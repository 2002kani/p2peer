import { formatBytes } from '../../lib/formatBytes'
import type { Transfer, TransferStatus } from '../../transfer/types'
import styles from './TransferItem.module.css'

const STATUS_LABEL: Record<TransferStatus, string> = {
  waiting: 'Wartet …',
  transferring: 'Überträgt …',
  done: 'Fertig',
  failed: 'Fehlgeschlagen',
}

interface TransferItemProps {
  transfer: Transfer
  peerName: string
}

export function TransferItem({ transfer, peerName }: TransferItemProps) {
  const { direction, name, size, transferred, status, url, error } = transfer
  const percent = size === 0 ? 100 : Math.floor((transferred / size) * 100)
  const counterpart = direction === 'send' ? `an ${peerName}` : `von ${peerName}`
  const statusText = status === 'failed' && error ? `${STATUS_LABEL.failed}: ${error}` : STATUS_LABEL[status]

  return (
    <li className={styles.item}>
      <span className={styles.direction} aria-hidden>
        {direction === 'send' ? '↑' : '↓'}
      </span>

      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.name} title={name}>
            {name}
          </span>
          <span className={styles.size}>{formatBytes(size)}</span>
        </div>

        <div className={styles.row}>
          <span>{counterpart}</span>
          <span className={styles.status} data-status={status}>
            {status === 'transferring' ? `${percent} %` : statusText}
          </span>
        </div>

        {status === 'transferring' && <progress className={styles.progress} max={100} value={percent} />}
      </div>

      {direction === 'receive' && status === 'done' && url && (
        <a className={styles.download} href={url} download={name}>
          Speichern
        </a>
      )}
    </li>
  )
}
