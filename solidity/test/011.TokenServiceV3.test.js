import { assert, expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;
// import { signaturesToBytes, packFunctionArgs, PredicateResponse } from 'predicate-sdk'

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

// Define the test suite
describe('TokenService', () => {
    let deployer, proxiedHolding, wrongPacket, attestor, attestor1, inPacket, Proxied, lib, aleolib, proxy, bridge, proxiedBridge, initializeData, ERC20TokenBridge, erc20TokenBridge, owner, proxiedV1, TokenService, TokenServiceImpl, TokenServiceImplAddr, signer, USDCMock, usdcMock, USDTMock, usdTMock, chainId, other, UnSupportedToken, unsupportedToken, proxiedEthVaultService, feeCollector, feeCollectorImpl;
    let blackListProxy, PredicateManager, predicateManager, FeeCollector;
    let erc20VaultServiceProxy;
    let EthVaultServiceImpl, ethVaultServiceInstance, EthVaultServiceProxy;
    let ERC20TokenServiceImpl;

    beforeEach(async () => {
        [owner, signer, bridge, other, attestor, attestor1, deployer] = await ethers.getSigners();
        // this.ADMIN_ROLE = ethers.keccak256(Buffer.from('ADMIN_ROLE'));
        // let predicateservice = await ethers.getContractFactory("PredicateService");
        console.log("kekeccak256 value for SERVICE_ROLE = ", ethers.utils.keccak256(ethers.utils.toUtf8Bytes("SERVICE_ROLE")));
        // 0xd8a7a79547af723ee3e12b59a480111268d8969c634e1a34a144d2c8b91d635b
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

        console.log("ERC20TokenBridge address: ", erc20TokenBridge.address);

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

        PredicateManager = await ethers.getContractFactory("PredicateManager");
        predicateManager = await PredicateManager.deploy();
        await predicateManager.deployed();

        UnSupportedToken = await ethers.getContractFactory("USDCMock");
        unsupportedToken = await UnSupportedToken.deploy();
        await unsupportedToken.deployed();

        TokenService = await ethers.getContractFactory("TokenServiceV3");

        ERC20TokenServiceImpl = await TokenService.deploy();
        await ERC20TokenServiceImpl.deployed();
        // console.log("ERC20TokenServiceImpl address: ", ERC20TokenServiceImpl.interface.format());
        initializeData = new ethers.utils.Interface(ERC20TokenServiceImpl.interface.format()).encodeFunctionData("TokenService_init", [proxiedBridge.address, owner.address, ETH_CHAINID, ALEO_CHAINID, blackListProxy.address]);
        proxy = await Proxied.deploy(ERC20TokenServiceImpl.address, initializeData);
        await proxy.deployed();
        // let ERC20TokenServiceImplAddr = ERC20TokenServiceImpl.address;
        proxiedV1 = TokenService.attach(proxy.address);
        await proxiedV1.connect(owner).addToken(usdcMock.address, ALEO_CHAINID, erc20VaultServiceProxy.address, "aleo.TokenAddress", "aleo.TokenService", 1, 100000000000);
        await proxiedV1.connect(owner).addToken(usdTMock.address, ALEO_CHAINID, erc20VaultServiceProxy.address, "aleo.TokenAddress", "aleo.TokenService", 1, 100000000000);
        await proxiedV1.connect(owner).addToken(ADDRESS_ONE, ALEO_CHAINID, ADDRESS_ZERO, "aleo.TokenAddress", "aleo.TokenService", ethers.utils.parseEther("0.001"), ethers.utils.parseEther("100000000000"));
        await (await proxiedBridge.connect(owner).addTokenService(proxiedV1.address)).wait();
        await (await proxiedBridge.connect(owner).addAttestor(attestor.address, 1)).wait();
        await (await proxiedBridge.connect(owner).addAttestor(attestor1.address, 2)).wait();


        // upgrade to bridge v2
        const BridgeV2 = await ethers.getContractFactory("BridgeV2", {
            libraries: {
                PacketLibrary: libInstance.address,
                AleoAddressLibrary: aleoLibInstance.address,
            }
        });
        let bridgeV2 = await BridgeV2.deploy();
        await bridgeV2.deployed();

        const upgradeTx = await proxiedBridge.upgradeTo(bridgeV2.address);
        await upgradeTx.wait();

        bridgeV2 = BridgeV2.attach(proxiedBridge.address);
        console.log("bridgeV2 address: ", bridgeV2.address);

        await bridgeV2.connect(owner).setAttestorCount(2);
        await bridgeV2.connect(owner).updateMaxAttestorCount(5);

        FeeCollector = await ethers.getContractFactory("FeeCollector");
        feeCollectorImpl = await FeeCollector.deploy();
        initializeData = new ethers.utils.Interface(FeeCollector.interface.format()).encodeFunctionData("initialize", [proxiedV1.address, owner.address, usdcMock.address, usdTMock.address, 0, 0]);
        proxy = await Proxied.deploy(feeCollectorImpl.address, initializeData);
        await proxy.deployed();
        feeCollector = FeeCollector.attach(proxy.address);

        await proxiedV1.connect(owner).setFeeCollector(feeCollector.address);

    });

    // Test deployment and initialization
    it('should initialize with the correct owner', async () => {
        const contractOwner = await proxiedV1.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    it('should set the correct policy by owner', async function () {
        await proxiedV1.connect(owner).setPredicateService(predicateManager.address);
        const predicateManagerAddress = await proxiedV1.predicateservice();
        console.log("predicateManagerAddress = ", predicateManagerAddress);
        expect(predicateManagerAddress).to.equal(predicateManager.address);
    });

    // Test for transfer
    it('should transfer USDC', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        console.log(await usdcMock.balanceOf(other.address));
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string,bool,bytes)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", false, "0x")).wait();
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);
    });

    // // Test for transfer
    it('should transfer Private USDC', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["privateTransfer(address,uint256,string,bool,bytes)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", false, "0x")).wait();
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);
    });

    it('should set the correct fees', async () => {
        await (await feeCollector.connect(owner).setPlatformFees(usdcMock.address, 5000)).wait();
        expect(await feeCollector.platformFees(usdcMock.address)).to.be.equal(5000);

        await (await feeCollector.connect(owner).setPrivatePlatformFees(usdcMock.address, 6000)).wait();
        expect(await feeCollector.privatePlatformFees(usdcMock.address)).to.be.equal(6000);

        await (await feeCollector.connect(owner).setRelayerFees(usdcMock.address, 7000)).wait();
        expect(await feeCollector.relayerFees(usdcMock.address)).to.be.equal(7000);

        await (await feeCollector.connect(owner).setPrivateRelayerFees(usdcMock.address, 8000)).wait();
        expect(await feeCollector.privateRelayerFees(usdcMock.address)).to.be.equal(8000);
    });

    // Test for transfer
    it('should transfer USDC with platform fees deducted', async () => {
        await (await feeCollector.connect(owner).setPlatformFees(usdcMock.address, 100)).wait();  

        await (await usdcMock.mint(other.address, 1500)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 1000)).wait();

        await (await proxiedV1.connect(other)["transfer(address,uint256,string,bool,bytes)"]
            (usdcMock.address, 1000, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", false, "0x")).wait();
        
        expect(await usdcMock.balanceOf(feeCollector.address)).to.be.equal(1);
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(999);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(500);

        await (await feeCollector.connect(owner).withdrawProtocolFees(usdcMock.address, owner.address)).wait();

        expect(await usdcMock.balanceOf(feeCollector.address)).to.be.equal(0);
        expect(await usdcMock.balanceOf(owner.address)).to.be.equal(1);
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(999);
    });

    // // Test for transfer
    it('should private transfer USDC with additional private platform fees deducted', async () => {
        await (await feeCollector.connect(owner).setPrivatePlatformFees(usdcMock.address, 200)).wait();

        await (await usdcMock.mint(other.address, 1500)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 1000)).wait();

        console.log("tSadress: ", proxiedV1.address);
        console.log("other address: ", other.address);
        console.log("usdcMock address: ", usdcMock.address);
        console.log("Bridge address: ", proxiedBridge.address);
        console.log("attestor address: ", attestor.address);
        console.log("owner address: ", owner.address);

        const outPacket = [
            11,
            1,
            [ETH_CHAINID, proxiedV1.address],
            [ALEO_CHAINID, "aleo.TokenService"],
            [other.address, "aleo.TokenAddress", 1000, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            195
        ]

        const tx = await proxiedV1.connect(other)["privateTransfer(address,uint256,string,bool,bytes)"]
            (usdcMock.address, 1000, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", false, 
                "0x1234567890");

        await expect(tx)
        .to.emit(proxiedV1, "PlatformFeesPaid")
        .withArgs(usdcMock.address, 2);
        
        // const receipt = await tx.wait();
        // console.log("receipt: ", receipt.events);

        // await expect(tx)
        //     .to.emit(proxiedBridge, "PacketDispatched")
        //     .withArgs(outPacket, "0x1234567890");

        expect(await usdcMock.balanceOf(feeCollector.address)).to.be.equal(2);
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(998);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(500);
    });

    // // Test for transfer with platform Fees and test withdraw fees too
    it('should transfer eth with platform fees deducted', async () => {
        await (await feeCollector.connect(owner).setPlatformFees(ADDRESS_ONE, 100)).wait();

        await (await proxiedV1.connect(other)["transfer(string,bool,bytes)"]
        ("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", false, "0x",
            { value: ethers.utils.parseEther("100")})).wait();
        
        console.log("feeCollector balance: ", await ethers.provider.getBalance(feeCollector.address));
        
        expect(await ethers.provider.getBalance(feeCollector.address)).to.be.equal(ethers.utils.parseEther("0.1"));
        expect(await ethers.provider.getBalance(proxiedV1.address)).to.be.equal(ethers.utils.parseEther("99.9"));
    });

    // Test for transfer
    it('should transfer all tokens with platform fees deducted', async () => {
        await (await feeCollector.connect(owner).setPlatformFees(usdcMock.address, 1000)).wait();
        await (await feeCollector.connect(owner).setPlatformFees(usdTMock.address, 1000)).wait();
        await (await feeCollector.connect(owner).setPlatformFees(ADDRESS_ONE, 1000)).wait();

        await (await feeCollector.connect(owner).setPrivatePlatformFees(usdcMock.address, 2000)).wait();
        await (await feeCollector.connect(owner).setPrivatePlatformFees(usdTMock.address, 2000)).wait();
        await (await feeCollector.connect(owner).setPrivatePlatformFees(ADDRESS_ONE, 2000)).wait();

        await (await usdcMock.mint(other.address, 1500)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 1000)).wait();

        await (await usdTMock.mint(other.address, 1500)).wait();
        await (await usdTMock.connect(other).approve(proxiedV1.address, 1200)).wait();

        await (await proxiedV1.connect(other)["transfer(address,uint256,string,bool,bytes)"]
            (usdcMock.address, 500, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", false, "0x")).wait();

        await (await proxiedV1.connect(other)["transfer(address,uint256,string,bool,bytes)"]
            (usdTMock.address, 700, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", false, "0x")).wait();

        await (await proxiedV1.connect(other)["transfer(string,bool,bytes)"]
        ("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", false, "0x",
            { value: ethers.utils.parseEther("100")})).wait();

        await (await proxiedV1.connect(other)["privateTransfer(address,uint256,string,bool,bytes)"]
            (usdcMock.address, 400, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", false, "0x")).wait();

        await (await proxiedV1.connect(other)["privateTransfer(address,uint256,string,bool,bytes)"]
            (usdTMock.address, 500, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", false, "0x")).wait();
             
        
        expect(await usdcMock.balanceOf(feeCollector.address)).to.be.equal(13);
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(887);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(600);

        await (await feeCollector.connect(owner).withdrawProtocolFees(usdcMock.address, owner.address)).wait();

        expect(await usdcMock.balanceOf(owner.address)).to.be.equal(13);
        expect(await usdcMock.balanceOf(feeCollector.address)).to.be.equal(0);
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(887);

        expect(await usdTMock.balanceOf(feeCollector.address)).to.be.equal(17);
        expect(await usdTMock.balanceOf(proxiedV1.address)).to.be.equal(1183);
        expect(await usdTMock.balanceOf(other.address)).to.be.equal(300);


        await (await feeCollector.connect(owner).withdrawProtocolFees(usdTMock.address, owner.address)).wait();

        expect(await usdTMock.balanceOf(owner.address)).to.be.equal(17);
        expect(await usdTMock.balanceOf(feeCollector.address)).to.be.equal(0);
        expect(await usdTMock.balanceOf(proxiedV1.address)).to.be.equal(1183);

        expect(await ethers.provider.getBalance(feeCollector.address)).to.be.equal(ethers.utils.parseEther("1"));


    });

    it("should transfer ERC20 tokens for non executor packets", async function () {
        // Mock packet and signatures
        const packet = [
            100,
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
    
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = signature1 + signature2.slice(2);
    
        // Transfer tokens to the contract
        await usdcMock.mint(proxiedV1.address, 100);
      
        await expect(proxiedV1.connect(signer).withdraw(packet, signatures))
          .to.emit(proxiedBridge, "Consumed")
          .withArgs(ALEO_CHAINID, packet[1], packetHash, 1);
    
        // Check balances
        expect(await usdcMock.balanceOf(signer.address)).to.equal(0);
        expect(await usdcMock.balanceOf(other.address)).to.equal(100);
      });

});
