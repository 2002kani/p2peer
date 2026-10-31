export type TransferDirection = "send" | "receive";

export type TransferStatus = "waiting" | "transferring" | "done" | "failed";

export interface Transfer {
  id: string;
  peerId: string;
  direction: TransferDirection;
  name: string;
  size: number;
  transferred: number;
  status: TransferStatus;
  url?: string;
  error?: string;
}
