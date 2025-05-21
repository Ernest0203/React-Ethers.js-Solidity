import { useEffect, useState } from "react";
import { ethers } from "ethers";

const networks = {
  bnb_testnet: {
    chainId: "0x61", // 97 в hex
    chainName: "BNB Smart Chain Testnet",
    rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545/"],
    //blockExplorerUrls: ["https://testnet.bscscan.com"],
    blockExplorerUrls: ["https://bsc-testnet.publicnode.com"],
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18,
    },
  },
  polygon_mumbai: {
    chainId: "0x13881",
    chainName: "Polygon Mumbai",
    rpcUrls: ["https://polygon-mumbai.g.alchemy.com/v2/YOUR_API_KEY"],
    blockExplorerUrls: ["https://mumbai.polygonscan.com"],
    nativeCurrency: {
      name: "MATIC",
      symbol: "MATIC",
      decimals: 18,
    },
  }
};

export default function WalletSender() {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [status, setStatus] = useState("");
  const [networkName, setNetworkName] = useState("");

  useEffect(() => {
    detectNetwork();
    window.ethereum?.on("chainChanged", detectNetwork);
  }, []);

  const detectNetwork = async () => {
    if (!window.ethereum) return setNetworkName("Metamask не найден");
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const net = await provider.getNetwork();
      setNetworkName(mapChainIdToName(net.chainId));
    } catch (err) {
      setNetworkName("Ошибка сети");
    }
  };

  const mapChainIdToName = (chainId) => {
    switch (Number(chainId)) {
      case 97:
        return "BNB Smart Chain Testnet";
      case 80001:
        return "Polygon Mumbai";
      default:
        return `Неизвестная сеть (Chain ID: ${chainId})`;
    }
  };

  const switchNetwork = async (key) => {
    const net = networks[key];
    if (!window.ethereum) return alert("Metamask не найден");

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: net.chainId }],
      });
    } catch (switchError) {
      // Если сеть не добавлена — пробуем добавить
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [net],
          });
        } catch (addError) {
          console.error("Ошибка при добавлении сети:", addError);
        }
      } else {
        console.error("Ошибка переключения сети:", switchError);
      }
    }
  };

  const sendTransaction = async () => {
    try {
      if (!window.ethereum) throw new Error("Metamask не установлен");

      await window.ethereum.request({ method: "eth_requestAccounts" });
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const tx = await signer.sendTransaction({
        to,
        value: ethers.parseEther(amount),
        gasPrice: ethers.parseUnits("200", "gwei")
      });

      setStatus("⏳ Отправка...");
      const receipt = await Promise.race([
        tx.wait(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Ожидание превысило лимит (15 секунд)")), 15000)
        )
      ])
      console.log("TX mined:", receipt)
      setStatus("✅ Успешно отправлено!");
    } catch (err) {
      setStatus("❌ Ошибка: " + err.message);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto bg-white shadow rounded">
      <h2 className="text-xl font-bold">🧾 Wallet - sender</h2>

      <div className="space-y-2">
        <div className="text-sm">🔗 Текущая сеть: <strong>{networkName}</strong></div>
        <br />
        <div className="space-x-2">
          <button
            onClick={() => switchNetwork("bnb_testnet")}
            className="bg-yellow-400 px-3 py-1 rounded text-sm hover:bg-yellow-500"
          >
            BNB Testnet
          </button>
          {/* <button
            onClick={() => switchNetwork("polygon_mumbai")}
            className="bg-purple-400 px-3 py-1 rounded text-sm hover:bg-purple-500 text-white"
          >
            Polygon Mumbai
          </button> */}
        </div>
      </div>

      <input
        className="border p-2 w-full"
        placeholder="Адрес получателя"
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <input
        className="border p-2 w-full"
        placeholder="Сумма (BNB / MATIC)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <button
        onClick={sendTransaction}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
      >
        Отправить
      </button>
      <div>{status}</div>
    </div>
  );
}
