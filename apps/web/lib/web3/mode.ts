import { getAddress, isAddress, type Address } from "viem";
import { ACTIVE_CHAIN_ID, IS_SEPOLIA, SEPOLIA_RPC_URL } from "./config";

export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

export function getContractAddress(): Address | undefined {
  const value = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  return value && isAddress(value) ? getAddress(value) : undefined;
}

export const CONTRACT_ADDRESS = getContractAddress();
export const CONTRACT_DEPLOYMENT_BLOCK = (() => {
  const value = process.env.NEXT_PUBLIC_CONTRACT_DEPLOYMENT_BLOCK;
  return value && /^\d+$/.test(value) ? BigInt(value) : 0n;
})();

export const ONCHAIN_MODE = IS_SEPOLIA ? "sepolia" : "local";
export const MODE_LABEL = IS_DEMO_MODE
  ? "DEMO MODE"
  : IS_SEPOLIA
    ? "SEPOLIA TESTNET"
    : "LOCAL BLOCKCHAIN";

export function getPublicConfigurationError(): string | undefined {
  if (IS_DEMO_MODE) return undefined;
  if (!CONTRACT_ADDRESS)
    return "NEXT_PUBLIC_CONTRACT_ADDRESS가 설정되지 않았습니다.";
  if (IS_SEPOLIA && !SEPOLIA_RPC_URL)
    return "NEXT_PUBLIC_SEPOLIA_RPC_URL이 설정되지 않았습니다.";
  if (![31_337, 11_155_111].includes(ACTIVE_CHAIN_ID))
    return "지원하지 않는 체인 ID입니다.";
  return undefined;
}
