// Import necessary libraries
// const { expect } = require('chai');
// const { ethers } = require('hardhat');
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;

// Define the test suite
describe('ERC20TokenService', () => {
    let proxiedHolding, wrongPacket, attestor, inPacket, Proxied, lib, proxy, bridge, proxiedBridge, initializeData, ERC20TokenBridge, erc20TokenBridge, owner, proxiedV1, ERC20TokenService, ERC20TokenServiceImpl, ERC20TokenServiceProxy, signer,  USDCMock, usdcMock, USDTMock, usdTMock, chainId, other, UnSupportedToken, unsupportedToken;

    let destchainID = 2;

    beforeEach(async () => {
        [owner, signer, bridge, other, attestor] = await ethers.getSigners();
        chainId  = 7;

        // Deploy ERC20TokenBridge
        lib = await ethers.getContractFactory("PacketLibrary", { from: signer.address });
        const libInstance = await lib.deploy();

        ERC20TokenBridge = await ethers.getContractFactory("ERC20TokenBridge", {libraries: {
            PacketLibrary: libInstance.target,
        }});
        erc20TokenBridge = await ERC20TokenBridge.deploy();

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
        proxiedBridge = ERC20TokenBridge.attach(proxy.target);


        USDCMock = await ethers.getContractFactory("USDCMock");
        usdcMock = await USDCMock.deploy();

        USDTMock = await ethers.getContractFactory("USDTMock");
        usdTMock = await USDTMock.deploy();

        UnSupportedToken =  await ethers.getContractFactory("USDCMock");
        unsupportedToken = await UnSupportedToken.deploy();

        ERC20TokenService = await ethers.getContractFactory("ERC20TokenService");

        ERC20TokenServiceImpl = await ERC20TokenService.deploy();

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
        proxiedV1 = await ERC20TokenService.attach(proxy.target);
        await proxiedV1.connect(owner).addToken(usdcMock.target, destchainID, "aleo.TokenAddress", "aleo.TokenService", 1, 100000000000);

        await proxiedBridge.connect(owner).addTokenService(proxiedV1.target);
        await proxiedBridge.connect(owner).addChain(destchainID, "aleo.BridgeAddress");

        await proxiedBridge.connect(owner).addAttestor(attestor.address, 1);

        inPacket = [
            1,
            1,
            [2, "aleo.TokenService"],
            [7, proxiedV1.target],
            ["aleo.SenderAddress", usdcMock.target, 100, other.address],
            100
        ];

        await proxiedBridge.connect(attestor).receivePacket(inPacket);
    });

    // Test deployment and initialization
    it('should deploy and initialize with the correct owner', async () => {
        const contractOwner = await proxiedV1.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    // Test that only the owner can update the token service
    it('should allow only owner to set the holding contract', async () => {
            const newHoldingContract = ethers.Wallet.createRandom().address;
    
            // Update Holding contract with the owner
            await proxiedV1.setHolding(newHoldingContract);
    
            // Try to Holding contract with another account and expect it to revert
            await expect(
                proxiedV1.connect(other).setHolding(newHoldingContract)
            ).to.be.reverted;
    });

    //Test for transfer of blackListed address
    it('should not allow blackListed address for transfer', async () => {
        // Mock USDC and USDT contracts to simulate blacklisting
        await usdcMock.addBlackList(other.address);

        await expect(proxiedV1.connect(other).transfer(usdcMock.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID)).to.be.revertedWith("Sender Blacklisted");
    });


    // Test for unsupported tokens while transfer
    it('should not allow unsupported token for transfer', async () => {
        await expect(proxiedV1.connect(other).transfer(unsupportedToken.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID)).to.be.revertedWith("Unknown token Address");
    });


    // Test for negative transfer
    it('should not transfer if he has less balance than inserted amount', async () => {
        await expect(proxiedV1.connect(other).transfer(usdcMock.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID)).to.be.reverted;
    });


    // Test for transfer
    it('should transfer', async () => {
        await usdcMock.mint(other.address, 150);
        await usdcMock.connect(other).approve(proxiedV1.target, 100);
        await proxiedV1.connect(other).transfer(usdcMock.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID);
        expect (await usdcMock.balanceOf(proxiedV1)).to.be.equal(100);
        expect (await usdcMock.balanceOf(other.address)).to.be.equal(50);
    });


    // Test for wrong destTokenService
    it('should not withdraw for false destTokenService', async() =>{
        await usdcMock.mint(other.address, 150);
        await usdcMock.connect(other).approve(proxiedV1.target, 100);
        await proxiedV1.connect(other).transfer(usdcMock.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID);

        wrongPacket = [
            1,
            1,
            [2, "aleo.TokenService"],
            [7, usdcMock.target],
            ["aleo.SenderAddress", usdcMock.target, 100, other.address],
            100
        ];

        await proxiedBridge.connect(attestor).receivePacket(wrongPacket);
        await expect (proxiedV1.connect(other).withdraw(wrongPacket)).to.be.revertedWith('Packet not intended for this Token Service');
    });

        // Test for wrong destTokenAddress
    it('should not withdraw for false destTokenAddress', async() =>{
        await usdcMock.mint(other.address, 150);
        await usdcMock.connect(other).approve(proxiedV1.target, 100);
        await proxiedV1.connect(other).transfer(usdcMock.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID);

        wrongPacket = [
            1,
            1,
            [2, "aleo.TokenService"],
            [7, proxiedV1.target],
            ["aleo.SenderAddress", unsupportedToken.target, 100, other.address],
            100
        ];

        await proxiedBridge.connect(attestor).receivePacket(wrongPacket);
        expect (proxiedV1.connect(other).withdraw(wrongPacket)).to.be.revertedWith('Token not supported');
    });

    //Test for receiving funds for blackListed address
    it('should not withdraw if recevining address is blackListed', async() =>{

        //deploying Holding Contract
        const Holding = await ethers.getContractFactory("Holding");
        const holdingImpl = await Holding.deploy();
        const HoldingProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.Interface(holdingImpl.interface.formatJson()).encodeFunctionData("initialize(address,address)", [owner.address, proxiedV1.target]);
        const proxyHolding = await HoldingProxy.deploy(holdingImpl.target, initializeData);
        proxiedHolding = Holding.attach(proxyHolding.target);

        //minting usdc
        await usdcMock.mint(other.address, 150);
        await usdcMock.connect(other).approve(proxiedV1.target, 100);

        //transferring some fund in aleo
        await proxiedV1.connect(other).transfer(usdcMock.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID);


        //set Holding contract in proxiedV1 which is TokenService 
        await proxiedV1.setHolding(proxiedHolding.target);

        //add to blackList 
        await usdcMock.addBlackList(other.address);

        await proxiedV1.connect(other).withdraw(inPacket);
        expect (await usdcMock.balanceOf(proxiedHolding)).to.be.equal(100);


    });

    //Test for withdraw
    it('should withdraw', async() =>{
        await usdcMock.mint(other.address, 150);
        await usdcMock.connect(other).approve(proxiedV1.target, 100);
        await proxiedV1.connect(other).transfer(usdcMock.target, 100, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", destchainID);

        expect (await usdcMock.balanceOf(proxiedV1)).to.be.equal(100);
        expect (await usdcMock.balanceOf(other.address)).to.be.equal(50);


        await proxiedV1.connect(other).withdraw(inPacket);
        expect (await usdcMock.balanceOf(proxiedV1)).to.be.equal(0);
        expect (await usdcMock.balanceOf(other.address)).to.be.equal(150);
    }); 
});