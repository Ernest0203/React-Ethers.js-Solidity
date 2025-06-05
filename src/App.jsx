import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import WalletSender from './components/WalletSender'
import BalanceComponent from './components/Balance'
import DexComponent from './components/Dex'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      {/* <WalletSender /> */}
      {/* <BalanceComponent /> */}
      <DexComponent />
    </>
  )
}

export default App
