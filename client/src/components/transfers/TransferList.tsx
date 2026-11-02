import type { Transfer } from '../../transfer/types'
import { TransferItem } from './TransferItem'
import styles from './TransferList.module.css'

interface TransferListProps {
  transfers: Transfer[]
  names: Record<string, string>
}

export function TransferList({ transfers, names }: TransferListProps) {
  if (transfers.length === 0) return null

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Übertragungen</h2>
      <ul className={styles.list}>
        {transfers.map((transfer) => (
          <TransferItem
            key={`${transfer.direction}-${transfer.id}`}
            transfer={transfer}
            peerName={names[transfer.peerId] ?? 'Unbekanntes Gerät'}
          />
        ))}
      </ul>
    </section>
  )
}
