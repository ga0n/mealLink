import { IS_SEPOLIA } from "./config";

const SEPOLIA_EXPLORER = "https://sepolia.etherscan.io";

export function transactionExplorerUrl(hash?: string): string | undefined {
  return IS_SEPOLIA && hash ? `${SEPOLIA_EXPLORER}/tx/${hash}` : undefined;
}

export function addressExplorerUrl(address?: string): string | undefined {
  return IS_SEPOLIA && address
    ? `${SEPOLIA_EXPLORER}/address/${address}`
    : undefined;
}
