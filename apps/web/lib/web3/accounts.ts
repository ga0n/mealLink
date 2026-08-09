import type { Address } from "viem";

export const LOCAL_ACCOUNTS = {
  admin: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266" as Address,
  welfareAgency: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" as Address,
  restaurant: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC" as Address,
  donor: "0x90F79bf6EB2c4f870365E785982E1f101E93b906" as Address,
} as const;

export const LOCAL_RESTAURANTS = [
  {
    name: "온기식당 광운점",
    address: LOCAL_ACCOUNTS.restaurant,
  },
] as const;

export function shortenAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
