const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers");
const hre = require("hardhat");

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

// PluginFactory settings
const VOTER_ADDRESS = "0x0000000000000000000000000000000000000000";
const BHONEY = "0xb89a17406508dc5edc3e777cbc23cd6b07fa6283";
const WBERA = "0x5806E416dA447b267cEA759358cF22Cc41FAE80F";

/*===========================  END SETTINGS  ========================*/
/*===================================================================*/

// Constants
const sleep = (delay) => new Promise((resolve) => setTimeout(resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);

// Contract Variables
let plugin;

/*===================================================================*/
/*===========================  CONTRACT DATA  =======================*/

async function getContracts() {
  // plugin = await ethers.getContractAt("contracts/plugins/berachain/BerpPlugin.sol:BerpPlugin", "0x0000000000000000000000000000000000000000");

  console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployPlugin() {
  console.log("Starting Plugin Deployment");
  const pluginArtifact = await ethers.getContractFactory("BerpPlugin");
  const pluginContract = await pluginArtifact.deploy(
    BHONEY,
    VOTER_ADDRESS,
    [BHONEY],
    [BGT],
    {
      gasPrice: ethers.gasPrice,
    }
  );
  plugin = await pluginContract.deployed();
  await sleep(5000);
  console.log("PluginDeployed at:", plugin.address);
  console.log("**************************************************************");
  console.log("Plugin: ", plugin.address);
  console.log("**************************************************************");
}

async function verifyPlugin() {
  console.log("Starting Plugin Verification");
  await hre.run("verify:verify", {
    address: plugin.address,
    contract:
      "contracts/plugins/berachain/BexPairPluginFactory.sol:BexPairPlugin",
    constructorArguments: [
      await plugin.getUnderlyingAddress(),
      VOTER_ADDRESS,
      await plugin.getTokensInUnderlying(),
      await plugin.getBribeTokens(),
      await plugin.getProtocol(),
      await plugin.getUnderlyingSymbol(),
    ],
  });
  console.log("Plugin Verified");
}

async function main() {
  const [wallet] = await ethers.getSigners();
  console.log("Using wallet: ", wallet.address);

  await getContracts();

  //===================================================================
  // 1. Deploy Plugin
  //===================================================================
  // Only deploy one plugin at a time

  // await deployPlugin();

  /*********** UPDATE getContracts() with new addresses *************/

  //===================================================================
  // 2. Verify Plugin
  //===================================================================

  // await verifyPlugin();
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
