import { Emitter } from "../lib/Emitter";
import type { SignalData } from "../signaling/types";

const OPEN_TIMEOUT_MS = 20_000;

export type PeerConnectionState =
  | "connecting"
  | "connected"
  | "failed"
  | "closed";

type PeerConnectionEvents = {
  state: PeerConnectionState;
  message: string | ArrayBuffer;
};

interface PeerConnectionOptions {
  remoteId: string;
  polite: boolean;
  iceServers: RTCIceServer[];
  sendSignal: (data: SignalData) => void;
}

export class PeerConnection {
  readonly remoteId: string;
  readonly events = new Emitter<PeerConnectionEvents>();
  readonly #pc: RTCPeerConnection;
  readonly #channel: RTCDataChannel;
  readonly #polite: boolean;
  readonly #sendSignal: (data: SignalData) => void;
  #state: PeerConnectionState = "connecting";
  #makingOffer = false;
  #ignoreOffer = false;
  #signalQueue: Promise<void> = Promise.resolve();

  constructor({
    remoteId,
    polite,
    iceServers,
    sendSignal,
  }: PeerConnectionOptions) {
    this.remoteId = remoteId;
    this.#polite = polite;
    this.#sendSignal = sendSignal;
    this.#pc = new RTCPeerConnection({ iceServers });

    // negotiated + fixed id: both sides create the same channel themselves,
    // so there is exactly one channel per pair, no matter who connects first
    this.#channel = this.#pc.createDataChannel("files", {
      negotiated: true,
      id: 0,
      ordered: true,
    });
    this.#channel.binaryType = "arraybuffer";
    this.#channel.onopen = () => this.#setState("connected");
    this.#channel.onclose = () => this.#setState("closed");
    this.#channel.onmessage = (event) =>
      this.events.emit("message", event.data);

    // fires once after the channel was created -> starts the offer/answer exchange
    this.#pc.onnegotiationneeded = () => void this.#negotiate();
    this.#pc.onicecandidate = ({ candidate }) => {
      if (candidate) this.#sendSignal({ candidate: candidate.toJSON() });
    };
    this.#pc.onconnectionstatechange = () => {
      if (this.#pc.connectionState === "failed") this.#setState("failed");
    };
  }

  get state(): PeerConnectionState {
    return this.#state;
  }

  get channel(): RTCDataChannel {
    return this.#channel;
  }

  handleSignal(data: SignalData): void {
    this.#signalQueue = this.#signalQueue
      .then(() => this.#applySignal(data))
      .catch((error) =>
        console.warn(`signal from ${this.remoteId} failed`, error),
      );
  }

  waitUntilOpen(): Promise<void> {
    if (this.#state === "connected") return Promise.resolve();
    if (this.#state !== "connecting")
      return Promise.reject(new Error("Verbindung getrennt"));

    return new Promise((resolve, reject) => {
      const timer = window.setTimeout(() => {
        off();
        this.#setState("failed");
        reject(new Error("Zeitüberschreitung beim Verbinden"));
      }, OPEN_TIMEOUT_MS);

      const off = this.events.on("state", (state) => {
        window.clearTimeout(timer);
        off();
        if (state === "connected") resolve();
        else reject(new Error("Verbindung fehlgeschlagen"));
      });
    });
  }

  close(): void {
    this.#setState("closed");
  }

  async #negotiate(): Promise<void> {
    try {
      this.#makingOffer = true;

      await this.#pc.setLocalDescription();
      this.#sendLocalDescription();
    } catch (error) {
      console.warn(`negotiation with ${this.remoteId} failed`, error);
    } finally {
      this.#makingOffer = false;
    }
  }

  async #applySignal(data: SignalData): Promise<void> {
    if (this.#isFinished()) return;

    if ("description" in data) {
      const { description } = data;
      const offerCollision =
        description.type === "offer" &&
        (this.#makingOffer || this.#pc.signalingState !== "stable");

      this.#ignoreOffer = !this.#polite && offerCollision;
      if (this.#ignoreOffer) return;

      await this.#pc.setRemoteDescription(description);
      if (description.type === "offer") {
        await this.#pc.setLocalDescription();
        this.#sendLocalDescription();
      }
      return;
    }

    try {
      await this.#pc.addIceCandidate(data.candidate);
    } catch (error) {
      if (!this.#ignoreOffer) throw error;
    }
  }

  #sendLocalDescription(): void {
    const description = this.#pc.localDescription;
    if (description) this.#sendSignal({ description: description.toJSON() });
  }

  #setState(state: PeerConnectionState): void {
    if (this.#state === state || this.#isFinished()) return;

    this.#state = state;
    if (this.#isFinished()) {
      this.#channel.close();
      this.#pc.close();
    }
    this.events.emit("state", state);
  }

  #isFinished(): boolean {
    return this.#state === "failed" || this.#state === "closed";
  }
}
