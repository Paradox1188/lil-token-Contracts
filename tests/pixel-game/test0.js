const convert = (amount, decimals) => ethers.utils.parseUnits(amount, decimals);
const divDec = (amount, decimals = 18) => amount / 10 ** decimals;
const divDec6 = (amount, decimals = 6) => amount / 10 ** decimals;
const { expect } = require("chai");
const { ethers, network } = require("hardhat");
const { execPath } = require("process");

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

function getRndInteger(min, max) {
  return Math.floor(Math.random() * (max - min)) + min;
}

let owner, multisig, treasury, user0, user1, user2;
let VTOKENFactory,
  OTOKENFactory,
  feesFactory,
  rewarderFactory,
  gaugeFactory,
  bribeFactory;
let minter, voter, fees, rewarder, governance, multicall;
let TOKEN, VTOKEN, OTOKEN, BASE;
let gridPlugin, gridNFT, gauge, bribe;

describe("local: test0", function () {
  before("Initial set up", async function () {
    console.log("Begin Initialization");

    // initialize users
    [owner, multisig, treasury, user0, user1, user2] =
      await ethers.getSigners();

    // initialize BASE
    const ERC20MockArtifact = await ethers.getContractFactory(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock"
    );
    BASE = await ERC20MockArtifact.deploy("BASE", "BASE");
    console.log("- BASE Initialized");

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

    // Deploy GridNFT
    const GridNFTArtifact = await ethers.getContractFactory("GridNFT");
    gridNFT = await GridNFTArtifact.deploy(OTOKEN.address, VTOKEN.address);
    console.log("- GridNFT Initialized");

    // Deploy GridPlugin
    const GridPluginArtifact = await ethers.getContractFactory("GridPlugin");
    gridPlugin = await GridPluginArtifact.deploy(
      gridNFT.address,
      voter.address,
      [gridNFT.address],
      [OTOKEN.address]
    );
    console.log("- GridPlugin Initialized");

    // Set up PixelGame
    await gridNFT.setGridPlugin(gridPlugin.address);
    await voter.addPlugin(gridPlugin.address);
    let GaugeAddress = await voter.gauges(gridPlugin.address);
    let BribeAddress = await voter.bribes(gridPlugin.address);
    gauge = await ethers.getContractAt(
      "contracts/GaugeFactory.sol:Gauge",
      GaugeAddress
    );
    bribe = await ethers.getContractAt(
      "contracts/BribeFactory.sol:Bribe",
      BribeAddress
    );
    console.log("- Grid Game Set up");

    console.log("Initialization Complete");
    console.log();
  });

  it("Set colors", async function () {
    console.log("******************************************************");
    await gridNFT.setColors([
      "#000000",
      "#18fc03",
      "#fce303",
      "#fc0317",
      "#03a5fc",
      "#db03fc",
    ]);
  });

  it("Mint test tokens to each user", async function () {
    console.log("******************************************************");
    await BASE.mint(user0.address, 1000);
    await BASE.mint(user1.address, 1000);
    await BASE.mint(user2.address, 1000);
    await OTOKEN.transfer(user0.address, oneThousand);
    await OTOKEN.transfer(user1.address, oneThousand);
    await gridNFT.safeMint(owner.address);
  });

  it("BondingCurveData, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user1.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
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

  it("User0 Buys TOKEN with 10 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, ten);
    await TOKEN.connect(user0).buy(
      ten,
      1,
      1992282187,
      user0.address,
      AddressZero
    );
  });

  it("User1 stakes TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(VTOKEN.address, one);
    await VTOKEN.connect(user0).deposit(one);
  });

  it("user0 votes on plugins a", async function () {
    console.log("******************************************************");
    await voter.connect(user0).vote([gridPlugin.address], [ten]);
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
  });

  it("GaugeCardData, gridPlugin, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(gridPlugin.address, user1.address);
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

  it("BondingCurveData, user1", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(user0.address);
    console.log("GLOBAL DATA");
    console.log("Price BASE: $", divDec(res.priceBASE));
    console.log("Price TOKEN: $", divDec(res.priceTOKEN));
    console.log("Price OTOKEN: $", divDec(res.priceOTOKEN));
    console.log("Max Market Sell: ", divDec(res.maxMarketSell));
    console.log();
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

  it("User0 places tiles randomly", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user0).approve(gridNFT.address, fifty);
    for (let i = 0; i < 50; i++) {
      await gridNFT
        .connect(user0)
        .placeFor(
          0,
          user1.address,
          [getRndInteger(0, 16)],
          [getRndInteger(0, 16)],
          getRndInteger(0, 6)
        );
    }
  });

  it("User0 places tiles randomly", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user0).approve(gridNFT.address, fifty);
    for (let i = 0; i < 50; i++) {
      await gridNFT
        .connect(user0)
        .placeFor(
          0,
          user1.address,
          [getRndInteger(0, 16)],
          [getRndInteger(0, 16)],
          getRndInteger(0, 6)
        );
    }
  });

  it("User0 places tiles randomly", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user0).approve(gridNFT.address, fifty);
    for (let i = 0; i < 50; i++) {
      await gridNFT
        .connect(user0)
        .placeFor(
          0,
          user1.address,
          [getRndInteger(0, 16)],
          [getRndInteger(0, 16)],
          getRndInteger(0, 6)
        );
    }
  });

  it("User0 places tiles randomly", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user0).approve(gridNFT.address, fifty);
    for (let i = 0; i < 50; i++) {
      await gridNFT
        .connect(user0)
        .placeFor(
          0,
          user1.address,
          [getRndInteger(0, 16)],
          [getRndInteger(0, 16)],
          getRndInteger(0, 6)
        );
    }
  });

  it("User1 places tiles randomly", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user1).approve(gridNFT.address, fifty);
    for (let i = 0; i < 50; i++) {
      await gridNFT
        .connect(user1)
        .placeFor(
          0,
          user1.address,
          [getRndInteger(0, 16)],
          [getRndInteger(0, 16)],
          getRndInteger(0, 6)
        );
    }
  });

  it("User1 places tiles randomly", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user1).approve(gridNFT.address, fifty);
    for (let i = 0; i < 50; i++) {
      await gridNFT
        .connect(user1)
        .placeFor(
          0,
          user1.address,
          [getRndInteger(0, 16)],
          [getRndInteger(0, 16)],
          getRndInteger(0, 6)
        );
    }
  });

  it("User1 places tiles randomly", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user1).approve(gridNFT.address, fifty);
    for (let i = 0; i < 50; i++) {
      await gridNFT
        .connect(user1)
        .placeFor(
          0,
          user1.address,
          [getRndInteger(0, 16)],
          [getRndInteger(0, 16)],
          getRndInteger(0, 6)
        );
    }
  });

  it("User1 places tiles randomly", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user1).approve(gridNFT.address, fifty);
    for (let i = 0; i < 50; i++) {
      await gridNFT
        .connect(user1)
        .placeFor(
          0,
          user1.address,
          [getRndInteger(0, 16)],
          [getRndInteger(0, 16)],
          getRndInteger(0, 6)
        );
    }
  });

  it("User1 places tiles randomly", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user1).approve(gridNFT.address, fifty);
    for (let i = 0; i < 50; i++) {
      await gridNFT
        .connect(user1)
        .placeFor(
          0,
          user1.address,
          [getRndInteger(0, 16)],
          [getRndInteger(0, 16)],
          getRndInteger(0, 6)
        );
    }
  });

  it("GaugeCardData, gridPlugin, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(gridPlugin.address, user0.address);
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

  it("Forward 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
  });

  it("GaugeCardData, gridPlugin, user0", async function () {
    console.log("******************************************************");
    let res = await multicall.gaugeCardData(gridPlugin.address, user0.address);
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

  it("Get encoded SVGs", async function () {
    console.log("******************************************************");
    let res = await gridNFT.tokenURI(0);
    console.log(res);
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.distributeToBribes([gridPlugin.address]);
  });

  it("BribeCardData, gridPlugin, user0 ", async function () {
    console.log("******************************************************");
    let res = await multicall.bribeCardData(gridPlugin.address, user0.address);
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
});
