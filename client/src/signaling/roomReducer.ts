import type { PeerInfo, ServerMessage } from "./types";

export interface RoomState {
  self: PeerInfo | null;
  peers: PeerInfo[];
  names: Record<string, string>;
}

export type RoomAction = ServerMessage | { type: "disconnected" };

export const initialRoomState: RoomState = { self: null, peers: [], names: {} };

export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case "welcome": {
      const { id, name, kind, peers } = action;
      return {
        self: { id, name, kind },
        peers,
        names: withNames(state.names, peers),
      };
    }
    case "peer-joined":
      return {
        ...state,
        peers: [
          ...state.peers.filter((p) => p.id !== action.peer.id),
          action.peer,
        ],
        names: withNames(state.names, [action.peer]),
      };
    case "peer-left":
      return { ...state, peers: state.peers.filter((p) => p.id !== action.id) };
    case "disconnected":
      return { ...initialRoomState, names: state.names };
    case "signal":
      return state;
  }
}

function withNames(
  names: Record<string, string>,
  peers: PeerInfo[],
): Record<string, string> {
  return { ...names, ...Object.fromEntries(peers.map((p) => [p.id, p.name])) };
}
