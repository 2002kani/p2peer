import type { Transfer, TransferDirection } from "./types";

export type TransferAction =
  | { type: "update"; transfer: Transfer }
  | { type: "dismiss"; id: string; direction: TransferDirection };

export function transfersReducer(
  state: Transfer[],
  action: TransferAction,
): Transfer[] {
  if (action.type === "dismiss") {
    return state.filter(
      (t) => !(t.id === action.id && t.direction === action.direction),
    );
  }

  const update = action.transfer;
  const index = state.findIndex(
    (t) => t.id === update.id && t.direction === update.direction,
  );
  if (index === -1) return [update, ...state];

  const next = [...state];
  next[index] = update;
  return next;
}
