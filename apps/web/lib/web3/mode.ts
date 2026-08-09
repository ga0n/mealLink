import { getAddress, isAddress, type Address } from "viem";

export const IS_DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE !== "false";

export function getContractAddress(): Address | undefined {
  const value = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
  return value && isAddress(value) ? getAddress(value) : undefined;
}

export const CONTRACT_ADDRESS = getContractAddress();
