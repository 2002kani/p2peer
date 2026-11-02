import type { ConnectionState } from "../../signaling/SignalingClient";
import type { PeerInfo } from "../../signaling/types";
import { DeviceIcon } from "../common/DeviceIcon";
import styles from "./SelfInfo.module.css";

interface SelfInfoProps {
  self: PeerInfo | null;
  connection: ConnectionState;
}

export function SelfInfo({ self, connection }: SelfInfoProps) {
  return (
    <footer className={styles.footer}>
      {connection === "connected" && self ? (
        <>
          Du bist <DeviceIcon kind={self.kind} /> <strong>{self.name}</strong>
        </>
      ) : (
        <span className={styles.connecting}>Verbinde mit dem Server …</span>
      )}
    </footer>
  );
}
