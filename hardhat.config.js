const { config } = require("dotenv");

require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("solidity-coverage");

config();
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const SCAN_API_KEY = process.env.SCAN_API_KEY || "";
const RPC_URL = process.env.RPC_URL || "";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
        details: {
          yul: true
        }
      },
    },
  },
  networks: {
    hardhat: {
    },
    mainnet: {
      url: RPC_URL,
      chainId: /*UPDATE chainId*/ 80001, /*END UPDATE*/
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: SCAN_API_KEY
  },
  paths: {
    sources: "./contracts",
    tests: "./tests",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 300000,
  },
};
