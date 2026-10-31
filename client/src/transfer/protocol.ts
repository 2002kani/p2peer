/*
 * Protocol on the DataChannel, per file:
 *   sender   -> file-start (JSON)
 *   sender   -> binary chunks (ArrayBuffer)
 *   sender   -> file-end (JSON)
 *   receiver -> file-received (JSON), only after all bytes arrived
 * The channel is ordered so the chunks arrive between start and end.
 */

export const CHUNK_SIZE = 64 * 1024;

export type ControlMessage =
  | {
      type: "file-start";
      transferId: string;
      name: string;
      size: number;
      mime: string;
    }
  | { type: "file-end"; transferId: string }
  | { type: "file-received"; transferId: string };

export function encode(message: ControlMessage): string {
  return JSON.stringify(message);
}

export function decode(raw: string): ControlMessage | null {
  try {
    return JSON.parse(raw) as ControlMessage;
  } catch {
    return null;
  }
}
