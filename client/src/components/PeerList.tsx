import type { PeerInfo } from '../signaling/types'
import { DeviceIcon } from './DeviceIcon'
import styles from './PeerList.module.css'

export function PeerList({ peers }: { peers: PeerInfo[] }) {
  if (peers.length === 0) {
    return <p className={styles.empty}>Noch keine anderen Geräte in deinem Netzwerk.</p>
  }

  return (
    <ul className={styles.list}>
      {peers.map((peer) => (
        <li key={peer.id} className={styles.peer}>
          <span className={styles.icon}>
            <DeviceIcon kind={peer.kind} />
          </span>
          <span>{peer.name}</span>
        </li>
      ))}
    </ul>
  )
}
