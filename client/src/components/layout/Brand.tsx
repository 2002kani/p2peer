import { useRef } from "react";
import styles from "./Brand.module.css";

const REPO_URL = "https://github.com/2002kani/p2peer";

export function Brand() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  return (
    <>
      <h1 className={styles.title}>
        <button
          type="button"
          className={styles.brand}
          onClick={open}
          aria-haspopup="dialog"
        >
          p2peer
          <span className={styles.info} aria-label="Info">
            i
          </span>
        </button>
      </h1>

      <dialog
        ref={dialogRef}
        className={styles.dialog}
        aria-labelledby="info-title"
        onClick={(event) => event.target === event.currentTarget && close()}
      >
        <div className={styles.content}>
          <button
            type="button"
            className={styles.close}
            onClick={close}
            aria-label="Close"
          >
            ✕
          </button>

          <h2 id="info-title" className={styles.heading}>
            About p2peer
          </h2>
          <p>
            p2peer sends files straight from device to device, without a detour
            through the cloud.
          </p>

          <ul className={styles.points}>
            <li>
              <strong>Direct transfer.</strong> Files travel via WebRTC directly
              between browsers, entirely locally within your network.
            </li>
            <li>
              <strong>Encrypted.</strong> Every connection is end-to-end
              encrypted (DTLS), so nobody in between can read along.
            </li>
          </ul>
          <a
            className={styles.repo}
            href={REPO_URL}
            target="_blank"
            rel="noreferrer"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path
                fill="currentColor"
                d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.41-2.69 5.38-5.25 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5z"
              />
            </svg>
            GitHub
          </a>
        </div>
      </dialog>
    </>
  );
}
