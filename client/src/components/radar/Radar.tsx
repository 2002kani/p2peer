import type { CSSProperties } from "react";
import type { PeerInfo } from "../../signaling/types";
import type { PeerConnectionState } from "../../webrtc/PeerConnection";
import { DEVICE_LABEL } from "../../lib/deviceLabel";
import { DeviceIcon } from "../common/DeviceIcon";
import { PeerNode } from "./PeerNode";
import styles from "./Radar.module.css";

// first peer sits top left, like in the mockup
const START_ANGLE = -140;

interface RadarProps {
  self: PeerInfo | null;
  peers: PeerInfo[];
  peerStates: Record<string, PeerConnectionState>;
  progress: Record<string, number>;
  onSendFiles: (peerId: string, files: File[]) => void;
}

export function Radar({
  self,
  peers,
  peerStates,
  progress,
  onSendFiles,
}: RadarProps) {
  return (
    <div className={styles.radar}>
      <span className={`${styles.circle} ${styles.glow}`} />
      {self &&
        [0, 1, 2].map((i) => (
          <span
            key={i}
            className={`${styles.circle} ${styles.wave}`}
            style={{ animationDelay: `${i * 1.5}s` }}
          />
        ))}

      <div className={styles.self}>
        <span className={styles.core}>
          <DeviceIcon kind={self?.kind ?? "Laptop"} size={34} />
        </span>
        <span className={styles.selfLabel}>
          <strong>You</strong>
          <span>
            {self ? `${self.name} · ${DEVICE_LABEL[self.kind]}` : "Connecting …"}
          </span>
        </span>
      </div>

      <ul className={styles.peers}>
        {peers.map((peer, index) => {
          const position = {
            "--angle": `${START_ANGLE + (index * 360) / peers.length}deg`,
            // alternate the distance a little so it looks less like a clock face
            "--distance": index % 2 === 0 ? 1 : 0.9,
          } as CSSProperties;

          return (
            <li key={peer.id} className={styles.slot} style={position}>
              <PeerNode
                peer={peer}
                state={peerStates[peer.id]}
                progress={progress[peer.id]}
                onSendFiles={onSendFiles}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
