const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const divDec6 = (amount, decimals = 6) => amount / 10 ** decimals;
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { execPath } = require("process");
const axios = require("axios");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

const AddressZero = "0x0000000000000000000000000000000000000000";
const one = convert("1", 18);
const two = convert("2", 18);
const five = convert("5", 18);
const ten = convert("10", 18);
const twenty = convert("20", 18);
const fifty = convert("50", 18);
const ninety = convert("90", 18);
const oneHundred = convert("100", 18);
const twoHundred = convert("200", 18);
const fiveHundred = convert("500", 18);
const eightHundred = convert("800", 18);
const oneThousand = convert("1000", 18);
const fiveThousand = convert("5000", 18);
const fiveThousand6 = convert("5000", 6);
const tenThousand6 = convert("10000", 6);
const oneHundred6 = convert("100", 6);

function timer(t) {
  return new Promise((r) => setTimeout(r, t));
}

const provider = new ethers.providers.getDefaultProvider(
  "http://127.0.0.1:8545/"
);

const BASE_API_KEY = process.env.BASE_API_KEY || "";

const STG_ADDR = "0xE3B53AF74a4BF62Ae5511055290838050bf764Df";
const STG_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${STG_ADDR}&apikey=${BASE_API_KEY}`;

// SG-ETH-LP
const LP0_ADDR = "0x28fc411f9e1c480AD312b3d9C60c22b965015c6B";
const LP0_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${LP0_ADDR}&apikey=${BASE_API_KEY}`;
const LP0_HOLDER = "0x64682257ead6bbd155b448e45a6bd85b459eb192";

// SG-USDbC-LP
const LP1_ADDR = "0x4c80E24119CFB836cdF0a6b53dc23F04F7e652CA";
const LP1_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${LP1_ADDR}&apikey=${BASE_API_KEY}`;
const LP1_HOLDER = "0xdf3885f792cd7ee4a03495cc74225b8cbe1205c3";

// MasterChef
const MASTER_CHEF = "0x06Eb48763f117c7Be887296CDcdfad2E4092739C";
const MASTER_CHEF_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${MASTER_CHEF}&apikey=${BASE_API_KEY}`;

let owner, multisig, treasury, user0, user1, user2;
let VTOKENFactory,
  OTOKENFactory,
  feesFactory,
  rewarderFactory,
  gaugeFactory,
  bribeFactory;
let minter, voter, fees, rewarder, governance, multicall, pluginFactory;
let TOKEN, VTOKEN, OTOKEN, BASE;
let STG, masterchef;
let LP0, plugin0, gauge0, bribe0;
let LP1, plugin1, gauge1, bribe1;

describe.only("base: Stargate farm Testing", function () {
  before("Initial set up", async function () {
    console.log("Begin Initialization");

    // STG
    response = await axios.get(STG_URL);
    const STG_ABI = JSON.parse(response.data.result);
    AERO = new ethers.Contract(STG_ADDR, STG_ABI, provider);
    await timer(1000);
    console.log("- STG Initialized");

    // LP0
    response = await axios.get(LP0_URL);
    const LP0_ABI = JSON.parse(response.data.result);
    LP0 = new ethers.Contract(LP0_ADDR, LP0_ABI, provider);
    await timer(1000);
    console.log("- LP0 Initialized");

    // LP1
    response = await axios.get(LP1_URL);
    const LP1_ABI = JSON.parse(response.data.result);
    LP1 = new ethers.Contract(LP1_ADDR, LP1_ABI, provider);
    await timer(1000);
    console.log("- LP1 Initialized");

    // MasterChef
    response = await axios.get(MASTER_CHEF_URL);
    const MASTER_CHEF_ABI = JSON.parse(response.data.result);
    masterchef = new ethers.Contract(MASTER_CHEF, MASTER_CHEF_ABI, provider);
    await timer(1000);
    console.log("- MasterChef Initialized");

    // initialize users
    [owner, multisig, treasury, user0, user1, user2] =
      await ethers.getSigners();

    // initialize ERC20Mocks
    const ERC20MockArtifact = await ethers.getContractFactory("ERC20Mock");
    BASE = await ERC20MockArtifact.deploy("BASE", "BASE");
    console.log("- ERC20Mocks Initialized");

    // initialize OTOKENFactory
    const OTOKENFactoryArtifact = await ethers.getContractFactory(
      "OTOKENFactory"
    );
    OTOKENFactory = await OTOKENFactoryArtifact.deploy();
    console.log("- OTOKENFactory Initialized");

    // initialize VTOKENFactory
    const VTOKENFactoryArtifact = await ethers.getContractFactory(
      "VTOKENFactory"
    );
    VTOKENFactory = await VTOKENFactoryArtifact.deploy();
    console.log("- VTOKENFactory Initialized");

    // initialize FeesFactory
    const FeesFactoryArtifact = await ethers.getContractFactory(
      "TOKENFeesFactory"
    );
    feesFactory = await FeesFactoryArtifact.deploy();
    console.log("- FeesFactory Initialized");

    // initialize RewarderFactory
    const RewarderFactoryArtifact = await ethers.getContractFactory(
      "VTOKENRewarderFactory"
    );
    rewarderFactory = await RewarderFactoryArtifact.deploy();
    console.log("- RewarderFactory Initialized");

    // intialize TOKEN
    const TOKENArtifact = await ethers.getContractFactory("TOKEN");
    TOKEN = await TOKENArtifact.deploy(
      BASE.address,
      oneThousand,
      OTOKENFactory.address,
      VTOKENFactory.address,
      rewarderFactory.address,
      feesFactory.address
    );
    console.log("- TOKEN Initialized");

    // initialize TOKENFees
    fees = await ethers.getContractAt(
      "contracts/TOKENFeesFactory.sol:TOKENFees",
      await TOKEN.FEES()
    );
    console.log("- TOKENFees Initialized");

    //initialize OTOKEN
    OTOKEN = await ethers.getContractAt(
      "contracts/OTOKENFactory.sol:OTOKEN",
      await TOKEN.OTOKEN()
    );
    console.log("- OTOKEN Initialized");

    //initialize VTOKEN
    VTOKEN = await ethers.getContractAt(
      "contracts/VTOKENFactory.sol:VTOKEN",
      await TOKEN.VTOKEN()
    );
    console.log("- VTOKEN Initialized");

    //initialize VTOKENRewarder
    rewarder = await ethers.getContractAt(
      "contracts/VTOKENRewarderFactory.sol:VTOKENRewarder",
      await VTOKEN.rewarder()
    );
    console.log("- VTOKENRewarder Initialized");

    // initialize GaugeFactory
    const gaugeFactoryArtifact = await ethers.getContractFactory(
      "GaugeFactory"
    );
    const gaugeFactoryContract = await gaugeFactoryArtifact.deploy(
      owner.address
    );
    gaugeFactory = await ethers.getContractAt(
      "GaugeFactory",
      gaugeFactoryContract.address
    );
    console.log("- GaugeFactory Initialized");

    //initialize BribeFactory
    const bribeFactoryArtifact = await ethers.getContractFactory(
      "BribeFactory"
    );
    const bribeFactoryContract = await bribeFactoryArtifact.deploy(
      owner.address
    );
    bribeFactory = await ethers.getContractAt(
      "BribeFactory",
      bribeFactoryContract.address
    );
    console.log("- BribeFactory Initialized");

    // initialize Voter
    const voterArtifact = await ethers.getContractFactory("Voter");
    const voterContract = await voterArtifact.deploy(
      VTOKEN.address,
      gaugeFactory.address,
      bribeFactory.address
    );
    voter = await ethers.getContractAt("Voter", voterContract.address);
    console.log("- Voter Initialized");

    // initialize Minter
    const minterArtifact = await ethers.getContractFactory("Minter");
    const minterContract = await minterArtifact.deploy(
      voter.address,
      TOKEN.address,
      VTOKEN.address,
      OTOKEN.address
    );
    minter = await ethers.getContractAt("Minter", minterContract.address);
    console.log("- Minter Initialized");

    // initialize governanor
    const governanceArtifact = await ethers.getContractFactory("TOKENGovernor");
    const governanceContract = await governanceArtifact.deploy(VTOKEN.address);
    governance = await ethers.getContractAt(
      "TOKENGovernor",
      governanceContract.address
    );
    console.log("- TOKENGovernor Initialized");

    // initialize Multicall
    const multicallArtifact = await ethers.getContractFactory("Multicall");
    const multicallContract = await multicallArtifact.deploy(
      voter.address,
      BASE.address,
      TOKEN.address,
      OTOKEN.address,
      VTOKEN.address,
      rewarder.address
    );
    multicall = await ethers.getContractAt(
      "Multicall",
      multicallContract.address
    );
    console.log("- Multicall Initialized");

    // System set-up
    await gaugeFactory.setVoter(voter.address);
    await bribeFactory.setVoter(voter.address);
    await VTOKEN.connect(owner).addReward(TOKEN.address);
    await VTOKEN.connect(owner).addReward(OTOKEN.address);
    await VTOKEN.connect(owner).addReward(BASE.address);
    await VTOKEN.connect(owner).setVoter(voter.address);
    await OTOKEN.connect(owner).setMinter(minter.address);
    await voter.initialize(minter.address);
    await minter.initialize();
    console.log("- System set up");

    // initialize Plugin Factory
    const pluginFactoryArtifact = await ethers.getContractFactory(
      "StargateFarmPluginFactory"
    );
    const pluginFactoryContract = await pluginFactoryArtifact.deploy(
      voter.address
    );
    pluginFactory = await ethers.getContractAt(
      "StargateFarmPluginFactory",
      pluginFactoryContract.address
    );
    console.log("- Plugin Factory Initialized");

    // initialize LP0
    await pluginFactory.createPlugin(0, "SG-ETH-LP");
    plugin0 = await ethers.getContractAt(
      "contracts/plugins/base/StargateFarmPluginFactory.sol:StargateFarmPlugin",
      await pluginFactory.last_plugin()
    );

    // initialize LP1
    await pluginFactory.createPlugin(1, "SG-USDbC-LP");
    plugin1 = await ethers.getContractAt(
      "contracts/plugins/base/StargateFarmPluginFactory.sol:StargateFarmPlugin",
      await pluginFactory.last_plugin()
    );

    // add LP0 Plugin to Voter
    await voter.addPlugin(plugin0.address);
    let Gauge0Address = await voter.gauges(plugin0.address);
    let Bribe0Address = await voter.bribes(plugin0.address);
    gauge0 = await ethers.getContractAt(
      "contracts/GaugeFactory.sol:Gauge",
      Gauge0Address
    );
    bribe0 = await ethers.getContractAt(
      "contracts/BribeFactory.sol:Bribe",
      Bribe0Address
    );
    console.log("- LP0 Added in Voter");

    // add LP1 Plugin to Voter
    await voter.addPlugin(plugin1.address);
    let Gauge1Address = await voter.gauges(plugin1.address);
    let Bribe1Address = await voter.bribes(plugin1.address);
    gauge1 = await ethers.getContractAt(
      "contracts/GaugeFactory.sol:Gauge",
      Gauge1Address
    );
    bribe1 = await ethers.getContractAt(
      "contracts/BribeFactory.sol:Bribe",
      Bribe1Address
    );
    console.log("- LP1 Added in Voter");

    console.log("Initialization Complete");
    console.log();
  });

  it("Impersonate LP0 holder and send to user0", async function () {
    console.log("******************************************************");
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [LP0_HOLDER],
    });
    const signer = ethers.provider.getSigner(LP0_HOLDER);

    await LP0.connect(signer).transfer(
      user0.address,
      await LP0.connect(owner).balanceOf(LP0_HOLDER)
    );

    console.log(
      "Holder LP0 balance: ",
      divDec(await LP0.connect(owner).balanceOf(LP0_HOLDER))
    );
    console.log(
      "User0 LP0 balance: ",
      divDec(await LP0.connect(owner).balanceOf(user0.address))
    );
  });

  it("Impersonate LP1 holder and send to user0", async function () {
    console.log("******************************************************");
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [LP1_HOLDER],
    });
    const signer = ethers.provider.getSigner(LP1_HOLDER);

    await LP1.connect(signer).transfer(
      user0.address,
      await LP1.connect(owner).balanceOf(LP1_HOLDER)
    );

    console.log(
      "Holder LP1 balance: ",
      divDec(await LP1.connect(owner).balanceOf(LP1_HOLDER))
    );
    console.log(
      "User0 LP1 balance: ",
      divDec(await LP1.connect(owner).balanceOf(user0.address))
    );
  });

  it("User0 deposits in all plugins", async function () {
    console.log("******************************************************");
    await LP0.connect(user0).approve(
      plugin0.address,
      await LP0.connect(owner).balanceOf(user0.address)
    );
    await plugin0
      .connect(user0)
      .depositFor(
        user0.address,
        await LP0.connect(owner).balanceOf(user0.address)
      );

    await LP1.connect(user0).approve(
      plugin1.address,
      await LP1.connect(owner).balanceOf(user0.address)
    );
    await plugin1
      .connect(user0)
      .depositFor(
        user0.address,
        await LP1.connect(owner).balanceOf(user0.address)
      );
  });

  it("Mint test tokens to each user", async function () {
    console.log("******************************************************");
    await BASE.mint(user0.address, 1000);
    await BASE.mint(user1.address, 1000);
    await BASE.mint(user2.address, 1000);
  });

  it("User1 Buys TOKEN with 100 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, oneHundred);
    await TOKEN.connect(user1).buy(
      oneHundred,
      1,
      1992282187,
      user1.address,
      AddressZero
    );
  });

  it("User1 stakes 50 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(VTOKEN.address, fifty);
    await VTOKEN.connect(user1).deposit(fifty);
  });

  it("User1 Sells 1 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user1.address)
    );
    await TOKEN.connect(user1).sell(
      await TOKEN.balanceOf(user1.address),
      1,
      1992282187,
      user1.address,
      user2.address
    );
  });

  it("user1 votes on plugins", async function () {
    console.log("******************************************************");
    await voter
      .connect(user1)
      .vote([plugin0.address, plugin1.address], [ten, ten]);
  });

  it("BondingCurveData, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user1.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Total Value Locked: $", divDec(res.tvl));
    console.log("Market Cap: $", divDec(res.marketCap));
    console.log("TOKEN Supply: ", divDec(res.supplyTOKEN));
    console.log("VTOKEN Supply: ", divDec(res.supplyVTOKEN));
    console.log("APR: ", divDec(res.apr), "%");
    console.log("Loan-to-Value: ", divDec(res.ltv), "%");
    console.log("WeeklyOTOKEN: ", divDec(res.weekly));
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance BASE: ", divDec(res.accountBASE));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance TOKEN: ", divDec(res.accountTOKEN));
    console.log("Earned TOKEN: ", divDec(res.accountEarnedTOKEN));
    console.log("Balance OTOKEN: ", divDec(res.accountOTOKEN));
    console.log("Earned BASE: ", divDec(res.accountEarnedBASE));
    console.log("Balance VTOKEN: ", divDec(res.accountVTOKEN));
    console.log("Voting Power: ", divDec(res.accountVotingPower));
    console.log("Used Voting Power: ", divDec(res.accountUsedWeights));
    console.log("Borrow Credit: ", divDec(res.accountBorrowCredit), "BASE");
    console.log("Borrow Debt: ", divDec(res.accountBorrowDebt), "BASE");
    console.log("Max Withdraw: ", divDec(res.accountMaxWithdraw), "VTOKEN");
  });

  it("GaugeCardData, plugin0, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin0.address, user1.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.gauge);
    console.log("Plugin: ", res.plugin);
    console.log("Underlying: ", res.underlying);
    console.log("Tokens in Underlying: ");
    for (let i = 0; i < res.tokensInUnderlying.length; i++) {
      console.log(" - ", res.tokensInUnderlying[i]);
    }
    console.log("Underlying Decimals: ", res.underlyingDecimals);
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Reward Per token: ", divDec(res.rewardPerToken));
    console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
    console.log("Total Supply: ", divDec(res.totalSupply));
    console.log("Voting Weight: ", divDec(res.votingWeight), "%");
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
    console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
    console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
  });

  it("BribeCardData, plugin0, user1 ", async function () {
    console.log("******************************************************");
    let res = await multicall.bribeCardData(plugin0.address, user1.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.bribe);
    console.log("Plugin: ", res.plugin);
    console.log("Reward Tokens: ");
    for (let i = 0; i < res.rewardTokens.length; i++) {
      console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
    }
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Voting Weight: ", divDec(res.voteWeight));
    console.log("Voting percent: ", divDec(res.votePercent), "%");
    console.log("Reward Per Token: ");
    for (let i = 0; i < res.rewardsPerToken.length; i++) {
      console.log(" - ", divDec(res.rewardsPerToken[i]));
    }
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Account Votes: ", divDec(res.accountVote));
    console.log("Earned Rewards: ");
    for (let i = 0; i < res.accountRewardsEarned.length; i++) {
      console.log(" - ", divDec(res.accountRewardsEarned[i]));
    }
  });

  it("GaugeCardData, plugin0, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin0.address, user0.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.gauge);
    console.log("Plugin: ", res.plugin);
    console.log("Underlying: ", res.underlying);
    console.log("Tokens in Underlying: ");
    for (let i = 0; i < res.tokensInUnderlying.length; i++) {
      console.log(" - ", res.tokensInUnderlying[i]);
    }
    console.log("Underlying Decimals: ", res.underlyingDecimals);
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Reward Per token: ", divDec(res.rewardPerToken));
    console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
    console.log("Total Supply: ", divDec(res.totalSupply));
    console.log("Voting Weight: ", divDec(res.votingWeight), "%");
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
    console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
    console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
  });

  it("GaugeCardData, plugin1, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin1.address, user0.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.gauge);
    console.log("Plugin: ", res.plugin);
    console.log("Underlying: ", res.underlying);
    console.log("Tokens in Underlying: ");
    for (let i = 0; i < res.tokensInUnderlying.length; i++) {
      console.log(" - ", res.tokensInUnderlying[i]);
    }
    console.log("Underlying Decimals: ", res.underlyingDecimals);
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Reward Per token: ", divDec(res.rewardPerToken));
    console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
    console.log("Total Supply: ", divDec(res.totalSupply));
    console.log("Voting Weight: ", divDec(res.votingWeight), "%");
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
    console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
    console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
  });

  it("Forward time by 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("GaugeCardData, plugin0, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin0.address, user0.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.gauge);
    console.log("Plugin: ", res.plugin);
    console.log("Underlying: ", res.underlying);
    console.log("Tokens in Underlying: ");
    for (let i = 0; i < res.tokensInUnderlying.length; i++) {
      console.log(" - ", res.tokensInUnderlying[i]);
    }
    console.log("Underlying Decimals: ", res.underlyingDecimals);
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Reward Per token: ", divDec(res.rewardPerToken));
    console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
    console.log("Total Supply: ", divDec(res.totalSupply));
    console.log("Voting Weight: ", divDec(res.votingWeight), "%");
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
    console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
    console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
  });

  it("GaugeCardData, plugin1, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin1.address, user0.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.gauge);
    console.log("Plugin: ", res.plugin);
    console.log("Underlying: ", res.underlying);
    console.log("Tokens in Underlying: ");
    for (let i = 0; i < res.tokensInUnderlying.length; i++) {
      console.log(" - ", res.tokensInUnderlying[i]);
    }
    console.log("Underlying Decimals: ", res.underlyingDecimals);
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Reward Per token: ", divDec(res.rewardPerToken));
    console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
    console.log("Total Supply: ", divDec(res.totalSupply));
    console.log("Voting Weight: ", divDec(res.votingWeight), "%");
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
    console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
    console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
  });

  it("Forward time by 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
    await fees.distribute();
    await voter.distributeToBribes([plugin0.address, plugin1.address]);
  });

  it("BribeCardData, plugin0, user1 ", async function () {
    console.log("******************************************************");
    let res = await multicall.bribeCardData(plugin0.address, user1.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.bribe);
    console.log("Plugin: ", res.plugin);
    console.log("Reward Tokens: ");
    for (let i = 0; i < res.rewardTokens.length; i++) {
      console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
    }
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Voting Weight: ", divDec(res.voteWeight));
    console.log("Voting percent: ", divDec(res.votePercent), "%");
    console.log("Reward Per Token: ");
    for (let i = 0; i < res.rewardsPerToken.length; i++) {
      console.log(" - ", divDec(res.rewardsPerToken[i]));
    }
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Account Votes: ", divDec(res.accountVote));
    console.log("Earned Rewards: ");
    for (let i = 0; i < res.accountRewardsEarned.length; i++) {
      console.log(" - ", divDec(res.accountRewardsEarned[i]));
    }
  });

  it("BribeCardData, plugin1, user1 ", async function () {
    console.log("******************************************************");
    let res = await multicall.bribeCardData(plugin1.address, user1.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.bribe);
    console.log("Plugin: ", res.plugin);
    console.log("Reward Tokens: ");
    for (let i = 0; i < res.rewardTokens.length; i++) {
      console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
    }
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Voting Weight: ", divDec(res.voteWeight));
    console.log("Voting percent: ", divDec(res.votePercent), "%");
    console.log("Reward Per Token: ");
    for (let i = 0; i < res.rewardsPerToken.length; i++) {
      console.log(" - ", divDec(res.rewardsPerToken[i]));
    }
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Account Votes: ", divDec(res.accountVote));
    console.log("Earned Rewards: ");
    for (let i = 0; i < res.accountRewardsEarned.length; i++) {
      console.log(" - ", divDec(res.accountRewardsEarned[i]));
    }
  });

  it("Forward time by 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("BribeCardData, plugin0, user1 ", async function () {
    console.log("******************************************************");
    let res = await multicall.bribeCardData(plugin0.address, user1.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.bribe);
    console.log("Plugin: ", res.plugin);
    console.log("Reward Tokens: ");
    for (let i = 0; i < res.rewardTokens.length; i++) {
      console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
    }
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Voting Weight: ", divDec(res.voteWeight));
    console.log("Voting percent: ", divDec(res.votePercent), "%");
    console.log("Reward Per Token: ");
    for (let i = 0; i < res.rewardsPerToken.length; i++) {
      console.log(" - ", divDec(res.rewardsPerToken[i]));
    }
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Account Votes: ", divDec(res.accountVote));
    console.log("Earned Rewards: ");
    for (let i = 0; i < res.accountRewardsEarned.length; i++) {
      console.log(" - ", divDec(res.accountRewardsEarned[i]));
    }
  });

  it("BribeCardData, plugin1, user1 ", async function () {
    console.log("******************************************************");
    let res = await multicall.bribeCardData(plugin1.address, user1.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.bribe);
    console.log("Plugin: ", res.plugin);
    console.log("Reward Tokens: ");
    for (let i = 0; i < res.rewardTokens.length; i++) {
      console.log(" - ", res.rewardTokens[i], res.rewardTokenDecimals[i]);
    }
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Voting Weight: ", divDec(res.voteWeight));
    console.log("Voting percent: ", divDec(res.votePercent), "%");
    console.log("Reward Per Token: ");
    for (let i = 0; i < res.rewardsPerToken.length; i++) {
      console.log(" - ", divDec(res.rewardsPerToken[i]));
    }
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Account Votes: ", divDec(res.accountVote));
    console.log("Earned Rewards: ");
    for (let i = 0; i < res.accountRewardsEarned.length; i++) {
      console.log(" - ", divDec(res.accountRewardsEarned[i]));
    }
  });

  it("User0 withdraws from all gauges", async function () {
    console.log("******************************************************");
    await plugin0
      .connect(user0)
      .withdrawTo(
        user0.address,
        await plugin0.connect(owner).balanceOf(user0.address)
      );
    await plugin1
      .connect(user0)
      .withdrawTo(
        user0.address,
        await plugin1.connect(owner).balanceOf(user0.address)
      );
  });

  it("GaugeCardData, plugin0, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin0.address, user0.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.gauge);
    console.log("Plugin: ", res.plugin);
    console.log("Underlying: ", res.underlying);
    console.log("Tokens in Underlying: ");
    for (let i = 0; i < res.tokensInUnderlying.length; i++) {
      console.log(" - ", res.tokensInUnderlying[i]);
    }
    console.log("Underlying Decimals: ", res.underlyingDecimals);
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Reward Per token: ", divDec(res.rewardPerToken));
    console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
    console.log("Total Supply: ", divDec(res.totalSupply));
    console.log("Voting Weight: ", divDec(res.votingWeight), "%");
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
    console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
    console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
  });

  it("GaugeCardData, plugin1, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(plugin1.address, user0.address);
    console.log("INFORMATION");
    console.log("Gauge: ", res.gauge);
    console.log("Plugin: ", res.plugin);
    console.log("Underlying: ", res.underlying);
    console.log("Tokens in Underlying: ");
    for (let i = 0; i < res.tokensInUnderlying.length; i++) {
      console.log(" - ", res.tokensInUnderlying[i]);
    }
    console.log("Underlying Decimals: ", res.underlyingDecimals);
    console.log("Is Alive: ", res.isAlive);
    console.log();
    console.log("GLOBAL DATA");
    console.log("Protocol: ", res.protocol);
    console.log("Symbol: ", res.symbol);
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Reward Per token: ", divDec(res.rewardPerToken));
    console.log("Reward Per token: $", divDec(res.rewardPerTokenUSD));
    console.log("Total Supply: ", divDec(res.totalSupply));
    console.log("Voting Weight: ", divDec(res.votingWeight), "%");
    console.log();
    console.log("ACCOUNT DATA");
    console.log("Balance Underlying: ", divDec(res.accountUnderlyingBalance));
    console.log("Balance Deposited: ", divDec(res.accountStakedBalance));
    console.log("Earned OTOKEN: ", divDec(res.accountEarnedOTOKEN));
  });
});
