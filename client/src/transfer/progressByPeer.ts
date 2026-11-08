import type { Transfer, TransferStatus } from "./types";

const ACTIVE: TransferStatus[] = ["waiting", "offered", "transferring"];

/** Combined progress (0..1) of all running transfers, keyed by peer id. */
export function progressByPeer(transfers: Transfer[]): Record<string, number> {
  const totals: Record<string, { size: number; transferred: number }> = {};

  for (const transfer of transfers) {
    if (!ACTIVE.includes(transfer.status)) continue;
    const total = (totals[transfer.peerId] ??= { size: 0, transferred: 0 });
    total.size += transfer.size;
    total.transferred += transfer.transferred;
  }

  return Object.fromEntries(
    Object.entries(totals).map(([peerId, { size, transferred }]) => [
      peerId,
      size === 0 ? 0 : transferred / size,
    ]),
  );
}
