// the browser needs the URL a moment longer than the click, otherwise some cancel the download
const REVOKE_DELAY_MS = 10_000;

/** Starts a download of the blob and releases it from memory afterwards. */
export function saveFile(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}
