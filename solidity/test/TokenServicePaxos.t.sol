// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Test, console, Vm} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ProxyContract} from "../contracts/proxies/Proxy.sol";
import {TokenServicePaxos} from "../contracts/main/paxosproxy/TokenServicePaxos.sol";
import {BridgeV2} from "../contracts/main/BridgeV2.sol";
import {BlackListService} from "../contracts/main/tokenservice/BlackListService.sol";
import {Erc20VaultService} from "../contracts/main/tokenservice/vault/Erc20VaultService.sol";
import {EthVaultService} from "../contracts/main/tokenservice/vault/EthVaultService.sol";
import {FeeCollector} from "../contracts/main/tokenservice/FeeCollector.sol";
import {PacketLibrary} from "../contracts/common/libraries/PacketLibrary.sol";
import {PredicateMessage} from "@predicate/contracts/src/interfaces/IPredicateClient.sol";
import {PredicateService} from "../contracts/main/tokenservice/predicate/PredicateService.sol";

/// @title TokenServicePaxos Fork Test
/// @notice Comprehensive fork test for TokenServicePaxos with real mainnet tokens and Predicate integration
contract TokenServicePaxosForkTest is Test {
    /*//////////////////////////////////////////////////////////////
                               CONSTANTS
    //////////////////////////////////////////////////////////////*/
    uint256 constant ETH_CHAINID = 1;
    uint256 constant ALEO_CHAINID = 6694886634401;
    address constant ADDRESS_ZERO = address(0);
    address constant ADDRESS_ONE = address(1);

    // Real mainnet contracts
    address constant TELLER_CONTRACT = 0xedE35eA2dc28444b52b6B5d47009926910783d7b;
    address constant PREDICATE_SERVICE = 0x053f202A596450908CDcf99F8e24B424EEBbaeE4;
    address constant BRIDGE_PROXY = 0x7440176A6F367D3Fad1754519bD8033EAF173133;
    address constant BRIDGE_V2 = 0x57CD053A5056a9B9104e3D1981F487c192BEdEa6;
    address constant PACKET_LIBRARY = 0xe0c41fDFe2f183B7f705507532Ad395425eedC6F;
    address constant ALEO_LIBRARY = 0xF692e3f5eC1e71415447D0eA2dEE0a370D531063;

    // Real token addresses
    address constant USDC = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address constant USDT = 0xdAC17F958D2ee523a2206206994597C13D831ec7;
    address constant ALEO_USD = 0xC60a7e21A6753ED4305C93034607009fAeC2A5F3;

    // Whale addresses with lots of tokens
    address constant USDC_WHALE = 0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341;
    address constant USDT_WHALE = 0xF977814e90dA44bFA03b6295A0616a897441aceC;

    // Predicate API Key (from test)
    string constant PREDICATE_API_KEY = "eggcVs2JRX4JurIWpUtK0akaygakr2Hy58AZE68n";

    /*//////////////////////////////////////////////////////////////
                            STATE VARIABLES
    //////////////////////////////////////////////////////////////*/
    address owner;
    address signer;
    address bridge;
    address other;
    address attestor1;
    address attestor2;
    address deployer;

    // Contracts
    TokenServicePaxos public tokenService;
    BridgeV2 public proxiedBridge;
    BlackListService public blackListService;
    Erc20VaultService public erc20VaultService;
    EthVaultService public ethVaultService;
    FeeCollector public feeCollector;

    // Proxy contracts
    ProxyContract public tokenServiceProxy;
    ProxyContract public blackListProxy;
    ProxyContract public erc20VaultServiceProxy;
    ProxyContract public ethVaultServiceProxy;
    ProxyContract public feeCollectorProxy;

    // Token contracts
    IERC20 public usdcContract;
    IERC20 public usdtContract;
    IERC20 public aleoUsdContract;

    // Bridge owner (will be impersonated)
    address public proxyBridgeOwner;

    // ========================================
    // SETUP
    // ========================================
    function setUp() public {
        // Setup test accounts
        owner = makeAddr("OWNER");
        signer = makeAddr("SIGNER");
        bridge = makeAddr("BRIDGE");
        other = makeAddr("OTHER");
        attestor1 = makeAddr("ATTESTOR_1");
        attestor2 = makeAddr("ATTESTOR_2");
        deployer = makeAddr("DEPLOYER");

        // Fund accounts
        vm.deal(owner, 100 ether);
        vm.deal(other, 100 ether);
        vm.deal(attestor2, 10 ether);
        vm.deal(attestor1, 10 ether);

        console.log("SERVICE_ROLE keccak256:", vm.toString(keccak256("SERVICE_ROLE")));

        /*//////////////////////////////////////////////////////////////
                    CONNECTING EXISTING BRIDGE PROXY
        //////////////////////////////////////////////////////////////*/
        {
            console.log("deploying the BridgeV2 implementation");
            vm.startPrank(owner);
            BridgeV2 bridgeV2Impl = new BridgeV2();
            bytes memory initData = abi.encodeWithSignature("Bridge_init(uint256,address)", ALEO_CHAINID, owner);
            vm.stopPrank();
            ProxyContract bridgeProxy = new ProxyContract(address(bridgeV2Impl), initData);
            proxiedBridge = BridgeV2(address(bridgeProxy));
        }
        /*//////////////////////////////////////////////////////////////
                    Getting Real USDC, USDT and ALEO_USD
        //////////////////////////////////////////////////////////////*/

        usdcContract = IERC20(USDC);
        usdtContract = IERC20(USDT);
        aleoUsdContract = IERC20(ALEO_USD);

        console.log("Connected to real USDC:", USDC);
        console.log("Connected to real USDT:", USDT);
        console.log("Connected to real AleoUSD:", ALEO_USD);
        /*//////////////////////////////////////////////////////////////
                    Deploy BlackListService with Real token
        //////////////////////////////////////////////////////////////*/

        vm.startPrank(owner);
        {
            BlackListService blackListImpl = new BlackListService();
            bytes memory initData =
                abi.encodeWithSignature("BlackList_init(address,address,address)", USDC, USDT, owner);
            blackListProxy = new ProxyContract(address(blackListImpl), initData);
            blackListService = BlackListService(address(blackListProxy));
        }

        /*//////////////////////////////////////////////////////////////
                           USDC VAULT SUPPORT
        //////////////////////////////////////////////////////////////*/
        {
            Erc20VaultService erc20VaultImpl = new Erc20VaultService();
            bytes memory initData =
                abi.encodeWithSignature("Erc20VaultService_init(address,string,address)", USDC, "USDC Vault", owner);
            erc20VaultServiceProxy = new ProxyContract(address(erc20VaultImpl), initData);
            erc20VaultService = Erc20VaultService(address(erc20VaultServiceProxy));
        }

        /*//////////////////////////////////////////////////////////////
                           ETH VAULT SUPPORT
        //////////////////////////////////////////////////////////////*/
        {
            EthVaultService ethVaultImpl = new EthVaultService();
            bytes memory initData = abi.encodeWithSignature("EthVaultService_init(string,address)", "ETH Vault", owner);
            ethVaultServiceProxy = new ProxyContract(address(ethVaultImpl), initData);
            ethVaultService = EthVaultService(payable(address(ethVaultServiceProxy)));
        }

        /*//////////////////////////////////////////////////////////////
                          TOKEN SERVICE PAXOS DEPLOY
        //////////////////////////////////////////////////////////////*/
        {
            console.log("Deploying TokenServicePaxos...");
            TokenServicePaxos tokenServiceImpl = new TokenServicePaxos();
            bytes memory initData = abi.encodeWithSignature(
                "TokenService_init(address,address,uint256,uint256,address)",
                address(proxiedBridge),
                owner,
                ETH_CHAINID,
                ALEO_CHAINID,
                address(blackListService)
            );
            tokenServiceProxy = new ProxyContract(address(tokenServiceImpl), initData);
            tokenService = TokenServicePaxos(payable(address(tokenServiceProxy)));

            console.log("TokenServicePaxos deployed at:", address(tokenService));
        }

        /*//////////////////////////////////////////////////////////////
                             TOKEN SERVICE ADD TOKEN
        //////////////////////////////////////////////////////////////*/
        console.log("Adding tokens to TokenService");
        tokenService.addToken(
            USDC, ALEO_CHAINID, address(erc20VaultService), "aleo.TokenAddress", "aleo.TokenService", 1, 100000000000
        );

        tokenService.addToken(
            USDT, ALEO_CHAINID, address(erc20VaultService), "aleo.TokenAddress", "aleo.TokenService", 1, 100000000000
        );

        tokenService.addToken(
            ALEO_USD,
            ALEO_CHAINID,
            address(erc20VaultService),
            "aleo.TokenAddress",
            "aleo.TokenService",
            1,
            100000000000
        );

        tokenService.addToken(
            ADDRESS_ONE,
            ALEO_CHAINID,
            ADDRESS_ZERO,
            "aleo.TokenAddress",
            "aleo.TokenService",
            0.001 ether,
            100000000000 ether
        );
        vm.stopPrank();
        /*//////////////////////////////////////////////////////////////
                       CONNECT WITH TOKENSERVICE
        //////////////////////////////////////////////////////////////*/
        proxyBridgeOwner = proxiedBridge.owner();
        console.log("Bridge owner:", proxyBridgeOwner);
        vm.deal(proxyBridgeOwner, 10 ether);
        console.log("Are we here");

        vm.startPrank(proxyBridgeOwner);
        proxiedBridge.addTokenService(address(tokenService));
        proxiedBridge.addAttestor(attestor1, 1);
        proxiedBridge.addAttestor(attestor2, 2);
        vm.stopPrank();
        console.log("We're rooting for this");
        /*//////////////////////////////////////////////////////////////
                          DEPLOY FEE COLLECTOR
        //////////////////////////////////////////////////////////////*/
        vm.startPrank(owner);
        {
            console.log("Deploying FeeCollector");
            FeeCollector feeCollectorImpl = new FeeCollector();
            bytes memory initData = abi.encodeWithSignature(
                "initialize(address,address,address,address,uint256,uint256)",
                address(tokenService),
                owner,
                USDC,
                USDT,
                0,
                0
            );
            feeCollectorProxy = new ProxyContract(address(feeCollectorImpl), initData);
            feeCollector = FeeCollector(payable(address(feeCollectorProxy)));
        }

        tokenService.setFeeCollector(feeCollector);
        tokenService.setTeller(TELLER_CONTRACT);
        tokenService.setBridgeToken(ALEO_USD);
        tokenService.setPredicateService(PredicateService(PREDICATE_SERVICE));
        _grantServiceRole(address(tokenService));
        vm.stopPrank();

        console.log("All contracts deployed and configured");
    }

    // ========================================
    // HELPER FUNCTIONS
    // ========================================

    /// @notice Get USDC tokens from whale address
    /// @param recipient Address to receive the USDC
    /// @param amount Amount of USDC to transfer (in USDC units, 6 decimals)
    function _getUSDCFromWhale(address recipient, uint256 amount) internal {
        vm.startPrank(USDC_WHALE);
        usdcContract.transfer(recipient, amount);
        vm.stopPrank();

        console.log("Transferred", amount, "USDC from whale to", recipient);
        console.log("Recipient USDC balance:", usdcContract.balanceOf(recipient));
    }

    /// @notice Get USDT tokens from whale address
    /// @param recipient Address to receive the USDT
    /// @param amount Amount of USDT to transfer (in USDT units, 6 decimals)
    function _getUSDTFromWhale(address recipient, uint256 amount) internal {
        vm.startPrank(USDT_WHALE);
        usdtContract.transfer(recipient, amount);
        vm.stopPrank();

        console.log("Transferred", amount, "USDT from whale to", recipient);
        console.log("Recipient USDT balance:", usdtContract.balanceOf(recipient));
    }

    function _callPredicateApi(address walletAddress, address deployedContract, bytes memory encodedTransferData)
        internal
        returns (
            bool isCompliant,
            string memory taskId,
            uint256 expiryBlock,
            address[] memory signers,
            bytes[] memory signatures
        )
    {
        string[] memory cmd = new string[](3 + 3);
        cmd[0] = "bun";
        cmd[1] = "run";
        cmd[2] = "./external-scripts/getPredicateMessage.ts";
        cmd[3] = vm.toString(walletAddress);
        cmd[4] = vm.toString(deployedContract);
        cmd[5] = vm.toString(encodedTransferData);
        bytes memory result = vm.ffi(cmd);
        (isCompliant, taskId, expiryBlock, signers, signatures) =
            abi.decode(result, (bool, string, uint256, address[], bytes[]));

        return (isCompliant, taskId, expiryBlock, signers, signatures);
    }

    /// @notice Grant SERVICE_ROLE to an address in PredicateService
    /// @param account Address to grant the role to
    function _grantServiceRole(address account) internal {
        bytes32 SERVICE_ROLE = keccak256("SERVICE_ROLE");

        // The Predicate service admin address (from mainnet)
        address predicateAdmin = 0x2f1672c81183CDE242ce49323402f004b5F82E6b;

        // Impersonate the admin and grant role
        vm.deal(predicateAdmin, 10 ether);
        vm.startPrank(predicateAdmin);
        IPredicateServiceAdmin(PREDICATE_SERVICE).grantRole(SERVICE_ROLE, account);
        vm.stopPrank();

        console.log("Granted SERVICE_ROLE to:", account);
    }

    // ========================================
    // TESTS
    // ========================================

    /// @notice Test basic setup and configuration
    function test_Setup() public view {
        assertEq(address(tokenService.feeCollector()), address(feeCollector), "FeeCollector not set");
        assertEq(address(tokenService.teller()), TELLER_CONTRACT, "Teller not set");

        assertTrue(proxiedBridge.isRegisteredTokenService(address(tokenService)), "TokenService not registered");
        assertTrue(proxiedBridge.isSupportedChain(ALEO_CHAINID), "Aleo chain not supported");

        console.log("All setup assertions passed");
    }

    function test_Predicate_API() public {
        address walletAddress = other;
        address deployedContract = PREDICATE_SERVICE;
        uint256 transferAmount = 100 * 1e6; // 100 USDC (6 decimals)
        string memory aleoReceiver = "aleo1jga9hrn0d5umq2tsqty2tcvtjkvd8n9r0g7cj7fq5vld4y6hesgsq23n3l";
        bytes memory encodedTransferData =
            abi.encodeWithSignature("_transfer(address,uint256,string)", ALEO_USD, transferAmount, aleoReceiver);
        (
            bool isCompliant,
            string memory taskId,
            uint256 expiryBlock,
            address[] memory signers,
            bytes[] memory signatures
        ) = _callPredicateApi(walletAddress, deployedContract, encodedTransferData);
        assertTrue(isCompliant);
        (taskId, expiryBlock, signers, signatures);
    }

    function _depositUSDCForAleoUSD(uint256 transferAmount) internal {
        string memory aleoReceiver = "aleo1jga9hrn0d5umq2tsqty2tcvtjkvd8n9r0g7cj7fq5vld4y6hesgsq23n3l";
        _getUSDCFromWhale(other, transferAmount * 10);
        console.log("Approving the tokenService for the transfer to Boring Vault");
        vm.prank(other);
        usdcContract.approve(address(tokenService), transferAmount);
        address walletAddress = other;
        address deployedContract = PREDICATE_SERVICE;
        bytes memory encodedTransferData =
            abi.encodeWithSignature("_transfer(address,uint256,string)", ALEO_USD, transferAmount, aleoReceiver);
        (
            bool isCompliant,
            string memory taskId,
            uint256 expiryBlock,
            address[] memory signers,
            bytes[] memory signatures
        ) = _callPredicateApi(walletAddress, deployedContract, encodedTransferData);

        PredicateMessage memory predicateMessage = PredicateMessage({
            taskId: taskId, expireByBlockNumber: expiryBlock, signerAddresses: signers, signatures: signatures
        });
        assertTrue(isCompliant, "isCompliant Recieved False");
        address depositAsset = USDC;
        uint256 minimumShares = 0;
        bytes memory additionalData =
            hex"04010b65e222bc6ccb31cef42a8acef4bd9aac060a00112460f03d5701876ab53ca74316808776b70d44badb0abc27aae0bd402f9f8e84fc5c8ca43d36176bbd73b8d880f38990f15ebfab23c5959dea6db4df284db08f726797175474096228d821b988ffa925c8c281beb7f438d5688ab9577a711565f57e9b4e56936654cd3907e1514e227340efc83e304ff7770f8cfc5436db4ee36bbdb0d983f90385ef3916efc2adb8052fbb1df02fa8b85a70d1ccb8d4b20f278fb1ac69d6a9bd5fa4b8108c";

        vm.prank(other);
        tokenService.transfer(
            ALEO_USD,
            transferAmount,
            aleoReceiver,
            predicateMessage,
            true, // isRelayerOn
            depositAsset,
            minimumShares
        );
    }

    /// @notice Test USDC transfer with real Predicate API integration
    function test__TransferUSDCWithPredicate() public {
        uint256 transferAmount = 100 * 1e6; // 100 USDC (6 decimals)
        string memory aleoReceiver = "aleo1jga9hrn0d5umq2tsqty2tcvtjkvd8n9r0g7cj7fq5vld4y6hesgsq23n3l";

        // ========================================
        // Get USDC from whale
        // ========================================
        console.log("\n--- Getting USDC from whale ---");
        _getUSDCFromWhale(other, transferAmount * 10);

        uint256 userBalanceBefore = usdcContract.balanceOf(other);
        assertGe(userBalanceBefore, transferAmount, "Insufficient USDC balance");

        // ========================================
        // Approve TokenService
        // ========================================
        vm.startPrank(other);
        usdcContract.approve(address(tokenService), transferAmount);
        console.log("Approved TokenService to spend USDC");
        vm.stopPrank();

        // ========================================
        // Get Predicate authorization
        // ========================================
        console.log("\n--- Getting Predicate authorization ---");
        // (string memory taskId, uint256 expireByBlockNumber, address[] memory signerAddresses, bytes[] memory signatures)
        // = _callPredicateApi(other, ALEO_USD, transferAmount, aleoReceiver);

        address walletAddress = other;
        address deployedContract = PREDICATE_SERVICE;
        bytes memory encodedTransferData =
            abi.encodeWithSignature("_transfer(address,uint256,string)", ALEO_USD, transferAmount, aleoReceiver);
        (
            bool isCompliant,
            string memory taskId,
            uint256 expiryBlock,
            address[] memory signers,
            bytes[] memory signatures
        ) = _callPredicateApi(walletAddress, deployedContract, encodedTransferData);

        PredicateMessage memory predicateMessage = PredicateMessage({
            taskId: taskId, expireByBlockNumber: expiryBlock, signerAddresses: signers, signatures: signatures
        });
        assertTrue(isCompliant, "isCompliant Recieved False");
        // ========================================
        // Execute transfer
        // ========================================
        console.log("\n--- Executing transfer ---");

        address depositAsset = USDC;
        uint256 minimumShares = 0;
        bytes memory additionalData = hex"";
        assertTrue(proxiedBridge.isRegisteredTokenService(address(tokenService)));
        assertTrue(proxiedBridge.isSupportedChain(ALEO_CHAINID));

        // Recording Logs
        vm.recordLogs();

        vm.prank(other);
        tokenService.transfer(
            ALEO_USD,
            transferAmount,
            aleoReceiver,
            predicateMessage,
            true, // isRelayerOn
            depositAsset,
            minimumShares
        );

        console.log("Transfer executed successfully!");

        Vm.Log[] memory logs = vm.getRecordedLogs();

        /*//////////////////////////////////////////////////////////////
                           FINDING THE EVENT
        //////////////////////////////////////////////////////////////*/

        bytes32 packetDispatchedSig = keccak256(
            "PacketDispatched((uint256,uint256,(uint256,address),(uint256,string),(address,string,uint256,string),uint256),bytes)"
        );

        bool found = false;
        for (uint256 i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == packetDispatchedSig && logs[i].emitter == address(proxiedBridge)) {
                found = true;
                console.log("PacketDispatched event emitted at index", i);

                // Quick decode to show packet
                (PacketLibrary.OutPacket memory packet,) = abi.decode(logs[i].data, (PacketLibrary.OutPacket, bytes));
                console.log("   Sequence:", packet.sequence);
                console.log("   Amount:", packet.message.amount);
                console.log("   Receiver:", packet.message.receiverAddress);
                break;
            }
        }

        assertTrue(found, "PacketDispatched event not emitted");

        // ========================================
        // Verify results
        // ========================================
        uint256 userBalanceAfter = usdcContract.balanceOf(other);
        assertEq(userBalanceAfter, userBalanceBefore - transferAmount, "USDC not deducted from user");

        console.log("\nFull integration test with real USDC passed!");
    }

    function test__depositWorks() public {
        uint256 transferAmount = 1000e6;
        _depositUSDCForAleoUSD(transferAmount);
        uint256 aleoUSDCBalance = aleoUsdContract.balanceOf(address(tokenService));
        // console.log("tellerContractBalance: ",)
        console.log("aleoUsdcBalance: ", aleoUSDCBalance);
    }
}

// ========================================
// INTERFACES
// ========================================

/// @notice Interface for PredicateService admin functions
interface IPredicateServiceAdmin {
    function grantRole(bytes32 role, address account) external;
    function getRoleAdmin(bytes32 role) external view returns (bytes32);
    function DEFAULT_ADMIN_ROLE() external view returns (bytes32);
}
