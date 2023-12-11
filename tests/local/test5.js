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
const ninety = convert("90", 18);
const oneHundred = convert("100", 18);
const twoHundred = convert("200", 18);
const fiveHundred = convert("500", 18);
const eightHundred = convert("800", 18);
const oneThousand = convert("1000", 18);

let owner, multisig, treasury, user0, user1, user2;
let VTOKENFactory,
  OTOKENFactory,
  feesFactory,
  rewarderFactory,
  gaugeFactory,
  bribeFactory;
let minter, voter, fees, rewarder, governance, multicall;
let TOKEN, VTOKEN, OTOKEN, BASE;
let LSTOKEN;
let pluginFactory;
let TEST0, xTEST0, plugin0, gauge0, bribe0;
let TEST1, xTEST1, plugin1, gauge1, bribe1;
let TEST2, LP0, plugin2, gauge2, bribe2;
let TEST3, LP1, plugin3, gauge3, bribe3;

describe.only("local: test0", function () {
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

    const PluginFactoryArtifact = await ethers.getContractFactory(
      "MockPluginFactory"
    );
    const PluginFactoryContract = await PluginFactoryArtifact.deploy(
      voter.address
    );
    pluginFactory = await ethers.getContractAt(
      "MockPluginFactory",
      PluginFactoryContract.address
    );
    console.log("- PluginFactory Initialized");

    await pluginFactory.createSingleStakePlugin("xTEST0", "TEST0");
    plugin0 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:MockPlugin",
      await pluginFactory.last_plugin()
    );
    console.log("- Plugin0 Initialized");

    await pluginFactory.createSingleStakePlugin("xTEST1", "TEST1");
    plugin1 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:MockPlugin",
      await pluginFactory.last_plugin()
    );
    console.log("- Plugin1 Initialized");

    await pluginFactory.createLPMockPlugin("LP0", "TEST2", "BASE");
    plugin2 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:MockPlugin",
      await pluginFactory.last_plugin()
    );
    console.log("- Plugin2 Initialized");

    await pluginFactory.createLPMockPlugin("LP1", "TEST3", "BASE");
    plugin3 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:MockPlugin",
      await pluginFactory.last_plugin()
    );
    console.log("- Plugin3 Initialized");

    // Initialize Mock Tokens
    xTEST0 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      await plugin0.getUnderlyingAddress()
    );
    TEST0 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      (
        await plugin0.getBribeTokens()
      )[0]
    );
    xTEST1 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      await plugin1.getUnderlyingAddress()
    );
    TEST1 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      (
        await plugin1.getBribeTokens()
      )[0]
    );
    LP0 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      await plugin2.getUnderlyingAddress()
    );
    TEST2 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      (
        await plugin2.getBribeTokens()
      )[0]
    );
    LP1 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      await plugin3.getUnderlyingAddress()
    );
    TEST3 = await ethers.getContractAt(
      "contracts/plugins/local/MockPluginFactory.sol:ERC20Mock",
      (
        await plugin3.getBribeTokens()
      )[0]
    );
    console.log("- Mock Tokens Initialized");

    // add Plugin0 to Voter
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
    console.log("- Plugin0 Added in Voter");

    // add Plugin1 to Voter
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
    console.log("- Plugin1 Added in Voter");

    // add Plugin2 to Voter
    await voter.addPlugin(plugin2.address);
    let Gauge2Address = await voter.gauges(plugin2.address);
    let Bribe2Address = await voter.bribes(plugin2.address);
    gauge2 = await ethers.getContractAt(
      "contracts/GaugeFactory.sol:Gauge",
      Gauge2Address
    );
    bribe2 = await ethers.getContractAt(
      "contracts/BribeFactory.sol:Bribe",
      Bribe2Address
    );
    console.log("- Plugin2 Added in Voter");

    // add Plugin3 to Voter
    await voter.addPlugin(plugin3.address);
    let Gauge3Address = await voter.gauges(plugin3.address);
    let Bribe3Address = await voter.bribes(plugin3.address);
    gauge3 = await ethers.getContractAt(
      "contracts/GaugeFactory.sol:Gauge",
      Gauge3Address
    );
    bribe3 = await ethers.getContractAt(
      "contracts/BribeFactory.sol:Bribe",
      Bribe3Address
    );
    console.log("- Plugin3 Added in Voter");

    // Initialize LSTOKEN
    const LSTOKENArtifact = await ethers.getContractFactory("LSTOKEN");
    LSTOKENContract = await LSTOKENArtifact.deploy(
      BASE.address,
      TOKEN.address,
      OTOKEN.address,
      VTOKEN.address,
      rewarder.address,
      voter.address,
      multicall.address
    );
    LSTOKEN = await ethers.getContractAt("LSTOKEN", LSTOKENContract.address);
    console.log("- LSTOKEN Initialized");

    console.log("Initialization Complete");
    console.log();
  });

  it("Mint test tokens to each user", async function () {
    console.log("******************************************************");
    await BASE.mint(user0.address, 1000);
    await BASE.mint(user1.address, 1000);
    await BASE.mint(user2.address, 1000);
    await xTEST0.mint(user0.address, 100);
    await xTEST0.mint(user1.address, 100);
    await xTEST0.mint(user2.address, 100);
    await xTEST1.mint(user0.address, 100);
    await xTEST1.mint(user1.address, 100);
    await xTEST1.mint(user2.address, 100);
    await LP0.mint(user0.address, 100);
    await LP0.mint(user1.address, 100);
    await LP0.mint(user2.address, 100);
    await LP1.mint(user0.address, 100);
    await LP1.mint(user1.address, 100);
    await LP1.mint(user2.address, 100);
  });

  it("User0 Buys TOKEN with 10 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, ten);
    await TOKEN.connect(user0).buy(
      ten,
      1,
      1792282187,
      user0.address,
      AddressZero
    );
  });

  it("User0 Sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, await TOKEN.getMaxSell());
    await TOKEN.connect(user0).sell(
      await TOKEN.getMaxSell(),
      1,
      1892282187,
      user0.address,
      AddressZero
    );
  });

  it("User0 Buys 10 TOKEN", async function () {
    console.log("******************************************************");
    let res = await multicall.connect(owner).quoteBuyOut(ten, 9700);
    console.log("TOKEN out", divDec(ten));
    console.log("Slippage Tolerance", "3%");
    console.log();
    console.log("BASE in", divDec(res.output));
    console.log("slippage", divDec(res.slippage));
    console.log("min TOKEN out", divDec(res.minOutput));

    await BASE.connect(user0).approve(TOKEN.address, res.output);
    await TOKEN.connect(user0).buy(
      res.output,
      res.minOutput,
      1792282187,
      user0.address,
      AddressZero
    );
  });

  it("User0 TOKEN for 5 BASE", async function () {
    console.log("******************************************************");
    let res = await multicall.connect(owner).quoteSellOut(five, 9950);
    console.log("BASE out", divDec(five));
    console.log("Slippage Tolerance", "0.5%");
    console.log();
    console.log("TOKEN in", divDec(res.output));
    console.log("slippage", divDec(res.slippage));
    console.log("min BASE out", divDec(res.minOutput));

    await TOKEN.connect(user0).approve(TOKEN.address, res.output);
    await TOKEN.connect(user0).sell(
      res.output,
      res.minOutput,
      1892282187,
      user0.address,
      AddressZero
    );
  });

  it("User1 stakes 0 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(VTOKEN.address, one);
    await VTOKEN.connect(user0).deposit(one);
  });

  it("User1 Sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user0.address)
    );
    await TOKEN.connect(user0).sell(
      await TOKEN.balanceOf(user0.address),
      1,
      1892282187,
      user0.address,
      AddressZero
    );
  });

  it("User0 borrows max against staked position", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).borrow(
      await TOKEN.getAccountCredit(user0.address)
    );
  });

  it("User0 tries to withdraws staked position", async function () {
    console.log("******************************************************");
    await expect(
      VTOKEN.connect(user0).withdraw(
        await VTOKEN.connect(owner).balanceOf(user0.address)
      )
    ).to.be.revertedWith("VTOKEN__CollateralActive");
    await expect(VTOKEN.connect(user0).withdraw(0)).to.be.revertedWith(
      "VTOKEN__InvalidZeroInput"
    );
  });

  it("User0 tries to repay more than what they owe", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, one);
    await expect(TOKEN.connect(user0).repay(two)).to.be.reverted;
  });

  it("User0 Buys TOKEN with 20 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, twenty);
    await TOKEN.connect(user0).buy(
      twenty,
      1,
      1792282187,
      user0.address,
      AddressZero
    );
  });

  it("User0 stakes 9 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(VTOKEN.address, ten.sub(one));
    await VTOKEN.connect(user0).deposit(ten.sub(one));
  });

  it("User0 Sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user0.address)
    );
    await TOKEN.connect(user0).sell(
      await TOKEN.balanceOf(user0.address),
      1,
      1892282187,
      user0.address,
      AddressZero
    );
  });

  it("User0 tries to borrow more than they can", async function () {
    console.log("******************************************************");
    await expect(TOKEN.connect(user0).borrow(twenty)).to.be.revertedWith(
      "TOKEN__ExceedsBorrowCreditLimit"
    );
    await expect(TOKEN.connect(user0).borrow(0)).to.be.revertedWith(
      "TOKEN__InvalidZeroInput"
    );
  });

  it("User0 borrows some against staked position", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).borrow(one);
  });

  it("User0 borrows max against staked position", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).borrow(
      await TOKEN.getAccountCredit(user0.address)
    );
  });

  it("User0 repays 1 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, one);
    await TOKEN.connect(user0).repay(one);
  });

  it("User0 repays max BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(
      TOKEN.address,
      await TOKEN.debts(user0.address)
    );
    await TOKEN.connect(user0).repay(await TOKEN.debts(user0.address));
  });

  it("User0 borrows max against staked position", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).borrow(
      await TOKEN.getAccountCredit(user0.address)
    );
  });

  it("User1 Buys TOKEN with 10 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, ten);
    await TOKEN.connect(user1).buy(
      ten,
      1,
      1892282187,
      user1.address,
      AddressZero
    );
  });

  it("User1 stakes 5 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(VTOKEN.address, five);
    await VTOKEN.connect(user1).deposit(five);
  });

  it("User1 Sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user1.address)
    );
    await TOKEN.connect(user1).sell(
      await TOKEN.balanceOf(user1.address),
      1,
      1892282187,
      user1.address,
      AddressZero
    );
  });

  it("User0 exercises 10 OTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(user0.address, ten);
    await OTOKEN.connect(user0).approve(TOKEN.address, ten);
    await BASE.connect(user0).approve(TOKEN.address, ten);
    await TOKEN.connect(user0).exercise(ten, user0.address);
  });

  it("User0 exercises 10 OTOKEN without any OTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user0).approve(TOKEN.address, ten);
    await BASE.connect(user0).approve(TOKEN.address, ten);
    await expect(TOKEN.connect(user0).exercise(ten, user0.address)).to.be
      .reverted;
  });

  it("User0 exercises 10 OTOKEN without any BASE", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(user1.address, ten);
    await BASE.connect(user0).transfer(
      treasury.address,
      await BASE.balanceOf(user0.address)
    );
    await OTOKEN.connect(user0).approve(TOKEN.address, ten);
    await BASE.connect(user0).approve(TOKEN.address, ten);
    await expect(TOKEN.connect(user0).exercise(ten, user0.address)).to.be
      .reverted;
    await BASE.connect(treasury).transfer(
      user0.address,
      await BASE.balanceOf(treasury.address)
    );
  });

  it("User0 exercises 10 OTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(user0.address, ten);
    await OTOKEN.connect(user0).approve(TOKEN.address, ten);
    await BASE.connect(user0).approve(TOKEN.address, ten);
    await TOKEN.connect(user0).exercise(ten, user0.address);
  });

  it("User0 tries to sell more TOKEN than whats available in bonding curve", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, twenty);
    await expect(
      TOKEN.connect(user0).sell(
        twenty,
        1,
        1792282187,
        user0.address,
        AddressZero
      )
    ).to.be.revertedWith("TOKEN__ExceedsSwapMarketReserves");
  });

  it("User0 sells max", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, await TOKEN.getMaxSell());
    await TOKEN.connect(user0).sell(
      await TOKEN.getMaxSell(),
      1,
      1792282187,
      user0.address,
      AddressZero
    );
  });

  it("User1 Buys TOKEN with 1 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, one);
    await TOKEN.connect(user1).buy(
      one,
      1,
      1892282187,
      user1.address,
      AddressZero
    );
  });

  it("User0 sells max", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, await TOKEN.getMaxSell());
    await TOKEN.connect(user0).sell(
      await TOKEN.getMaxSell(),
      1,
      1792282187,
      user0.address,
      AddressZero
    );
  });

  it("User1 Buys TOKEN with 1 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, one);
    await TOKEN.connect(user1).buy(
      one,
      1,
      1892282187,
      user1.address,
      AddressZero
    );
  });

  it("User0 sells max", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, await TOKEN.getMaxSell());
    await TOKEN.connect(user0).sell(
      await TOKEN.getMaxSell(),
      1,
      1792282187,
      user0.address,
      AddressZero
    );
  });

  it("User1 Buys TOKEN with 1 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, one);
    await TOKEN.connect(user1).buy(
      one,
      1,
      1892282187,
      user1.address,
      AddressZero
    );
  });

  it("User0 sells max", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, await TOKEN.getMaxSell());
    await TOKEN.connect(user0).sell(
      await TOKEN.getMaxSell(),
      1,
      1792282187,
      user0.address,
      AddressZero
    );
  });

  it("User0 exercises 10 OTOKEN", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(user0.address, ten);
    await OTOKEN.connect(user0).approve(TOKEN.address, ten);
    await BASE.connect(user0).approve(TOKEN.address, ten);
    await TOKEN.connect(user0).exercise(ten, user0.address);
  });

  it("User1 Buys TOKEN with 1 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, one);
    await TOKEN.connect(user1).buy(
      one,
      1,
      1892282187,
      user1.address,
      AddressZero
    );
  });

  it("User0 sells max", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, await TOKEN.getMaxSell());
    await TOKEN.connect(user0).sell(
      await TOKEN.getMaxSell(),
      1,
      1792282187,
      user0.address,
      AddressZero
    );
  });

  it("User1 Buys TOKEN with 1 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, one);
    await TOKEN.connect(user1).buy(
      one,
      1,
      1892282187,
      user1.address,
      AddressZero
    );
  });

  it("User0 sells max", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(TOKEN.address, await TOKEN.getMaxSell());
    await TOKEN.connect(user0).sell(
      await TOKEN.getMaxSell(),
      1,
      1792282187,
      user0.address,
      AddressZero
    );
  });

  it("User0 redeems all TOKENS for BASE", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user0.address)
    );
    await TOKEN.connect(user0).redeem(
      await TOKEN.balanceOf(user0.address),
      user0.address
    );
  });

  it("User1 redeems all TOKENS for BASE", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user1.address)
    );
    await TOKEN.connect(user1).redeem(
      await TOKEN.balanceOf(user1.address),
      user1.address
    );
  });

  it("User0 repays max BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(
      TOKEN.address,
      await TOKEN.debts(user0.address)
    );
    await TOKEN.connect(user0).repay(await TOKEN.debts(user0.address));
  });

  it("User0 unstakes all TOKEN", async function () {
    console.log("******************************************************");
    await VTOKEN.connect(user0).withdraw(await VTOKEN.balanceOf(user0.address));
  });

  it("User1 unstakes all TOKEN", async function () {
    console.log("******************************************************");
    await VTOKEN.connect(user1).withdraw(await VTOKEN.balanceOf(user1.address));
  });

  it("User0 redeems all TOKENS for BASE", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user0.address)
    );
    await TOKEN.connect(user0).redeem(
      await TOKEN.balanceOf(user0.address),
      user0.address
    );
  });

  it("User1 redeems all TOKENS for BASE", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user1.address)
    );
    await TOKEN.connect(user1).redeem(
      await TOKEN.balanceOf(user1.address),
      user1.address
    );
  });

  it("User0 Buys TOKEN with 20 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(TOKEN.address, twenty);
    await TOKEN.connect(user0).buy(
      twenty,
      1,
      1792282187,
      user0.address,
      AddressZero
    );
  });

  it("User0 stakes 10 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(VTOKEN.address, ten);
    await VTOKEN.connect(user0).deposit(ten);
  });

  it("User1 Buys TOKEN with 20 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, twenty);
    await TOKEN.connect(user1).buy(
      twenty,
      1,
      1792282187,
      user1.address,
      AddressZero
    );
  });

  it("User1 stakes 5 TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(VTOKEN.address, five);
    await VTOKEN.connect(user1).deposit(five);
  });

  it("User0 borrows max against staked position", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).borrow(
      await TOKEN.getAccountCredit(user0.address)
    );
  });

  it("User1 borrows max against staked position", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).borrow(
      await TOKEN.getAccountCredit(user1.address)
    );
  });

  it("User2 call distributeFees", async function () {
    console.log("******************************************************");
    await fees.distributeBASE();
    await fees.distributeTOKEN();
  });

  it("Forward 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("User1 claims rewards", async function () {
    console.log("******************************************************");
    await rewarder.connect(user2).getReward(user1.address);
  });

  it("User0 claims rewards", async function () {
    console.log("******************************************************");
    await rewarder.connect(user0).getReward(user0.address);
  });

  it("User0 claims rewards", async function () {
    console.log("******************************************************");
    await rewarder.connect(user0).getReward(user0.address);
  });

  it("Owner mints OTOKEN and sends to fee contract", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(fees.address, ten);
  });

  it("User2 Buys TOKEN with 20 ETH", async function () {
    console.log("******************************************************");
    await BASE.connect(user2).approve(TOKEN.address, twenty);
    await TOKEN.connect(user2).buy(
      twenty,
      1,
      1892282187,
      user2.address,
      AddressZero
    );
  });

  it("User2 sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user2).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user2.address)
    );
    await TOKEN.connect(user2).sell(
      await TOKEN.balanceOf(user2.address),
      1,
      1792282187,
      user2.address,
      AddressZero
    );
  });

  it("User2 call distributeFees", async function () {
    console.log("******************************************************");
    await fees.distribute();
  });

  it("Forward 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("User2 Buys TOKEN with 20 ETH", async function () {
    console.log("******************************************************");
    await BASE.connect(user2).approve(TOKEN.address, twenty);
    await TOKEN.connect(user2).buy(
      twenty,
      1,
      1892282187,
      user2.address,
      AddressZero
    );
  });

  it("User2 sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user2).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user2.address)
    );
    await TOKEN.connect(user2).sell(
      await TOKEN.balanceOf(user2.address),
      1,
      1792282187,
      user2.address,
      AddressZero
    );
  });

  it("Owner mints OTOKEN and sends to fee contract", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(fees.address, ten);
  });

  it("User2 call distributeFees", async function () {
    console.log("******************************************************");
    await fees.distribute();
  });

  it("user0 votes on plugins a", async function () {
    console.log("******************************************************");
    await voter
      .connect(user0)
      .vote(
        [plugin0.address, plugin1.address, plugin2.address, plugin3.address],
        [ten, ten, ten, ten]
      );
  });

  it("User1 deposits xTEST0 in plugin0", async function () {
    console.log("******************************************************");
    await xTEST0.connect(user1).approve(plugin0.address, ten);
    await plugin0.connect(user1).depositFor(user1.address, ten);
  });

  it("User1 deposits xTEST1 in plugin1", async function () {
    console.log("******************************************************");
    await xTEST1.connect(user1).approve(plugin1.address, ten);
    await plugin1.connect(user1).depositFor(user1.address, ten);
  });

  it("User1 deposits LP0 in plugin2", async function () {
    console.log("******************************************************");
    await LP0.connect(user1).approve(plugin2.address, ten);
    await plugin2.connect(user1).depositFor(user1.address, ten);
  });

  it("User1 deposits LP1 in plugin3", async function () {
    console.log("******************************************************");
    await LP1.connect(user1).approve(plugin3.address, ten);
    await plugin3.connect(user1).depositFor(user1.address, ten);
  });

  it("user0 votes on plugins b", async function () {
    console.log("******************************************************");
    await expect(voter.connect(user0).reset()).to.be.revertedWith(
      "Voter__AlreadyVotedThisEpoch"
    );
    await expect(
      voter.connect(user0).vote([plugin0.address], [ten])
    ).to.be.revertedWith("Voter__AlreadyVotedThisEpoch");
  });

  it("User1 withdraws Assets from gauge0", async function () {
    console.log("******************************************************");
    await expect(
      gauge0.connect(user1)._deposit(user1.address, ten)
    ).to.be.revertedWith("Gauge__NotAuthorizedPlugin");
    await expect(
      gauge0
        .connect(user1)
        ._withdraw(
          user1.address,
          await gauge0.connect(user1).balanceOf(user1.address)
        )
    ).to.be.revertedWith("Gauge__NotAuthorizedPlugin");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
  });

  it("Forward time by 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [1 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
  });

  it("Forward time by 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("user0 resets vote", async function () {
    console.log("******************************************************");
    await voter.connect(user0).reset();
  });

  it("User0 repays max BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user0).approve(
      TOKEN.address,
      await TOKEN.debts(user0.address)
    );
    await TOKEN.connect(user0).repay(await TOKEN.debts(user0.address));
  });

  it("User0 unstakes all TOKEN", async function () {
    console.log("******************************************************");
    await VTOKEN.connect(user0).withdraw(await VTOKEN.balanceOf(user0.address));
  });

  it("User0 burns 10 OTOKEN for voting power", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(owner).transfer(user0.address, ten);
    await OTOKEN.connect(user0).approve(
      VTOKEN.address,
      await OTOKEN.balanceOf(user0.address)
    );
    await VTOKEN.connect(user0).burnFor(
      user0.address,
      await OTOKEN.balanceOf(user0.address)
    );
    await OTOKEN.connect(user0).approve(
      VTOKEN.address,
      await OTOKEN.balanceOf(user0.address)
    );
    await expect(
      VTOKEN.connect(user0).burnFor(
        user0.address,
        await OTOKEN.balanceOf(user0.address)
      )
    ).to.be.reverted;
  });

  it("User2 Buys TOKEN with 20 ETH", async function () {
    console.log("******************************************************");
    await BASE.connect(user2).approve(TOKEN.address, twenty);
    await TOKEN.connect(user2).buy(
      twenty,
      1,
      1892282187,
      user2.address,
      AddressZero
    );
  });

  it("User2 sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user2).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user2.address)
    );
    await TOKEN.connect(user2).sell(
      await TOKEN.balanceOf(user2.address),
      1,
      1792282187,
      user2.address,
      AddressZero
    );
  });

  it("User2 call distributeFees", async function () {
    console.log("******************************************************");
    await fees.distribute();
  });

  it("user0 resets vote", async function () {
    console.log("******************************************************");
    await expect(voter.connect(user0).reset()).to.be.revertedWith(
      "Voter__AlreadyVotedThisEpoch"
    );
  });

  it("user0 votes on plugins c", async function () {
    console.log("******************************************************");
    await expect(
      voter
        .connect(user0)
        .vote(
          [plugin0.address, plugin1.address, plugin2.address, plugin3.address],
          [ten, ten, ten, ten]
        )
    ).to.be.revertedWith("Voter__AlreadyVotedThisEpoch");
  });

  it("Forward time by 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [1 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("User0 claims rewards", async function () {
    console.log("******************************************************");
    await rewarder.connect(user0).getReward(user0.address);
  });

  it("User0 burns 10 OTOKEN for voting power", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user0).approve(
      VTOKEN.address,
      await OTOKEN.balanceOf(user0.address)
    );
    await VTOKEN.connect(user0).burnFor(
      user0.address,
      await OTOKEN.balanceOf(user0.address)
    );
  });

  it("Forward time by 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [1 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("user1 votes on plugins", async function () {
    console.log("******************************************************");
    await voter
      .connect(user1)
      .vote([plugin0.address, plugin1.address], [ten, ten]);
  });

  it("Forward time by 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("user0 votes on plugins d", async function () {
    console.log("******************************************************");
    await voter
      .connect(user0)
      .vote(
        [plugin0.address, plugin1.address, plugin2.address, plugin3.address],
        [ten, ten, ten, ten]
      );
  });

  it("Forward time by 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [1 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("owner distributes voting rewards", async function () {
    console.log("******************************************************");
    await voter.distributeToBribes([
      plugin0.address,
      plugin1.address,
      plugin2.address,
      plugin3.address,
    ]);
  });

  it("Forward time by 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [1 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("User0 claims bribes", async function () {
    console.log("******************************************************");
    await voter
      .connect(user0)
      .claimBribes([
        bribe0.address,
        bribe1.address,
        bribe2.address,
        bribe3.address,
      ]);
  });

  it("User1 claims bribes", async function () {
    console.log("******************************************************");
    await voter.connect(user1).claimBribes([bribe0.address, bribe1.address]);
  });

  it("User0 claims gauges", async function () {
    console.log("******************************************************");
    await voter
      .connect(user0)
      .claimRewards([
        gauge0.address,
        gauge1.address,
        gauge2.address,
        gauge3.address,
      ]);
  });

  it("user2 tries calling getReward on gauge0 for user0", async function () {
    console.log("******************************************************");
    await expect(
      gauge0.connect(user2).getReward(user0.address)
    ).to.be.revertedWith("Gauge__NotAuthorizedUser");
  });

  it("Forward time by 3 day", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [3 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("User0 claims bribes", async function () {
    console.log("******************************************************");
    await voter
      .connect(user0)
      .claimBribes([
        bribe0.address,
        bribe1.address,
        bribe2.address,
        bribe3.address,
      ]);
  });

  it("User1 claims bribes", async function () {
    console.log("******************************************************");
    await voter.connect(user1).claimBribes([bribe0.address, bribe1.address]);
  });

  it("owner distributes voting rewards", async function () {
    console.log("******************************************************");
    await voter.distributeToBribes([
      plugin0.address,
      plugin1.address,
      plugin2.address,
      plugin3.address,
    ]);
  });

  it("User2 deposits in all plugins", async function () {
    console.log("******************************************************");
    await xTEST0.connect(user2).approve(plugin0.address, ten);
    await plugin0.connect(user2).depositFor(user2.address, ten);
    await xTEST1.connect(user2).approve(plugin1.address, ten);
    await plugin1.connect(user2).depositFor(user2.address, ten);
    await LP0.connect(user2).approve(plugin2.address, ten);
    await plugin2.connect(user2).depositFor(user2.address, ten);
    await LP1.connect(user2).approve(plugin3.address, ten);
    await plugin3.connect(user2).depositFor(user2.address, ten);
  });

  it("User2 Buys TOKEN with 10 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user2).approve(TOKEN.address, ten);
    await TOKEN.connect(user2).buy(
      ten,
      1,
      1792282187,
      user2.address,
      AddressZero
    );
  });

  it("User2 stakes all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user2).approve(
      VTOKEN.address,
      await TOKEN.balanceOf(user2.address)
    );
    await VTOKEN.connect(user2).deposit(await TOKEN.balanceOf(user2.address));
  });

  it("user2 votes on plugins", async function () {
    console.log("******************************************************");
    await expect(
      voter.connect(user2).vote([plugin3.address], [ten, ten])
    ).to.be.revertedWith("Voter__PluginLengthNotEqualToWeightLength");
    await expect(voter.connect(user2).vote([plugin3.address], [0])).to.be
      .reverted;
    await voter.connect(user2).vote([plugin3.address], [ten]);
  });

  it("Forward 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("User2 claims gauges", async function () {
    console.log("******************************************************");
    await voter
      .connect(user2)
      .claimRewards([
        gauge0.address,
        gauge1.address,
        gauge2.address,
        gauge3.address,
      ]);
  });

  it("User2 claims bribes", async function () {
    console.log("******************************************************");
    await voter.connect(user2).claimBribes([bribe2.address, bribe3.address]);
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
  });

  it("users call get Reward on VTOKEN", async function () {
    console.log("******************************************************");
    await rewarder.connect(user0).getReward(user0.address);
    await rewarder.connect(user1).getReward(user1.address);
    await rewarder.connect(user2).getReward(user2.address);
  });

  it("User2 Buys TOKEN with 20 ETH", async function () {
    console.log("******************************************************");
    await BASE.connect(user2).approve(TOKEN.address, twenty);
    await TOKEN.connect(user2).buy(
      twenty,
      1,
      1892282187,
      user2.address,
      AddressZero
    );
  });

  it("User2 sells all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user2).approve(
      TOKEN.address,
      await TOKEN.balanceOf(user2.address)
    );
    await TOKEN.connect(user2).sell(
      await TOKEN.balanceOf(user2.address),
      1,
      1792282187,
      user2.address,
      AddressZero
    );
  });

  it("User2 call distributeFees", async function () {
    console.log("******************************************************");
    await fees.distribute();
  });

  it("Forward 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("Forward time by 7 day", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("Users claims gauges", async function () {
    console.log("******************************************************");
    await voter
      .connect(user0)
      .claimRewards([
        gauge0.address,
        gauge1.address,
        gauge2.address,
        gauge3.address,
      ]);
    await voter
      .connect(user1)
      .claimRewards([
        gauge0.address,
        gauge1.address,
        gauge2.address,
        gauge3.address,
      ]);
    await voter
      .connect(user2)
      .claimRewards([
        gauge0.address,
        gauge1.address,
        gauge2.address,
        gauge3.address,
      ]);
  });

  it("User2 claims bribes", async function () {
    console.log("******************************************************");
    await voter
      .connect(user0)
      .claimBribes([
        bribe0.address,
        bribe1.address,
        bribe2.address,
        bribe3.address,
      ]);
    await voter
      .connect(user1)
      .claimBribes([
        bribe0.address,
        bribe1.address,
        bribe2.address,
        bribe3.address,
      ]);
    await voter
      .connect(user2)
      .claimBribes([
        bribe0.address,
        bribe1.address,
        bribe2.address,
        bribe3.address,
      ]);
  });

  it("users call get Reward on VTOKEN", async function () {
    console.log("******************************************************");
    await rewarder.connect(user0).getReward(user0.address);
    await rewarder.connect(user1).getReward(user1.address);
    await rewarder.connect(user2).getReward(user2.address);
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
    await voter.distributeToBribes([
      plugin0.address,
      plugin1.address,
      plugin2.address,
      plugin3.address,
    ]);
  });

  it("User1 tries to withdraws staked position", async function () {
    console.log("******************************************************");
    await expect(
      VTOKEN.connect(user1).withdraw(await VTOKEN.balanceOf(user1.address))
    ).to.be.revertedWith("VTOKEN__VotingWeightActive");
  });

  it("Forward time by 7 day", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("User1 resets vote", async function () {
    console.log("******************************************************");
    await voter.connect(user1).reset();
  });

  it("User1 repays 2 BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(TOKEN.address, two);
    await TOKEN.connect(user1).repay(two);
  });

  it("User1 unstakes max available VTOKEN", async function () {
    console.log("******************************************************");
    await VTOKEN.connect(user1).withdraw(
      await VTOKEN.withdrawAvailable(user1.address)
    );
  });

  it("User1 repays all BASE", async function () {
    console.log("******************************************************");
    await BASE.connect(user1).approve(
      TOKEN.address,
      await TOKEN.debts(user1.address)
    );
    await TOKEN.connect(user1).repay(await TOKEN.debts(user1.address));
  });

  it("User1 unstakes max available VTOKEN", async function () {
    console.log("******************************************************");
    await VTOKEN.connect(user1).withdraw(
      await VTOKEN.withdrawAvailable(user1.address)
    );
  });

  it("User1 burns 100 OTOKEN for voting power", async function () {
    console.log("******************************************************");
    await OTOKEN.connect(user1).approve(VTOKEN.address, oneHundred);
    await VTOKEN.connect(user1).burnFor(user1.address, oneHundred);
  });

  it("Forward 1 hour", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [1 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("User1 tries to borrow 1 BASE", async function () {
    console.log("******************************************************");
    await expect(TOKEN.connect(user1).borrow(one)).to.be.revertedWith(
      "TOKEN__ExceedsBorrowCreditLimit"
    );
  });

  it("BondingCurveData, user0", async function () {
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

  it("User0 mints lsTOKEN with all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(LSTOKEN.address, ten);
    await LSTOKEN.connect(user0).mint(ten);
    console.log(
      "User0 lsToken Balance: ",
      divDec(await LSTOKEN.balanceOf(user0.address))
    );
  });

  it("User0 calls stakeTokenForVTOKEN", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).stakeTokenForVToken();
  });

  it("User0 calls borrowMaxBase", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).borrowMaxBase();
  });

  it("User0 calls burnOTokenForVToken", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).burnOTokenForVToken();
  });

  it("User0 calls buyTokenWithBase", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).buyTokenWithBase(
      await BASE.connect(owner).balanceOf(LSTOKEN.address)
    );
  });

  it("BondingCurveData, lsToken", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(LSTOKEN.address);
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

  it("User1 mints lsTOKEN five TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user1).approve(LSTOKEN.address, five);
    await LSTOKEN.connect(user1).mint(five);
    console.log(
      "User1 lsToken Balance: ",
      divDec(await LSTOKEN.balanceOf(user1.address))
    );
  });

  it("User0 claims rewards", async function () {
    console.log("******************************************************");
    console.log(
      "Before User0 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user0.address))
    );
    await LSTOKEN.connect(user0).claimFees();
    console.log(
      "After User0 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user0.address))
    );
  });

  it("User1 claims rewards", async function () {
    console.log("******************************************************");
    console.log(
      "Before User1 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user1.address))
    );
    await LSTOKEN.connect(user1).claimFees();
    console.log(
      "After User1 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user1.address))
    );
  });

  it("User0 calls stakeTokenForVTOKEN", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).stakeTokenForVToken();
  });

  it("User0 calls borrowMaxBase", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).borrowMaxBase();
  });

  it("User0 calls burnOTokenForVToken", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).burnOTokenForVToken();
  });

  it("User0 calls buyTokenWithBase", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).buyTokenWithBase(
      await BASE.connect(owner).balanceOf(LSTOKEN.address)
    );
  });

  it("User0 claims rewards", async function () {
    console.log("******************************************************");
    console.log(
      "Before User0 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user0.address))
    );
    await LSTOKEN.connect(user0).claimFees();
    console.log(
      "After User0 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user0.address))
    );
  });

  it("User1 claims rewards", async function () {
    console.log("******************************************************");
    console.log(
      "Before User1 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user1.address))
    );
    await LSTOKEN.connect(user1).claimFees();
    console.log(
      "After User1 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user1.address))
    );
  });

  it("User0 calls stakeTokenForVTOKEN", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).stakeTokenForVToken();
  });

  it("User0 calls borrowMaxBase", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).borrowMaxBase();
  });

  it("User0 calls burnOTokenForVToken", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).burnOTokenForVToken();
  });

  it("User0 calls buyTokenWithBase", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).buyTokenWithBase(
      await BASE.connect(owner).balanceOf(LSTOKEN.address)
    );
  });

  it("User0 claims rewards", async function () {
    console.log("******************************************************");
    console.log(
      "Before User0 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user0.address))
    );
    await LSTOKEN.connect(user0).claimFees();
    console.log(
      "After User0 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user0.address))
    );
  });

  it("User1 claims rewards", async function () {
    console.log("******************************************************");
    console.log(
      "Before User1 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user1.address))
    );
    await LSTOKEN.connect(user1).claimFees();
    console.log(
      "After User1 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user1.address))
    );
  });

  it("User0 transfers LSTOKEN to user1", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).transfer(
      user1.address,
      await LSTOKEN.balanceOf(user0.address)
    );
  });

  it("User0 calls stakeTokenForVTOKEN", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).stakeTokenForVToken();
  });

  it("User0 calls borrowMaxBase", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).borrowMaxBase();
  });

  it("User0 calls burnOTokenForVToken", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).burnOTokenForVToken();
  });

  it("User0 calls buyTokenWithBase", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).buyTokenWithBase(
      await BASE.connect(owner).balanceOf(LSTOKEN.address)
    );
  });

  it("User0 claims rewards", async function () {
    console.log("******************************************************");
    console.log(
      "Before User0 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user0.address))
    );
    await LSTOKEN.connect(user0).claimFees();
    console.log(
      "After User0 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user0.address))
    );
  });

  it("User1 claims rewards", async function () {
    console.log("******************************************************");
    console.log(
      "Before User1 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user1.address))
    );
    await LSTOKEN.connect(user1).claimFees();
    console.log(
      "After User1 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user1.address))
    );
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
  });

  it("User2 call distributeFees", async function () {
    console.log("******************************************************");
    await fees.distribute();
  });

  it("Forward 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("User0 calls claimVTokenRewards", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).claimVTokenRewards();
  });

  it("User0 calls stakeTokenForVTOKEN", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).stakeTokenForVToken();
  });

  it("User0 calls stakeTokenForVTOKEN", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).stakeTokenForVToken();
  });

  it("User0 calls borrowMaxBase", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).borrowMaxBase();
  });

  it("User0 calls borrowMaxBase", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).borrowMaxBase();
  });

  it("User0 calls burnOTokenForVToken", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).burnOTokenForVToken();
  });

  it("User0 calls buyTokenWithBase", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).buyTokenWithBase(one);
  });

  it("User0 calls buyTokenWithBase", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).buyTokenWithBase(
      await BASE.connect(owner).balanceOf(LSTOKEN.address)
    );
  });

  it("User0 calls buyTokenWithBase", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).buyTokenWithBase(
      await BASE.connect(owner).balanceOf(LSTOKEN.address)
    );
  });

  it("User1 transfers LSTOKEN to user0", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user1).transfer(
      user0.address,
      await LSTOKEN.balanceOf(user1.address)
    );
  });

  it("User0 claims rewards", async function () {
    console.log("******************************************************");
    console.log(
      "Before User0 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user0.address))
    );
    await LSTOKEN.connect(user0).claimFees();
    console.log(
      "After User0 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user0.address))
    );
  });

  it("User1 claims rewards", async function () {
    console.log("******************************************************");
    console.log(
      "Before User1 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user1.address))
    );
    await LSTOKEN.connect(user1).claimFees();
    console.log(
      "After User1 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user1.address))
    );
  });

  it("User0 claims rewards", async function () {
    console.log("******************************************************");
    console.log(
      "Before User0 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user0.address))
    );
    await LSTOKEN.connect(user0).claimFees();
    console.log(
      "After User0 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user0.address))
    );
  });

  it("User1 claims rewards", async function () {
    console.log("******************************************************");
    console.log(
      "Before User1 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user1.address))
    );
    await LSTOKEN.connect(user1).claimFees();
    console.log(
      "After User1 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user1.address))
    );
  });

  it("Leverage Check", async function () {
    console.log("******************************************************");
    console.log(
      "Leverage Check",
      divDec(await LSTOKEN.connect(user0).leverage())
    );
  });

  it("Vote Master sets votes", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(owner).setVotes(
      [plugin0.address, plugin1.address, plugin2.address, plugin3.address],
      [ten, ten, ten, ten]
    );
    console.log(await LSTOKEN.connect(owner).getVote());
    await LSTOKEN.connect(user1).vote();
  });

  it("owner distributes voting rewards", async function () {
    console.log("******************************************************");
    await voter.distributeToBribes([
      plugin0.address,
      plugin1.address,
      plugin2.address,
      plugin3.address,
    ]);
  });

  it("Forward 7 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [7 * 24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("BribeCardData, plugin0, lsTOKEN ", async function () {
    console.log("******************************************************");
    let res = await multicall.bribeCardData(plugin0.address, LSTOKEN.address);
    console.log("INFORMATION");
    console.log("Bribe: ", res.bribe);
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

  it("BribeCardData, plugin2, lsTOKEN ", async function () {
    console.log("******************************************************");
    let res = await multicall.bribeCardData(plugin2.address, LSTOKEN.address);
    console.log("INFORMATION");
    console.log("Bribe: ", res.bribe);
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

  it("User0 calls stakeTokenForVTOKEN", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).claimBribes([
      bribe0.address,
      bribe1.address,
      bribe2.address,
      bribe3.address,
    ]);
  });

  it("User0 calls stakeTokenForVTOKEN", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).claimBribes([
      bribe0.address,
      bribe1.address,
      bribe2.address,
      bribe3.address,
    ]);
  });

  it("User0 calls claimVTokenRewards", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).claimVTokenRewards();
  });

  it("User0 calls claimVTokenRewards", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).claimVTokenRewards();
  });

  it("LSTOKENBalances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(LSTOKEN.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(LSTOKEN.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(LSTOKEN.address)));
    console.log("vTOKEN", divDec(await VTOKEN.balanceOf(LSTOKEN.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(LSTOKEN.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(LSTOKEN.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(LSTOKEN.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(LSTOKEN.address)));
  });

  it("User0 calls sweep rewards", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).sweepRewards([
      BASE.address,
      TOKEN.address,
      OTOKEN.address,
      VTOKEN.address,
    ]);
  });

  it("LSTOKENBalances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(LSTOKEN.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(LSTOKEN.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(LSTOKEN.address)));
    console.log("vTOKEN", divDec(await VTOKEN.balanceOf(LSTOKEN.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(LSTOKEN.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(LSTOKEN.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(LSTOKEN.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(LSTOKEN.address)));
  });

  it("User0 calls sweep rewards", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).sweepRewards([
      TEST0.address,
      TEST1.address,
      TEST2.address,
      TEST3.address,
    ]);
  });

  it("LSTOKENBalances", async function () {
    console.log("******************************************************");
    console.log("BASE", divDec(await BASE.balanceOf(LSTOKEN.address)));
    console.log("TOKEN", divDec(await TOKEN.balanceOf(LSTOKEN.address)));
    console.log("oTOKEN", divDec(await OTOKEN.balanceOf(LSTOKEN.address)));
    console.log("vTOKEN", divDec(await VTOKEN.balanceOf(LSTOKEN.address)));
    console.log();
    console.log("TEST0", divDec(await TEST0.balanceOf(LSTOKEN.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(LSTOKEN.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(LSTOKEN.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(LSTOKEN.address)));
  });

  it("Owner balances", async function () {
    console.log("******************************************************");
    console.log("TEST0", divDec(await TEST0.balanceOf(owner.address)));
    console.log("TEST1", divDec(await TEST1.balanceOf(owner.address)));
    console.log("TEST2", divDec(await TEST2.balanceOf(owner.address)));
    console.log("TEST3", divDec(await TEST3.balanceOf(owner.address)));
  });

  it("Coverage Testing", async function () {
    console.log("******************************************************");
    await expect(LSTOKEN.connect(user0).mint(0)).to.be.revertedWith(
      "LSTOKEN__InvalidZeroInput"
    );
    await expect(
      LSTOKEN.connect(user0).setVotes([plugin1.address], [100])
    ).to.be.revertedWith("LSTOKEN__NotVoteDelegate");
    await expect(
      LSTOKEN.connect(owner).setVotes([plugin1.address], [100, 100])
    ).to.be.revertedWith("LSTOKEN__InvalidLength");
    await expect(
      LSTOKEN.connect(owner).setVoter(AddressZero)
    ).to.be.revertedWith("LSTOKEN__InvalidZeroAddress");
    await expect(LSTOKEN.connect(user0).setVoter(user0.address)).to.be.reverted;
    await LSTOKEN.connect(owner).setVoter(user0.address);

    await expect(
      LSTOKEN.connect(owner).setVoteDelegate(AddressZero)
    ).to.be.revertedWith("LSTOKEN__InvalidZeroAddress");
    await expect(LSTOKEN.connect(user0).setVoteDelegate(user0.address)).to.be
      .reverted;
    await LSTOKEN.connect(owner).setVoteDelegate(user0.address);

    await expect(
      LSTOKEN.connect(owner).setRewardReceiver(AddressZero)
    ).to.be.revertedWith("LSTOKEN__InvalidZeroAddress");
    await expect(LSTOKEN.connect(user0).setRewardReceiver(user0.address)).to.be
      .reverted;
    await LSTOKEN.connect(owner).setRewardReceiver(user0.address);
  });

  it("User0 calls loop 10 times", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).loop(10);
  });

  it("Leverage Check", async function () {
    console.log("******************************************************");
    console.log(
      "Leverage Check",
      divDec(await LSTOKEN.connect(user0).leverage())
    );
  });

  it("User0 calls loop 10 times", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).loop(10);
  });

  it("Leverage Check", async function () {
    console.log("******************************************************");
    console.log(
      "Leverage Check",
      divDec(await LSTOKEN.connect(user0).leverage())
    );
    console.log(
      "LSTOKEN Supply",
      divDec(await LSTOKEN.connect(user0).totalSupply())
    );
    console.log(
      "LSTOKEN VTOKEN Balance",
      divDec(await VTOKEN.connect(owner).balanceOf(LSTOKEN.address))
    );
  });

  it("BondingCurveData, lsToken", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(LSTOKEN.address);
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

  it("User0 mints lsTOKEN with all TOKEN", async function () {
    console.log("******************************************************");
    await TOKEN.connect(user0).approve(LSTOKEN.address, five);
    await LSTOKEN.connect(user0).mint(five);
    console.log(
      "User0 lsToken Balance: ",
      divDec(await LSTOKEN.balanceOf(user0.address))
    );
  });

  it("BondingCurveData, lsToken", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(LSTOKEN.address);
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

  it("Leverage Check", async function () {
    console.log("******************************************************");
    console.log(
      "Leverage Check",
      divDec(await LSTOKEN.connect(user0).leverage())
    );
    console.log(
      "LSTOKEN Supply",
      divDec(await LSTOKEN.connect(user0).totalSupply())
    );
    console.log(
      "LSTOKEN VTOKEN Balance",
      divDec(await VTOKEN.connect(owner).balanceOf(LSTOKEN.address))
    );
  });

  it("User0 calls loop 10 times", async function () {
    console.log("******************************************************");
    await LSTOKEN.connect(user0).loop(10);
  });

  it("Leverage Check", async function () {
    console.log("******************************************************");
    console.log(
      "Leverage Check",
      divDec(await LSTOKEN.connect(user0).leverage())
    );
    console.log(
      "LSTOKEN Supply",
      divDec(await LSTOKEN.connect(user0).totalSupply())
    );
    console.log(
      "LSTOKEN VTOKEN Balance",
      divDec(await VTOKEN.connect(owner).balanceOf(LSTOKEN.address))
    );
  });

  it("User0 claims rewards", async function () {
    console.log("******************************************************");
    console.log(
      "Before User0 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user0.address))
    );
    await LSTOKEN.connect(user0).claimFees();
    console.log(
      "After User0 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user0.address))
    );
  });

  it("User1 claims rewards", async function () {
    console.log("******************************************************");
    console.log(
      "Before User1 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user1.address))
    );
    await LSTOKEN.connect(user1).claimFees();
    console.log(
      "After User1 Base Balance",
      divDec(await BASE.connect(owner).balanceOf(user1.address))
    );
  });

  it("BondingCurveData, lsToken", async function () {
    console.log("******************************************************");
    let res = await multicall.bondingCurveData(LSTOKEN.address);
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
});
