import type { ConnectionState } from '../signaling/useSignaling'
import type { PeerInfo } from '../signaling/types'
import { DeviceIcon } from './DeviceIcon'
import styles from './SelfInfo.module.css'

interface SelfInfoProps {
  self: PeerInfo | null
  connection: ConnectionState
}

export function SelfInfo({ self, connection }: SelfInfoProps) {
  if (connection === 'connecting' || !self) {
    return <footer className={styles.footer}>Verbinde mit dem Server …</footer>
  }

  return (
    <footer className={styles.footer}>
      Du bist <DeviceIcon kind={self.kind} /> <strong>{self.name}</strong>
    </footer>
  )
}
