const { config } = require("dotenv");

require("@nomiclabs/hardhat-waffle");
require("@nomicfoundation/hardhat-verify");
require("solidity-coverage");

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

const CHAIN_ID = 84531; // Mumbai chain id

/*===========================  END SETTINGS  ========================*/
/*===================================================================*/

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
        // details: {
        //   yul: true
        // }
      },
    },
  },
  networks: {
    mainnet: {
      url: RPC_URL,
      chainId: CHAIN_ID,
      accounts: [PRIVATE_KEY],
    },
    hardhat: {
      // ******* zkevm plugin testing *******
      // chainId: 1101,
      // forking: {
      //   url: "https://zkevm-rpc.com",
      //   blockNumber: 5210000,
      // }
      // ***********************************
      // ******* base plugin testing *******
      chainId: 8453,
      forking: {
        url: "https://mainnet.base.org",
        blockNumber: 7511050,
      },
      // ***********************************
    },
  },
  etherscan: {
    apiKey: SCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./tests/base",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 300000,
  },
};
