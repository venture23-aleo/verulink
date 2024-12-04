import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;
import {signaturesToBytes, packFunctionArgs, PredicateResponse} from 'predicate-sdk'

const ADDRESS_ONE = "0x0000000000000000000000000000000000000001";

function inPacketHash(inPacket) {
    let packetHash = ethers.utils.solidityKeccak256([
        "uint256",
        "uint256",
        "uint256", "string",
        "uint256", "address",
        "string", "address", "uint256", "address",
        "uint256"
    ], [
        inPacket[0],
        inPacket[1],
        inPacket[2][0], inPacket[2][1],
        inPacket[3][0], inPacket[3][1],
        inPacket[4][0], inPacket[4][1], inPacket[4][2], inPacket[4][3],
        inPacket[5]
    ]);
    return packetHash;
}

const ETH_CHAINID = 1;
const ALEO_CHAINID = 2;

// Define the test suite
describe('TokenService', () => {
    let deployer, proxiedHolding, wrongPacket, attestor, attestor1, inPacket, Proxied, lib, aleolib, proxy, bridge, proxiedBridge, initializeData, ERC20TokenBridge, erc20TokenBridge, owner, proxiedV1, TokenService, TokenServiceImpl, TokenServiceImplAddr, signer, USDCMock, usdcMock, USDTMock, usdTMock, chainId, other, UnSupportedToken, unsupportedToken;
    let blackListProxy, PredicateManager, predicateManager;
    let erc20VaultServiceProxy;
    let EthVaultServiceImpl, ethVaultServiceInstance, EthVaultServiceProxy, proxiedEthVaultService;
    let destchainID = 2;
    let ERC20TokenServiceImpl;

    beforeEach(async () => {
        [owner, signer, bridge, other, attestor, attestor1, deployer] = await ethers.getSigners();

        // Deploy ERC20TokenBridge
        lib = await ethers.getContractFactory("PacketLibrary", { from: owner.address });
        const libInstance = await lib.deploy();
        await libInstance.deployed();
        aleolib = await ethers.getContractFactory("AleoAddressLibrary", { from: owner.address });
        const aleoLibInstance = await aleolib.deploy();
        await aleoLibInstance.deployed();
        ERC20TokenBridge = await ethers.getContractFactory("Bridge", {
            libraries: {
                PacketLibrary: libInstance.address,
                AleoAddressLibrary: aleoLibInstance.address,
            }
        });
        erc20TokenBridge = await ERC20TokenBridge.deploy();
        await erc20TokenBridge.deployed();
        initializeData = new ethers.utils.Interface(ERC20TokenBridge.interface.format()).encodeFunctionData("Bridge_init(uint256,address)", [ALEO_CHAINID, owner.address]);

        Proxied = await ethers.getContractFactory('ProxyContract');
        proxy = await Proxied.deploy(erc20TokenBridge.address, initializeData);
        await proxy.deployed();
        proxiedBridge = ERC20TokenBridge.attach(proxy.address);

        USDCMock = await ethers.getContractFactory("USDCMock");
        usdcMock = await USDCMock.deploy();
        await usdcMock.deployed();

        USDTMock = await ethers.getContractFactory("USDTMock");
        usdTMock = await USDTMock.deploy();
        await usdTMock.deployed();

        {
            const BlackListService = await ethers.getContractFactory("BlackListService");
            const blackListServiceImpl = await BlackListService.deploy();
            await blackListServiceImpl.deployed();
            const BlackListServiceProxy = await ethers.getContractFactory('ProxyContract');

            initializeData = new ethers.utils.Interface(BlackListService.interface.format()).encodeFunctionData("BlackList_init", [usdcMock.address, usdTMock.address, owner.address]);
            blackListProxy = await BlackListServiceProxy.deploy(blackListServiceImpl.address, initializeData);
            await blackListProxy.deployed();
            blackListProxy = BlackListService.attach(blackListProxy.address);
        }

        {
            const Erc20VaultService = await ethers.getContractFactory("Erc20VaultService");
            const erc20VaultServiceImpl = await Erc20VaultService.deploy();
            await erc20VaultServiceImpl.deployed();
            const Erc20VaultServiceProxy = await ethers.getContractFactory('ProxyContract');
            initializeData = new ethers.utils.Interface(Erc20VaultService.interface.format()).encodeFunctionData("Erc20VaultService_init", [usdcMock.address, "USDC Vault", owner.address]);
            erc20VaultServiceProxy = await Erc20VaultServiceProxy.deploy(erc20VaultServiceImpl.address, initializeData);
            await erc20VaultServiceProxy.deployed();
            erc20VaultServiceProxy = Erc20VaultService.attach(erc20VaultServiceProxy.address);
        }

        {
            EthVaultServiceImpl = await ethers.getContractFactory('EthVaultService');
            ethVaultServiceInstance = await EthVaultServiceImpl.deploy();
            await ethVaultServiceInstance.deployed();
            EthVaultServiceProxy = await ethers.getContractFactory('ProxyContract');

            initializeData = new ethers.utils.Interface(EthVaultServiceImpl.interface.format()).encodeFunctionData("EthVaultService_init", ["ETH Vault", owner.address]);
            const ethVaultServiceProxy = await EthVaultServiceProxy.deploy(ethVaultServiceInstance.address, initializeData);
            await ethVaultServiceProxy.deployed();
            proxiedEthVaultService = EthVaultServiceImpl.attach(ethVaultServiceProxy.address);
        }

        UnSupportedToken = await ethers.getContractFactory("USDCMock");
        unsupportedToken = await UnSupportedToken.deploy();
        await unsupportedToken.deployed();

        // PredicateManager = await ethers.getContractFactory("PredicateManager");
        // predicateManager = await PredicateManager.deploy();
        // await predicateManager.deployed();

        TokenService = await ethers.getContractFactory("TokenService");

        ERC20TokenServiceImpl = await TokenService.deploy();
        await ERC20TokenServiceImpl.deployed();
        initializeData = new ethers.utils.Interface(ERC20TokenServiceImpl.interface.format()).encodeFunctionData("TokenService_init", [proxiedBridge.address, owner.address, ETH_CHAINID, ALEO_CHAINID, blackListProxy.address]);
        proxy = await Proxied.deploy(ERC20TokenServiceImpl.address, initializeData);
        await proxy.deployed();
        // let ERC20TokenServiceImplAddr = ERC20TokenServiceImpl.address;
        proxiedV1 = TokenService.attach(proxy.address);
        await proxiedV1.connect(owner).addToken(usdcMock.address, ALEO_CHAINID, erc20VaultServiceProxy.address, "aleo.TokenAddress", "aleo.TokenService", 1, 100000000000);
        await proxiedV1.connect(owner).addToken(usdTMock.address, ALEO_CHAINID, erc20VaultServiceProxy.address, "aleo.TokenAddress", "aleo.TokenService", 1, 100000000000);
        await (await proxiedBridge.connect(owner).addTokenService(proxiedV1.address)).wait();
        await (await proxiedBridge.connect(owner).addAttestor(attestor.address, 1)).wait();
        await (await proxiedBridge.connect(owner).addAttestor(attestor1.address, 2)).wait();

        inPacket = [
            1,
            1,
            [ALEO_CHAINID, "aleo.TokenService"],
            [ETH_CHAINID, proxiedV1.address],
            ["aleo.SenderAddress", usdcMock.address, 100, other.address],
            100
        ];

    });

    // Test deployment and initialization
    it('should initialize with the correct owner', async () => {
        const contractOwner = await proxiedV1.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    // it('should set the correct policy by owner', async function () {
    //     await proxiedV1.connect(owner).setPredicateManager(predicateManager.address);
    //     await proxiedV1.connect(owner).setPolicy('New Policy');
    //     const currentPolicy = await proxiedV1.policyID();
    //     expect(currentPolicy).to.equal('New Policy');
    // });

    it('should not allow transfer if Token transfer failed', async () => {
        // Mock USDC and USDT contracts to simulate blacklisting
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await usdcMock.addBlackList(other.address)).wait();

        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"))
            .to.be.revertedWith("SafeERC20: ERC20 operation did not succeed");
    });

    it('reverts if the contract is already initialized', async function () {
        await expect(proxiedV1["TokenService_init(address,address,uint256,uint256,address)"](proxiedBridge.address, owner.address, ETH_CHAINID, ALEO_CHAINID, blackListProxy.address)).to.be.revertedWith('Initializable: contract is already initialized');
    });

    it('should return "ERC20" as the token type', async () => {
        const result = await proxiedV1.tokenType();
        expect(result).to.equal('ERC20');
    });

    // Test that only the owner can update the token service
    it('should allow only owner to set the holding contract', async () => {
        const newHoldingContract = ethers.Wallet.createRandom().address;

        // Update Holding contract with the owner
        await (await proxiedV1.connect(owner).setHolding(newHoldingContract)).wait();

        // Try to Holding contract with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).setHolding(newHoldingContract)
        ).to.be.reverted;
    });

    it('should not allow blackListed address msg.sender for transfer', async () => {
        // Mock USDC and USDT contracts to simulate blacklisting
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await blackListProxy.connect(owner).addToBlackList(other.address)).wait();

        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"))
            .to.be.revertedWith("TokenService: sender blacklisted");
    });

    // Test for unsupported tokens while transfer
    it('should not allow unsupported token for transfer', async () => {
        unsupportedToken = await USDCMock.deploy();
        await unsupportedToken.deployed();
        await (await unsupportedToken.mint(other.address, 150)).wait();
        await (await unsupportedToken.connect(other).approve(proxiedV1.address, 100)).wait();
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (unsupportedToken.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("TokenService: token not supported");
    });

    // // Test for transfer
    it('should transfer USDC', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);
    });

    it('should transfer ETH using transfer(receiver)', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 100 })).wait();
        expect(await ethers.provider.getBalance(proxiedV1.address)).to.be.equal(100);
    });

    it('should transfer USDT', async () => {
        await (await usdTMock.mint(other.address, 150)).wait();
        await (await usdTMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdTMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        expect(await usdTMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdTMock.balanceOf(other.address)).to.be.equal(50);
    });

    it('should transfer USDT and checking if "Sender Blacklisted" in _packetify', async () => {
        await (await usdTMock.mint(other.address, 150)).wait();
        await (await usdTMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await blackListProxy.connect(owner).addToBlackList(other.address)).wait();
        // return;
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdTMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("TokenService: sender blacklisted");
    });

    it('should transfer USDT and checking if "Token not supported" in _packetify', async () => {
        await (await usdTMock.mint(other.address, 150)).wait();
        await (await usdTMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await proxiedV1.connect(owner).disable(usdTMock.address);
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdTMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("TokenService: token not supported");
    });

    it('should transfer USDT and checking "Transfer amount not in range" in _packetify', async () => {
        const amountOutOfRange = 10000000000010;
        await (await usdTMock.mint(other.address, amountOutOfRange)).wait();
        await (await usdTMock.connect(other).approve(proxiedV1.address, amountOutOfRange)).wait();
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdTMock.address, amountOutOfRange, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("TokenService: amount out of range");
    });

    it('should transfer Only ERC20 Tokens', async () => {
        await (await usdTMock.mint(other.address, 150)).wait();
        await (await usdTMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (ADDRESS_ONE, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("TokenService: only erc20 tokens");
    });

    it("should revert if transfer amount is not in range", async () => {
        const amountOutOfRange = 1000000000001; // Assuming this amount is out of the expected range

        // Mint some USDC tokens to the owner
        await usdcMock.mint(other.address, 100000000000000);
        await usdcMock.connect(other).approve(proxiedV1.address, 1000000000001);

        // Attempt to transfer tokens with an amount out of range
        await expect(
            proxiedV1.connect(other)["transfer(address,uint256,string)"](usdcMock.address, amountOutOfRange, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")
        ).to.be.revertedWith("TokenService: amount out of range");
    });

    // Test for wrong destTokenService
    it('should not withdraw for wrong destTokenService', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"](usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();

        wrongPacket = [
            1,
            1,
            [ALEO_CHAINID, "aleo.TokenService"],
            [ETH_CHAINID, usdcMock.address],
            ["aleo.SenderAddress", usdcMock.address, 100, other.address],
            100
        ];
        const packetHash = inPacketHash(wrongPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await expect(proxiedV1.connect(other).withdraw(wrongPacket, signatures)).to.be.revertedWith('TokenService: invalid token service');
    });

    // Test for wrong destTokenAddress
    it('should not withdraw for wrong destTokenAddress', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"](usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();

        wrongPacket = [
            1,
            1,
            [ALEO_CHAINID, "aleo.TokenService"],
            [ETH_CHAINID, proxiedV1.address],
            ["aleo.SenderAddress", unsupportedToken.address, 100, other.address],
            100
        ];
        const packetHash = inPacketHash(wrongPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await expect(proxiedV1.connect(other).withdraw(wrongPacket, signatures)).to.be.revertedWith('TokenService: invalid token');
    });

    //Test for receiving funds for blackListed address
    it('should transfer to holding if receiving address is blackListed', async () => {
        //deploying Holding Contract
        const Holding = await ethers.getContractFactory("Holding");
        const holdingImpl = await Holding.deploy();
        await holdingImpl.deployed();
        const HoldingProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(holdingImpl.interface.format()).encodeFunctionData("Holding_init(address,address)", [proxiedV1.address, owner.address]);
        const proxyHolding = await HoldingProxy.deploy(holdingImpl.address, initializeData);
        await proxyHolding.deployed();
        proxiedHolding = Holding.attach(proxyHolding.address);

        //minting usdc
        await (await usdcMock.mint(other.address, 15000000000)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();

        //transferring some fund in aleo
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();

        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)

        //set Holding contract in proxiedV1 which is TokenService 
        await (await proxiedV1.connect(owner).setHolding(proxiedHolding.address)).wait();
        //add to blackList 
        await (await usdcMock.addBlackList(other.address)).wait();

        await (await proxiedV1.connect(other).withdraw(inPacket, signatures)).wait();
        expect(await usdcMock.balanceOf(proxiedHolding.address)).to.be.equal(100);
    });

    it('should not withdraw when token is not enabled', async () => {
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await proxiedV1.connect(owner).addToken(ADDRESS_ONE, destchainID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 100 })).wait();
        await proxiedV1.disable(ADDRESS_ONE);
        inPacket[4][1] = ADDRESS_ONE;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await expect(proxiedV1.withdraw(inPacket, signatures)).to.be.revertedWith("TokenService: invalid token");
    });

    it('should transfer to holding when quorum is NAY', async () => {
        const NAY = 2;
        // deploying Holding Contract
        const Holding = await ethers.getContractFactory("Holding");
        const holdingImpl = await Holding.deploy();
        await holdingImpl.deployed();
        const HoldingProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(holdingImpl.interface.format()).encodeFunctionData("Holding_init(address,address)", [proxiedV1.address, owner.address]);
        const proxyHolding = await HoldingProxy.deploy(holdingImpl.address, initializeData);
        await proxyHolding.deployed();
        proxiedHolding = Holding.attach(proxyHolding.address);
        await (await proxiedV1.setHolding(proxiedHolding.address)).wait();
        //minting usdc
        await (await usdcMock.mint(other.address, 15000000)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        inPacket[4][2] = 97;
        await (await usdcMock.mint(proxiedV1.address, 100)).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, NAY]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await proxiedV1.connect(other).withdraw(inPacket, signatures);
        expect(await usdcMock.balanceOf(proxiedHolding.address)).to.be.equal(97);
    });

    it('should lock ETH to holding when quorum is NAY ', async () => {
        const NAY = 2;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await proxiedV1.connect(owner).addToken(ADDRESS_ONE, ALEO_CHAINID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 100 })).wait();

        // deploying Holding Contract
        const Holding = await ethers.getContractFactory("Holding");
        const holdingImpl = await Holding.deploy();
        await holdingImpl.deployed();
        const HoldingProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(holdingImpl.interface.format()).encodeFunctionData("Holding_init(address,address)", [proxiedV1.address, owner.address]);
        const proxyHolding = await HoldingProxy.deploy(holdingImpl.address, initializeData);
        await proxyHolding.deployed();
        proxiedHolding = Holding.attach(proxyHolding.address);
        await (await proxiedV1.setHolding(proxiedHolding.address)).wait();
        inPacket[4][1] = ADDRESS_ONE;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, NAY]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await proxiedV1.withdraw(inPacket, signatures);
    });

    it('should transfer ETH to user when quorum is YEA ', async () => {
        const YEA = 1;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await proxiedV1.connect(owner).addToken(ADDRESS_ONE, ALEO_CHAINID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 100 })).wait();

        inPacket[4][1] = ADDRESS_ONE;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, YEA]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await proxiedV1.withdraw(inPacket, signatures);
    });

    //Test for withdraw
    it('should withdraw', async () => {
        const YEA = 1;
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, YEA]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);
        await (await proxiedV1.connect(other).withdraw(inPacket, signatures)).wait();
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(0);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(150);
    });

    it('should revert on transferring ETH to user when contract has no ETH ', async () => {
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await proxiedV1.connect(owner).addToken(ADDRESS_ONE, ALEO_CHAINID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        inPacket[4][1] = ADDRESS_ONE;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await expect(proxiedV1.withdraw(inPacket, signatures))
            .to.be.revertedWith("TokenService: eth withdraw failed");
    });

    it('should revert on transferring ERC20 if Withdraw Failed', async () => {
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        // await proxiedV1.connect(owner).addToken(ADDRESS_ONE, ALEO_CHAINID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        inPacket[4][1] = usdcMock.address;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));

        const signatures = signature1 + signature2.slice(2)
        await (await usdcMock.addBlackList(proxiedV1.address)).wait();
        await expect(proxiedV1.withdraw(inPacket, signatures))
            .to.be.revertedWith("SafeERC20: ERC20 operation did not succeed");
    });

    it('should not transfer ETH to user when quorum is Insufficient', async () => {
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await proxiedV1.connect(owner).addToken(ADDRESS_ONE, ALEO_CHAINID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 100 })).wait();

        inPacket[4][1] = ADDRESS_ONE;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 2]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1;
        await expect(proxiedV1.withdraw(inPacket, signatures)).to.be.revertedWith("ConsumedPacketManagerImpl: inadequate signatures");
    });

    it('should not withdraw for Invalid Token Service', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await expect(ERC20TokenServiceImpl.withdraw(inPacket, signatures)).to.be.revertedWith("TokenService: invalid token service");
    });

    it('should not withdraw if a token is disabled', async () => {
        inPacket = [
            1,
            1,
            [ALEO_CHAINID, "aleo.TokenService"],
            [ETH_CHAINID, proxiedV1.address],
            ["aleo.SenderAddress", usdcMock.address, 100, other.address],
            100
        ];

        await (await usdcMock.mint(other.address, 15000)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 10000)).wait();
        // await (await proxiedV1.connect(other)["transfer(address,uint256,string)"](usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        await (await proxiedV1.connect(owner).disable(usdcMock.address)).wait();
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await expect(proxiedV1.withdraw(inPacket, signatures)).to.be.revertedWith("TokenService: invalid token");
    });

    it('should not withdraw if contract is paused', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);
        await (await proxiedV1.connect(owner).pause());
        await expect(proxiedV1.connect(other).withdraw(inPacket, signatures)).to.be.revertedWith("Pausable: paused");
    });

    it('should not withdraw to holding if token transfer failed', async () => {
        let NTToken = await ethers.getContractFactory("USDCMock");
        let nTToken = await NTToken.deploy();
        await nTToken.deployed();

        const tokenAddress = nTToken.address;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 1000;

        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        inPacket[4][1] = nTToken.address;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 2]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)

        await (await proxiedV1.connect(owner).setHolding(ethers.Wallet.createRandom().address)).wait();

        // replicate transfer to load some erc20 funds in the tokenservice
        await (await nTToken.mint(proxiedV1.address, 100000000)).wait();

        await (await nTToken.addBlackList(proxiedV1.address)).wait();
        await expect(proxiedV1.connect(other).withdraw(inPacket, signatures))
            .to.be.revertedWith('SafeERC20: ERC20 operation did not succeed');
    });

    it('should not withdraw if unknown attestor for yea vote', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const randomAttestor = ethers.Wallet.createRandom();
        const signature1 = await randomAttestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);
        // await (await proxiedV1.pause());
        await expect(proxiedV1.connect(other).withdraw(inPacket, signatures)).to.be.revertedWith("ConsumedPacketManagerImpl: unknown signer");
    });

    it('should fail in double withdraw', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);

        await (await proxiedV1.connect(other).withdraw(inPacket, signatures)).wait();
        await expect(proxiedV1.connect(other).withdraw(inPacket, signatures)).to.be.revertedWith("ConsumedPacketManagerImpl: packet already consumed");
    });

    it('should convert sig v=0 to v=27', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        let newSignature1;
        const v = signature1.slice(-2);
        if (v == "1b") newSignature1 = signature1.slice(0, -2) + "00";
        if (v == "1c") newSignature1 = signature1.slice(0, -2) + "01";
        const signatures = newSignature1 + signature2.slice(2)
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);

        await expect(proxiedV1.connect(other).withdraw(inPacket, signatures))
            .to.emit(proxiedBridge, "Consumed")
            .withArgs(ALEO_CHAINID, inPacket[1], packetHash, 1);
    });

    it('should not transferToVault if token is not supported', async () => {
        const tokenAddress = ethers.constants.AddressZero;
        await expect(proxiedV1.connect(owner).transferToVault(tokenAddress, 50)).to.be.revertedWith("TokenService: token not supported");
    });

    it('should not transfer ETH from tokenservice to vault if given amount is greater than balance', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 50 })).wait();
        await expect(proxiedV1.connect(owner).transferToVault(tokenAddress, 500)).to.be.revertedWith('TokenService: eth transfer failed');
    });

    it('should not transfer to vault if vault is zero address', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, ethers.constants.AddressZero, destTokenAddress, destTokenService, min, max);
        await expect(proxiedV1.connect(owner).transferToVault(tokenAddress, 500))
            .to.be.revertedWith('TokenService: vault zero address');
    });

    it('should not transfer ETH from tokenservice to vault if contract is paused', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner).pause());
        expect(proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 50 })).to.be.reverted;
    });

    it('should not transfer ETH from tokenservice to vault by non-owner', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 50 })).wait();
        await expect(proxiedV1.connect(other).transferToVault(tokenAddress, 50)).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should transfer ETH from tokenservice to vault', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 50 })).wait();
        await (await proxiedV1.connect(owner).transferToVault(tokenAddress, 50)).wait();
        expect(await ethers.provider.getBalance(proxiedEthVaultService.address)).to.be.equal(50);
    });


    it('should transfer USDC', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        await (await proxiedV1.connect(owner).transferToVault(usdcMock.address, 50)).wait();
        expect(await usdcMock.balanceOf(erc20VaultServiceProxy.address)).to.equal(50);
    });

    it('should not transfer USDC if given amount is greater than balance', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        await expect(proxiedV1.connect(owner).transferToVault(usdcMock.address, 150)).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    it('should not transfer USDC if contract is paused', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(owner).pause());
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.reverted;
    });

    it('should validate Aleo address for "transfer(string receiver)"', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await proxiedV1.connect(owner)["transfer(string)"]("aleo1g2vt2rag4fzug6aklxxxhhraza54gw0jr9q6myjtkm3jjmdtugqq6yrng8", { value: 100 });
    });

    it('should revert if Aleo address length is not 63', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await expect(proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl2", { value: 100 })).to.be.revertedWith("Invalid Aleo address length");
    });

    it('should revert if Aleo address length is not 63 for "transfer(address,uint256,string)"', async () => {
        // Define test parameters
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const receiver = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl2";
        const value = 100;
        const min = 1;
        const max = 100;

        // Add token with necessary details
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);

        // Expect revert due to invalid Aleo address length
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, value, receiver)).to.be.revertedWith("Invalid Aleo address length");
        // await expect(proxiedV1.transfer(tokenAddress, value, receiver)).to.be.revertedWith("Invalid Aleo address length");
    });
});

// Define the test suite for ERC20TokenBridgeV2
describe('Upgradeabilty: TokenServiceV2', () => {
    let deployer, proxiedHolding, wrongPacket, attestor, attestor1, inPacket, Proxied, lib, aleolib, proxy, bridge, proxiedBridge, initializeData, ERC20TokenBridge,
        erc20TokenBridge, owner, proxied, proxiedV2, TokenServiceV1, TokenServiceImpl, TokenServiceImplAddr, signer, USDCMock, usdcMock, USDTMock, usdTMock, chainId,
        other, UnSupportedToken, unsupportedToken, upgradeData;
    let blackListProxy, PredicateManager, predicateManager;
    let erc20VaultServiceProxy;
    let EthVaultServiceImpl, ethVaultServiceInstance, EthVaultServiceProxy, proxiedEthVaultService, TokenServiceV2, TokenServiceV2Impl;
    let destchainID = 2;

    beforeEach(async () => {
        [owner, signer, bridge, other, attestor, attestor1, deployer] = await ethers.getSigners();

        // Deploy ERC20TokenBridge
        lib = await ethers.getContractFactory("PacketLibrary", { from: owner.address });
        const libInstance = await lib.deploy();
        await libInstance.deployed();
        aleolib = await ethers.getContractFactory("AleoAddressLibrary", { from: owner.address });
        const aleoLibInstance = await aleolib.deploy();
        await aleoLibInstance.deployed();
        ERC20TokenBridge = await ethers.getContractFactory("Bridge", {
            libraries: {
                PacketLibrary: libInstance.address,
                AleoAddressLibrary: aleoLibInstance.address,
            }
        });
        erc20TokenBridge = await ERC20TokenBridge.deploy();
        await erc20TokenBridge.deployed();
        initializeData = new ethers.utils.Interface(ERC20TokenBridge.interface.format()).encodeFunctionData("Bridge_init(uint256,address)", [ALEO_CHAINID, owner.address]);

        Proxied = await ethers.getContractFactory('ProxyContract');
        proxy = await Proxied.deploy(erc20TokenBridge.address, initializeData);
        await proxy.deployed();
        proxiedBridge = ERC20TokenBridge.attach(proxy.address);

        USDCMock = await ethers.getContractFactory("USDCMock");
        usdcMock = await USDCMock.deploy();
        await usdcMock.deployed();

        USDTMock = await ethers.getContractFactory("USDTMock");
        usdTMock = await USDTMock.deploy();
        await usdTMock.deployed();

        {
            const BlackListService = await ethers.getContractFactory("BlackListService");
            const blackListServiceImpl = await BlackListService.deploy();
            await blackListServiceImpl.deployed();
            const BlackListServiceProxy = await ethers.getContractFactory('ProxyContract');

            initializeData = new ethers.utils.Interface(BlackListService.interface.format()).encodeFunctionData("BlackList_init", [usdcMock.address, usdTMock.address, owner.address]);
            blackListProxy = await BlackListServiceProxy.deploy(blackListServiceImpl.address, initializeData);
            await blackListProxy.deployed();
            blackListProxy = BlackListService.attach(blackListProxy.address);
        }

        {
            const Erc20VaultService = await ethers.getContractFactory("Erc20VaultService");
            const erc20VaultServiceImpl = await Erc20VaultService.deploy();
            await erc20VaultServiceImpl.deployed();
            const Erc20VaultServiceProxy = await ethers.getContractFactory('ProxyContract');
            initializeData = new ethers.utils.Interface(Erc20VaultService.interface.format()).encodeFunctionData("Erc20VaultService_init", [usdcMock.address, "USDC Vault", owner.address]);
            erc20VaultServiceProxy = await Erc20VaultServiceProxy.deploy(erc20VaultServiceImpl.address, initializeData);
            await erc20VaultServiceProxy.deployed();
            erc20VaultServiceProxy = Erc20VaultService.attach(erc20VaultServiceProxy.address);
        }

        {
            EthVaultServiceImpl = await ethers.getContractFactory('EthVaultService');
            ethVaultServiceInstance = await EthVaultServiceImpl.deploy();
            await ethVaultServiceInstance.deployed();
            EthVaultServiceProxy = await ethers.getContractFactory('ProxyContract');

            initializeData = new ethers.utils.Interface(EthVaultServiceImpl.interface.format()).encodeFunctionData("EthVaultService_init", ["ETH Vault", owner.address]);
            const ethVaultServiceProxy = await EthVaultServiceProxy.deploy(ethVaultServiceInstance.address, initializeData);
            await ethVaultServiceProxy.deployed();
            proxiedEthVaultService = EthVaultServiceImpl.attach(ethVaultServiceProxy.address);
        }

        UnSupportedToken = await ethers.getContractFactory("USDCMock");
        unsupportedToken = await UnSupportedToken.deploy();
        await unsupportedToken.deployed();

        // PredicateManager = await ethers.getContractFactory("PredicateManager");
        // predicateManager = await PredicateManager.deploy();
        // await predicateManager.deployed();

        TokenServiceV1 = await ethers.getContractFactory("TokenService");

        TokenServiceImpl = await TokenServiceV1.deploy();
        await TokenServiceImpl.deployed();
        initializeData = new ethers.utils.Interface(TokenServiceImpl.interface.format()).encodeFunctionData("TokenService_init", [proxiedBridge.address, owner.address, ETH_CHAINID, ALEO_CHAINID, blackListProxy.address]);
        proxy = await Proxied.deploy(TokenServiceImpl.address, initializeData);
        await proxy.deployed();
        TokenServiceImplAddr = TokenServiceImpl.address;
        proxied = TokenServiceV1.attach(proxy.address);

        TokenServiceV2 = await ethers.getContractFactory("TokenServiceV2");

        TokenServiceV2Impl = await TokenServiceV2.deploy();
        await TokenServiceV2Impl.deployed();
        let TokenServiceV2ABI = TokenServiceV2.interface.format();

        // upgradeData = new ethers.utils.Interface(TokenServiceV2ABI).encodeFunctionData("initializev2", [5]);

        console.log("OLD DATA =====");

        console.log("owner = ", await proxied.owner());
        console.log("destChainId = ", await proxied.destChainId());
        console.log("self = ", await proxied.self());

        await proxied.connect(owner).upgradeTo(TokenServiceV2Impl.address);
        // await proxied.connect(owner).upgradeToAndCall(TokenServiceV2Impl.address, upgradeData);
        proxied = TokenServiceV2.attach(proxy.address);

        console.log("OLD DATA RETRIEVED FROM UPGRADED PROXY =====");
        console.log("owner = ", await proxied.owner());
        console.log("destChainId = ", await proxied.destChainId());
        console.log("self = ", await proxied.self());

        await proxied.connect(owner).addToken(usdcMock.address, ALEO_CHAINID, erc20VaultServiceProxy.address, "aleo.TokenAddress", "aleo.TokenService", 1, 100000000000);
        await proxied.connect(owner).addToken(usdTMock.address, ALEO_CHAINID, erc20VaultServiceProxy.address, "aleo.TokenAddress", "aleo.TokenService", 1, 100000000000);
        await (await proxiedBridge.connect(owner).addTokenService(proxied.address)).wait();
        await (await proxiedBridge.connect(owner).addAttestor(attestor.address, 1)).wait();
        await (await proxiedBridge.connect(owner).addAttestor(attestor1.address, 2)).wait();

        inPacket = [
            1,
            1,
            [ALEO_CHAINID, "aleo.TokenService"],
            [ETH_CHAINID, proxied.address],
            ["aleo.SenderAddress", usdcMock.address, 100, other.address],
            100
        ];

    });

    // Test deployment and initialization
    it('should initialize with the correct owner', async () => {
        const contractOwner = await proxied.owner();
        expect(contractOwner).to.equal(owner.address);
    });
    return;
    it('should set the correct policy by owner', async function () {
        await proxiedV1.connect(owner).setPredicateManager(predicateManager.address);
        await proxiedV1.connect(owner).setPolicy('New Policy');
        const currentPolicy = await proxiedV1.policyID();
        expect(currentPolicy).to.equal('New Policy');
    });

    it('should not allow transfer if Token transfer failed', async () => {
        // Mock USDC and USDT contracts to simulate blacklisting
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await usdcMock.addBlackList(other.address)).wait();

        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"))
            .to.be.revertedWith("SafeERC20: ERC20 operation did not succeed");
    });

    it('reverts if the contract is already initialized', async function () {
        await expect(proxiedV1["TokenService_init(address,address,uint256,uint256,address)"](proxiedBridge.address, owner.address, ETH_CHAINID, ALEO_CHAINID, blackListProxy.address)).to.be.revertedWith('Initializable: contract is already initialized');
    });

    it('should return "ERC20" as the token type', async () => {
        const result = await proxiedV1.tokenType();
        expect(result).to.equal('ERC20');
    });

    // Test that only the owner can update the token service
    it('should allow only owner to set the holding contract', async () => {
        const newHoldingContract = ethers.Wallet.createRandom().address;

        // Update Holding contract with the owner
        await (await proxiedV1.connect(owner).setHolding(newHoldingContract)).wait();

        // Try to Holding contract with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).setHolding(newHoldingContract)
        ).to.be.reverted;
    });

    it('should not allow blackListed address msg.sender for transfer', async () => {
        // Mock USDC and USDT contracts to simulate blacklisting
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await blackListProxy.connect(owner).addToBlackList(other.address)).wait();

        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"))
            .to.be.revertedWith("TokenService: sender blacklisted");
    });

    // Test for unsupported tokens while transfer
    it('should not allow unsupported token for transfer', async () => {
        unsupportedToken = await USDCMock.deploy();
        await unsupportedToken.deployed();
        await (await unsupportedToken.mint(other.address, 150)).wait();
        await (await unsupportedToken.connect(other).approve(proxiedV1.address, 100)).wait();
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (unsupportedToken.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("TokenService: token not supported");
    });

    // // Test for transfer
    it('should transfer USDC', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);
    });

    it('should transfer ETH using transfer(receiver)', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 100 })).wait();
        expect(await ethers.provider.getBalance(proxiedV1.address)).to.be.equal(100);
    });

    it('should transfer USDT', async () => {
        await (await usdTMock.mint(other.address, 150)).wait();
        await (await usdTMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdTMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        expect(await usdTMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdTMock.balanceOf(other.address)).to.be.equal(50);
    });

    it('should transfer USDT and checking if "Sender Blacklisted" in _packetify', async () => {
        await (await usdTMock.mint(other.address, 150)).wait();
        await (await usdTMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await blackListProxy.connect(owner).addToBlackList(other.address)).wait();
        // return;
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdTMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("TokenService: sender blacklisted");
    });

    it('should transfer USDT and checking if "Token not supported" in _packetify', async () => {
        await (await usdTMock.mint(other.address, 150)).wait();
        await (await usdTMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await proxiedV1.connect(owner).disable(usdTMock.address);
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdTMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("TokenService: token not supported");
    });

    it('should transfer USDT and checking "Transfer amount not in range" in _packetify', async () => {
        const amountOutOfRange = 10000000000010;
        await (await usdTMock.mint(other.address, amountOutOfRange)).wait();
        await (await usdTMock.connect(other).approve(proxiedV1.address, amountOutOfRange)).wait();
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdTMock.address, amountOutOfRange, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("TokenService: amount out of range");
    });

    it('should transfer Only ERC20 Tokens', async () => {
        await (await usdTMock.mint(other.address, 150)).wait();
        await (await usdTMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (ADDRESS_ONE, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("TokenService: only erc20 tokens");
    });

    it("should revert if transfer amount is not in range", async () => {
        const amountOutOfRange = 1000000000001; // Assuming this amount is out of the expected range

        // Mint some USDC tokens to the owner
        await usdcMock.mint(other.address, 100000000000000);
        await usdcMock.connect(other).approve(proxiedV1.address, 1000000000001);

        // Attempt to transfer tokens with an amount out of range
        await expect(
            proxiedV1.connect(other)["transfer(address,uint256,string)"](usdcMock.address, amountOutOfRange, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")
        ).to.be.revertedWith("TokenService: amount out of range");
    });

    // Test for wrong destTokenService
    it('should not withdraw for wrong destTokenService', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"](usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();

        wrongPacket = [
            1,
            1,
            [ALEO_CHAINID, "aleo.TokenService"],
            [ETH_CHAINID, usdcMock.address],
            ["aleo.SenderAddress", usdcMock.address, 100, other.address],
            100
        ];
        const packetHash = inPacketHash(wrongPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await expect(proxiedV1.connect(other).withdraw(wrongPacket, signatures)).to.be.revertedWith('TokenService: invalid token service');
    });

    // Test for wrong destTokenAddress
    it('should not withdraw for wrong destTokenAddress', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"](usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();

        wrongPacket = [
            1,
            1,
            [ALEO_CHAINID, "aleo.TokenService"],
            [ETH_CHAINID, proxiedV1.address],
            ["aleo.SenderAddress", unsupportedToken.address, 100, other.address],
            100
        ];
        const packetHash = inPacketHash(wrongPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await expect(proxiedV1.connect(other).withdraw(wrongPacket, signatures)).to.be.revertedWith('TokenService: invalid token');
    });

    //Test for receiving funds for blackListed address
    it('should transfer to holding if receiving address is blackListed', async () => {
        //deploying Holding Contract
        const Holding = await ethers.getContractFactory("Holding");
        const holdingImpl = await Holding.deploy();
        await holdingImpl.deployed();
        const HoldingProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(holdingImpl.interface.format()).encodeFunctionData("Holding_init(address,address)", [proxiedV1.address, owner.address]);
        const proxyHolding = await HoldingProxy.deploy(holdingImpl.address, initializeData);
        await proxyHolding.deployed();
        proxiedHolding = Holding.attach(proxyHolding.address);

        //minting usdc
        await (await usdcMock.mint(other.address, 15000000000)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();

        //transferring some fund in aleo
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();

        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)

        //set Holding contract in proxiedV1 which is TokenService 
        await (await proxiedV1.connect(owner).setHolding(proxiedHolding.address)).wait();
        //add to blackList 
        await (await usdcMock.addBlackList(other.address)).wait();

        await (await proxiedV1.connect(other).withdraw(inPacket, signatures)).wait();
        expect(await usdcMock.balanceOf(proxiedHolding.address)).to.be.equal(100);
    });

    it('should not withdraw when token is not enabled', async () => {
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await proxiedV1.connect(owner).addToken(ADDRESS_ONE, destchainID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 100 })).wait();
        await proxiedV1.disable(ADDRESS_ONE);
        inPacket[4][1] = ADDRESS_ONE;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await expect(proxiedV1.withdraw(inPacket, signatures)).to.be.revertedWith("TokenService: invalid token");
    });

    it('should transfer to holding when quorum is NAY', async () => {
        const NAY = 2;
        // deploying Holding Contract
        const Holding = await ethers.getContractFactory("Holding");
        const holdingImpl = await Holding.deploy();
        await holdingImpl.deployed();
        const HoldingProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(holdingImpl.interface.format()).encodeFunctionData("Holding_init(address,address)", [proxiedV1.address, owner.address]);
        const proxyHolding = await HoldingProxy.deploy(holdingImpl.address, initializeData);
        await proxyHolding.deployed();
        proxiedHolding = Holding.attach(proxyHolding.address);
        await (await proxiedV1.setHolding(proxiedHolding.address)).wait();
        //minting usdc
        await (await usdcMock.mint(other.address, 15000000)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        inPacket[4][2] = 97;
        await (await usdcMock.mint(proxiedV1.address, 100)).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, NAY]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await proxiedV1.connect(other).withdraw(inPacket, signatures);
        expect(await usdcMock.balanceOf(proxiedHolding.address)).to.be.equal(97);
    });

    it('should lock ETH to holding when quorum is NAY ', async () => {
        const NAY = 2;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await proxiedV1.connect(owner).addToken(ADDRESS_ONE, ALEO_CHAINID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 100 })).wait();

        // deploying Holding Contract
        const Holding = await ethers.getContractFactory("Holding");
        const holdingImpl = await Holding.deploy();
        await holdingImpl.deployed();
        const HoldingProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(holdingImpl.interface.format()).encodeFunctionData("Holding_init(address,address)", [proxiedV1.address, owner.address]);
        const proxyHolding = await HoldingProxy.deploy(holdingImpl.address, initializeData);
        await proxyHolding.deployed();
        proxiedHolding = Holding.attach(proxyHolding.address);
        await (await proxiedV1.setHolding(proxiedHolding.address)).wait();
        inPacket[4][1] = ADDRESS_ONE;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, NAY]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await proxiedV1.withdraw(inPacket, signatures);
    });

    it('should transfer ETH to user when quorum is YEA ', async () => {
        const YEA = 1;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await proxiedV1.connect(owner).addToken(ADDRESS_ONE, ALEO_CHAINID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 100 })).wait();

        inPacket[4][1] = ADDRESS_ONE;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, YEA]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await proxiedV1.withdraw(inPacket, signatures);
    });

    //Test for withdraw
    it('should withdraw', async () => {
        const YEA = 1;
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, YEA]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);
        await (await proxiedV1.connect(other).withdraw(inPacket, signatures)).wait();
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(0);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(150);
    });

    it('should revert on transferring ETH to user when contract has no ETH ', async () => {
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await proxiedV1.connect(owner).addToken(ADDRESS_ONE, ALEO_CHAINID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        inPacket[4][1] = ADDRESS_ONE;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await expect(proxiedV1.withdraw(inPacket, signatures))
            .to.be.revertedWith("TokenService: eth withdraw failed");
    });

    it('should revert on transferring ERC20 if Withdraw Failed', async () => {
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        // await proxiedV1.connect(owner).addToken(ADDRESS_ONE, ALEO_CHAINID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        inPacket[4][1] = usdcMock.address;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));

        const signatures = signature1 + signature2.slice(2)
        await (await usdcMock.addBlackList(proxiedV1.address)).wait();
        await expect(proxiedV1.withdraw(inPacket, signatures))
            .to.be.revertedWith("SafeERC20: ERC20 operation did not succeed");
    });

    it('should not transfer ETH to user when quorum is Insufficient', async () => {
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await proxiedV1.connect(owner).addToken(ADDRESS_ONE, ALEO_CHAINID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 100 })).wait();

        inPacket[4][1] = ADDRESS_ONE;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 2]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1;
        await expect(proxiedV1.withdraw(inPacket, signatures)).to.be.revertedWith("ConsumedPacketManagerImpl: inadequate signatures");
    });

    it('should not withdraw for Invalid Token Service', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await expect(TokenServiceImpl.withdraw(inPacket, signatures)).to.be.revertedWith("TokenService: invalid token service");
    });

    it('should not withdraw if a token is disabled', async () => {
        inPacket = [
            1,
            1,
            [ALEO_CHAINID, "aleo.TokenService"],
            [ETH_CHAINID, proxiedV1.address],
            ["aleo.SenderAddress", usdcMock.address, 100, other.address],
            100
        ];

        await (await usdcMock.mint(other.address, 15000)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 10000)).wait();
        // await (await proxiedV1.connect(other)["transfer(address,uint256,string)"](usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        await (await proxiedV1.connect(owner).disable(usdcMock.address)).wait();
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        await expect(proxiedV1.withdraw(inPacket, signatures)).to.be.revertedWith("TokenService: invalid token");
    });

    it('should not withdraw if contract is paused', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);
        await (await proxiedV1.connect(owner).pause());
        await expect(proxiedV1.connect(other).withdraw(inPacket, signatures)).to.be.revertedWith("Pausable: paused");
    });

    it('should not withdraw to holding if token transfer failed', async () => {
        let NTToken = await ethers.getContractFactory("USDCMock");
        let nTToken = await NTToken.deploy();
        await nTToken.deployed();

        const tokenAddress = nTToken.address;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 1000;

        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        inPacket[4][1] = nTToken.address;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 2]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)

        await (await proxiedV1.connect(owner).setHolding(ethers.Wallet.createRandom().address)).wait();

        // replicate transfer to load some erc20 funds in the tokenservice
        await (await nTToken.mint(proxiedV1.address, 100000000)).wait();

        await (await nTToken.addBlackList(proxiedV1.address)).wait();
        await expect(proxiedV1.connect(other).withdraw(inPacket, signatures))
            .to.be.revertedWith('SafeERC20: ERC20 operation did not succeed');
    });

    it('should not withdraw if unknown attestor for yea vote', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const randomAttestor = ethers.Wallet.createRandom();
        const signature1 = await randomAttestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);
        // await (await proxiedV1.pause());
        await expect(proxiedV1.connect(other).withdraw(inPacket, signatures)).to.be.revertedWith("ConsumedPacketManagerImpl: unknown signer");
    });

    it('should fail in double withdraw', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2)
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);

        await (await proxiedV1.connect(other).withdraw(inPacket, signatures)).wait();
        await expect(proxiedV1.connect(other).withdraw(inPacket, signatures)).to.be.revertedWith("ConsumedPacketManagerImpl: packet already consumed");
    });

    it('should convert sig v=0 to v=27', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        let newSignature1;
        const v = signature1.slice(-2);
        if (v == "1b") newSignature1 = signature1.slice(0, -2) + "00";
        if (v == "1c") newSignature1 = signature1.slice(0, -2) + "01";
        const signatures = newSignature1 + signature2.slice(2)
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);

        await expect(proxiedV1.connect(other).withdraw(inPacket, signatures))
            .to.emit(proxiedBridge, "Consumed")
            .withArgs(ALEO_CHAINID, inPacket[1], packetHash, 1);
    });

    it('should not transferToVault if token is not supported', async () => {
        const tokenAddress = ethers.constants.AddressZero;
        await expect(proxiedV1.connect(owner).transferToVault(tokenAddress, 50)).to.be.revertedWith("TokenService: token not supported");
    });

    it('should not transfer ETH from tokenservice to vault if given amount is greater than balance', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 50 })).wait();
        await expect(proxiedV1.connect(owner).transferToVault(tokenAddress, 500)).to.be.revertedWith('TokenService: eth transfer failed');
    });

    it('should not transfer to vault if vault is zero address', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, ethers.constants.AddressZero, destTokenAddress, destTokenService, min, max);
        await expect(proxiedV1.connect(owner).transferToVault(tokenAddress, 500))
            .to.be.revertedWith('TokenService: vault zero address');
    });

    it('should not transfer ETH from tokenservice to vault if contract is paused', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner).pause());
        expect(proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 50 })).to.be.reverted;
    });

    it('should not transfer ETH from tokenservice to vault by non-owner', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 50 })).wait();
        await expect(proxiedV1.connect(other).transferToVault(tokenAddress, 50)).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should transfer ETH from tokenservice to vault', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 50 })).wait();
        await (await proxiedV1.connect(owner).transferToVault(tokenAddress, 50)).wait();
        expect(await ethers.provider.getBalance(proxiedEthVaultService.address)).to.be.equal(50);
    });


    it('should transfer USDC', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        await (await proxiedV1.connect(owner).transferToVault(usdcMock.address, 50)).wait();
        expect(await usdcMock.balanceOf(erc20VaultServiceProxy.address)).to.equal(50);
    });

    it('should not transfer USDC if given amount is greater than balance', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        await expect(proxiedV1.connect(owner).transferToVault(usdcMock.address, 150)).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    it('should not transfer USDC if contract is paused', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(owner).pause());
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.reverted;
    });

    it('should validate Aleo address for "transfer(string receiver)"', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await proxiedV1.connect(owner)["transfer(string)"]("aleo1g2vt2rag4fzug6aklxxxhhraza54gw0jr9q6myjtkm3jjmdtugqq6yrng8", { value: 100 });
    });

    it('should revert if Aleo address length is not 63', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await expect(proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl2", { value: 100 })).to.be.revertedWith("Invalid Aleo address length");
    });

    it('should revert if Aleo address length is not 63 for "transfer(address,uint256,string)"', async () => {
        // Define test parameters
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const receiver = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl2";
        const value = 100;
        const min = 1;
        const max = 100;

        // Add token with necessary details
        await proxiedV1.connect(owner).addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);

        // Expect revert due to invalid Aleo address length
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, value, receiver)).to.be.revertedWith("Invalid Aleo address length");
        // await expect(proxiedV1.transfer(tokenAddress, value, receiver)).to.be.revertedWith("Invalid Aleo address length");
    });
});