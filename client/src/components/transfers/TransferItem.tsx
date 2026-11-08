import { useEffect } from "react";
import { formatBytes } from "../../lib/formatBytes";
import type { Transfer, TransferStatus } from "../../transfer/types";
import styles from "./TransferItem.module.css";

const STATUS_LABEL: Record<TransferStatus, string> = {
  waiting: "Waiting …",
  offered: "Waiting for answer …",
  transferring: "Transferring …",
  done: "Done",
  declined: "Declined",
  failed: "Failed",
};

const FINISHED: TransferStatus[] = ["done", "declined", "failed"];

// nothing left to do with a finished transfer -> received files are already saved
const DISMISS_MS = 4_000;

interface TransferItemProps {
  transfer: Transfer;
  peerName: string;
  onAccept: (transfer: Transfer) => void;
  onDecline: (transfer: Transfer) => void;
  onDismiss: (transfer: Transfer) => void;
}

export function TransferItem({
  transfer,
  peerName,
  onAccept,
  onDecline,
  onDismiss,
}: TransferItemProps) {
  const { direction, name, size, transferred, status, error } = transfer;
  const percent = size === 0 ? 100 : Math.floor((transferred / size) * 100);
  const counterpart =
    direction === "send" ? `to ${peerName}` : `from ${peerName}`;
  const isOffer = direction === "receive" && status === "offered";
  const isFinished = FINISHED.includes(status);
  const statusText = isOffer
    ? "Wants to send"
    : direction === "receive" && status === "done"
      ? "Saved"
      : status === "failed" && error
        ? `${STATUS_LABEL.failed}: ${error}`
        : STATUS_LABEL[status];

  useEffect(() => {
    if (!isFinished) return;
    const timer = setTimeout(() => onDismiss(transfer), DISMISS_MS);
    return () => clearTimeout(timer);
  }, [isFinished, onDismiss, transfer]);

  return (
    <li className={styles.item}>
      {/* after accepting, the receiver has nothing to cancel -> the toast closes itself */}
      {(isOffer || (direction === "send" && isFinished)) && (
        <button
          type="button"
          className={styles.cancel}
          onClick={() => (isOffer ? onDecline(transfer) : onDismiss(transfer))}
          aria-label={isOffer ? "Decline" : "Close"}
        >
          ✕
        </button>
      )}
      <span className={styles.direction} aria-hidden>
        {direction === "send" ? "↑" : "↓"}
      </span>

      <div className={styles.body}>
        <div className={styles.row}>
          <span className={styles.name} title={name}>
            {name}
          </span>
          <span className={styles.size}>{formatBytes(size)}</span>
        </div>

        <div className={styles.row}>
          <span className={styles.counterpart} title={counterpart}>
            {counterpart}
          </span>
          <span
            className={styles.status}
            data-status={status}
            title={statusText}
          >
            {status === "transferring" ? `${percent} %` : statusText}
          </span>
        </div>

        {status === "transferring" && (
          <progress className={styles.progress} max={100} value={percent} />
        )}
      </div>

      {isOffer && (
        <button
          type="button"
          className={styles.action}
          onClick={() => onAccept(transfer)}
        >
          Accept
        </button>
      )}
    </li>
  );
}
