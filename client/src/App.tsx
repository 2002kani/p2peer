import styles from './App.module.css'
import { PeerList } from './components/peers/PeerList'
import { TransferList } from './components/transfers/TransferList'
import { SelfInfo } from './components/layout/SelfInfo'
import { SIGNALING_URL } from './config'
import { useFileShare } from './hooks/useFileShare'

function App() {
  const { connection, self, peers, names, peerStates, transfers, sendFiles } = useFileShare(SIGNALING_URL)

  return (
    <>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>p2peer</h1>
          <p className={styles.hint}>Klicke auf ein Gerät oder ziehe Dateien darauf, um sie zu senden.</p>
        </header>

        <PeerList peers={peers} peerStates={peerStates} onSendFiles={sendFiles} />
        <TransferList transfers={transfers} names={names} />
      </main>

      <SelfInfo self={self} connection={connection} />
    </>
  )
}

export default App
