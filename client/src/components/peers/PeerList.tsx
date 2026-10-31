import type { PeerInfo } from '../../signaling/types'
import type { PeerConnectionState } from '../../webrtc/PeerConnection'
import { PeerCard } from './PeerCard'
import styles from './PeerList.module.css'

interface PeerListProps {
  peers: PeerInfo[]
  peerStates: Record<string, PeerConnectionState>
  onSendFiles: (peerId: string, files: File[]) => void
}

export function PeerList({ peers, peerStates, onSendFiles }: PeerListProps) {
  if (peers.length === 0) {
    return (
      <p className={styles.empty}>
        Noch keine anderen Geräte in deinem Netzwerk.
        <br />
        Öffne p2peer auf einem zweiten Gerät.
      </p>
    )
  }

  return (
    <ul className={styles.list}>
      {peers.map((peer) => (
        <PeerCard key={peer.id} peer={peer} state={peerStates[peer.id]} onSendFiles={onSendFiles} />
      ))}
    </ul>
  )
}
