import { keccak256, type Address, type Hex } from "viem";

export const LOCAL_VOUCHER_STORAGE_KEY = "meallink-local-vouchers-v1";

export interface LocalVoucherSecret {
  voucherId: string;
  campaignId: string;
  secret: Hex;
  restaurant: Address;
  recipientReference: string;
  issuedAt: string;
  transactionHash?: Hex;
}

export function createQrSecret(): Hex {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return `0x${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

export function hashQrSecret(secret: Hex) {
  return keccak256(secret);
}

export function encodeLocalVoucher(
  voucher: Pick<LocalVoucherSecret, "voucherId" | "secret">,
) {
  return `MEALLINK:LOCAL:${voucher.voucherId}:${voucher.secret}`;
}

export function parseLocalVoucher(value: string) {
  const match = value
    .trim()
    .match(/^MEALLINK:LOCAL:(\d+):(0x[0-9a-fA-F]{64})$/);
  if (!match) return undefined;
  return { voucherId: BigInt(match[1]), secret: match[2] as Hex };
}

export function loadLocalVouchers(): LocalVoucherSecret[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(
      localStorage.getItem(LOCAL_VOUCHER_STORAGE_KEY) ?? "[]",
    ) as LocalVoucherSecret[];
  } catch {
    return [];
  }
}

export function saveLocalVoucher(voucher: LocalVoucherSecret) {
  if (typeof window === "undefined") return;
  const vouchers = loadLocalVouchers().filter(
    (item) => item.voucherId !== voucher.voucherId,
  );
  localStorage.setItem(
    LOCAL_VOUCHER_STORAGE_KEY,
    JSON.stringify([voucher, ...vouchers]),
  );
}
