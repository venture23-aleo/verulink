// Import necessary libraries
// const { expect } = require('chai');
// const { ethers } = require('hardhat');
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;

// Define the test suite
describe('ERC20TokenService', () => {
    let proxiedHolding, wrongPacket, attestor, inPacket, Proxied, lib, proxy, bridge, proxiedBridge, initializeData, ERC20TokenBridge, erc20TokenBridge, owner, proxiedV1, ERC20TokenService, ERC20TokenServiceImpl, ERC20TokenServiceImplAddr, signer, USDCMock, usdcMock, USDTMock, usdTMock, chainId, other, UnSupportedToken, unsupportedToken;

    let destchainID = 2;

    beforeEach(async () => {
        [owner, signer, bridge, other, attestor] = await ethers.getSigners();
        chainId = 7;

        // Deploy ERC20TokenBridge
        lib = await ethers.getContractFactory("PacketLibrary", { from: signer.address });
        const libInstance = await lib.deploy();
        await libInstance.waitForDeployment();

        ERC20TokenBridge = await ethers.getContractFactory("ERC20TokenBridge", {
            libraries: {
                PacketLibrary: libInstance.target,
            }
        });
        erc20TokenBridge = await ERC20TokenBridge.deploy();
        await erc20TokenBridge.waitForDeployment();
        initializeData = new ethers.Interface([{
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_owner",
                    "type": "address"
                }
            ],
            "name": "initialize",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }]).encodeFunctionData("initialize", [owner.address]);

        Proxied = await ethers.getContractFactory('ProxyContract');
        proxy = await Proxied.deploy(erc20TokenBridge.target, initializeData);
        await proxy.waitForDeployment();
        proxiedBridge = ERC20TokenBridge.attach(proxy.target);


        USDCMock = await ethers.getContractFactory("USDCMock");
        usdcMock = await USDCMock.deploy();
        await usdcMock.waitForDeployment();

        USDTMock = await ethers.getContractFactory("USDTMock");
        usdTMock = await USDTMock.deploy();
        await usdTMock.waitForDeployment();

        UnSupportedToken = await ethers.getContractFactory("USDCMock");
        unsupportedToken = await UnSupportedToken.deploy();
        await unsupportedToken.waitForDeployment();

        ERC20TokenService = await ethers.getContractFactory("ERC20TokenService");

        ERC20TokenServiceImpl = await ERC20TokenService.deploy();
        await ERC20TokenServiceImpl.waitForDeployment();

        initializeData = new ethers.Interface([{
            "inputs": [
                {
                    "internalType": "address",
                    "name": "bridge",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_chainId",
                    "type": "uint256"
                },
                {
                    "internalType": "address",
                    "name": "_usdc",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_usdt",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_owner",
                    "type": "address"
                }
            ],
            "name": "initialize",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }]).encodeFunctionData("initialize", [proxiedBridge.target, chainId, usdcMock.target, usdTMock.target, owner.address]);

        proxy = await Proxied.deploy(ERC20TokenServiceImpl.target, initializeData);
        await proxy.waitForDeployment();
        ERC20TokenServiceImplAddr = ERC20TokenServiceImpl.target;
        proxiedV1 = ERC20TokenService.attach(proxy.target);
        await (await proxiedV1.connect(owner).addToken(usdcMock.target, destchainID, "aleo.TokenAddress", "aleo.TokenService", 1, 100000000000)).wait();
        await (await proxiedV1.connect(owner).addToken(usdTMock.target, destchainID, "aleo.TokenAddress", "aleo.TokenService", 1, 100000000000)).wait();
        await (await proxiedBridge.connect(owner).addTokenService(proxiedV1.target, destchainID)).wait();
        await (await proxiedBridge.connect(owner).addChain(destchainID, "aleo.BridgeAddress")).wait();
        await (await proxiedBridge.connect(owner).addAttestor(attestor.address, destchainID, 1)).wait();

        inPacket = [
            1,
            1,
            [2, "aleo.TokenService"],
            [7, proxiedV1.target],
            ["aleo.SenderAddress", usdcMock.target, 100, other.address],
            100
        ];

        await (await proxiedBridge.connect(attestor).receivePacket(inPacket)).wait();
    });

    // Test deployment and initialization
    it('should initialize with the correct owner', async () => {
        const contractOwner = await proxiedV1.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    it('reverts if the contract is already initialized', async function () {
        // console.log("initializeData = ", initializeData);
        expect(proxiedV1.initialize(proxiedBridge.target, chainId, usdcMock.target, usdTMock.target, owner.address)).to.be.revertedWith('Initializable: contract is already initialized');
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
        expect(
            proxiedV1.connect(other).setHolding(newHoldingContract)
        ).to.be.reverted;
    });

    //Test for transfer of blackListed address
    it('should not allow blackListed address for transfer', async () => {
        // Mock USDC and USDT contracts to simulate blacklisting
        await (await usdcMock.addBlackList(other.address)).wait();

        expect(proxiedV1.connect(other).transfer(usdcMock.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID)).to.be.revertedWith("Sender Blacklisted");
    });


    // Test for unsupported tokens while transfer
    it('should not allow unsupported token for transfer', async () => {
        expect(proxiedV1.connect(other).transfer(unsupportedToken.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID)).to.be.revertedWith("Unknown token Address");
    });


    // Test for negative transfer
    it('should not transfer if he has less balance than inserted amount', async () => {
        expect(proxiedV1.connect(other).transfer(usdcMock.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID)).to.be.reverted;
    });


    // Test for transfer
    it('should transfer USDC', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.target, 100)).wait();
        await (await proxiedV1.connect(other).transfer(usdcMock.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID)).wait();
        expect(await usdcMock.balanceOf(proxiedV1)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);
    });

    it('should transfer USDT', async () => {
        await (await usdTMock.mint(other.address, 150)).wait();
        await (await usdTMock.connect(other).approve(proxiedV1.target, 100)).wait();
        await (await proxiedV1.connect(other).transfer(usdTMock.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID)).wait();
        expect(await usdTMock.balanceOf(proxiedV1)).to.be.equal(100);
        expect(await usdTMock.balanceOf(other.address)).to.be.equal(50);
    });

    // Test for wrong destTokenService
    it('should not withdraw for false destTokenService', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.target, 100)).wait();
        await (await proxiedV1.connect(other).transfer(usdcMock.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID)).wait();

        wrongPacket = [
            1,
            1,
            [2, "aleo.TokenService"],
            [7, usdcMock.target],
            ["aleo.SenderAddress", usdcMock.target, 100, other.address],
            100
        ];

        await (await proxiedBridge.connect(attestor).receivePacket(wrongPacket)).wait();
        expect(proxiedV1.connect(other).withdraw(wrongPacket)).to.be.revertedWith('Packet not intended for this Token Service');
    });

    // Test for wrong destTokenAddress
    it('should not withdraw for false destTokenAddress', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.target, 100)).wait();
        await (await proxiedV1.connect(other).transfer(usdcMock.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID)).wait();

        wrongPacket = [
            1,
            1,
            [2, "aleo.TokenService"],
            [7, proxiedV1.target],
            ["aleo.SenderAddress", unsupportedToken.target, 100, other.address],
            100
        ];

        await (await proxiedBridge.connect(attestor).receivePacket(wrongPacket)).wait();
        expect(proxiedV1.connect(other).withdraw(wrongPacket)).to.be.revertedWith('Token not supported');
    });

    //Test for receiving funds for blackListed address
    it('should not withdraw if recevining address is blackListed', async () => {

        //deploying Holding Contract
        const Holding = await ethers.getContractFactory("Holding");
        const holdingImpl = await Holding.deploy();
        await holdingImpl.waitForDeployment();
        const HoldingProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.Interface(holdingImpl.interface.formatJson()).encodeFunctionData("initialize(address,address)", [owner.address, proxiedV1.target]);
        const proxyHolding = await HoldingProxy.deploy(holdingImpl.target, initializeData);
        await proxyHolding.waitForDeployment();
        proxiedHolding = Holding.attach(proxyHolding.target);

        //minting usdc
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.target, 100)).wait();

        //transferring some fund in aleo
        await (await proxiedV1.connect(other).transfer(usdcMock.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID)).wait();


        //set Holding contract in proxiedV1 which is TokenService 
        await (await proxiedV1.setHolding(proxiedHolding.target)).wait();

        //add to blackList 
        await (await usdcMock.addBlackList(other.address)).wait();

        await (await proxiedV1.connect(other).withdraw(inPacket)).wait();
        expect(await usdcMock.balanceOf(proxiedHolding)).to.be.equal(100);
    });

    //Test for withdraw
    it('should withdraw', async () => {
        await (await usdcMock.mint(other.address, 150)).wait();
        await (await usdcMock.connect(other).approve(proxiedV1.target, 100)).wait();
        await (await proxiedV1.connect(other).transfer(usdcMock.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID)).wait();

        expect(await usdcMock.balanceOf(proxiedV1)).to.be.equal(100);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(50);


        await (await proxiedV1.connect(other).withdraw(inPacket)).wait();
        expect(await usdcMock.balanceOf(proxiedV1)).to.be.equal(0);
        expect(await usdcMock.balanceOf(other.address)).to.be.equal(150);
    });
});

// Define the test suite for ERC20TokenBridgeV2
describe('Upgradeabilty: ERC20TokenServiceV2', () => {
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

    // Deploy a new ERC20TokenServiceV2 contract before each test
    beforeEach(async () => {
        [owner, signer, other] = await ethers.getSigners();
        const chainId = 7;

        lib = await ethers.getContractFactory("PacketLibrary", { from: signer.address });
        const libInstance = await lib.deploy();
        await libInstance.waitForDeployment();

        ERC20TokenBridge = await ethers.getContractFactory("ERC20TokenBridge", {
            libraries: {
                PacketLibrary: libInstance.target,
            }
        });
        erc20TokenBridge = await ERC20TokenBridge.deploy();
        await erc20TokenBridge.waitForDeployment();
        // console.log("erc20TokenBridge = ", erc20TokenBridge.target);

        USDCMock = await ethers.getContractFactory("USDCMock");
        usdcMock = await USDCMock.deploy();
        await usdcMock.waitForDeployment();

        USDTMock = await ethers.getContractFactory("USDTMock");
        usdTMock = await USDTMock.deploy();
        await usdTMock.waitForDeployment();

        ERC20TokenServiceV1 = await ethers.getContractFactory("ERC20TokenService");
        ERC20TokenServiceV1Impl = await ERC20TokenServiceV1.deploy();
        await ERC20TokenServiceV1Impl.waitForDeployment();

        ERC20TokenServiceProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.Interface([{
            "inputs": [
                {
                    "internalType": "address",
                    "name": "bridge",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_chainId",
                    "type": "uint256"
                },
                {
                    "internalType": "address",
                    "name": "_usdc",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_usdt",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_owner",
                    "type": "address"
                }
            ],
            "name": "initialize",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }]).encodeFunctionData("initialize(address,uint256,address,address,address)", [erc20TokenBridge.target, chainId, usdcMock.target, usdTMock.target, owner.address]);

        const proxy = await ERC20TokenServiceProxy.deploy(ERC20TokenServiceV1Impl.target, initializeData);
        await proxy.waitForDeployment();
        proxied = ERC20TokenServiceV1.attach(proxy.target);

        ERC20TokenServiceV2 = await ethers.getContractFactory("ERC20TokenServiceV2");

        ERC20TokenServiceV2Impl = await ERC20TokenServiceV2.deploy();
        await ERC20TokenServiceV2Impl.waitForDeployment();
        let ERC20TokenServiceV2ABI = ERC20TokenServiceV2.interface.formatJson();

        upgradeData = new ethers.Interface(ERC20TokenServiceV2ABI).encodeFunctionData("initializev2", [5]);
        await proxied.upgradeToAndCall(ERC20TokenServiceV2Impl.target, upgradeData);
        proxied = ERC20TokenServiceV2.attach(proxy.target);
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

    it('reverts if the contract is initialized twice', async function () {
        expect(proxied.initializev2(100)).to.be.revertedWith('Initializable: contract is already initialized');
    });
});