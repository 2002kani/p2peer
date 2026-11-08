export type TransferDirection = "send" | "receive";

export type TransferStatus =
  | "waiting"
  | "offered"
  | "transferring"
  | "done"
  | "declined"
  | "failed";

export interface Transfer {
  id: string;
  peerId: string;
  direction: TransferDirection;
  name: string;
  size: number;
  transferred: number;
  status: TransferStatus;
  error?: string;
}
