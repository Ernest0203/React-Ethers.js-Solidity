import hre from "hardhat";
import fs from "fs";
import path from "path";

const { ethers } = hre;

async function main() {
  const [deployer] = await ethers.getSigners();

  const TokenA = await ethers.getContractFactory("TokenA");
  const tokenA = await TokenA.deploy();
  await tokenA.waitForDeployment();

  const TokenB = await ethers.getContractFactory("TokenB");
  const tokenB = await TokenB.deploy();
  await tokenB.waitForDeployment();

  const DEX = await ethers.getContractFactory("SimpleDEX");
  const dex = await DEX.deploy(await tokenA.getAddress(), await tokenB.getAddress());
  await dex.waitForDeployment();

  const deploymentsDir = path.join(process.cwd(), "deployments", "localhost");
  fs.mkdirSync(deploymentsDir, { recursive: true });

  const saveContractData = (name, contract, abi) => {
    const filePath = path.join(deploymentsDir, `${name}.json`);
    const content = {
      address: contract.target, // или await contract.getAddress()
      abi,
    };
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2));
    console.log(`✅ Saved ${name} to ${filePath}`);
  };

  saveContractData("TokenA", tokenA, TokenA.interface.formatJson());
  saveContractData("TokenB", tokenB, TokenB.interface.formatJson());
  saveContractData("SimpleDEX", dex, DEX.interface.formatJson());
}

main().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exitCode = 1;
});
