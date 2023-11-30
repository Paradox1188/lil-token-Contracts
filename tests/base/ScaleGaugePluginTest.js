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
const one6 = convert("1", 6);
const two = convert("2", 18);
const five = convert("5", 18);
const ten = convert("10", 18);
const ten6 = convert("10", 6);
const twenty = convert("20", 18);
const thirty = convert("30", 18);
const fifty = convert("50", 18);
const ninety = convert("90", 18);
const oneHundred = convert("100", 18);
const twoHundred = convert("200", 18);
const fiveHundred = convert("500", 18);
const eightHundred = convert("800", 18);
const oneThousand = convert("1000", 18);
const oneThousand6 = convert("1000", 6);
const fourThousand = convert("4000", 18);
const fourThousand6 = convert("4000", 6);
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

const SCALE_ADDR = "0x54016a4848a38f257B6E96331F7404073Fd9c32C";
const SCALE_PROXY = "0x7bE024bbD16E3E0ab6839cb94D0dc25B7A101eAb";
const SCALE_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${SCALE_PROXY}&apikey=${BASE_API_KEY}`;
const SCALE_HOLDER = "0xadf9152100c536e854e0ed7a3e0e60275cef7e7d";

const WETH_ADDR = "0x4200000000000000000000000000000000000006";
const WETH_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${WETH_ADDR}&apikey=${BASE_API_KEY}`;
const WETH_HOLDER = "0xee5eb45230f39b99899c234ae3e1bd636fda3be4";

const USDbC_ADDR = "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA";
const USDbC_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=0x1833C6171E0A3389B156eAedB301CFfbf328B463&apikey=${BASE_API_KEY}`;
const USDbC_HOLDER = "0xc68a33de9ceac7bdaed242ae1dc40d673ed4f643";

const MAI_ADDR = "0xbf1aeA8670D2528E08334083616dD9C5F3B087aE";
const MAI_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${MAI_ADDR}&apikey=${BASE_API_KEY}`;
const MAI_HOLDER = "0x9ce6e6b60c894d1df9bc3d9d6cc969b79fb176b7";

const TAROT_ADDR = "0xf544251d25f3d243a36b07e7e7962a678f952691";
const TAROT_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${TAROT_ADDR}&apikey=${BASE_API_KEY}`;
const TAROT_HOLDER = "0x0ed650c3185ef33b6f61ad2fa7521a3602df566c";

// vLP-SCALE/WETH
const LP0_ADDR = "0xc825c67cA3a80D487C339A6C16bB84f7DCA16012";
const LP0_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${LP0_ADDR}&apikey=${BASE_API_KEY}`;
const LP0_GAUGE = "0x190fC4FDB5d6Aa5C625ff0E45899CDA15Ce3c95F";
const LP0_GAUGE_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${LP0_GAUGE}&apikey=${BASE_API_KEY}`;

// sLP-MAI/USDbC
const LP1_ADDR = "0x8084B1b2DDe3B685A0FAB3bBF201f94340d1D768";
const LP1_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${LP0_ADDR}&apikey=${BASE_API_KEY}`;
const LP1_GAUGE = "0x6496BC99dcB8319BeF9939b45Be9cb8f345aC9B1";
const LP1_GAUGE_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${LP1_GAUGE}&apikey=${BASE_API_KEY}`;

// vLP-TAROT/USDC
const LP2_ADDR = "0xc54D3698Ff73a58D229860c8C2E137867841c631";
const LP2_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${LP2_ADDR}&apikey=${BASE_API_KEY}`;
const LP2_GAUGE = "0x7cE4F825E56a28D47891c721ef9641947c4Ae6B8";
const LP2_GAUGE_HOLDER = "0xb1028c2d61337589e515d6bdb949ed97935518b2";
const LP2_GAUGE_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${LP2_GAUGE}&apikey=${BASE_API_KEY}`;

// veSCALE
const VE_ADDR = "0x28c9C71c776a1203000B56C0Cca48BEf1cd51C53";
const VE_PROXY = "0x3Ce7ba8aD19FE33Ae2cE20A4Cc1b0D91C5053549";
const VE_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${VE_PROXY}&apikey=${BASE_API_KEY}`;
const MULTISIG = "0x0cF24278C99d60388dd8A3A663937f1b9f934d09";
const ID = "1123";

// ROUTER
const ROUTER = "0x2F87Bf58D5A9b2eFadE55Cdbd46153a0902be6FA";
const ROUTER_URL = `https://api.basescan.org/api?module=contract&action=getabi&address=${ROUTER}&apikey=${BASE_API_KEY}`;

let owner, multisig, treasury, user0, user1, user2;
let VTOKENFactory,
  OTOKENFactory,
  feesFactory,
  rewarderFactory,
  gaugeFactory,
  bribeFactory;
let minter, voter, fees, rewarder, governance, multicall, pluginFactory;
let TOKEN, VTOKEN, OTOKEN, BASE;
let SCALE, WETH, USDbC, MAI, TAROT, router, ve;
let LP0, LP0Gauge, plugin0, gauge0, bribe0;
let LP1, LP1Gauge, plugin1, gauge1, bribe1;
let LP2, LP2Gauge, plugin2, gauge2, bribe2;

describe.only("base: Equalizer gauge Testing", function () {
  before("Initial set up", async function () {
    console.log("Begin Initialization");

    // Router
    response = await axios.get(ROUTER_URL);
    const ROUTER_ABI = JSON.parse(response.data.result);
    router = new ethers.Contract(ROUTER, ROUTER_ABI, provider);
    await timer(1000);
    console.log("- router Initialized");

    // SCALE
    response = await axios.get(SCALE_URL);
    const SCALE_ABI = JSON.parse(response.data.result);
    SCALE = new ethers.Contract(SCALE_ADDR, SCALE_ABI, provider);
    await timer(1000);
    console.log("- SCALE Initialized");

    // WETH
    response = await axios.get(WETH_URL);
    const WETH_ABI = JSON.parse(response.data.result);
    WETH = new ethers.Contract(WETH_ADDR, WETH_ABI, provider);
    await timer(1000);
    console.log("- WETH Initialized");

    // USDbC
    response = await axios.get(USDbC_URL);
    const USDbC_ABI = JSON.parse(response.data.result);
    USDbC = new ethers.Contract(USDbC_ADDR, USDbC_ABI, provider);
    await timer(1000);
    console.log("- USDbC Initialized");

    // MAI
    response = await axios.get(MAI_URL);
    const MAI_ABI = JSON.parse(response.data.result);
    MAI = new ethers.Contract(MAI_ADDR, MAI_ABI, provider);
    await timer(1000);
    console.log("- MAI Initialized");

    // TAROT
    response = await axios.get(TAROT_URL);
    const TAROT_ABI = JSON.parse(response.data.result);
    TAROT = new ethers.Contract(TAROT_ADDR, TAROT_ABI, provider);
    await timer(1000);
    console.log("- TAROT Initialized");

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

    // LP2
    response = await axios.get(LP2_URL);
    const LP2_ABI = JSON.parse(response.data.result);
    LP2 = new ethers.Contract(LP2_ADDR, LP2_ABI, provider);
    await timer(1000);
    console.log("- LP2 Initialized");

    // LP0Gauge
    response = await axios.get(LP0_GAUGE_URL);
    const LP0_GAUGE_ABI = JSON.parse(response.data.result);
    LP0Gauge = new ethers.Contract(LP0_GAUGE, LP0_GAUGE_ABI, provider);
    await timer(1000);
    console.log("- LP0Gauge Initialized");

    // LP1Gauge
    response = await axios.get(LP1_GAUGE_URL);
    const LP1_GAUGE_ABI = JSON.parse(response.data.result);
    LP1Gauge = new ethers.Contract(LP1_GAUGE, LP1_GAUGE_ABI, provider);
    await timer(1000);
    console.log("- LP1Gauge Initialized");

    // LP2Gauge
    response = await axios.get(LP2_GAUGE_URL);
    const LP2_GAUGE_ABI = JSON.parse(response.data.result);
    LP2Gauge = new ethers.Contract(LP2_GAUGE, LP2_GAUGE_ABI, provider);
    await timer(1000);
    console.log("- LP2Gauge Initialized");

    // VE
    response = await axios.get(VE_URL);
    const VE_ABI = JSON.parse(response.data.result);
    ve = new ethers.Contract(VE_ADDR, VE_ABI, provider);
    await timer(1000);
    console.log("- VE Initialized");

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
      "ScaleGaugePluginFactory"
    );
    const pluginFactoryContract = await pluginFactoryArtifact.deploy(
      voter.address
    );
    pluginFactory = await ethers.getContractAt(
      "ScaleGaugePluginFactory",
      pluginFactoryContract.address
    );
    console.log("- Plugin Factory Initialized");

    // initialize LP0
    await pluginFactory.createPlugin(LP0.address, "vLP-SCALE/WETH");
    plugin0 = await ethers.getContractAt(
      "contracts/plugins/base/ScaleGaugePluginFactory.sol:ScaleGaugePlugin",
      await pluginFactory.last_plugin()
    );

    // initialize LP1
    await pluginFactory.createPlugin(LP1.address, "sLP-MAI/USDbC");
    plugin1 = await ethers.getContractAt(
      "contracts/plugins/base/ScaleGaugePluginFactory.sol:ScaleGaugePlugin",
      await pluginFactory.last_plugin()
    );

    // initialize LP2
    await pluginFactory.createPlugin(LP2.address, "vLP-TAROT/USDC");
    plugin2 = await ethers.getContractAt(
      "contracts/plugins/base/ScaleGaugePluginFactory.sol:ScaleGaugePlugin",
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

    // add LP2 Plugin to Voter
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
    console.log("- LP2 Added in Voter");

    console.log("Initialization Complete");
    console.log();
  });

  it("Impersonate MUTLSIG holder and approve plugin on NFT", async function () {
    console.log("******************************************************");
    await owner.sendTransaction({
      to: MULTISIG,
      value: ethers.utils.parseEther("1.0"), // Sends exactly 1.0 ether
    });
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [MULTISIG],
    });
    const signer = ethers.provider.getSigner(MULTISIG);

    await ve.connect(signer).approve(plugin2.address, ID);
  });

  it("Impersonate SCALE holder and send to user0", async function () {
    console.log("******************************************************");
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [SCALE_HOLDER],
    });
    const signer = ethers.provider.getSigner(SCALE_HOLDER);

    await SCALE.connect(signer).transfer(
      user0.address,
      await SCALE.connect(owner).balanceOf(SCALE_HOLDER)
    );

    console.log(
      "Holder SCALE balance: ",
      divDec(await SCALE.connect(owner).balanceOf(SCALE_HOLDER))
    );
    console.log(
      "User0 SCALE balance: ",
      divDec(await SCALE.connect(owner).balanceOf(user0.address))
    );
  });

  it("Impersonate WETH holder and send to user0", async function () {
    console.log("******************************************************");
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [WETH_HOLDER],
    });
    const signer = ethers.provider.getSigner(WETH_HOLDER);

    await WETH.connect(signer).transfer(
      user0.address,
      await WETH.connect(owner).balanceOf(WETH_HOLDER)
    );

    console.log(
      "Holder WETH balance: ",
      divDec(await WETH.connect(owner).balanceOf(WETH_HOLDER))
    );
    console.log(
      "User0 WETH balance: ",
      divDec(await WETH.connect(owner).balanceOf(user0.address))
    );
  });

  it("Impersonate USDbC holder and send to user0", async function () {
    console.log("******************************************************");
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [USDbC_HOLDER],
    });
    const signer = ethers.provider.getSigner(USDbC_HOLDER);

    await USDbC.connect(signer).transfer(
      user0.address,
      await USDbC.connect(owner).balanceOf(USDbC_HOLDER)
    );

    console.log(
      "Holder USDbC balance: ",
      divDec(await USDbC.connect(owner).balanceOf(USDbC_HOLDER))
    );
    console.log(
      "User0 USDbC balance: ",
      divDec(await USDbC.connect(owner).balanceOf(user0.address))
    );
  });

  it("Impersonate MAI holder and send to user0", async function () {
    console.log("******************************************************");
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [MAI_HOLDER],
    });
    const signer = ethers.provider.getSigner(MAI_HOLDER);

    await MAI.connect(signer).transfer(
      user0.address,
      await MAI.connect(owner).balanceOf(MAI_HOLDER)
    );

    console.log(
      "Holder MAI balance: ",
      divDec(await MAI.connect(owner).balanceOf(MAI_HOLDER))
    );
    console.log(
      "User0 MAI balance: ",
      divDec(await MAI.connect(owner).balanceOf(user0.address))
    );
  });

  it("Impersonate TAROT holder and send to user0", async function () {
    console.log("******************************************************");
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [TAROT_HOLDER],
    });
    const signer = ethers.provider.getSigner(TAROT_HOLDER);

    await TAROT.connect(signer).transfer(
      user0.address,
      await TAROT.connect(owner).balanceOf(TAROT_HOLDER)
    );

    console.log(
      "Holder TAROT balance: ",
      divDec(await TAROT.connect(owner).balanceOf(MAI_HOLDER))
    );
    console.log(
      "User0 TAROT balance: ",
      divDec(await TAROT.connect(owner).balanceOf(user0.address))
    );
  });

  it("user0 gets LP0 liquidity", async function () {
    console.log("******************************************************");
    await SCALE.connect(user0).approve(
      router.address,
      await SCALE.connect(owner).balanceOf(user0.address)
    );
    await router
      .connect(user0)
      .addLiquidityETH(
        SCALE.address,
        false,
        await SCALE.connect(owner).balanceOf(user0.address),
        1,
        1,
        user0.address,
        1888060806,
        { value: ten }
      );
    await LP0Gauge.connect(user0).withdrawAll();
    console.log(
      "User0 LP0 balance: ",
      divDec(await LP0.connect(owner).balanceOf(user0.address))
    );
  });

  it("user0 swap USDC to MAI", async function () {
    console.log("******************************************************");
    await USDbC.connect(user0).approve(router.address, fiveThousand6);
    await router
      .connect(user0)
      .swapExactTokensForTokens(
        fiveThousand6,
        1,
        [[USDbC.address, MAI.address, true]],
        user0.address,
        1792282187
      );
  });

  it("user0 gets LP1 liquidity", async function () {
    console.log("******************************************************");
    await MAI.connect(user0).approve(router.address, fiveThousand);
    await USDbC.connect(user0).approve(router.address, fiveThousand6);
    await router
      .connect(user0)
      .addLiquidity(
        USDbC.address,
        MAI.address,
        true,
        fiveThousand6,
        fiveThousand,
        1,
        1,
        user0.address,
        1888060806
      );
    await LP1Gauge.connect(user0).withdrawAll();
    console.log(
      "User0 USDbC balance: ",
      divDec6(await USDbC.connect(owner).balanceOf(user0.address))
    );
    console.log(
      "User0 MAI balance: ",
      divDec(await MAI.connect(owner).balanceOf(user0.address))
    );
    console.log(
      "User0 LP1 balance: ",
      divDec(await LP1.connect(owner).balanceOf(user0.address))
    );
  });

  it("user0 gets LP2 liquidity", async function () {
    console.log("******************************************************");
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [LP2_GAUGE_HOLDER],
    });
    const signer = ethers.provider.getSigner(LP2_GAUGE_HOLDER);
    await LP2Gauge.connect(signer).withdrawAll();

    await LP2.connect(signer).transfer(
      user0.address,
      await LP2.connect(owner).balanceOf(LP2_GAUGE_HOLDER)
    );
    console.log(
      "User0 LP2 balance: ",
      divDec(await LP2.connect(owner).balanceOf(user0.address))
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

    await LP2.connect(user0).approve(
      plugin2.address,
      await LP2.connect(owner).balanceOf(user0.address)
    );
    await plugin2
      .connect(user0)
      .depositFor(
        user0.address,
        await LP2.connect(owner).balanceOf(user0.address)
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
      .vote(
        [plugin0.address, plugin1.address, plugin2.address],
        [ten, ten, ten]
      );
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

  it("LPGauge data ", async function () {
    console.log("******************************************************");
    console.log("LP0Gauge");
    console.log(
      "Claimable SCALE: ",
      await LP0Gauge.connect(owner).earned(SCALE.address, plugin0.address)
    );
    console.log();

    console.log("LP1Gauge");
    console.log(
      "Claimable SCALE: ",
      await LP1Gauge.connect(owner).earned(SCALE.address, plugin1.address)
    );
    console.log();

    console.log("LP2Gauge");
    console.log(
      "Claimable SCALE: ",
      await LP2Gauge.connect(owner).earned(SCALE.address, plugin2.address)
    );
    console.log();
  });

  it("Forward time by 1 days", async function () {
    console.log("******************************************************");
    await network.provider.send("evm_increaseTime", [24 * 3600]);
    await network.provider.send("evm_mine");
  });

  it("LPGauge data ", async function () {
    console.log("******************************************************");
    console.log("LP0Gauge");
    console.log(
      "Claimable SCALE: ",
      await LP0Gauge.connect(owner).earned(SCALE.address, plugin0.address)
    );
    console.log();

    console.log("LP1Gauge");
    console.log(
      "Claimable SCALE: ",
      await LP1Gauge.connect(owner).earned(SCALE.address, plugin1.address)
    );
    console.log();

    console.log("LP2Gauge");
    console.log(
      "Claimable SCALE: ",
      await LP2Gauge.connect(owner).earned(SCALE.address, plugin2.address)
    );
    console.log();
  });

  it("NFT Balances", async function () {
    console.log("******************************************************");
    console.log("Multisig NFTs", await ve.connect(user0).balanceOf(MULTISIG));
    console.log(
      "Multisig Amount",
      divDec(await ve.connect(user0).balanceOfNFT(ID))
    );
    console.log();
    console.log(
      "Plugin0 NFTs",
      await ve.connect(user0).balanceOf(plugin0.address)
    );
    console.log(
      "Plugin1 NFTs",
      await ve.connect(user0).balanceOf(plugin1.address)
    );
    console.log(
      "Plugin2 NFTs",
      await ve.connect(user0).balanceOf(plugin2.address)
    );
  });

  it("Owner calls distribute", async function () {
    console.log("******************************************************");
    await voter.connect(owner).distro();
    await fees.distribute();
    await voter.distributeToBribes([
      plugin0.address,
      plugin1.address,
      plugin2.address,
    ]);
  });

  it("NFT Balances", async function () {
    console.log("******************************************************");
    console.log("Multisig NFTs", await ve.connect(user0).balanceOf(MULTISIG));
    console.log(
      "Multisig Amount",
      divDec(await ve.connect(user0).balanceOfNFT(ID))
    );
    console.log();
    console.log(
      "Plugin0 NFTs",
      await ve.connect(user0).balanceOf(plugin0.address)
    );
    console.log(
      "Plugin1 NFTs",
      await ve.connect(user0).balanceOf(plugin1.address)
    );
    console.log(
      "Plugin2 NFTs",
      await ve.connect(user0).balanceOf(plugin2.address)
    );
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

  it("NFT Balances", async function () {
    console.log("******************************************************");
    console.log("Multisig NFTs", await ve.connect(user0).balanceOf(MULTISIG));
    console.log(
      "Multisig Amount",
      divDec(await ve.connect(user0).balanceOfNFT(ID))
    );
    console.log();
    console.log(
      "Plugin0 NFTs",
      await ve.connect(user0).balanceOf(plugin0.address)
    );
    console.log(
      "Plugin1 NFTs",
      await ve.connect(user0).balanceOf(plugin1.address)
    );
  });
});
