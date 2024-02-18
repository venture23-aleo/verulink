import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;

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
    let proxiedHolding, wrongPacket, attestor, attestor1, inPacket, Proxied, lib, proxy, bridge, proxiedBridge, initializeData, ERC20TokenBridge, erc20TokenBridge, owner, proxiedV1, TokenService, ERC20TokenServiceImpl, ERC20TokenServiceImplAddr, signer, USDCMock, usdcMock, USDTMock, usdTMock, chainId, other, UnSupportedToken, unsupportedToken;
    let blackListProxy;
    let erc20VaultServiceProxy;
    let EthVaultServiceImpl, ethVaultServiceInstance, EthVaultServiceProxy, proxiedEthVaultService;
    let destchainID = 2;

    beforeEach(async () => {
        [owner, signer, bridge, other, attestor, attestor1] = await ethers.getSigners();
        // chainId = 7;

        // Deploy ERC20TokenBridge
        lib = await ethers.getContractFactory("PacketLibrary", { from: owner.address });
        const libInstance = await lib.deploy();
        await libInstance.deployed();
        ERC20TokenBridge = await ethers.getContractFactory("Bridge", {
            libraries: {
                PacketLibrary: libInstance.address,
            }
        });
        erc20TokenBridge = await ERC20TokenBridge.deploy();
        await erc20TokenBridge.deployed();
        initializeData = new ethers.utils.Interface(ERC20TokenBridge.interface.format()).encodeFunctionData("Bridge_init(uint256)", [ALEO_CHAINID]);

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
            // initializeData = new ethers.utils.Interface(BlackListService.interface.format()).encodeFunctionData(["initializemock"](owner.address, usdcMock.address, usdTMock.address));
            
            initializeData = new ethers.utils.Interface(BlackListService.interface.format()).encodeFunctionData("BlackList_init", [usdcMock.address, usdTMock.address]);
            blackListProxy = await BlackListServiceProxy.deploy(blackListServiceImpl.address, initializeData);
            await blackListProxy.deployed();
            blackListProxy = BlackListService.attach(blackListProxy.address);
        }

        {
            const Erc20VaultService = await ethers.getContractFactory("Erc20VaultService");
            const erc20VaultServiceImpl = await Erc20VaultService.deploy();
            await erc20VaultServiceImpl.deployed();
            const Erc20VaultServiceProxy = await ethers.getContractFactory('ProxyContract');
            // initializeData = new ethers.utils.Interface(Erc20VaultService.interface.format()).encodeFunctionData(["initialize"](usdcMock.address, "vaultservice", owner.address));
            initializeData = new ethers.utils.Interface(Erc20VaultService.interface.format()).encodeFunctionData("Erc20VaultService_init", [usdcMock.address, "USDC Vault"]);
            erc20VaultServiceProxy = await Erc20VaultServiceProxy.deploy(erc20VaultServiceImpl.address, initializeData);
            await erc20VaultServiceProxy.deployed();
            erc20VaultServiceProxy = Erc20VaultService.attach(erc20VaultServiceProxy.address);
            // console.log("vault proxy = ", erc20VaultServiceProxy.address);
        }

        {
            EthVaultServiceImpl = await ethers.getContractFactory('EthVaultServiceMock');
            ethVaultServiceInstance = await EthVaultServiceImpl.deploy();
            await ethVaultServiceInstance.deployed();
            EthVaultServiceProxy = await ethers.getContractFactory('ProxyContract');
    
            initializeData = new ethers.utils.Interface(EthVaultServiceImpl.interface.format()).encodeFunctionData("EthVaultService_init", ["ETH Vault"]);
            const ethVaultServiceProxy = await EthVaultServiceProxy.deploy(ethVaultServiceInstance.address, initializeData);
            await ethVaultServiceProxy.deployed();
            proxiedEthVaultService = EthVaultServiceImpl.attach(ethVaultServiceProxy.address);
        }

        UnSupportedToken = await ethers.getContractFactory("USDCMock");
        unsupportedToken = await UnSupportedToken.deploy();
        await unsupportedToken.deployed();

        TokenService = await ethers.getContractFactory("TokenService");

        ERC20TokenServiceImpl = await TokenService.deploy();
        await ERC20TokenServiceImpl.deployed();
        initializeData = new ethers.utils.Interface(ERC20TokenServiceImpl.interface.format()).encodeFunctionData("TokenService_init", [proxiedBridge.address, ETH_CHAINID, ALEO_CHAINID, blackListProxy.address]);
        proxy = await Proxied.deploy(ERC20TokenServiceImpl.address, initializeData);
        await proxy.deployed();
        ERC20TokenServiceImplAddr = ERC20TokenServiceImpl.address;
        proxiedV1 = TokenService.attach(proxy.address);
        await proxiedV1.connect(owner).addToken(usdcMock.address, ALEO_CHAINID, erc20VaultServiceProxy.address, "aleo.TokenAddress", "aleo.TokenService", 1, 100000000000);
        await proxiedV1.connect(owner).addToken(usdTMock.address, ALEO_CHAINID, erc20VaultServiceProxy.address, "aleo.TokenAddress", "aleo.TokenService", 1, 100000000000);
        // console.log("hello");
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

    it('reverts if the contract is already initialized', async function () {
        // console.log("initializeData = ", initializeData);
        await expect(proxiedV1["TokenService_init(address,uint256,uint256,address)"](proxiedBridge.address, ETH_CHAINID, ALEO_CHAINID, blackListProxy.address)).to.be.revertedWith('Initializable: contract is already initialized');
    });

    it('should return "ERC20" as the token type', async () => {
        const result = await proxiedV1.tokenType();
        expect(result).to.equal('ERC20');
    });

    // Test that only the owner can update the token service
    it('should allow only owner to set the holding contract', async () => {
        const newHoldingContract = ethers.Wallet.createRandom().address;

        // Update Holding contract with the owner
        await (await proxiedV1.setHolding(newHoldingContract)).wait();

        // Try to Holding contract with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).setHolding(newHoldingContract)
        ).to.be.reverted;
    });

    //Test for transfer of blackListed address
    it('should not allow blackListed address msg.sender for transfer', async () => {
        // Mock USDC and USDT contracts to simulate blacklisting
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await usdcMock.addBlackList(other.address)).wait();

        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("Sender Blacklisted");
    });

    // Test for unsupported tokens while transfer
    it('should not allow unsupported token for transfer', async () => {
        unsupportedToken = await USDCMock.deploy();
        await unsupportedToken.deployed();
        await (await unsupportedToken.mint(other.address, 150)).wait();
        await (await unsupportedToken.connect(other).approve(proxiedV1.address, 100)).wait();
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (unsupportedToken.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("Token not supported");
    });


    // Test for negative transfer
    // it('should not transfer if he has less balance than inserted amount', async () => {
    //     await (await usdcMock.mint(other.address, 90)).wait();
    //     await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
    //     await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
    //         (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("ERC20: transfer amount exceeds balance");
    // });

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
        await proxiedV1.addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
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
            (usdTMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("Sender Blacklisted");
    });

    it('should transfer USDT and checking if "Token not supported" in _packetify', async () => {
        await (await usdTMock.mint(other.address, 150)).wait();
        await (await usdTMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await proxiedV1.disable(usdTMock.address, destchainID);
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdTMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("Token not supported");
    });

    it('should transfer USDT and checking "Transfer amount not in range" in _packetify', async () => {
        const amountOutOfRange = 10000000000010;
        await (await usdTMock.mint(other.address, amountOutOfRange)).wait();
        await (await usdTMock.connect(other).approve(proxiedV1.address, amountOutOfRange)).wait();
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdTMock.address, amountOutOfRange, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("Amount out of range");
    });

    it('should transfer Only ERC20 Tokens', async () => {
        await (await usdTMock.mint(other.address, 150)).wait();
        await (await usdTMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (ADDRESS_ONE, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.revertedWith("Only ERC20 Tokens");
    });

    it("should revert if transfer amount is not in range", async () => {
        const amountOutOfRange = 1000000000001; // Assuming this amount is out of the expected range

        // Mint some USDC tokens to the owner
        await usdcMock.mint(owner.address, 100000000000000);
        await usdcMock.approve(proxiedV1.address, 1000000000001);

        // Attempt to transfer tokens with an amount out of range
        await expect(
            proxiedV1["transfer(address,uint256,string)"](usdcMock.address, amountOutOfRange, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")
        ).to.be.revertedWith("Amount out of range");
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
        const signatures = [signature1, signature2];
        await expect(proxiedV1.connect(other).withdraw(wrongPacket, signatures)).to.be.revertedWith('Invalid Token Service');
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
        const signatures = [signature1, signature2];
        await expect(proxiedV1.connect(other).withdraw(wrongPacket, signatures)).to.be.revertedWith('Invalid Token');
    });

    //Test for receiving funds for blackListed address
    it('should transfer to holding if receiving address is blackListed', async () => {
        //deploying Holding Contract
        const Holding = await ethers.getContractFactory("Holding");
        const holdingImpl = await Holding.deploy();
        await holdingImpl.deployed();
        const HoldingProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(holdingImpl.interface.format()).encodeFunctionData("Holding_init(address)", [proxiedV1.address]);
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
        const signatures = [signature1, signature2];

        //set Holding contract in proxiedV1 which is TokenService 
        await (await proxiedV1.setHolding(proxiedHolding.address)).wait();
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
        await proxiedV1.disable(ADDRESS_ONE, destchainID);
        // deploying Holding Contract
        // const Holding = await ethers.getContractFactory("Holding");
        // const holdingImpl = await Holding.deploy();
        // await holdingImpl.deployed();
        // const HoldingProxy = await ethers.getContractFactory('ProxyContract');
        // initializeData = new ethers.utils.Interface(holdingImpl.interface.format()).encodeFunctionData("Holding_init", [proxiedV1.address]);
        // const proxyHolding = await HoldingProxy.deploy(holdingImpl.address, initializeData);
        // await proxyHolding.deployed();
        // proxiedHolding = Holding.attach(proxyHolding.address);
        // await (await proxiedV1.setHolding(proxiedHolding.address)).wait();
        inPacket[4][1] = ADDRESS_ONE;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = [signature1, signature2];
        await expect(proxiedV1.withdraw(inPacket, signatures)).to.be.revertedWith("Invalid Token");
    });

    it('should transfer to holding when quorum is NAY', async () => {
        const NAY = 2;
        // deploying Holding Contract
        const Holding = await ethers.getContractFactory("Holding");
        const holdingImpl = await Holding.deploy();
        await holdingImpl.deployed();
        const HoldingProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(holdingImpl.interface.format()).encodeFunctionData("Holding_init(address)", [proxiedV1.address]);
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
        const signatures = [signature1, signature2];
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
        initializeData = new ethers.utils.Interface(holdingImpl.interface.format()).encodeFunctionData("Holding_init(address)", [proxiedV1.address]);
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
        const signatures = [signature1, signature2];
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
        const signatures = [signature1, signature2];
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
        const signatures = [signature1, signature2];
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
        const signatures = [signature1, signature2];
        await expect(proxiedV1.withdraw(inPacket, signatures)).to.be.revertedWith("ETH Withdraw Failed");
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
        const signatures = [signature1];
        await expect(proxiedV1.withdraw(inPacket, signatures)).to.be.revertedWith("Insufficient Quorum");
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
        const signatures = [signature1, signature2];
        await expect(ERC20TokenServiceImpl.withdraw(inPacket, signatures)).to.be.revertedWith("Invalid Token Service");
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
        const tokenAddress = usdcMock.address;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        // console.log("inpacket1 = ", inPacket);
        // Add token
        // const ERC20TokenSupport = await ethers.getContractFactory("TokenService");
        // const tokenSupportImpl = await ERC20TokenSupport.deploy();
        // await tokenSupportImpl.deployed();
        // let ERC20TokenSupportABI = ERC20TokenSupport.interface.format();

        // const ERC20TokenSupportProxy = await ethers.getContractFactory('ProxyContract');
        // const initializeData = new ethers.utils.Interface(ERC20TokenSupportABI).encodeFunctionData("TokenService_init", [other.address, ETH_CHAINID, ALEO_CHAINID, other.address]);
        // const proxy = await ERC20TokenSupportProxy.deploy(tokenSupportImpl.address, initializeData);
        // await proxy.deployed();
        // const proxiedContract = ERC20TokenSupport.attach(proxy.address);
        // await proxiedContract.addToken(tokenAddress, ALEO_CHAINID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        // await proxiedContract.connect(owner).enable(inPacket[4][1], inPacket[2][0]);
        // inPacket[4][1] = usdTMock.address;
        await (await usdcMock.mint(other.address, 15000)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 10000)).wait();
        // await (await proxiedV1.connect(other)["transfer(address,uint256,string)"](usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 1]
        );
        await (await proxiedV1.disable(usdcMock.address,ALEO_CHAINID)).wait();
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = [signature1, signature2];
        await expect(proxiedV1.withdraw(inPacket, signatures)).to.be.revertedWith("Invalid Token");
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
        const signatures = [signature1, signature2];
        expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);
        await (await proxiedV1.pause());
        await expect (proxiedV1.connect(other).withdraw(inPacket, signatures)).to.be.revertedWith("Pausable: paused");
    });

    it('should not withdraw if token transfer is failed', async () => {
        let NTToken = await ethers.getContractFactory("USDCMock");
        let nTToken = await NTToken.deploy();
        await nTToken.deployed();

        const tokenAddress = nTToken.address;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 1000;

        await proxiedV1.addToken(tokenAddress, ALEO_CHAINID, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);
        inPacket[4][1] = nTToken.address;
        const packetHash = inPacketHash(inPacket);
        let message = ethers.utils.solidityKeccak256(
            ['bytes32', 'uint8'],
            [packetHash, 2]
        );
        const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
        const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
        const signatures = [signature1, signature2];

        await (await proxiedV1.setHolding(ethers.Wallet.createRandom().address)).wait();

        // replicate transfer to load some erc20 funds in the tokenservice
        await (await nTToken.mint(proxiedV1.address,100000000)).wait();

        await (await nTToken.addBlackList(proxiedV1.address)).wait();
        await expect(proxiedV1.connect(other).withdraw(inPacket, signatures)).to.be.revertedWith('Token transfer failed');
    });

    // it('should not withdraw if allowance is failed', async () => {
    //     let FailedinPacket = [
    //         1,
    //         1,
    //         [2, "aleo.TokenService"],
    //         [7, proxiedV1.address],
    //         ["aleo.SenderAddress", usdcMock.address, 100, other.address],
    //         100
    //     ];
    //     await (await usdcMock.mint(other.address, 150)).wait();
    //     await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
    //     await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
    //         (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
    //     const packetHash = inPacketHash(FailedinPacket);
    //     let message = ethers.utils.solidityKeccak256(
    //         ['bytes32', 'uint8'],
    //         [packetHash, 1]
    //     );
    //     const signature1 = await attestor.signMessage(ethers.utils.arrayify(message));
    //     const signature2 = await attestor1.signMessage(ethers.utils.arrayify(message));
    //     const signatures = [signature1, signature2];
    //     expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(100);
    //     expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);
    //     await (await proxiedV1.connect(other).withdraw(FailedinPacket, signatures)).wait();
    //     // expect(await usdcMock.balanceOf(proxiedV1.address)).to.be.equal(0);
    //     // expect(await usdcMock.balanceOf(other.address)).to.be.equal(150);
    // });

    it('should not transferToVault if token is not supported', async () => {
        const tokenAddress = ethers.constants.AddressZero;
        await expect(proxiedV1.connect(owner).transferToVault(tokenAddress, 50)).to.be.revertedWith("Token not supported");
    });

    it('should not transfer ETH from tokenservice to vault if given amount is greater than balance', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 50 })).wait();
        await expect(proxiedV1.connect(owner).transferToVault(tokenAddress, 500)).to.be.revertedWith('ETH Transfer Failed');
    });

    it('should not transfer ETH from tokenservice to vault if contract is paused', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await(await proxiedV1.pause());
        expect (proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 50 })).to.be.reverted;
    });

    it('should not transfer ETH from tokenservice to vault by non-owner', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 50 })).wait();
        await expect(proxiedV1.connect(other).transferToVault(tokenAddress, 50)).to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should transfer ETH from tokenservice to vault', async () => {
        const tokenAddress = ADDRESS_ONE;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;
        await proxiedV1.addToken(tokenAddress, ALEO_CHAINID, proxiedEthVaultService.address, destTokenAddress, destTokenService, min, max);
        await (await proxiedV1.connect(owner)["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 50 })).wait();
        await( await proxiedV1.connect(owner).transferToVault(tokenAddress, 50)).wait();
        expect(await ethers.provider.getBalance(proxiedEthVaultService.address)).to.be.equal(50);
    });


    it('should transfer USDC', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
        await (await proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
        await( await proxiedV1.connect(owner).transferToVault(usdcMock.address, 50)).wait();
        expect(await usdcMock.balanceOf(erc20VaultServiceProxy.address)).to.equal(50);
    });

    // it('should not transfer USDC if wrong length aleo address is given', async () => {
    //     await (await usdcMock.mint(other.address, 150)).wait();
    //     await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
    //     await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
    //         (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jz")).to.be.revertedWith("Wrong receiver Address");
    // });

    // it('should not transfer USDC if wrong length aleo address is given', async () => {
    //     await (await usdcMock.mint(other.address, 150)).wait();
    //     await (await usdcMock.connect(other).approve(proxiedV1.address, 100)).wait();
    //     await expect(proxiedV1.connect(other)["transfer(address,uint256,string)"]
    //         (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27897")).to.be.revertedWith("Wrong receiver Address");
    // });

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
        await(await proxiedV1.pause());
        await expect (proxiedV1.connect(other)["transfer(address,uint256,string)"]
            (usdcMock.address, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).to.be.reverted;
    });
});

// Define the test suite for ERC20TokenBridgeV2
describe('Upgradeabilty: TokenServiceV2', () => {
    let lib, ERC20TokenServiceV1Impl, initializeData, proxied, upgradeData;
    let owner;
    let signer;
    let other;
    let ERC20TokenServiceV1;
    let ERC20TokenServiceV2Impl;
    let ERC20TokenServiceV2;
    let ERC20TokenServiceProxy;
    let USDCMock, usdcMock;
    let USDTMock, usdTMock;
    let ERC20TokenBridge, erc20TokenBridge, proxiedBridge;
    let blackListProxy;
    let erc20VaultServiceProxy;
    // Deploy a new ERC20TokenServiceV2 contract before each test
    beforeEach(async () => {
        [owner, signer, other] = await ethers.getSigners();
        lib = await ethers.getContractFactory("PacketLibrary", { from: signer.address });
        const libInstance = await lib.deploy();
        await libInstance.deployed();

        ERC20TokenBridge = await ethers.getContractFactory("Bridge", {
            libraries: {
                PacketLibrary: libInstance.address,
            }
        });
        erc20TokenBridge = await ERC20TokenBridge.deploy();
        await erc20TokenBridge.deployed();
        // console.log("erc20TokenBridge = ", erc20TokenBridge.address);

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
            // initializeData = new ethers.utils.Interface(BlackListService.interface.format()).encodeFunctionData(["initializemock"](owner.address, usdcMock.address, usdtMock.address));
            initializeData = new ethers.utils.Interface(BlackListService.interface.format()).encodeFunctionData("BlackList_init", [usdcMock.address, usdTMock.address]);
            blackListProxy = await BlackListServiceProxy.deploy(blackListServiceImpl.address, initializeData);
            await blackListProxy.deployed();
            blackListProxy = BlackListService.attach(blackListProxy.address);
        }

        {
            const Erc20VaultService = await ethers.getContractFactory("Erc20VaultService");
            const erc20VaultServiceImpl = await Erc20VaultService.deploy();
            await erc20VaultServiceImpl.deployed();
            const Erc20VaultServiceProxy = await ethers.getContractFactory('ProxyContract');
            // initializeData = new ethers.utils.Interface(Erc20VaultService.interface.format()).encodeFunctionData(["initialize"](usdcMock.address, "vaultservice", owner.address));
            initializeData = new ethers.utils.Interface(Erc20VaultService.interface.format()).encodeFunctionData("Erc20VaultService_init", [usdcMock.address, "USDC Vault"]);
            erc20VaultServiceProxy = await Erc20VaultServiceProxy.deploy(erc20VaultServiceImpl.address, initializeData);
            await erc20VaultServiceProxy.deployed();
            erc20VaultServiceProxy = Erc20VaultService.attach(erc20VaultServiceProxy.address);
        }

        ERC20TokenServiceV1 = await ethers.getContractFactory("TokenService");
        ERC20TokenServiceV1Impl = await ERC20TokenServiceV1.deploy();
        await ERC20TokenServiceV1Impl.deployed();

        ERC20TokenServiceProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(ERC20TokenServiceV1.interface.format()).encodeFunctionData("TokenService_init(address,uint256,uint256,address)", [erc20TokenBridge.address, ETH_CHAINID, ALEO_CHAINID, blackListProxy.address]);

        const proxy = await ERC20TokenServiceProxy.deploy(ERC20TokenServiceV1Impl.address, initializeData);
        await proxy.deployed();
        proxied = ERC20TokenServiceV1.attach(proxy.address);

        ERC20TokenServiceV2 = await ethers.getContractFactory("TokenServiceV2");

        ERC20TokenServiceV2Impl = await ERC20TokenServiceV2.deploy();
        await ERC20TokenServiceV2Impl.deployed();
        let ERC20TokenServiceV2ABI = ERC20TokenServiceV2.interface.format();

        upgradeData = new ethers.utils.Interface(ERC20TokenServiceV2ABI).encodeFunctionData("initializev2", [5]);
        await proxied.upgradeToAndCall(ERC20TokenServiceV2Impl.address, upgradeData);
        proxied = ERC20TokenServiceV2.attach(proxy.address);
    });

    // Test deployment and initialization
    it('should give the correct owner', async () => {
        const contractOwner = await proxied.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    // Test the value set by the multiply function
    it('should set the correct value', async () => {
        const val = await proxied.val();
        expect(val).to.equal(5);
    });

    it('only owner should be able to upgrade', async () => {
        await expect(proxied.connect(other).upgradeToAndCall(ERC20TokenServiceV2Impl.address, upgradeData)).to.be.reverted;
    });

    it('reverts if the contract is initialized twice', async function () {
        await expect(proxied.initializev2(100)).to.be.revertedWith('Initializable: contract is already initialized');
    });
});