import { Emitter } from "../lib/Emitter";
import type { SignalingClient } from "../signaling/SignalingClient";
import type { ServerMessage } from "../signaling/types";
import { PeerConnection, type PeerConnectionState } from "./PeerConnection";

type ConnectionManagerEvents = {
  state: { peerId: string; state: PeerConnectionState };
  message: { peerId: string; data: string | ArrayBuffer };
};

/**
 * Holds one PeerConnection per remote peer and routes the signals of the server to it.
 */
export class ConnectionManager {
  readonly events = new Emitter<ConnectionManagerEvents>();
  readonly #signaling: SignalingClient;
  readonly #iceServers: RTCIceServer[];
  readonly #connections = new Map<string, PeerConnection>();
  readonly #unsubscribe: Array<() => void>;
  #selfId: string | null = null;

  constructor(signaling: SignalingClient, iceServers: RTCIceServer[]) {
    this.#signaling = signaling;
    this.#iceServers = iceServers;
    this.#unsubscribe = [
      signaling.events.on("message", (message) =>
        this.#onServerMessage(message),
      ),

      signaling.events.on("status", (status) => {
        if (status === "connecting") this.#reset(null);
      }),
    ];
  }

  connect(peerId: string): PeerConnection {
    const existing = this.#connections.get(peerId);
    if (existing) return existing;
    if (!this.#selfId) throw new Error("Nicht mit dem Server verbunden");

    const connection = new PeerConnection({
      remoteId: peerId,

      polite: this.#selfId < peerId,
      iceServers: this.#iceServers,
      sendSignal: (data) => this.#signaling.sendSignal(peerId, data),
    });

    connection.events.on("state", (state) => {
      if (
        (state === "failed" || state === "closed") &&
        this.#connections.get(peerId) === connection
      ) {
        this.#connections.delete(peerId);
      }
      this.events.emit("state", { peerId, state });
    });
    connection.events.on("message", (data) =>
      this.events.emit("message", { peerId, data }),
    );

    this.#connections.set(peerId, connection);
    this.events.emit("state", { peerId, state: "connecting" });
    return connection;
  }

  get(peerId: string): PeerConnection | undefined {
    return this.#connections.get(peerId);
  }

  dispose(): void {
    this.#unsubscribe.forEach((unsubscribe) => unsubscribe());
    this.#reset(null);
  }

  #onServerMessage(message: ServerMessage): void {
    switch (message.type) {
      case "welcome":
        this.#reset(message.id);
        break;
      case "peer-left":
        this.#connections.get(message.id)?.close();
        break;
      case "signal":
        this.connect(message.from).handleSignal(message.data);
        break;
    }
  }

  #reset(selfId: string | null): void {
    for (const connection of [...this.#connections.values()]) {
      connection.close();
    }
    this.#connections.clear();
    this.#selfId = selfId;
  }
}
