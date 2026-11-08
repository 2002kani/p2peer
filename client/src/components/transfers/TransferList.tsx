import type { Transfer } from "../../transfer/types";
import { TransferItem } from "./TransferItem";
import styles from "./TransferList.module.css";

interface TransferListProps {
  transfers: Transfer[];
  names: Record<string, string>;
  onAccept: (transfer: Transfer) => void;
  onDecline: (transfer: Transfer) => void;
  onDismiss: (transfer: Transfer) => void;
}

export function TransferList({
  transfers,
  names,
  onAccept,
  onDecline,
  onDismiss,
}: TransferListProps) {
  if (transfers.length === 0) return null;

  return (
    <section
      className={styles.toasts}
      aria-label="Transfers"
      aria-live="polite"
    >
      <ul className={styles.list}>
        {transfers.map((transfer) => (
          <TransferItem
            key={`${transfer.direction}-${transfer.id}`}
            transfer={transfer}
            peerName={names[transfer.peerId] ?? "Unknown device"}
            onAccept={onAccept}
            onDecline={onDecline}
            onDismiss={onDismiss}
          />
        ))}
      </ul>
    </section>
  );
}
