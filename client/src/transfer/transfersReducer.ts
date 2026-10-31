import type { Transfer } from "./types";

export function transfersReducer(
  state: Transfer[],
  update: Transfer,
): Transfer[] {
  const index = state.findIndex(
    (t) => t.id === update.id && t.direction === update.direction,
  );
  if (index === -1) return [update, ...state];

  const next = [...state];
  next[index] = update;
  return next;
}
