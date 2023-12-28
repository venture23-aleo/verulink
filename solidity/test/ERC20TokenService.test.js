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

    //----------------- BlackListService ----------------

    it("should add to and remove from the black list", async () => {
        // Check initial status
        expect(await proxiedV1.isBlackListed(other.address)).to.be.false;

        // Add to the black list
        await proxiedV1.addToBlackList(other.address);

        // Check if added
        expect(await proxiedV1.isBlackListed(other.address)).to.be.true;

        // Remove from the black list
        await proxiedV1.removeFromBlackList(other.address);

        // Check if removed
        expect(await proxiedV1.isBlackListed(other.address)).to.be.false;
    });

    it("should add to and remove from the black list for usdc", async () => {
        // Check initial status
        expect(await proxiedV1.isBlackListed(other.address)).to.be.false;

        // Add to the black list
        await usdcMock.addBlackList(other.address);

        // Check if added
        expect(await proxiedV1.isBlackListed(other.address)).to.be.true;

        // Remove from the black list
        await usdcMock.removeBlackList(other.address);

        // Check if removed
        expect(await proxiedV1.isBlackListed(other.address)).to.be.false;
    });

    it("should add to and remove from the black list for usdt", async () => {
        // Check initial status
        expect(await proxiedV1.isBlackListed(other.address)).to.be.false;

        // Add to the black list
        await usdTMock.addBlackList(other.address);

        // Check if added
        expect(await proxiedV1.isBlackListed(other.address)).to.be.true;

        // Remove from the black list
        await usdTMock.removeBlackList(other.address);

        // Check if removed
        expect(await proxiedV1.isBlackListed(other.address)).to.be.false;
    });

    it("should allow only owner to add to the black list", async () => {
        // Try to add to the black list with the owner
        await proxiedV1.connect(owner).addToBlackList(other.address);

        // Check if the account is added to the black list
        expect(await proxiedV1.isBlackListed(other.address)).to.be.true;

        // Try to add to the black list with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).addToBlackList(owner.address)
        ).to.be.reverted;
    });

    it("should allow only owner to remove from the black list", async () => {
        // Add to the black list with the owner
        await proxiedV1.connect(owner).addToBlackList(other.address);

        // Try to remove from the black list with the owner
        await proxiedV1.connect(owner).removeFromBlackList(other.address);

        // Check if the account is removed from the black list
        expect(await proxiedV1.isBlackListed(other.address)).to.be.false;

        // Try to remove from the black list with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).removeFromBlackList(owner.address)
        ).to.be.reverted;
    });

    it("should include USDC and USDT blacklists", async () => {
        // Mock USDC and USDT contracts to simulate blacklisting
        await usdcMock.addBlackList(other.address);

        // Check if blacklisted in BlackListService
        expect(await proxiedV1.isBlackListed(other.address)).to.be.true;

        // Remove from blacklists
        await usdcMock.removeBlackList(other.address);

        // Check if removed from BlackListService
        expect(await proxiedV1.isBlackListed(other.address)).to.be.false;
    });


    //-------------- ERC20TokenSupport-----------

    it('should add a token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;
        const destTokenAddress = "0x123";
        const destTokenService = "aleo.bridge";
        const min = 1;
        const max = 100;

        // Add token
        await proxiedV1.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max);

        // Check if the token was added
        const isSupported = await proxiedV1.isSupportedToken(tokenAddress);
        expect(isSupported).to.be.true;

        // Check if the added token matches the expected values
        const addedToken = await proxiedV1.supportedTokens(tokenAddress);
        expect(addedToken.tokenAddress).to.equal(tokenAddress);
        expect(addedToken.destTokenAddress.chainId).to.equal(destChainId);
        expect(addedToken.destTokenAddress.addr).to.equal(destTokenAddress);
        expect(addedToken.destTokenService.chainId).to.equal(destChainId);
        expect(addedToken.destTokenService.addr).to.equal(destTokenService);
        expect(addedToken.minValue).to.equal(min);
        expect(addedToken.maxValue).to.equal(max);
        expect(addedToken.enabled).to.be.true;
    });

    // Test attempting to add an existing token
    // it('should revert when trying to add an existing token', async () => {
    //     const tokenAddress = ethers.Wallet.createRandom().address;
    //     const destChainId = 1;
    //     const destTokenAddress = "0x123";
    //     const destTokenService = "aleo.bridge";
    //     const min = 1;
    //     const max = 100;

    //     // Add a token
    //     await proxiedV1.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max);
    //     console.log("hello");

    //     // Attempt to add the same token again
    //     await expect(proxiedV1.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max))
    //         .to.be.revertedWith('Token already supported');
    // });

    // Test removing a token
    it('should remove a token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;
        const destTokenAddress = "0x123";
        const destTokenService = "aleo.bridge";
        const min = 1;
        const max = 100;

        // Add token
        await proxiedV1.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max);

        // Remove token
        await proxiedV1.removeToken(tokenAddress);

        // Check if the token was removed
        const isSupported = await proxiedV1.isSupportedToken(tokenAddress);
        expect(isSupported).to.be.false;
    });

    // Test attempting to remove a non-existing token
    it('should revert when trying to remove a non-existing token', async () => {
        const nonExistingToken = ethers.Wallet.createRandom().address;

        // Attempt to remove a non-existing token
        await expect(proxiedV1.removeToken(nonExistingToken)).to.be.revertedWith('Token not supported');
    });

    // ...

// Test isSupportedToken function
it('should return true for a supported token and matching destChainId', async () => {
    const tokenAddress = ethers.Wallet.createRandom().address;
    const destChainId = 1;
    const destTokenAddress = "0x123";
    const destTokenService = "aleo.bridge";
    const min = 1;
    const max = 100;

    // Add token
    await proxiedV1.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max);

    // Check if the token is supported for the specified destChainId
    const isSupported = await proxiedV1["isSupportedToken(address, uint256)"](tokenAddress, destChainId);
    expect(isSupported).to.be.true;
});

it('should return false for a supported token and non-matching destChainId', async () => {
    const tokenAddress = ethers.Wallet.createRandom().address;
    const destChainId = 1;
    const destTokenAddress = "0x123";
    const destTokenService = "aleo.bridge";
    const min = 1;
    const max = 100;

    // Add token
    await proxiedV1.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max);

    // Check if the token is not supported for a different destChainId
    const nonMatchingDestChainId = 2;
    const isSupported = await proxiedV1["isSupportedToken(address, uint256)"](tokenAddress, nonMatchingDestChainId);
    expect(isSupported).to.be.false;
});

it('should return false for a non-existing token and any destChainId', async () => {
    const nonExistingToken = ethers.Wallet.createRandom().address;
    const destChainId = 1;

    // Check if the non-existing token is not supported for any destChainId
    const isSupported = await proxiedV1["isSupportedToken(address, uint256)"](nonExistingToken, destChainId);
    expect(isSupported).to.be.false;
});

    // Test onlyOwner modifier for addToken function
    it('should allow only owner to add a token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;
        const destTokenAddress = '0x123';
        const destTokenService = 'aleo.bridge';
        const min = 1;
        const max = 100;

        // Add token with the owner
        await proxiedV1.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max);

        // Try to add token with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)
        ).to.be.reverted;
    });

    // Test onlyOwner modifier for removeToken function
    it('should allow only owner to remove a token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;
        const destTokenAddress = '0x123';
        const destTokenService = 'aleo.bridge';
        const min = 1;
        const max = 100;

        // Add token with the owner
        await proxiedV1.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max);

        // Try to remove token with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).removeToken(tokenAddress)
        ).to.be.reverted;
    });
});