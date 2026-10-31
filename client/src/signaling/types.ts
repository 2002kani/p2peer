export type DeviceKind = "Laptop" | "Handy" | "Tablet" | "Unknown";

export interface PeerInfo {
  id: string;
  name: string;
  kind: DeviceKind;
}

export type SignalData =
  | { description: RTCSessionDescriptionInit }
  | { candidate: RTCIceCandidateInit };

export type ServerMessage =
  | ({ type: "welcome"; peers: PeerInfo[] } & PeerInfo)
  | { type: "peer-joined"; peer: PeerInfo }
  | { type: "peer-left"; id: string }
  | { type: "signal"; from: string; data: SignalData };

export type ClientMessage = { type: "signal"; to: string; data: SignalData };
