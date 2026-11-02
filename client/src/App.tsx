import { useMemo } from 'react'
import styles from './App.module.css'
import { ConnectionStatus } from './components/layout/ConnectionStatus'
import { MapBackground } from './components/layout/MapBackground'
import { Radar } from './components/radar/Radar'
import { TransferList } from './components/transfers/TransferList'
import { SIGNALING_URL } from './config'
import { useFileShare } from './hooks/useFileShare'
import { progressByPeer } from './transfer/progressByPeer'

function App() {
  const { connection, self, peers, names, peerStates, transfers, sendFiles } = useFileShare(SIGNALING_URL)
  const progress = useMemo(() => progressByPeer(transfers), [transfers])

  return (
    <>
      <MapBackground />

      <header className={styles.header}>
        <h1 className={styles.title}>p2peer</h1>
        <ConnectionStatus connection={connection} />
      </header>

      <main className={styles.main}>
        <Radar self={self} peers={peers} peerStates={peerStates} progress={progress} onSendFiles={sendFiles} />
      </main>

      <p className={styles.hint}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
          <path d="M2.5 9a14 14 0 0 1 19 0M5.5 12.5a9.5 9.5 0 0 1 13 0M8.5 16a5 5 0 0 1 7 0M12 19.5h.01" />
        </svg>
        {peers.length === 0
          ? 'Geräte werden automatisch im Netzwerk gefunden …'
          : 'Klicke auf ein Gerät oder ziehe Dateien darauf, um sie zu senden.'}
      </p>

      <TransferList transfers={transfers} names={names} />
    </>
  )
}

export default App
