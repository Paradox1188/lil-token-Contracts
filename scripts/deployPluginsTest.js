const { ethers } = require("hardhat");
const { utils, BigNumber } = require("ethers")
const hre = require("hardhat")

/*===================================================================*/
/*===========================  SETTINGS  ============================*/

const VOTER_ADDRESS = '0x0000000000000000000000000000000000000000';

/*===========================  END SETTINGS  ========================*/
/*===================================================================*/

// Constants
const sleep = (delay) => new Promise (( resolve) => setTimeout (resolve, delay));
const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);

// Contract Variables
let pluginFactory;
let plugin;

/*===================================================================*/
/*===========================  CONTRACT DATA  =======================*/

async function getContracts() {

    // pluginFactory = await ethers.getContractAt("contracts/plugins/local/MockPluginFactory.sol:MockPluginFactory", "0x0000000000000000000000000000000000000000");
    // plugin = await ethers.getContractAt("contracts/plugins/local/MockPluginFactory.sol:MockPlugin", "0x0000000000000000000000000000000000000000");

    console.log("Contracts Retrieved");
}

/*===========================  END CONTRACT DATA  ===================*/
/*===================================================================*/

async function deployPluginFactory() {
    console.log('Starting PluginFactory Deployment');
    const pluginFactoryArtifact = await ethers.getContractFactory("MockPluginFactory");
    const pluginFactoryContract = await pluginFactoryArtifact.deploy(VOTER_ADDRESS, { gasPrice: ethers.gasPrice, });
    pluginFactory = await pluginFactoryContract.deployed();
    await sleep(5000);
    console.log("PluginFactory Deployed at:", pluginFactory.address);
}

async function printFactoryAddress() {
    console.log('**************************************************************');
    console.log("PluginFactory: ", pluginFactory.address);
    console.log('**************************************************************');
}

async function verifyPluginFactory() {
    console.log('Starting PluginFactory Verification');
    await hre.run("verify:verify", {
        address: pluginFactory.address,
        contract: "contracts/plugins/local/MockPluginFactory.sol:MockPluginFactory",
        constructorArguments: [
            VOTER_ADDRESS,  
        ],
    });
    console.log("PluginFactory Verified");
}

async function deployLPPlugin(lpSymbol, token0Symbol, token1Symbol) {
    console.log('Starting Plugin Deployment');
    await pluginFactory.createLPMockPlugin(lpSymbol, token0Symbol, token1Symbol, { gasPrice: ethers.gasPrice, });
    await sleep(5000);
    let pluginAddress = await pluginFactory.last_plugin();
    console.log("Plugin Deployed at:", pluginAddress);
    console.log('**************************************************************');
    console.log("LP Plugin: ", pluginAddress);
    console.log('**************************************************************');
}

async function deployLPFarmPlugin(lpSymbol, token0Symbol, token1Symbol, rewardSymbol) {
    console.log('Starting Plugin Deployment');
    await pluginFactory.createLPMockFarmPlugin(lpSymbol, token0Symbol, token1Symbol, rewardSymbol, { gasPrice: ethers.gasPrice, });
    await sleep(5000);
    let pluginAddress = await pluginFactory.last_plugin();
    console.log("Plugin Deployed at:", pluginAddress);
    console.log('**************************************************************');
    console.log("LP Farm Plugin: ", pluginAddress);
    console.log('**************************************************************');
}

async function deploySingleStakePlugin(tokenSymbol, rewardSymbol) {
    console.log('Starting Plugin Deployment');
    await pluginFactory.createSingleStakeMockPlugin(tokenSymbol, rewardSymbol, { gasPrice: ethers.gasPrice, });
    await sleep(5000);
    let pluginAddress = await pluginFactory.last_plugin();
    console.log("Plugin Deployed at:", pluginAddress);
    console.log('**************************************************************');
    console.log("SingleStake Plugin: ", pluginAddress);
    console.log('**************************************************************');
}

async function verifyPlugin() {
    console.log('Starting Plugin Verification');
    await hre.run("verify:verify", {
        address: plugin.address,
        contract: "contracts/plugins/local/MockPluginFactory.sol:MockPlugin",
        constructorArguments: [
            await plugin.getUnderlyingAddress(),
            VOTER_ADDRESS,
            await plugin.getTokensInUnderlying(),
            await plugin.getBribeTokens(),
            await plugin.getProtocol(),
            await plugin.getUnderlyingSymbol(),
        ],  
    });
    console.log("LPMockPlugin Verified");
}

async function main() {

    const [wallet] = await ethers.getSigners();
    console.log('Using wallet: ', wallet.address);
  
    await getContracts();
    
    //===================================================================
    // 1. Deploy Plugin Factory
    //===================================================================

    // await deployPluginFactory();
    // await printFactoryAddress();

    /*********** UPDATE getContracts() with new addresses *************/

    //===================================================================
    // 2. Verify Plugin Factory
    //===================================================================

    // await verifyPluginFactory();

    //===================================================================
    // 3. Deploy Plugin
    //===================================================================
    // Only deploy one plugin at a time

    //----LP Plugin------------------------------------------------------
    // await deployLPPlugin("LP-TEST0/TEST1", "TEST0", "TEST1");

    //----LP Farm Plugin-------------------------------------------------
    // await deployLPFarmPlugin("LP-TEST0/TEST1", "TEST0", "TEST1", "RWRD0");

    //----Single Stake Plugin--------------------------------------------
    // await deploySingleStakePlugin("TEST0", "TEST1");

    /*********** UPDATE getContracts() with new addresses *************/

    //===================================================================
    // 4. Verify Plugin
    //===================================================================

    // await verifyPlugin();
  
  }
  
  main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });