import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { balanceStorageAbi } from "../abi";

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export default function BalanceComponent() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [balance, setBalance] = useState(null);
  const [amount, setAmount] = useState("0.01");
  const [loading, setLoading] = useState(false);
  const [userAddress, setUserAddress] = useState(null);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Установи MetaMask");
    try {
      const accounts = await window.ethereum.
        request({ method: "eth_requestAccounts" });
      setUserAddress(accounts[0]);
      setWalletConnected(true);
      
    } catch (err) {
      console.error("MetaMask connection error:", err);
    }
  };

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, balanceStorageAbi, signer);
  };

  const fetchBalance = async () => {
    try {
      const contract = await getContract();
      const rawBalance = await contract.getMyBalance();
      setBalance(ethers.formatEther(rawBalance));
    } catch (err) {
      console.error("Ошибка при получении баланса:", err);
    }
  };

  const deposit = async () => {
    try {
      setLoading(true);
      const contract = await getContract();
      const tx = await contract.deposit({ value: ethers.parseEther(amount) });
      await tx.wait();
      await fetchBalance();
    } catch (err) {
      console.error("Ошибка при депозите:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (walletConnected) {
      fetchBalance();
    }
  }, [walletConnected]);

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
          setWalletConnected(true);
        }
      }
    };
    checkConnection();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>💰 Контракт: BalanceStorage</h2>

      {!walletConnected ? (
        <button onClick={connectWallet}>🔌 Подключить MetaMask</button>
      ) : (
        <>
          <p>👛 Адрес: {userAddress}</p>
          <p>🔍 Баланс в контракте: {balance ?? "—"} ETH</p>
          <input
            type="number"
            step="0.001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Сколько внести (ETH)"
          />
          <button onClick={deposit} disabled={loading}>
            {loading ? "⏳ Отправка..." : "📥 Внести депозит"}
          </button>
        </>
      )}
    </div>
  );
}
