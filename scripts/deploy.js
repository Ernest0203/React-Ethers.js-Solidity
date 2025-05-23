import hre from "hardhat";

async function main() {
  const Contract = await hre.ethers.getContractFactory("BalanceStorage");
  const contract = await Contract.deploy();

  await contract.waitForDeployment();

  console.log("Contract deployed at:", await contract.getAddress());
}

main();
