import { createId } from "../lib/createId";
import { Emitter } from "../lib/Emitter";
import type { ConnectionManager } from "../webrtc/ConnectionManager";
import { CHUNK_SIZE, decode, encode } from "./protocol";
import type { Transfer } from "./types";

const BUFFER_HIGH = 1024 * 1024;
const BUFFER_LOW = 256 * 1024;

const PROGRESS_INTERVAL_MS = 100;

type TransferEvents = {
  update: Transfer;
};

interface IncomingFile {
  transfer: Transfer;
  mime: string;
  chunks: ArrayBuffer[];
  lastProgress: number;
}

/**
 * Sends and receives files over the DataChannels of the ConnectionManager.
 * Files to the same peer are sent one after another.
 */
export class TransferService {
  readonly events = new Emitter<TransferEvents>();
  readonly #connections: ConnectionManager;
  readonly #unsubscribe: Array<() => void>;
  readonly #sendQueues = new Map<string, Promise<void>>();
  readonly #aborts = new Map<string, AbortController>();
  readonly #incoming = new Map<string, IncomingFile>();
  readonly #acks = new Map<string, () => void>();
  readonly #objectUrls: string[] = [];

  constructor(connections: ConnectionManager) {
    this.#connections = connections;
    this.#unsubscribe = [
      connections.events.on("message", ({ peerId, data }) =>
        this.#onMessage(peerId, data),
      ),
      connections.events.on("state", ({ peerId, state }) => {
        if (state === "failed" || state === "closed") this.#abortPeer(peerId);
      }),
    ];
  }

  sendFiles(peerId: string, files: File[]): void {
    const signal = this.#abortSignal(peerId);

    for (const file of files) {
      const transfer: Transfer = {
        id: createId(),
        peerId,
        direction: "send",
        name: file.name,
        size: file.size,
        transferred: 0,
        status: "waiting",
      };
      this.#emit(transfer);

      const previous = this.#sendQueues.get(peerId) ?? Promise.resolve();
      this.#sendQueues.set(
        peerId,
        previous.then(() => this.#sendFile(transfer, file, signal)),
      );
    }
  }

  dispose(): void {
    this.#unsubscribe.forEach((unsubscribe) => unsubscribe());
    for (const peerId of [...this.#aborts.keys(), ...this.#incoming.keys()]) {
      this.#abortPeer(peerId);
    }
    this.#objectUrls.forEach((url) => URL.revokeObjectURL(url));
  }

  async #sendFile(
    transfer: Transfer,
    file: File,
    signal: AbortSignal,
  ): Promise<void> {
    try {
      signal.throwIfAborted();
      const connection = this.#connections.connect(transfer.peerId);
      await connection.waitUntilOpen();
      signal.throwIfAborted();

      const channel = connection.channel;
      channel.bufferedAmountLowThreshold = BUFFER_LOW;
      const confirmed = this.#waitForAck(transfer.id, signal);
      confirmed.catch(() => {});

      this.#update(transfer, { status: "transferring" });
      channel.send(
        encode({
          type: "file-start",
          transferId: transfer.id,
          name: file.name,
          size: file.size,
          mime: file.type,
        }),
      );

      let offset = 0;
      let lastProgress = 0;
      while (offset < file.size) {
        if (channel.bufferedAmount > BUFFER_HIGH)
          await waitForDrain(channel, signal);

        const chunk = await file
          .slice(offset, offset + CHUNK_SIZE)
          .arrayBuffer();
        signal.throwIfAborted();
        channel.send(chunk);
        offset += chunk.byteLength;

        if (Date.now() - lastProgress > PROGRESS_INTERVAL_MS) {
          lastProgress = Date.now();
          this.#update(transfer, { transferred: offset });
        }
      }

      channel.send(encode({ type: "file-end", transferId: transfer.id }));
      this.#update(transfer, { transferred: offset });

      await confirmed;
      this.#update(transfer, { status: "done" });
    } catch (error) {
      this.#acks.delete(transfer.id);
      this.#update(transfer, { status: "failed", error: errorMessage(error) });
    }
  }

  #onMessage(peerId: string, data: string | ArrayBuffer): void {
    if (data instanceof ArrayBuffer) {
      this.#onChunk(peerId, data);
      return;
    }

    const message = decode(data);
    if (!message) return;

    switch (message.type) {
      case "file-start":
        this.#onFileStart(
          peerId,
          message.transferId,
          message.name,
          message.size,
          message.mime,
        );
        break;
      case "file-end":
        this.#onFileEnd(peerId, message.transferId);
        break;
      case "file-received":
        this.#acks.get(message.transferId)?.();
        break;
    }
  }

  #onFileStart(
    peerId: string,
    transferId: string,
    name: string,
    size: number,
    mime: string,
  ): void {
    // a previous file that never finished is lost
    this.#failIncoming(peerId, "Übertragung abgebrochen");

    const transfer: Transfer = {
      id: transferId,
      peerId,
      direction: "receive",
      name,
      size,
      transferred: 0,
      status: "transferring",
    };
    this.#incoming.set(peerId, { transfer, mime, chunks: [], lastProgress: 0 });
    this.#emit(transfer);
  }

  #onChunk(peerId: string, chunk: ArrayBuffer): void {
    const incoming = this.#incoming.get(peerId);
    if (!incoming) return;

    incoming.chunks.push(chunk);
    incoming.transfer.transferred += chunk.byteLength;

    if (Date.now() - incoming.lastProgress > PROGRESS_INTERVAL_MS) {
      incoming.lastProgress = Date.now();
      this.#emit(incoming.transfer);
    }
  }

  #onFileEnd(peerId: string, transferId: string): void {
    const incoming = this.#incoming.get(peerId);
    if (!incoming || incoming.transfer.id !== transferId) return;
    this.#incoming.delete(peerId);

    const { transfer, mime, chunks } = incoming;
    if (transfer.transferred !== transfer.size) {
      this.#update(transfer, {
        status: "failed",
        error: "Datei unvollständig",
      });
      return;
    }

    const url = URL.createObjectURL(
      new Blob(chunks, { type: mime || "application/octet-stream" }),
    );
    this.#objectUrls.push(url);
    this.#update(transfer, { status: "done", url });

    try {
      this.#connections
        .get(peerId)
        ?.channel.send(encode({ type: "file-received", transferId }));
    } catch (error) {
      console.warn("could not confirm file", error);
    }
  }

  #waitForAck(transferId: string, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        this.#acks.delete(transferId);
        reject(signal.reason);
      };
      this.#acks.set(transferId, () => {
        this.#acks.delete(transferId);
        signal.removeEventListener("abort", onAbort);
        resolve();
      });
      signal.addEventListener("abort", onAbort, { once: true });
    });
  }

  #abortSignal(peerId: string): AbortSignal {
    let controller = this.#aborts.get(peerId);
    if (!controller) {
      controller = new AbortController();
      this.#aborts.set(peerId, controller);
    }
    return controller.signal;
  }

  #abortPeer(peerId: string): void {
    this.#aborts.get(peerId)?.abort(new Error("Verbindung getrennt"));
    this.#aborts.delete(peerId);
    this.#sendQueues.delete(peerId);
    this.#failIncoming(peerId, "Verbindung getrennt");
  }

  #failIncoming(peerId: string, error: string): void {
    const incoming = this.#incoming.get(peerId);
    if (!incoming) return;
    this.#incoming.delete(peerId);
    this.#update(incoming.transfer, { status: "failed", error });
  }

  #update(transfer: Transfer, changes: Partial<Transfer>): void {
    Object.assign(transfer, changes);
    this.#emit(transfer);
  }

  #emit(transfer: Transfer): void {
    this.events.emit("update", { ...transfer });
  }
}

function waitForDrain(
  channel: RTCDataChannel,
  signal: AbortSignal,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      channel.removeEventListener("bufferedamountlow", onLow);
      signal.removeEventListener("abort", onAbort);
    };
    const onLow = () => {
      cleanup();
      resolve();
    };
    const onAbort = () => {
      cleanup();
      reject(signal.reason);
    };
    channel.addEventListener("bufferedamountlow", onLow);
    signal.addEventListener("abort", onAbort);
  });
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Unbekannter Fehler";
}
