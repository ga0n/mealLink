import toolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import hardhatVerify from "@nomicfoundation/hardhat-verify";
import { configVariable, defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [toolboxMochaEthers, hardhatVerify],
  networks: {
    localhost: {
      type: "http",
      chainType: "l1",
      chainId: 31337,
      url: "http://127.0.0.1:8545",
      accounts: "remote",
    },
    sepolia: {
      type: "http",
      chainType: "l1",
      chainId: 11155111,
      url: configVariable("SEPOLIA_RPC_URL"),
      accounts: [configVariable("SEPOLIA_DEPLOYER_PRIVATE_KEY")],
    },
  },
  verify: {
    etherscan: {
      apiKey: configVariable("ETHERSCAN_API_KEY"),
    },
  },
  solidity: {
    profiles: {
      default: {
        version: "0.8.28",
        settings: { optimizer: { enabled: true, runs: 200 } },
      },
      production: {
        version: "0.8.28",
        settings: { optimizer: { enabled: true, runs: 500 }, viaIR: true },
      },
    },
  },
  paths: {
    sources: "./contracts",
    tests: { mocha: "./test" },
    cache: "./cache",
    artifacts: "./artifacts",
  },
  test: {
    mocha: { timeout: 40_000 },
  },
});
