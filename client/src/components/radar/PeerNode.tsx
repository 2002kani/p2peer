import { useRef, useState, type DragEvent } from 'react'
import type { PeerInfo } from '../../signaling/types'
import type { PeerConnectionState } from '../../webrtc/PeerConnection'
import { DEVICE_LABEL } from '../../lib/deviceLabel'
import { DeviceIcon } from '../common/DeviceIcon'
import styles from './PeerNode.module.css'

const STATE_LABEL: Record<PeerConnectionState, string> = {
  connecting: 'Connecting …',
  connected: 'Connected',
  failed: 'Connection failed',
  closed: '',
}

interface PeerNodeProps {
  peer: PeerInfo
  state?: PeerConnectionState
  // 0..1 while a transfer with this peer is running
  progress?: number
  onSendFiles: (peerId: string, files: File[]) => void
}

export function PeerNode({ peer, state, progress, onSendFiles }: PeerNodeProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const send = (files: FileList | null) => {
    if (files && files.length > 0) onSendFiles(peer.id, Array.from(files))
  }

  const onDragOver = (event: DragEvent) => {
    event.preventDefault()
    setDragOver(true)
  }

  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragOver(false)
    send(event.dataTransfer.files)
  }

  const stateLabel = state ? STATE_LABEL[state] : ''

  return (
    <div className={styles.node}>
      <button
        type="button"
        className={dragOver ? `${styles.circle} ${styles.dragOver}` : styles.circle}
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        title={stateLabel ? `${stateLabel} · Send files to ${peer.name}` : `Send files to ${peer.name}`}
      >
        <DeviceIcon kind={peer.kind} />
        <span className={styles.dot} data-state={state} />

        {progress !== undefined && (
          <svg className={styles.progress} viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="48" pathLength={100} className={styles.track} />
            <circle
              cx="50"
              cy="50"
              r="48"
              pathLength={100}
              className={styles.bar}
              strokeDasharray={`${progress * 100} 100`}
            />
          </svg>
        )}
      </button>

      <span className={styles.name}>{peer.name}</span>
      <span className={styles.kind}>{DEVICE_LABEL[peer.kind]}</span>

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(event) => {
          send(event.target.files)
          // reset, so the same file can be chosen again
          event.target.value = ''
        }}
      />
    </div>
  )
}
