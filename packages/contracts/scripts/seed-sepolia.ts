import { readFile, writeFile } from "node:fs/promises";
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
const deployment = JSON.parse(
  await readFile(SEPOLIA_DEPLOYMENT_FILE, "utf8"),
) as SepoliaDeployment;
if (deployment.chainId !== SEPOLIA_CHAIN_ID)
  throw new Error("Sepolia 배포 기록이 아닙니다.");
if (deployment.agencyAddress.toLowerCase() !== agencyAddress.toLowerCase()) {
  throw new Error(
    "배포 기록과 SEPOLIA_AGENCY_ADDRESS가 달라 초기화를 중단합니다.",
  );
}
if (
  deployment.restaurantAddress.toLowerCase() !== restaurantAddress.toLowerCase()
) {
  throw new Error(
    "배포 기록과 SEPOLIA_RESTAURANT_ADDRESS가 달라 초기화를 중단합니다.",
  );
}

const connection = await network.create("sepolia");
const { ethers } = connection;
try {
  const [admin] = await ethers.getSigners();
  const code = await ethers.provider.getCode(deployment.contractAddress);
  if (code === "0x") throw new Error("기록된 주소에 컨트랙트 코드가 없습니다.");

  const requiredGasReserve = ethers.parseEther("0.0002");
  for (const [role, address] of [
    ["deployer/admin", admin.address],
    ["welfare agency", agencyAddress],
    ["restaurant", restaurantAddress],
  ] as const) {
    const balance = await ethers.provider.getBalance(address);
    console.log(
      `${role} 공개 주소: ${address} · 잔액 ${ethers.formatEther(balance)} Sepolia ETH`,
    );
    if (balance < requiredGasReserve) {
      throw new Error(
        `${role} 주소 ${address}에 테스트 가스비가 부족합니다. 최소 0.0002 Sepolia ETH를 준비해 주세요.`,
      );
    }
  }

  const mealLink = await ethers.getContractAt(
    "MealLink",
    deployment.contractAddress,
    admin,
  );
  let campaignExists = false;
  try {
    const campaign = await mealLink.getCampaign(1n);
    if (
      campaign.agency.toLowerCase() !== agencyAddress.toLowerCase() ||
      campaign.goalQuantity !== 100n ||
      campaign.voucherPrice !== ethers.parseEther("0.001")
    ) {
      throw new Error(
        "캠페인 #1이 존재하지만 현재 환경 설정과 다릅니다. 자동으로 변경하지 않습니다.",
      );
    }
    console.log(
      "캠페인 #1이 이미 올바르게 초기화되어 있어 중복 생성을 건너뜁니다.",
    );
    campaignExists = true;
  } catch (error) {
    if (error instanceof Error && !error.message.includes("CampaignNotFound"))
      throw error;
  }

  if (!campaignExists) {
    const transaction = await mealLink.createCampaign(
      agencyAddress,
      100n,
      ethers.parseEther("0.001"),
    );
    console.log(
      "캠페인 생성 트랜잭션이 제출되었습니다. 블록 확정까지 기다립니다.",
    );
    const receipt = await transaction.wait();
    if (!receipt || receipt.status !== 1)
      throw new Error("캠페인 생성 트랜잭션이 실패했습니다.");
    deployment.campaignId = 1;
    deployment.campaignTransactionHash = transaction.hash;
    deployment.seededAt = new Date().toISOString();
    await writeFile(
      SEPOLIA_DEPLOYMENT_FILE,
      `${JSON.stringify(deployment, null, 2)}\n`,
      "utf8",
    );
    console.log(
      `캠페인 #1 생성 완료: https://sepolia.etherscan.io/tx/${transaction.hash}`,
    );
  }
} finally {
  await connection.close();
}
