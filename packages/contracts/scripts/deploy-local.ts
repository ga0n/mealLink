import { writeFile } from "node:fs/promises";
import { network } from "hardhat";

const connection = await network.create("localhost");
const { ethers } = connection;

try {
  const [admin] = await ethers.getSigners();
  const mealLink = await ethers.deployContract("MealLink", [admin.address]);
  await mealLink.waitForDeployment();
  const address = await mealLink.getAddress();
  await writeFile(
    new URL("../.local-deployment.json", import.meta.url),
    `${JSON.stringify({ chainId: 31337, address }, null, 2)}\n`,
    "utf8",
  );
  console.log(`MealLink local address: ${address}`);
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
} finally {
  await connection.close();
}
