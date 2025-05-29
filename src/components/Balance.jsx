import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import SimpleBankJson from "../../deployments/localhost/SimpleBank.json";

const CONTRACT_ADDRESS = SimpleBankJson.address;
const balanceStorageAbi = SimpleBankJson.abi;
const LOCAL_CHAIN_ID = "0x7a69"; // 31337 в hex

export default function BalanceComponent() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [balance, setBalance] = useState(null);
  const [contractBalance, setContractBalance] = useState(null);
  const [amount, setAmount] = useState("0.01");
  const [withdrawAmount, setWithdrawAmount] = useState("0.01");
  const [loading, setLoading] = useState(false);
  const [userAddress, setUserAddress] = useState(null);
  const [networkValid, setNetworkValid] = useState(true);
  const [error, setError] = useState(null);

  const checkNetwork = async () => {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    setNetworkValid(chainId === LOCAL_CHAIN_ID);
    return chainId === LOCAL_CHAIN_ID;
  };

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Установи MetaMask");

    try {
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      const isValidNetwork = await checkNetwork();

      if (!isValidNetwork) {
        setError("Подключись к сети Hardhat (localhost:8545)");
        return;
      }

      setUserAddress(accounts[0]);
      setWalletConnected(true);
      setError(null);
    } catch (err) {
      console.error("Ошибка подключения MetaMask:", err);
      setError("Не удалось подключить кошелёк");
    }
  };

  const getContract = async () => {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const contractProvider = new ethers.Contract(CONTRACT_ADDRESS, balanceStorageAbi, provider)
    if (contractProvider) {
      const contractRawBalance = await contractProvider.getContractBalance()
      setContractBalance(ethers.formatEther(contractRawBalance));
    }
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_ADDRESS, balanceStorageAbi, signer);
  };

  const fetchBalance = async () => {
    try {
      const contract = await getContract();
      const rawBalance = await contract.getMyBalance();
      setBalance(ethers.formatEther(rawBalance));
      setError(null);
    } catch (err) {
      console.error("Ошибка при получении баланса:", err);
      setError("Не удалось получить баланс");
    }
  };

  const deposit = async () => {
    setError(null);
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return alert("Введите корректное значение для депозита");
    }

    try {
      setLoading(true);
      const contract = await getContract();
      const value = ethers.parseEther(amount);
      const tx = await contract.deposit({ value });
      await tx.wait();
      await fetchBalance();
    } catch (err) {
      console.error("Ошибка при депозите:", err);
      setError("Ошибка при депозите");
    } finally {
      setLoading(false);
    }
  };

  const withdraw = async () => {
    setError(null);
    if (!withdrawAmount || isNaN(withdrawAmount) || parseFloat(withdrawAmount) <= 0) {
      return alert("Введите корректное значение для вывода");
    }

    try {
      setLoading(true);
      const contract = await getContract();
      const rawBalance = await contract.getMyBalance();
      const amountToWithdraw = ethers.parseEther(withdrawAmount);

      if (amountToWithdraw > rawBalance) {
        setError("Нельзя вывести больше, чем есть на балансе");
        setLoading(false);
        return;
      }

      const tx = await contract.withdraw(amountToWithdraw);
      await tx.wait();
      await fetchBalance();
    } catch (err) {
      console.error("Ошибка при выводе:", err);
      setError("Ошибка при выводе средств");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (!window.ethereum) return;
      const accounts = await window.ethereum.request({ method: "eth_accounts" });
      const validNetwork = await checkNetwork();

      if (accounts.length > 0 && validNetwork) {
        setUserAddress(accounts[0]);
        setWalletConnected(true);
      }
    };

    checkConnection();

    // подписка на смену аккаунта / сети
    const handleAccountsChanged = () => window.location.reload();
    const handleChainChanged = () => window.location.reload();

    window.ethereum?.on("accountsChanged", handleAccountsChanged);
    window.ethereum?.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  useEffect(() => {
    if (walletConnected) fetchBalance();
  }, [walletConnected]);

  return (
    <div style={{ padding: 20 }}>
      <h2>💰 Контракт: BalanceStorage</h2>

      {!walletConnected ? (
        <button onClick={connectWallet}>🔌 Подключить MetaMask</button>
      ) : !networkValid ? (
        <p style={{ color: "red" }}>❌ Подключись к локальной сети (Hardhat)</p>
      ) : (
        <>
          <p>👛 Адрес: {userAddress}</p>
          <p>🔍 Баланс в контракте: <strong>{balance ?? "—"} ETH</strong></p>
          <p>🔍 Баланс Контракта: <strong>{contractBalance ?? "—"} ETH</strong></p>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div style={{ marginBottom: 10 }}>
            <input
              type="number"
              step="0.001"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Сколько внести (ETH)"
            />
            <button onClick={deposit} disabled={loading}>
              {loading ? "⏳ Отправка..." : "📥 Внести депозит"}
            </button>
          </div>

          <div style={{ marginBottom: 10 }}>
            <input
              type="number"
              step="0.001"
              min="0"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="Сколько вывести (ETH)"
            />
            <button onClick={withdraw} disabled={loading}>
              {loading ? "⏳ Вывод..." : "📤 Вывести средства"}
            </button>
          </div>

          <button onClick={fetchBalance}>🔄 Обновить баланс</button>
        </>
      )}
    </div>
  );
}
