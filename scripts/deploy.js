import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying with:", deployer.address);

  const SimpleBank = await ethers.getContractFactory("SimpleBank");
  const simpleBank = await SimpleBank.deploy();

  console.log("SimpleBank deployed to:", simpleBank.target);

  const deploymentsDir = path.join(__dirname, "../deployments/localhost");
  const filePath = path.join(deploymentsDir, "SimpleBank.json");

  fs.mkdirSync(deploymentsDir, { recursive: true });

  fs.writeFileSync(
    filePath,
    JSON.stringify(
      {
        address: simpleBank.target,
        abi: SimpleBank.interface.formatJson(),
      },
      null,
      2
    )
  );

  console.log("Deployment info saved to:", filePath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
