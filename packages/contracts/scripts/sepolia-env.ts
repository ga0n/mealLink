import { isAddress } from "ethers";

export const SEPOLIA_CHAIN_ID = 11_155_111;
export const SEPOLIA_DEPLOYMENT_FILE = new URL(
  "../deployments/sepolia.json",
  import.meta.url,
);

export function requireEnvironment(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(
      `${name} 환경변수가 없습니다. 값을 추측하지 않고 작업을 중단합니다.`,
    );
  }
  return value;
}

export function requirePublicAddress(name: string): string {
  const value = requireEnvironment(name);
  if (!isAddress(value))
    throw new Error(`${name}에 올바른 공개 주소를 입력해 주세요.`);
  return value;
}

export function validatePrivateKeyPresence(): void {
  const value = requireEnvironment("SEPOLIA_DEPLOYER_PRIVATE_KEY");
  if (!/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error("SEPOLIA_DEPLOYER_PRIVATE_KEY 형식이 올바르지 않습니다.");
  }
}

export type SepoliaDeployment = {
  chainId: typeof SEPOLIA_CHAIN_ID;
  contractAddress: string;
  deploymentTransactionHash: string;
  deploymentBlockNumber: number;
  adminAddress: string;
  agencyAddress: string;
  restaurantAddress: string;
  donorAddress: string;
  campaignId?: number;
  campaignTransactionHash?: string;
  deployedAt: string;
  seededAt?: string;
};
