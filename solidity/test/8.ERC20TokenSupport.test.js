// Import necessary libraries
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;

// Define the test suite
describe('ERC20TokenSupport', () => {
    let owner, otherAccount, tokenSupportImpl, ERC20TokenSupport, ERC20TokenSupportProxy, initializeData, proxiedContract, lib;

    // Deploy a new ERC20TokenSupport contract before each test
    beforeEach(async () => {
        [owner, otherAccount] = await ethers.getSigners();

        ERC20TokenSupport = await ethers.getContractFactory("ERC20TokenSupport");
        tokenSupportImpl = await ERC20TokenSupport.deploy();
        await tokenSupportImpl.waitForDeployment();
        let ERC20TokenSupportABI = ERC20TokenSupport.interface.formatJson();

        ERC20TokenSupportProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.Interface(ERC20TokenSupportABI).encodeFunctionData("initialize", [owner.address]);
        const proxy = await ERC20TokenSupportProxy.deploy(tokenSupportImpl.target, initializeData);
        await proxy.waitForDeployment();
        proxiedContract = ERC20TokenSupport.attach(proxy.target);
    });

    // Test deployment and initialization
    it('should deploy and initialize with the correct owner', async () => {
        const contractOwner = await proxiedContract.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    // Test adding a token
    it('should add a token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;
        const destTokenAddress = "0x123";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)).wait();

        // Check if the token was added
        const isSupported = await proxiedContract.isSupportedToken(tokenAddress, destChainId);
        expect(isSupported).to.be.true;

        // Check if the added token matches the expected values
        const addedToken = await proxiedContract.supportedTokens(tokenAddress);
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
    it('should revert when trying to add an existing token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;
        const destTokenAddress = "0x123";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add a token
        await (await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)).wait();

        // Attempt to add the same token again
        expect(proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)).to.be.revertedWith("Token already supported");
    });

    // Test removing a token
    it('should remove a token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;
        const destTokenAddress = "0x123";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)).wait();

        // Remove token
        await (await proxiedContract.removeToken(tokenAddress, destChainId)).wait();

        // Check if the token was removed
        const isSupported = await proxiedContract.isSupportedToken(tokenAddress, destChainId);
        expect(isSupported).to.be.false;
    });

    // Test attempting to remove a non-existing token
    it('should revert when trying to remove a non-existing token', async () => {
        const nonExistingToken = ethers.Wallet.createRandom().address;

        // Attempt to remove a non-existing token
        expect(proxiedContract.removeToken(nonExistingToken, 1)).to.be.revertedWith('Token not supported');
    });

    // ...

    // Test isSupportedToken function
    it('should return true for a supported token and matching destChainId', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;
        const destTokenAddress = "0x123";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)).wait();

        // Check if the token is supported for the specified destChainId
        const isSupported = await proxiedContract["isSupportedToken(address, uint256)"](tokenAddress, destChainId);
        expect(isSupported).to.be.true;
    });

    it('should return false for a supported token and non-matching destChainId', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;
        const destTokenAddress = "0x123";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)).wait();

        // Check if the token is not supported for a different destChainId
        const nonMatchingDestChainId = 2;
        const isSupported = await proxiedContract["isSupportedToken(address, uint256)"](tokenAddress, nonMatchingDestChainId);
        expect(isSupported).to.be.false;
    });

    it('should return false for a non-existing token and any destChainId', async () => {
        const nonExistingToken = ethers.Wallet.createRandom().address;
        const destChainId = 1;

        // Check if the non-existing token is not supported for any destChainId
        const isSupported = await proxiedContract["isSupportedToken(address, uint256)"](nonExistingToken, destChainId);
        expect(isSupported).to.be.false;
    });

    // Test onlyOwner modifier for addToken function
    it('should allow only owner to add a token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;
        const destTokenAddress = '0x123';
        const destTokenService = 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27';
        const min = 1;
        const max = 100;

        // Add token with the owner
        await (await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)).wait();
    });

    it('should revert when non-owner tries to add a token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;
        const destTokenAddress = '0x123';
        const destTokenService = 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27';
        const min = 1;
        const max = 100;

        // Try to add token with another account and expect it to revert
        expect(proxiedContract.connect(otherAccount).addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)).to.be.revertedWith("Not owner");
    });

    // Test onlyOwner modifier for removeToken function
    it('should allow only owner to remove a token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 2;
        const destTokenAddress = '0x123';
        const destTokenService = 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27';
        const min = 1;
        const max = 100;

        // Add token with the owner
        await (await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)).wait();

        // Owner tries to remove the token 
        await (await proxiedContract.removeToken(tokenAddress, destChainId)).wait();
    });

    it('should revert when non-owner tries to remove a token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 2;
        const destTokenAddress = '0x123';
        const destTokenService = 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27';
        const min = 1;
        const max = 100;

        // Add token with the owner
        await (await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)).wait();

        // Try to remove token with another account and expect it to revert
        expect(
            proxiedContract.connect(otherAccount).removeToken(tokenAddress, destChainId)
        ).to.be.revertedWith("Not owner");
    });

    // Test enable function
    it('only owner can enable a supported token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;
        const destTokenAddress = "0x123";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)).wait();

        // Enable the token
        await (await proxiedContract.enable(tokenAddress, destChainId)).wait();

        // Check if the token is enabled
        const isEnabled = await proxiedContract.isEnabledToken(tokenAddress, destChainId);
        expect(isEnabled).to.be.true;
    });

    it('should revert when enabling an unsupported token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;

        // Try to Enable an unsupported token
        expect(proxiedContract.enable(tokenAddress, destChainId)).to.be.revertedWith("Token not supported");
    });

    it('should revert when non-owner tries to enable a supported token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;
        const destTokenAddress = "0x123";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)).wait();

        // Enable the token
        expect(proxiedContract.connect(otherAccount).enable(tokenAddress, destChainId)).to.be.revertedWith("Not owner");

        // Check if the token is enabled
        const isEnabled = await proxiedContract.isEnabledToken(tokenAddress, destChainId);
        expect(isEnabled).to.be.true;
    });

    // Test disable function
    it('only owner should disable an enabled token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;
        const destTokenAddress = "0x123";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)).wait();

        // Enable the token
        await (await proxiedContract.enable(tokenAddress, destChainId)).wait();
        // Disable the token
        await (await proxiedContract.disable(tokenAddress, destChainId)).wait();
        const isEnabled = await proxiedContract.isEnabledToken(tokenAddress, destChainId);

        // Check if the token is disabled
        expect(isEnabled).to.be.false;
    });

    it('should revert when owner tires to disable an unenabled token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 2;
        const destTokenAddress = "0x123";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)).wait();

        // Disable the token
        await (await proxiedContract.disable(tokenAddress, destChainId)).wait();
        expect(proxiedContract.disable(tokenAddress, destChainId)).to.be.revertedWith("Token not enabled");
        const isEnabled = await proxiedContract.isEnabledToken(tokenAddress, destChainId);
        // // Check if the token is disabled
        expect(isEnabled).to.be.false;
    });

    it('should revert when non-owner tries to disable an enabled token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;
        const destTokenAddress = "0x123";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)).wait();

        // Enable the token
        await (await proxiedContract.enable(tokenAddress, destChainId)).wait();
        // Disable the token
        expect(proxiedContract.connect(otherAccount).disable(tokenAddress, destChainId)).to.be.revertedWith("Not owner");
    });

    // Test TokenRemoved event
    it('should emit TokenRemoved event when removing a token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 2;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, "0x123", "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", 1, 100)).wait();

        await expect(
            proxiedContract.removeToken(tokenAddress, destChainId)
        ).to.emit(proxiedContract, 'TokenRemoved')
            .withArgs(tokenAddress, destChainId);
    });

    // Test TokenEnabled event
    it('should emit TokenEnabled event when enabling a token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 2;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, "0x123", "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", 1, 100)).wait();

        await expect(
            proxiedContract.enable(tokenAddress, destChainId)
        ).to.emit(proxiedContract, 'TokenEnabled')
            .withArgs(tokenAddress, destChainId);
    });

    // Test TokenDisabled event
    it('should emit TokenDisabled event when disabling a token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 2;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, "0x123", "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", 1, 100)).wait();

        // Enable the token
        await (await proxiedContract.enable(tokenAddress, destChainId)).wait();

        await expect(
            proxiedContract.disable(tokenAddress, destChainId)
        ).to.emit(proxiedContract, 'TokenDisabled')
            .withArgs(tokenAddress, destChainId);
    });
});
