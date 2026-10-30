import type { PeerInfo, ServerMessage } from './types'

export interface RoomState {
  self: PeerInfo | null
  peers: PeerInfo[]
}

export type RoomAction = ServerMessage | { type: 'disconnected' }

export const initialRoomState: RoomState = { self: null, peers: [] }

// Pure function: welcome sets the initial state, peer-joined / peer-left apply the changes.
export function roomReducer(state: RoomState, action: RoomAction): RoomState {
  switch (action.type) {
    case 'welcome': {
      const { id, name, kind, peers } = action
      return { self: { id, name, kind }, peers }
    }
    case 'peer-joined':
      // filter first, so a duplicate join can never show a peer twice
      return {
        ...state,
        peers: [...state.peers.filter((p) => p.id !== action.peer.id), action.peer],
      }
    case 'peer-left':
      return { ...state, peers: state.peers.filter((p) => p.id !== action.id) }
    case 'disconnected':
      // server forgets us on disconnect -> after reconnect a fresh welcome arrives
      return initialRoomState
    case 'signal':
      // not part of the room state, handled by the WebRTC layer
      return state
  }
}
