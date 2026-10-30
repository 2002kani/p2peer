import { PeerList } from './components/PeerList'
import { SelfInfo } from './components/SelfInfo'
import { SIGNALING_URL } from './config'
import { useSignaling } from './signaling/useSignaling'

function App() {
  const { connection, self, peers } = useSignaling(SIGNALING_URL)

  return (
    <>
      <main className="main">
        <h1>p2peer</h1>
        <PeerList peers={peers} />
      </main>
      <SelfInfo self={self} connection={connection} />
    </>
  )
}

export default App
