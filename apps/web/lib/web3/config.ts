import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors/injected";
import { defineChain } from "viem";
import { sepolia } from "viem/chains";

export const HARDHAT_CHAIN_ID = 31_337;
export const SEPOLIA_CHAIN_ID = 11_155_111;
export const HARDHAT_RPC_URL =
  process.env.NEXT_PUBLIC_LOCAL_RPC_URL ?? "http://127.0.0.1:8545";
export const SEPOLIA_RPC_URL = process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL;

export const hardhatLocal = defineChain({
  id: HARDHAT_CHAIN_ID,
  name: "Hardhat Local",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [HARDHAT_RPC_URL] } },
  testnet: true,
});

export const ACTIVE_CHAIN_ID =
  Number(process.env.NEXT_PUBLIC_CHAIN_ID) === SEPOLIA_CHAIN_ID
    ? SEPOLIA_CHAIN_ID
    : HARDHAT_CHAIN_ID;
export const IS_SEPOLIA = ACTIVE_CHAIN_ID === SEPOLIA_CHAIN_ID;
export const ACTIVE_CHAIN = IS_SEPOLIA ? sepolia : hardhatLocal;
export const ACTIVE_NETWORK_NAME = IS_SEPOLIA ? "Sepolia" : "Hardhat Local";
export const ACTIVE_RPC_URL = IS_SEPOLIA ? SEPOLIA_RPC_URL : HARDHAT_RPC_URL;

export function createWagmiConfig() {
  return createConfig({
    chains: [hardhatLocal, sepolia],
    connectors: [injected({ target: "metaMask" })],
    ssr: true,
    transports: {
      [hardhatLocal.id]: http(HARDHAT_RPC_URL),
      [sepolia.id]: http(SEPOLIA_RPC_URL),
    },
  });
}

declare module "wagmi" {
  interface Register {
    config: ReturnType<typeof createWagmiConfig>;
  }
}
