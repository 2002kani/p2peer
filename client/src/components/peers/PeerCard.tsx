import { useRef, useState, type DragEvent } from 'react'
import type { PeerInfo } from '../../signaling/types'
import type { PeerConnectionState } from '../../webrtc/PeerConnection'
import { DeviceIcon } from '../common/DeviceIcon'
import styles from './PeerCard.module.css'

const STATE_LABEL: Record<PeerConnectionState, string> = {
  connecting: 'Verbinde …',
  connected: 'Verbunden',
  failed: 'Verbindung fehlgeschlagen',
  closed: '',
}

interface PeerCardProps {
  peer: PeerInfo
  state?: PeerConnectionState
  onSendFiles: (peerId: string, files: File[]) => void
}

export function PeerCard({ peer, state, onSendFiles }: PeerCardProps) {
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

  return (
    <li>
      <button
        type="button"
        className={dragOver ? `${styles.card} ${styles.dragOver}` : styles.card}
        onClick={() => inputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        title={`Dateien an ${peer.name} senden`}
      >
        <span className={styles.icon}>
          <DeviceIcon kind={peer.kind} />
        </span>
        <span className={styles.name}>{peer.name}</span>
        <span className={styles.state} data-state={state}>
          {state ? STATE_LABEL[state] : ''}
        </span>
      </button>

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
    </li>
  )
}
