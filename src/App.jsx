import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import WalletSender from './components/WalletSender'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <WalletSender />
    </>
  )
}

export default App
