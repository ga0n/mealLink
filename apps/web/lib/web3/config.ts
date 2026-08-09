import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors/injected";
import { defineChain } from "viem";

export const HARDHAT_CHAIN_ID = 31_337;
export const HARDHAT_RPC_URL =
  process.env.NEXT_PUBLIC_LOCAL_RPC_URL ?? "http://127.0.0.1:8545";

export const hardhatLocal = defineChain({
  id: HARDHAT_CHAIN_ID,
  name: "Hardhat Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [HARDHAT_RPC_URL] },
  },
  testnet: true,
});

export function createWagmiConfig() {
  return createConfig({
    chains: [hardhatLocal],
    connectors: [injected({ target: "metaMask" })],
    ssr: true,
    transports: {
      [hardhatLocal.id]: http(HARDHAT_RPC_URL),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof createWagmiConfig>;
  }
}
