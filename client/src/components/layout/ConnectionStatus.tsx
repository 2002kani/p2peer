import type { ConnectionState } from '../../signaling/SignalingClient'
import styles from './ConnectionStatus.module.css'

export function ConnectionStatus({ connection }: { connection: ConnectionState }) {
  return (
    <span className={styles.status} data-state={connection}>
      <span className={styles.dot} />
      {connection === 'connected' ? 'Online' : 'Verbinde …'}
    </span>
  )
}
