import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import DexJson from "../../deployments/localhost/SimpleDEX.json";
import TokenAJson from "../../deployments/localhost/TokenA.json";

const DEX_ADDRESS = DexJson.address;
const DEX_ABI = DexJson.abi;
const TOKEN_A_ADDRESS = TokenAJson.address;
const TOKEN_A_ABI = TokenAJson.abi;

const LOCAL_CHAIN_ID = "0x7a69"; // Hardhat

export default function DexComponent() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState(null);
  const [tokenAmount, setTokenAmount] = useState("1");
  const [ethAmount, setEthAmount] = useState("0.01");
  const [reserves, setReserves] = useState({ eth: "-", token: "-" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Проверка сети
  const checkNetwork = async () => {
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    return chainId === LOCAL_CHAIN_ID;
  };

  // Подключение кошелька
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Установи MetaMask");
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const validNetwork = await checkNetwork();
    if (!validNetwork) return alert("Подключись к Hardhat сети");

    setUserAddress(accounts[0]);
    setWalletConnected(true);
  };

  const getProvider = () => new ethers.BrowserProvider(window.ethereum);
  const getSigner = async () => (await getProvider()).getSigner();

  const getDexContract = async (withSigner = false) => {
    const provider = await getProvider();
    const signer = withSigner ? await provider.getSigner() : undefined;
    return new ethers.Contract(DEX_ADDRESS, DEX_ABI, signer || provider);
  };

  const getTokenContract = async (withSigner = false) => {
    const provider = await getProvider();
    const signer = withSigner ? await provider.getSigner() : undefined;
    return new ethers.Contract(TOKEN_A_ADDRESS, TOKEN_A_ABI, signer || provider);
  };

  // Получить резервы из контракта
  const fetchReserves = async () => {
    try {
      const dex = await getDexContract();
      const [ethReserve, tokenReserve] = await dex.getReserves();
      setReserves({
        eth: ethers.formatEther(ethReserve),
        token: ethers.formatEther(tokenReserve),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Добавить ликвидность (ETH + токены)
  const addLiquidity = async () => {
    setError(null);
    setLoading(true);
    try {
      const dex = await getDexContract(true);
      const token = await getTokenContract(true);

      const tokenAmountParsed = ethers.parseEther(tokenAmount);
      const ethAmountParsed = ethers.parseEther(ethAmount);

      // Проверяем approve токена
      const allowance = await token.allowance(userAddress, DEX_ADDRESS);
      if (allowance < tokenAmountParsed) {
        const approveTx = await token.approve(DEX_ADDRESS, tokenAmountParsed);
        await approveTx.wait();
      }

      console.log(ethAmountParsed, tokenAmountParsed);

      // Вызываем addLiquidity с передачей ETH
      const tx = await dex.addLiquidity(tokenAmountParsed, { value: ethAmountParsed });
      await tx.wait();

      await fetchReserves();
    } catch (e) {
      console.error(e);
      setError("Ошибка при добавлении ликвидности");
    }
    setLoading(false);
  };

  // Свап ETH на токен
  const swapEthForToken = async () => {
    setError(null);
    setLoading(true);
    try {
      const dex = await getDexContract(true);
      const ethAmountParsed = ethers.parseEther(ethAmount);
      const tx = await dex.swapETHForToken({ value: ethAmountParsed });
      await tx.wait();
      await fetchReserves();
    } catch (e) {
      console.error(e);
      setError("Ошибка при свапе ETH → Token");
    }
    setLoading(false);
  };

  // Свап токен на ETH
  const swapTokenForEth = async () => {
    setError(null);
    setLoading(true);
    try {
      const dex = await getDexContract(true);
      const token = await getTokenContract(true);

      const tokenAmountParsed = ethers.parseEther(tokenAmount);

      const allowance = await token.allowance(userAddress, DEX_ADDRESS);
      if (allowance < tokenAmountParsed) {
        const approveTx = await token.approve(DEX_ADDRESS, tokenAmountParsed);
        await approveTx.wait();
      }

      const tx = await dex.swapTokenForETH(tokenAmountParsed);
      await tx.wait();
      await fetchReserves();
    } catch (e) {
      console.error(e);
      setError("Ошибка при свапе Token → ETH");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (walletConnected) {
      fetchReserves();
    }
  }, [walletConnected]);

  return (
    <div style={{ padding: 20 }}>
      <h2>🧪 Simple DEX (ETH & Token)</h2>

      {!walletConnected ? (
        <button onClick={connectWallet}>🔌 Подключить кошелек</button>
      ) : (
        <>
          <p>👛 Адрес: {userAddress}</p>
          <p>📊 Резервы: {reserves.eth} ETH / {reserves.token} Token</p>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div style={{ marginTop: 20 }}>
            <h3>💧 Добавить ликвидность</h3>
            <input
              type="number"
              step="0.0001"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              placeholder="ETH количество"
            />
            <input
              type="number"
              step="0.0001"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              placeholder="Token количество"
            />
            <button onClick={addLiquidity} disabled={loading}>Добавить</button>
          </div>

          <div style={{ marginTop: 20 }}>
            <h3>⚡️ Свап ETH → Token</h3>
            <input
              type="number"
              step="0.0001"
              value={ethAmount}
              onChange={(e) => setEthAmount(e.target.value)}
              placeholder="ETH количество"
            />
            <button onClick={swapEthForToken} disabled={loading}>Свапнуть ETH → Token</button>
          </div>

          <div style={{ marginTop: 20 }}>
            <h3>⚡️ Свап Token → ETH</h3>
            <input
              type="number"
              step="0.0001"
              value={tokenAmount}
              onChange={(e) => setTokenAmount(e.target.value)}
              placeholder="Token количество"
            />
            <button onClick={swapTokenForEth} disabled={loading}>Свапнуть Token → ETH</button>
          </div>

          <button style={{ marginTop: 20 }} onClick={fetchReserves}>🔄 Обновить резервы</button>
        </>
      )}
    </div>
  );
}
