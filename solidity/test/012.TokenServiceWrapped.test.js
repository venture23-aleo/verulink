import { assert, expect } from 'chai';
import hardhat from 'hardhat';
const { ethers, upgrades } = hardhat;

const ADDRESS_ONE = "0x0000000000000000000000000000000000000001";
const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

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

describe('TokenServiceWrapped', () => {
    let deployer, owner, signer, other, attestor, attestor1;
    let proxiedV1, TokenServiceWrapped, tokenServiceImpl, holding;
    let usdcMock, usdtMock, unsupportedToken;
    let proxiedBridge, blackListProxy;
    let lib, aleolib, ERC20TokenBridge, erc20TokenBridge;
    let initializeData, Proxied, proxy, Holding, holdingInstance, HoldingProxy, FeeCollector, feeCollectorImpl, feeCollector;

    beforeEach(async () => {
        [owner, signer, other, attestor, attestor1, deployer] = await ethers.getSigners();

        // console.log("keccak256 value for SERVICE_ROLE = ", ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SERVICE_ROLE")));

        // Deploy libraries
        lib = await ethers.getContractFactory("PacketLibrary", { from: owner.address });
        const libInstance = await lib.deploy();
        await libInstance.deployed();

        aleolib = await ethers.getContractFactory("AleoAddressLibrary", { from: owner.address });
        const aleoLibInstance = await aleolib.deploy();
        await aleoLibInstance.deployed();

        // Deploy Bridge with libraries
        ERC20TokenBridge = await ethers.getContractFactory("BridgeV2", {
            libraries: {
                PacketLibrary: libInstance.address,
                AleoAddressLibrary: aleoLibInstance.address,
            }
        });
        erc20TokenBridge = await ERC20TokenBridge.deploy();
        await erc20TokenBridge.deployed();

        initializeData = new ethers.utils.Interface(ERC20TokenBridge.interface.format())
            .encodeFunctionData("Bridge_init(uint256,address)", [ALEO_CHAINID, owner.address]);

        Proxied = await ethers.getContractFactory('ProxyContract');
        proxy = await Proxied.deploy(erc20TokenBridge.address, initializeData);
        await proxy.deployed();
        proxiedBridge = ERC20TokenBridge.attach(proxy.address);

        // Deploy mock tokens
        const USDCMock = await ethers.getContractFactory("USDCMock");
        usdcMock = await USDCMock.deploy();
        await usdcMock.deployed();

        const USDTMock = await ethers.getContractFactory("USDTMock");
        usdtMock = await USDTMock.deploy();
        await usdtMock.deployed();

        const UnSupportedToken = await ethers.getContractFactory("USDCMock");
        unsupportedToken = await UnSupportedToken.deploy();
        await unsupportedToken.deployed();

        // Deploy BlackListService
        {
            const BlackListService = await ethers.getContractFactory("BlackListService");
            const blackListServiceImpl = await BlackListService.deploy();
            await blackListServiceImpl.deployed();
            const BlackListServiceProxy = await ethers.getContractFactory('ProxyContract');

            initializeData = new ethers.utils.Interface(BlackListService.interface.format())
                .encodeFunctionData("BlackList_init", [usdcMock.address, usdtMock.address, owner.address]);
            blackListProxy = await BlackListServiceProxy.deploy(blackListServiceImpl.address, initializeData);
            await blackListProxy.deployed();
            blackListProxy = BlackListService.attach(blackListProxy.address);
        }

        // Deploy TokenServiceWrapped
        TokenServiceWrapped = await ethers.getContractFactory("TokenServiceWrapped");
        tokenServiceImpl = await TokenServiceWrapped.deploy();
        await tokenServiceImpl.deployed();

        initializeData = new ethers.utils.Interface(TokenServiceWrapped.interface.format())
            .encodeFunctionData("initialize", [
                proxiedBridge.address,
                owner.address,
                ETH_CHAINID,
                ALEO_CHAINID,
                blackListProxy.address
            ]);

        proxy = await Proxied.deploy(tokenServiceImpl.address, initializeData);
        await proxy.deployed();
        proxiedV1 = TokenServiceWrapped.attach(proxy.address);

        Holding = await ethers.getContractFactory('Holding');
        holdingInstance = await Holding.deploy();
        await holdingInstance.deployed();
        HoldingProxy = await ethers.getContractFactory('ProxyContract');

        initializeData = new ethers.utils.Interface(Holding.interface.format()).encodeFunctionData("Holding_init", [proxiedV1.address, owner.address]);
        const holdingProxy = await HoldingProxy.deploy(holdingInstance.address, initializeData);
        await holdingProxy.deployed();
        holding = Holding.attach(holdingProxy.address);

        // Set holding contract
        await proxiedV1.connect(owner).setHolding(holding.address);

        await proxiedV1.connect(owner).addToken(usdcMock.address, ALEO_CHAINID, ADDRESS_ZERO, "aleo.TokenAddress", "aleo.TokenService", 1, 100000000000);


        // Setup bridge
        await proxiedBridge.connect(owner).addTokenService(proxiedV1.address);
        await proxiedBridge.connect(owner).addAttestor(attestor1.address, 1);
        await proxiedBridge.connect(owner).addAttestor(attestor.address, 2);

        FeeCollector = await ethers.getContractFactory("FeeCollector");
        feeCollectorImpl = await FeeCollector.deploy();
        initializeData = new ethers.utils.Interface(FeeCollector.interface.format()).encodeFunctionData("initialize", [proxiedV1.address, owner.address]);
        proxy = await Proxied.deploy(feeCollectorImpl.address, initializeData);
        await proxy.deployed();
        feeCollector = FeeCollector.attach(proxy.address);

        await proxiedV1.connect(owner).setFeeCollector(feeCollector.address);

    });

    describe("Deployment and Initialization", () => {
        it('should initialize with the correct owner', async () => {
            const contractOwner = await proxiedV1.owner();
            expect(contractOwner).to.equal(owner.address);
        });

        it('should have correct bridge and blacklist addresses', async () => {
            expect(await proxiedV1.erc20Bridge()).to.equal(proxiedBridge.address);
            expect(await proxiedV1.blackListService()).to.equal(blackListProxy.address);
        });

        it('should return correct token type', async () => {
            expect(await proxiedV1.tokenType()).to.equal("BRC20");
        });

        it('should not allow re-initialization', async () => {
            await expect(
                proxiedV1.initialize(
                    proxiedBridge.address,
                    owner.address,
                    ETH_CHAINID,
                    ALEO_CHAINID,
                    blackListProxy.address
                )
            ).to.be.revertedWithCustomError(proxiedV1, "InvalidInitialization");
        });
    });

    describe("Token Management", () => {
        it('should allow owner to update holding contract', async () => {
            const MockHolding = await ethers.getContractFactory("HoldingMock");
            const newHolding = await MockHolding.deploy();
            await newHolding.deployed();

            await expect(proxiedV1.connect(owner).setHolding(newHolding.address))
                .to.not.be.reverted;

            expect(await proxiedV1.holding()).to.equal(newHolding.address);
        });

        it('should not allow non-owner to update holding contract', async () => {
            const MockHolding = await ethers.getContractFactory("HoldingMock");
            const newHolding = await MockHolding.deploy();
            await newHolding.deployed();

            await expect(
                proxiedV1.connect(other).setHolding(newHolding.address)
            ).to.be.revertedWithCustomError(proxiedV1, "OwnableUnauthorizedAccount");
        });

        it('should allow owner to update bridge', async () => {
            const newBridge = await ERC20TokenBridge.deploy();
            await newBridge.deployed();

            await expect(proxiedV1.connect(owner).setBridge(newBridge.address))
                .to.not.be.reverted;

            expect(await proxiedV1.erc20Bridge()).to.equal(newBridge.address);
        });

        it('should allow owner to update blacklist service', async () => {
            const BlackListService = await ethers.getContractFactory("BlackListService");
            const newBlackList = await BlackListService.deploy();
            await newBlackList.deployed();

            await expect(proxiedV1.connect(owner).setBlackListService(newBlackList.address))
                .to.not.be.reverted;

            expect(await proxiedV1.blackListService()).to.equal(newBlackList.address);
        });
    });

    describe("Token Send", () => {
        it('should allow users to send tokens to another chain', async () => {
            const amount = 1000;
            const receiver = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";

            await usdcMock.mint(other.address, amount * 2);
            await usdcMock.connect(other).approve(proxiedV1.address, amount);

            await proxiedV1.connect(other).publicTokenSend(
                usdcMock.address,
                amount,
                receiver
            );

            // Check that tokens were transferred to the contract
            expect(await usdcMock.balanceOf(other.address)).to.be.lte(amount);
        });

        it('should reject invalid receiver addresses', async () => {
            const amount = 1000;
            const invalidReceiver = "invalid_address";

            await usdcMock.mint(other.address, amount);
            await usdcMock.connect(other).approve(proxiedV1.address, amount);

            await expect(
                proxiedV1.connect(other).publicTokenSend(usdcMock.address, amount, invalidReceiver)
            ).to.be.reverted; // Bridge will reject invalid addresses
        });

        it('should reject blacklisted senders', async () => {
            const amount = 1000;
            const receiver = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";

            // Add sender to blacklist
            await blackListProxy.connect(owner).addToBlackList(other.address);

            await usdcMock.mint(other.address, amount);
            await usdcMock.connect(other).approve(proxiedV1.address, amount);

            await expect(
                proxiedV1.connect(other).publicTokenSend(usdcMock.address, amount, receiver)
            ).to.be.revertedWith("TokenService: senderBlacklisted");
        });

        it('should reject unsupported tokens', async () => {
            const amount = 1000;
            const receiver = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";

            await unsupportedToken.mint(other.address, amount);
            await unsupportedToken.connect(other).approve(proxiedV1.address, amount);

            await expect(
                proxiedV1.connect(other).publicTokenSend(unsupportedToken.address, amount, receiver)
            ).to.be.revertedWith("TokenService: tokenDisabled");
        });

        it('should reject amounts outside the supported range', async () => {
            const tooSmallAmount = 0; // Below minimum of 1
            const receiver = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";

            await expect(
                proxiedV1.connect(other).publicTokenSend(usdcMock.address, tooSmallAmount, receiver)
            ).to.be.revertedWith("TokenService: invalidAmount");
        });

        it('should reject when contract is paused', async () => {
            const amount = 1000;
            const receiver = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";

            await usdcMock.mint(other.address, amount);
            await usdcMock.connect(other).approve(proxiedV1.address, amount);

            // Pause the contract
            await proxiedV1.connect(owner).pause();

            await expect(
                proxiedV1.connect(other).publicTokenSend(usdcMock.address, amount, receiver)
            ).to.be.revertedWithCustomError(proxiedV1, "EnforcedPause");
        });

        it('should cut the fees when fees are set', async () => {
            await (await feeCollector.connect(owner).setPlatformFees(usdcMock.address, 5000)).wait();
            expect(await feeCollector.platformFees(usdcMock.address)).to.be.equal(5000);
            
            const amount = 1000;
            const receiver = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";

            await usdcMock.mint(other.address, amount);
            await usdcMock.connect(other).approve(proxiedV1.address, amount);

            await expect(
                proxiedV1.connect(other).publicTokenSend(usdcMock.address, amount, receiver)
            ).to.emit(proxiedV1, "PlatformFeesPaid").withArgs(usdcMock.address, amount*5000/100000);

            assert.equal(await proxiedV1.collectedFees(usdcMock.address), amount * 5000 / 100000);

            
        });
    });

    describe("Token Receive", () => {
        it("should transfer ERC20 tokens for valid packets with YEA vote", async function () {
            // Mock packet and signatures
            const packet = [
                1,
                1,
                [ALEO_CHAINID, "aleo.TokenService"],
                [ETH_CHAINID, proxiedV1.address],
                ["aleo.SenderAddress", usdcMock.address, 100, other.address],
                100
            ];

            const packetHash = inPacketHash(packet);
            let message = ethers.utils.solidityKeccak256(
                ['bytes32', 'uint8'],
                [packetHash, 1]
            );

            const signature1 = await attestor1.signMessage(ethers.utils.arrayify(message));
            const signature2 = await attestor.signMessage(ethers.utils.arrayify(message));
            const signatures = signature1 + signature2.slice(2);

            await expect(proxiedV1.connect(signer).tokenReceive(packet, signatures))
                .to.emit(proxiedBridge, "Consumed")
                .withArgs(ALEO_CHAINID, packet[1], packetHash, 1);

            // Check balances
            expect(await usdcMock.balanceOf(signer.address)).to.equal(0);
            expect(await usdcMock.balanceOf(other.address)).to.equal(100);
        });

        it("should lock tokens for blacklisted receivers", async function () {
            const amount = 1000;

            // Add receiver to blacklist
            await blackListProxy.connect(owner).addToBlackList(other.address);

            const packet = [
                1,
                1,
                [ALEO_CHAINID, "aleo.TokenService"],
                [ETH_CHAINID, proxiedV1.address],
                ["aleo.SenderAddress", usdcMock.address, amount, other.address],
                100
            ];

            const packetHash = inPacketHash(packet);
            let message = ethers.utils.solidityKeccak256(
                ['bytes32', 'uint8'],
                [packetHash, 1]
            );

            const signature1 = await attestor1.signMessage(ethers.utils.arrayify(message));
            const signature2 = await attestor.signMessage(ethers.utils.arrayify(message));
            const signatures = signature1 + signature2.slice(2);

            await usdcMock.mint(proxiedV1.address, amount);

            await proxiedV1.connect(signer).tokenReceive(packet, signatures);

            // Check that tokens were sent to holding contract
            expect(await usdcMock.balanceOf(holding.address)).to.equal(amount);
        });

        it("should reject packets with invalid destination", async function () {
            const packet = [
                100,
                1,
                [ALEO_CHAINID, "aleo.TokenService"],
                [ETH_CHAINID, other.address], // Wrong destination
                ["aleo.SenderAddress", usdcMock.address, 1000, other.address],
                100
            ];

            await expect(
                proxiedV1.connect(signer).tokenReceive(packet, "0x")
            ).to.be.revertedWith("TokenService: invalidDestTokenService");
        });

        it("should reject packets for unsupported tokens", async function () {
            const packet = [
                100,
                1,
                [ALEO_CHAINID, "aleo.TokenService"],
                [ETH_CHAINID, proxiedV1.address],
                ["aleo.SenderAddress", unsupportedToken.address, 1000, other.address],
                100
            ];

            const packetHash = inPacketHash(packet);
            let message = ethers.utils.solidityKeccak256(
                ['bytes32', 'uint8'],
                [packetHash, 1]
            );

            const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
            const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
            const signatures = signature1 + signature2.slice(2);

            await expect(
                proxiedV1.connect(signer).tokenReceive(packet, signatures)
            ).to.be.revertedWith("TokenService: tokenDisabled");
        });

        it("should reject when contract is paused", async function () {
            const packet = [
                100,
                1,
                [ALEO_CHAINID, "aleo.TokenService"],
                [ETH_CHAINID, proxiedV1.address],
                ["aleo.SenderAddress", usdcMock.address, 1000, other.address],
                100
            ];

            // Pause the contract
            await proxiedV1.connect(owner).pause();

            await expect(
                proxiedV1.connect(signer).tokenReceive(packet, "0x")
            ).to.be.revertedWithCustomError(proxiedV1, "EnforcedPause");
        });
    });

    describe("Pausable Functionality", () => {
        it('should allow owner to pause and unpause', async () => {
            await expect(proxiedV1.connect(owner).pause()).to.not.be.reverted;
            expect(await proxiedV1.paused()).to.be.true;

            await expect(proxiedV1.connect(owner).unpause()).to.not.be.reverted;
            expect(await proxiedV1.paused()).to.be.false;
        });

        it('should not allow non-owner to pause', async () => {
            await expect(
                proxiedV1.connect(other).pause()
            ).to.be.revertedWithCustomError(proxiedV1, "OwnableUnauthorizedAccount");
        });
    });



    describe("Token Support Functions", () => {
        it('should report if token is enabled', async () => {
            expect(await proxiedV1.isEnabledToken(usdcMock.address)).to.be.true;
            expect(await proxiedV1.isEnabledToken(unsupportedToken.address)).to.be.false;
        });

        it('should validate amount ranges', async () => {
            expect(await proxiedV1.isAmountInRange(usdcMock.address, 100)).to.be.true;
            expect(await proxiedV1.isAmountInRange(usdcMock.address, 0)).to.be.false;
        });

        it('should allow owner to disable tokens', async () => {
            await proxiedV1.connect(owner).disable(usdcMock.address);
            expect(await proxiedV1.isEnabledToken(usdcMock.address)).to.be.false;
        });
    });
});