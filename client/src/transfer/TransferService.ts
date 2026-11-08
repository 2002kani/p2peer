import { createId } from "../lib/createId";
import { Emitter } from "../lib/Emitter";
import { saveFile } from "../lib/saveFile";
import type { ConnectionManager } from "../webrtc/ConnectionManager";
import { CHUNK_SIZE, decode, encode, type ControlMessage } from "./protocol";
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
  readonly #answers = new Map<string, (accepted: boolean) => void>();
  readonly #acks = new Map<string, (value: void) => void>();

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

  accept(transferId: string): void {
    const incoming = this.#findOffer(transferId);
    if (!incoming) return;
    this.#update(incoming.transfer, { status: "transferring" });
    this.#sendControl(incoming.transfer.peerId, {
      type: "file-accept",
      transferId,
    });
  }

  decline(transferId: string): void {
    const incoming = this.#findOffer(transferId);
    if (!incoming) return;
    this.#incoming.delete(incoming.transfer.peerId);
    this.#update(incoming.transfer, { status: "declined" });
    this.#sendControl(incoming.transfer.peerId, {
      type: "file-decline",
      transferId,
    });
  }

  dispose(): void {
    this.#unsubscribe.forEach((unsubscribe) => unsubscribe());
    for (const peerId of [...this.#aborts.keys(), ...this.#incoming.keys()]) {
      this.#abortPeer(peerId);
    }
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

      // the queue to this peer stays blocked until the receiver decides
      const answer = this.#waitFor(this.#answers, transfer.id, signal);
      this.#update(transfer, { status: "offered" });
      channel.send(
        encode({
          type: "file-offer",
          transferId: transfer.id,
          name: file.name,
          size: file.size,
          mime: file.type,
        }),
      );
      if (!(await answer)) {
        this.#update(transfer, { status: "declined" });
        return;
      }
      signal.throwIfAborted();

      const confirmed = this.#waitFor(this.#acks, transfer.id, signal);
      confirmed.catch(() => {});

      this.#update(transfer, { status: "transferring" });

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
      this.#answers.delete(transfer.id);
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
      case "file-offer":
        this.#onFileOffer(
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
      case "file-accept":
        this.#answers.get(message.transferId)?.(true);
        break;
      case "file-decline":
        this.#answers.get(message.transferId)?.(false);
        break;
      case "file-received":
        this.#acks.get(message.transferId)?.();
        break;
    }
  }

  #onFileOffer(
    peerId: string,
    transferId: string,
    name: string,
    size: number,
    mime: string,
  ): void {
    // a previous file that never finished is lost
    this.#failIncoming(peerId, "Transfer cancelled");

    const transfer: Transfer = {
      id: transferId,
      peerId,
      direction: "receive",
      name,
      size,
      transferred: 0,
      status: "offered",
    };
    this.#incoming.set(peerId, { transfer, mime, chunks: [], lastProgress: 0 });
    this.#emit(transfer);
  }

  #onChunk(peerId: string, chunk: ArrayBuffer): void {
    const incoming = this.#incoming.get(peerId);
    // chunks before our file-accept were never asked for
    if (incoming?.transfer.status !== "transferring") return;

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
        error: "File incomplete",
      });
      return;
    }

    saveFile(
      new Blob(chunks, { type: mime || "application/octet-stream" }),
      transfer.name,
    );
    this.#update(transfer, { status: "done" });
    this.#sendControl(peerId, { type: "file-received", transferId });
  }

  #sendControl(peerId: string, message: ControlMessage): void {
    try {
      this.#connections.get(peerId)?.channel.send(encode(message));
    } catch (error) {
      console.warn(`could not send ${message.type}`, error);
    }
  }

  /** Resolves once the peer answers this transfer with a message routed into `pending`. */
  #waitFor<T>(
    pending: Map<string, (value: T) => void>,
    transferId: string,
    signal: AbortSignal,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const onAbort = () => {
        pending.delete(transferId);
        reject(signal.reason);
      };
      pending.set(transferId, (value) => {
        pending.delete(transferId);
        signal.removeEventListener("abort", onAbort);
        resolve(value);
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
    this.#aborts.get(peerId)?.abort(new Error("Connection lost"));
    this.#aborts.delete(peerId);
    this.#sendQueues.delete(peerId);
    this.#failIncoming(peerId, "Connection lost");
  }

  #findOffer(transferId: string): IncomingFile | undefined {
    for (const incoming of this.#incoming.values()) {
      if (
        incoming.transfer.id === transferId &&
        incoming.transfer.status === "offered"
      )
        return incoming;
    }
    return undefined;
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
  return error instanceof Error ? error.message : "Unknown error";
}
