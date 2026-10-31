import { Emitter } from "../lib/Emitter";
import type { ClientMessage, ServerMessage, SignalData } from "./types";

const RECONNECT_DELAY_MS = 3000;

export type ConnectionState = "connecting" | "connected";

type SignalingEvents = {
  status: ConnectionState;
  message: ServerMessage;
};

/**
 * WebSocket connection to the signaling server.
 * Reconnects automatically until close() is called.
 */
export class SignalingClient {
  readonly events = new Emitter<SignalingEvents>();
  readonly #url: string;
  #socket: WebSocket | null = null;
  #retryTimer: number | undefined;
  #closed = false;

  constructor(url: string) {
    this.#url = url;
  }

  connect(): void {
    if (this.#closed) return;

    const socket = new WebSocket(this.#url);
    this.#socket = socket;

    socket.onopen = () => this.events.emit("status", "connected");

    socket.onmessage = (event) => {
      const message = parseMessage(event.data);
      if (message) this.events.emit("message", message);
    };

    socket.onclose = () => {
      if (this.#socket !== socket) return;
      this.#socket = null;
      if (this.#closed) return;

      this.events.emit("status", "connecting");
      this.#retryTimer = window.setTimeout(
        () => this.connect(),
        RECONNECT_DELAY_MS,
      );
    };
  }

  sendSignal(to: string, data: SignalData): void {
    if (this.#socket?.readyState !== WebSocket.OPEN) return;

    const message: ClientMessage = { type: "signal", to, data };
    this.#socket.send(JSON.stringify(message));
  }

  close(): void {
    this.#closed = true;
    window.clearTimeout(this.#retryTimer);
    this.#socket?.close();
    this.#socket = null;
  }
}

function parseMessage(raw: unknown): ServerMessage | null {
  if (typeof raw !== "string") return null;
  try {
    return JSON.parse(raw) as ServerMessage;
  } catch {
    console.warn("invalid message from signaling server", raw);
    return null;
  }
}
