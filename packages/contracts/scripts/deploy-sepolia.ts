import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { network } from "hardhat";
import {
  requirePublicAddress,
  SEPOLIA_CHAIN_ID,
  SEPOLIA_DEPLOYMENT_FILE,
  type SepoliaDeployment,
  validatePrivateKeyPresence,
} from "./sepolia-env.js";

validatePrivateKeyPresence();
const agencyAddress = requirePublicAddress("SEPOLIA_AGENCY_ADDRESS");
const restaurantAddress = requirePublicAddress("SEPOLIA_RESTAURANT_ADDRESS");
const donorAddress = requirePublicAddress("SEPOLIA_DONOR_ADDRESS");
const connection = await network.create("sepolia");
const { ethers } = connection;

try {
  const chain = await ethers.provider.getNetwork();
  if (chain.chainId !== BigInt(SEPOLIA_CHAIN_ID)) {
    throw new Error(
      `Sepolia가 아닌 chainId ${chain.chainId.toString()}에 연결되어 배포를 중단합니다.`,
    );
  }

  try {
    await access(SEPOLIA_DEPLOYMENT_FILE);
    const existing = JSON.parse(
      await readFile(SEPOLIA_DEPLOYMENT_FILE, "utf8"),
    ) as SepoliaDeployment;
    const code = await ethers.provider.getCode(existing.contractAddress);
    if (existing.chainId === SEPOLIA_CHAIN_ID && code !== "0x") {
      throw new Error(
        `이미 기록된 Sepolia 배포가 있습니다: ${existing.contractAddress}. 중복 배포를 막았습니다.`,
      );
    }
    throw new Error(
      "기존 Sepolia 배포 기록이 유효하지 않습니다. 파일을 직접 확인한 뒤 조치해 주세요.",
    );
  } catch (error) {
    if (error instanceof Error && !error.message.includes("ENOENT"))
      throw error;
  }

  const [admin] = await ethers.getSigners();
  for (const [role, address, minimum] of [
    ["welfare agency", agencyAddress, ethers.parseEther("0.0002")],
    ["restaurant", restaurantAddress, ethers.parseEther("0.0002")],
    ["donor", donorAddress, ethers.parseEther("0.0012")],
  ] as const) {
    const roleBalance = await ethers.provider.getBalance(address);
    console.log(
      `${role} 공개 주소: ${address} · 잔액 ${ethers.formatEther(roleBalance)} Sepolia ETH`,
    );
    if (roleBalance < minimum) {
      throw new Error(
        `${role} 주소 ${address}에 테스트 ETH가 부족합니다. 최소 ${ethers.formatEther(minimum)} Sepolia ETH를 준비해 주세요.`,
      );
    }
  }
  const balance = await ethers.provider.getBalance(admin.address);
  const factory = await ethers.getContractFactory("MealLink", admin);
  const deploymentRequest = await factory.getDeployTransaction(admin.address);
  const estimatedGas = await ethers.provider.estimateGas({
    ...deploymentRequest,
    from: admin.address,
  });
  const feeData = await ethers.provider.getFeeData();
  const gasPrice = feeData.maxFeePerGas ?? feeData.gasPrice;
  if (!gasPrice)
    throw new Error(
      "Sepolia 가스 가격을 조회하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    );
  const requiredBalance = estimatedGas * gasPrice * 2n;
  console.log(`deployer 공개 주소: ${admin.address}`);
  console.log(`deployer 잔액: ${ethers.formatEther(balance)} Sepolia ETH`);
  if (balance < requiredBalance) {
    throw new Error(
      `배포 가스비가 부족합니다. ${admin.address}에 최소 ${ethers.formatEther(requiredBalance)} Sepolia ETH가 필요합니다.`,
    );
  }

  const mealLink = await factory.deploy(admin.address);
  const deploymentTransaction = mealLink.deploymentTransaction();
  if (!deploymentTransaction)
    throw new Error("배포 트랜잭션을 생성하지 못했습니다.");
  console.log("배포 트랜잭션이 제출되었습니다. 블록 확정까지 기다립니다.");
  await mealLink.waitForDeployment();
  const receipt = await deploymentTransaction.wait();
  if (!receipt || receipt.status !== 1)
    throw new Error("Sepolia 배포 트랜잭션이 실패했습니다.");

  const record: SepoliaDeployment = {
    chainId: SEPOLIA_CHAIN_ID,
    contractAddress: await mealLink.getAddress(),
    deploymentTransactionHash: deploymentTransaction.hash,
    deploymentBlockNumber: receipt.blockNumber,
    adminAddress: admin.address,
    agencyAddress,
    restaurantAddress,
    donorAddress,
    deployedAt: new Date().toISOString(),
  };
  await mkdir(new URL("../deployments/", import.meta.url), { recursive: true });
  await writeFile(
    SEPOLIA_DEPLOYMENT_FILE,
    `${JSON.stringify(record, null, 2)}\n`,
    "utf8",
  );
  console.log(`Sepolia 배포 완료: ${record.contractAddress}`);
  console.log(
    `트랜잭션: https://sepolia.etherscan.io/tx/${record.deploymentTransactionHash}`,
  );
} finally {
  await connection.close();
}
