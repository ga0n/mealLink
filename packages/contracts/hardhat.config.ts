import toolboxMochaEthers from "@nomicfoundation/hardhat-toolbox-mocha-ethers";
import { defineConfig } from "hardhat/config";

export default defineConfig({
  plugins: [toolboxMochaEthers],
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
