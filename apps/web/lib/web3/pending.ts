import type { Hex } from "viem";
import { ACTIVE_CHAIN_ID } from "./config";

export const TRANSACTION_STORAGE_KEY = "meallink-onchain-transactions-v1";

export type StoredTransaction = {
  hash: Hex;
  chainId: number;
  action: "donate" | "issue" | "redeem";
  status: "pending" | "confirmed" | "failed";
  createdAt: string;
  blockNumber?: string;
};

export function loadTransactions(): StoredTransaction[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      localStorage.getItem(TRANSACTION_STORAGE_KEY) ?? "[]",
    ) as StoredTransaction[];
  } catch {
    return [];
  }
}

export function savePendingTransaction(
  hash: Hex,
  action: StoredTransaction["action"],
) {
  if (typeof window === "undefined") return;
  const current = loadTransactions().filter((item) => item.hash !== hash);
  const next: StoredTransaction = {
    hash,
    chainId: ACTIVE_CHAIN_ID,
    action,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(
    TRANSACTION_STORAGE_KEY,
    JSON.stringify([next, ...current].slice(0, 20)),
  );
}

export function updateStoredTransaction(
  hash: Hex,
  status: StoredTransaction["status"],
  blockNumber?: bigint,
) {
  if (typeof window === "undefined") return;
  const next = loadTransactions().map((item) =>
    item.hash === hash
      ? { ...item, status, blockNumber: blockNumber?.toString() }
      : item,
  );
  localStorage.setItem(TRANSACTION_STORAGE_KEY, JSON.stringify(next));
}

export function latestActiveTransaction() {
  return loadTransactions().find((item) => item.chainId === ACTIVE_CHAIN_ID);
}
