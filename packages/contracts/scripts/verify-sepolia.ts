import { readFile } from "node:fs/promises";
import hre from "hardhat";
import {
  requireEnvironment,
  SEPOLIA_DEPLOYMENT_FILE,
  type SepoliaDeployment,
} from "./sepolia-env.js";

requireEnvironment("ETHERSCAN_API_KEY");
const deployment = JSON.parse(
  await readFile(SEPOLIA_DEPLOYMENT_FILE, "utf8"),
) as SepoliaDeployment;
console.log(`Etherscan 소스 검증 요청: ${deployment.contractAddress}`);
await hre.tasks.getTask("verify").run({
  address: deployment.contractAddress,
  constructorArgs: [deployment.adminAddress],
  contract: "contracts/MealLink.sol:MealLink",
  force: false,
  creationTxHash: deployment.deploymentTransactionHash,
});
