import { assert, expect } from "chai";
import hardhat from "hardhat";
import { packFunctionArgs, signaturesToBytes } from "predicate-sdk";
const { ethers } = hardhat;

const ETH_CHAINID = 1;
const ALEO_CHAINID = 2;
const ADDRESS_ONE = "0x0000000000000000000000000000000000000001";
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";
const TELLER_CONTRACT = "0xede35ea2dc28444b52b6b5d47009926910783d7b";
const PREDICATE_SERVICE = "0x053f202A596450908CDcf99F8e24B424EEBbaeE4";
const BRIDGE_PROXY = "0x7440176A6F367D3Fad1754519bD8033EAF173133";

// Real mainnet token addresses
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
const USDT = "0xdAC17F958D2ee523a2206206994597C13D831ec7";
const ALEO_USD = "0xc60a7e21a6753ed4305c93034607009faec2a5f3";

// Whale addresses with lots of tokens 
const USDC_WHALE = "0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341";
const USDT_WHALE = "0xF977814e90dA44bFA03b6295A0616a897441aceC";
async function callPredicateApi({
  apiKey = "",
  walletAddress = "",
  deployedContract = "",
  chainId = 1,
  data = "0x",
  msgValue = "0",
}) {
  const endpoint = "https://api.predicate.io/v1/task";

  const body = {
    from: walletAddress,
    to: deployedContract,
    data,
    msg_value: msgValue,
    chain_id: chainId,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const text = await response.text(); // read once

  if (!response.ok) {
    console.error(`API call failed: ${response.status} - ${text}`);
    throw new Error(`Predicate API error: ${response.status}`);
  }

  // parse once from the text we already read
  return JSON.parse(text);
}
describe("TokenServicePaxos", () => {
  let deployer,
    proxiedHolding,
    wrongPacket,
    attestor,
    attestor1,
    inPacket,
    Proxied,
    lib,
    aleolib,
    proxy,
    bridge,
    proxiedBridge,
    initializeData,
    ERC20TokenBridge,
    erc20TokenBridge,
    owner,
    proxiedV1,
    TokenService,
    TokenServiceImpl,
    TokenServiceImplAddr,
    signer,
    usdcContract, // ← Changed name to be clearer
    usdtContract, // ← Changed name to be clearer
    chainId,
    other,
    UnSupportedToken,
    unsupportedToken,
    proxiedEthVaultService,
    feeCollector,
    feeCollectorImpl;
  let blackListProxy, PredicateManager, predicateManager, FeeCollector;
  let erc20VaultServiceProxy;
  let EthVaultServiceImpl, ethVaultServiceInstance, EthVaultServiceProxy;
  let ERC20TokenServiceImpl;

  beforeEach(async () => {
    [owner, signer, bridge, other, attestor, attestor1, deployer] =
      await ethers.getSigners();

    console.log(
      "kekeccak256 value for SERVICE_ROLE = ",
      ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SERVICE_ROLE"))
    );

    // Deploy libraries
    lib = await ethers.getContractFactory("PacketLibrary", {
      from: owner.address,
    });
    const libInstance = await lib.deploy();
    await libInstance.deployed();

    aleolib = await ethers.getContractFactory("AleoAddressLibrary", {
      from: owner.address,
    });
    const aleoLibInstance = await aleolib.deploy();
    await aleoLibInstance.deployed();

    //! Making change

    // ========================================
    // Deploy BridgeV2 with libraries
    // ========================================
    ERC20TokenBridge = await ethers.getContractFactory("BridgeV2", {
      libraries: {
        PacketLibrary: libInstance.address,
        AleoAddressLibrary: aleoLibInstance.address,
      },
    });

    erc20TokenBridge = await ERC20TokenBridge.deploy();
    await erc20TokenBridge.deployed();

    initializeData = new ethers.utils.Interface(
      ERC20TokenBridge.interface.format()
    ).encodeFunctionData("Bridge_init(uint256,address)", [
      ALEO_CHAINID,
      owner.address,
    ]);

    Proxied = await ethers.getContractFactory("ProxyContract");
    proxy = await Proxied.deploy(erc20TokenBridge.address, initializeData);
    await proxy.deployed();
    proxiedBridge = ERC20TokenBridge.attach(proxy.address);

    // proxiedBridge = await ethers.getContractAt("ProxyContract", BRIDGE_PROXY);

    // ========================================
    // USE REAL USDC AND USDT FROM MAINNET FORK
    // ========================================
    // Get real token contracts (they're already deployed on mainnet)
    usdcContract = await ethers.getContractAt("IERC20", USDC);
    usdtContract = await ethers.getContractAt("IERC20", USDT);

    console.log("✅ Connected to real USDC:", USDC);
    console.log("✅ Connected to real USDT:", USDT);

    // ========================================
    // Deploy BlackListService with REAL tokens
    // ========================================
    {
      const BlackListService = await ethers.getContractFactory(
        "BlackListService"
      );
      const blackListServiceImpl = await BlackListService.deploy();
      await blackListServiceImpl.deployed();
      const BlackListServiceProxy = await ethers.getContractFactory(
        "ProxyContract"
      );

      initializeData = new ethers.utils.Interface(
        BlackListService.interface.format()
      ).encodeFunctionData("BlackList_init", [
        USDC, // ← Use real USDC address
        USDT, // ← Use real USDT address
        owner.address,
      ]);
      blackListProxy = await BlackListServiceProxy.deploy(
        blackListServiceImpl.address,
        initializeData
      );
      await blackListProxy.deployed();
      blackListProxy = BlackListService.attach(blackListProxy.address);
    }

    // ========================================
    // Deploy Erc20VaultService with REAL USDC
    // ========================================
    {
      const Erc20VaultService = await ethers.getContractFactory(
        "Erc20VaultService"
      );
      const erc20VaultServiceImpl = await Erc20VaultService.deploy();
      await erc20VaultServiceImpl.deployed();
      const Erc20VaultServiceProxy = await ethers.getContractFactory(
        "ProxyContract"
      );
      initializeData = new ethers.utils.Interface(
        Erc20VaultService.interface.format()
      ).encodeFunctionData("Erc20VaultService_init", [
        USDC, // ← Use real USDC address
        "USDC Vault",
        owner.address,
      ]);
      erc20VaultServiceProxy = await Erc20VaultServiceProxy.deploy(
        erc20VaultServiceImpl.address,
        initializeData
      );
      await erc20VaultServiceProxy.deployed();
      erc20VaultServiceProxy = Erc20VaultService.attach(
        erc20VaultServiceProxy.address
      );
    }

    // ========================================
    // Deploy EthVaultService
    // ========================================
    {
      EthVaultServiceImpl = await ethers.getContractFactory("EthVaultService");
      ethVaultServiceInstance = await EthVaultServiceImpl.deploy();
      await ethVaultServiceInstance.deployed();
      EthVaultServiceProxy = await ethers.getContractFactory("ProxyContract");

      initializeData = new ethers.utils.Interface(
        EthVaultServiceImpl.interface.format()
      ).encodeFunctionData("EthVaultService_init", [
        "ETH Vault",
        owner.address,
      ]);
      const ethVaultServiceProxy = await EthVaultServiceProxy.deploy(
        ethVaultServiceInstance.address,
        initializeData
      );
      await ethVaultServiceProxy.deployed();
      proxiedEthVaultService = EthVaultServiceImpl.attach(
        ethVaultServiceProxy.address
      );
    }

    UnSupportedToken = await ethers.getContractFactory("USDCMock");
    unsupportedToken = await UnSupportedToken.deploy();
    await unsupportedToken.deployed();

    // ========================================
    // Deploy TokenServicePaxos
    // ========================================
    console.log("Deploying TokenServicePaxos...");
    TokenService = await ethers.getContractFactory("TokenServicePaxos");
    ERC20TokenServiceImpl = await TokenService.deploy();
    await ERC20TokenServiceImpl.deployed();
    initializeData = new ethers.utils.Interface(
      ERC20TokenServiceImpl.interface.format()
    ).encodeFunctionData("TokenService_init", [
      proxiedBridge.address,
      owner.address,
      ETH_CHAINID,
      ALEO_CHAINID,
      blackListProxy.address,
    ]);
    console.log(
      "ERC20TokenServiceImpl.address: ",
      ERC20TokenServiceImpl.address
    );
    console.log("intializeData: ", initializeData);
    proxy = await Proxied.deploy(ERC20TokenServiceImpl.address, initializeData);
    console.log("Initializing Data 🎇🎇🎇");
    await proxy.deployed();
    proxiedV1 = TokenService.attach(proxy.address);

    // ========================================
    // Add REAL tokens to TokenService
    // ========================================
    console.log("Adding Real Tokens to TokenService");
    await proxiedV1
      .connect(owner)
      .addToken(
        USDC,
        ALEO_CHAINID,
        erc20VaultServiceProxy.address,
        "aleo.TokenAddress",
        "aleo.TokenService",
        1,
        100000000000
      );
    await proxiedV1
      .connect(owner)
      .addToken(
        USDT,
        ALEO_CHAINID,
        erc20VaultServiceProxy.address,
        "aleo.TokenAddress",
        "aleo.TokenService",
        1,
        100000000000
      );

    await proxiedV1
      .connect(owner)
      .addToken(
        ALEO_USD,
        ALEO_CHAINID,
        erc20VaultServiceProxy.address,
        "aleo.TokenAddress",
        "aleo.TokenService",
        1,
        100000000000
      );

    await proxiedV1
      .connect(owner)
      .addToken(
        ADDRESS_ONE,
        ALEO_CHAINID,
        ADDRESS_ZERO,
        "aleo.TokenAddress",
        "aleo.TokenService",
        ethers.utils.parseEther("0.001"),
        ethers.utils.parseEther("100000000000")
      );
    await (
      await proxiedBridge.connect(owner).addTokenService(proxiedV1.address)
    ).wait();
    await (
      await proxiedBridge.connect(owner).addAttestor(attestor.address, 1)
    ).wait();
    await (
      await proxiedBridge.connect(owner).addAttestor(attestor1.address, 2)
    ).wait();

    // ========================================
    // Deploy FeeCollector with REAL tokens
    // ========================================
    FeeCollector = await ethers.getContractFactory("FeeCollector");
    feeCollectorImpl = await FeeCollector.deploy();
    initializeData = new ethers.utils.Interface(
      FeeCollector.interface.format()
    ).encodeFunctionData("initialize", [
      proxiedV1.address,
      owner.address,
      USDC, // ← Real USDC
      USDT, // ← Real USDT
      0,
      0,
    ]);
    proxy = await Proxied.deploy(feeCollectorImpl.address, initializeData);
    await proxy.deployed();
    feeCollector = FeeCollector.attach(proxy.address);

    await proxiedV1.connect(owner).setFeeCollector(feeCollector.address);
    await proxiedV1.connect(owner).setTeller(TELLER_CONTRACT);

    console.log("✅ All contracts deployed and configured with real tokens");
  });

  // ... existing tests ...

  it.only("should transfer USDC using real Predicate API", async function () {
    this.timeout(60000);

    const transferAmount = 100 * 1e6; // 100 USDC (6 decimals)
    const aleoReceiver =
      "aleo1jga9hrn0d5umq2tsqty2tcvtjkvd8n9r0g7cj7fq5vld4y6hesgsq23n3l";

    // ========================================
    // Get real USDC from a whale account
    // ========================================
    console.log("\n💰 Getting USDC from whale account...");

    // Impersonate the whale
    let whale = await ethers.getImpersonatedSigner(USDC_WHALE);
    // await ethers.provider.send("hardhat_impersonateAccount", [USDC_WHALE]);
    // const whale = await ethers.getSigner(USDC_WHALE);

    // Transfer USDC from whale to test user
    await usdcContract
      .connect(whale)
      .transfer(other.address, transferAmount * 10);
    console.log("✅ Transferred USDC from whale to test user");
    console.log(
      "  User USDC balance:",
      (await usdcContract.balanceOf(other.address)).toString()
    );

    // Stop impersonating
    await ethers.provider.send("hardhat_stopImpersonatingAccount", [
      USDC_WHALE,
    ]);

    // ========================================
    // Approve TokenService to spend USDC
    // ========================================
    await usdcContract
      .connect(other)
      .approve(proxiedV1.address, transferAmount);
    console.log("✅ Approved TokenService to spend USDC");

    // ========================================
    // Set PredicateService
    // ========================================
    await proxiedV1.connect(owner).setPredicateService(PREDICATE_SERVICE);
    console.log("✅ PredicateService set:", PREDICATE_SERVICE);

    // ========================================
    // Get Predicate authorization
    // ========================================
    const encodedTransferData = packFunctionArgs(
      "_transfer(address,uint256,string)",
      [ALEO_USD, transferAmount, aleoReceiver]
    );

    const predicateResponse = await callPredicateApi({
      apiKey: "eggcVs2JRX4JurIWpUtK0akaygakr2Hy58AZE68n",
      walletAddress: other.address,
      deployedContract: PREDICATE_SERVICE,
      chainId: ETH_CHAINID,
      data: encodedTransferData,
      msgValue: "0",
    });

    console.log("\n✅ Predicate API Response:");
    console.log("  Compliant:", predicateResponse.is_compliant);
    console.log("  Task ID:", predicateResponse.task_id);

    expect(predicateResponse.is_compliant).to.be.true;

    //^ Granting role to paxos for handleMessage bypass.
    const SERVICE_ROLE_BYTES = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes("SERVICE_ROLE")
    );
    const predicateService = await ethers.getContractAt(
      "PredicateService",
      PREDICATE_SERVICE
    );
    const predicateOwner = await predicateService.getRoleAdmin(
      SERVICE_ROLE_BYTES
    );
    console.log("Predicate service owner: ", predicateOwner);
    const DEFAULT_ADMIN_ROLE = await predicateService.DEFAULT_ADMIN_ROLE();
    console.log("  DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);

    const admin = "0x2f1672c81183CDE242ce49323402f004b5F82E6b";
    const adminSigner = await ethers.getImpersonatedSigner(admin);
    await owner.sendTransaction({
      to: admin,
      value: ethers.utils.parseEther("1.0"),
    });

    await predicateService
      .connect(adminSigner)
      .grantRole(SERVICE_ROLE_BYTES, proxiedV1.address);
    // predicateService.grantRole(0xd8a7a79547af723ee3e12b59a480111268d8969c634e1a34a144d2c8b91d635b,proxiedV1.address);

    const predicateMessage = {
      taskId: predicateResponse.task_id,
      expireByBlockNumber: predicateResponse.expiry_block,
      signerAddresses: predicateResponse.signers,
      signatures: predicateResponse.signature,
    };
    console.log(predicateMessage);

    // ========================================
    // Execute the transfer
    // ========================================
    const depositAsset = USDC;
    const minimumShares = 0;
    const additionalData =
      "0x04010b65e222bc6ccb31cef42a8acef4bd9aac060a00112460f03d5701876ab53ca74316808776b70d44badb0abc27aae0bd402f9f8e84fc5c8ca43d36176bbd73b8d880f38990f15ebfab23c5959dea6db4df284db08f726797175474096228d821b988ffa925c8c281beb7f438d5688ab9577a711565f57e9b4e56936654cd3907e1514e227340efc83e304ff7770f8cfc5436db4ee36bbdb0d983f90385ef3916efc2adb8052fbb1df02fa8b85a70d1ccb8d4b20f278fb1ac69d6a9bd5fa4b8108c";

    console.log("\n🚀 Executing transfer with real USDC...");

    const tx = await proxiedV1
      .connect(other)
      [
        "transfer(address,uint256,string,(string,uint256,address[],bytes[]),bool,bytes,address,uint256)"
      ](
        ALEO_USD,
        transferAmount,
        aleoReceiver,
        [
          predicateMessage.taskId,
          predicateMessage.expireByBlockNumber,
          predicateMessage.signerAddresses,
          predicateMessage.signatures,
        ],
        true,
        additionalData,
        USDC,
        minimumShares,
        { gasLimit: 1000000 }
      );

    const receipt = await tx.wait();
    console.log("✅ Transfer successful!");
    console.log("  Gas used:", receipt.gasUsed.toString());
    console.log("  Tx hash:", receipt.transactionHash);

    // ========================================
    // Verify bridge event
    // ========================================
    const bridgeEvents = receipt.logs.filter((log) => {
      try {
        const parsed = proxiedBridge.interface.parseLog(log);
        return parsed.name === "PacketDispatched";
      } catch {
        return false;
      }
    });

    expect(bridgeEvents.length).to.be.greaterThan(
      0,
      "No PacketDispatched event found"
    );

    const event = proxiedBridge.interface.parseLog(bridgeEvents[0]);
    const packet = event.args.packet;

    console.log("\n📦 Bridge Event Emitted:");
    console.log("  Token:", packet[4][1]);
    console.log("  Amount:", packet[4][2].toString());
    console.log("  Receiver:", packet[4][3]);



    console.log("\n🎉 Full integration test with real USDC passed!");
  });
});
