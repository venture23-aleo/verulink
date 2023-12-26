// Import necessary libraries
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;
import { ERC20TokenSupportABI } from "../scripts/ABI/ABI.js"

// Define the test suite
describe('ERC20TokenSupport', () => {
    let owner, otherAccount, tokenSupportImpl, ERC20TokenSupport, ERC20TokenSupportProxy, initializeData, proxiedContract, lib;

    // Deploy a new ERC20TokenSupport contract before each test
    beforeEach(async () => {
        [owner, otherAccount] = await ethers.getSigners();

        ERC20TokenSupport = await ethers.getContractFactory("ERC20TokenSupport");
        tokenSupportImpl = await ERC20TokenSupport.deploy();
        ERC20TokenSupportProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.Interface(ERC20TokenSupportABI).encodeFunctionData("initialize", [owner.address]);
        const proxy = await ERC20TokenSupportProxy.deploy(tokenSupportImpl.target, initializeData);
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
        const destTokenService = "aleo.bridge";
        const min = 1;
        const max = 100;

        // Add token
        await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max);

        // Check if the token was added
        const isSupported = await proxiedContract.isSupportedToken(tokenAddress);
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
    // it('should revert when trying to add an existing token', async () => {
    //     const tokenAddress = ethers.Wallet.createRandom().address;
    //     const destChainId = 1;
    //     const destTokenAddress = "0x123";
    //     const destTokenService = "aleo.bridge";
    //     const min = 1;
    //     const max = 100;

    //     // Add a token
    //     await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max);
    //     console.log("hello");

    //     // Attempt to add the same token again
    //     await expect(proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max))
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
        await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max);

        // Remove token
        await proxiedContract.removeToken(tokenAddress);

        // Check if the token was removed
        const isSupported = await proxiedContract.isSupportedToken(tokenAddress);
        expect(isSupported).to.be.false;
    });

    // Test attempting to remove a non-existing token
    it('should revert when trying to remove a non-existing token', async () => {
        const nonExistingToken = ethers.Wallet.createRandom().address;

        // Attempt to remove a non-existing token
        await expect(proxiedContract.removeToken(nonExistingToken)).to.be.revertedWith('Token not supported');
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
    await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max);

    // Check if the token is supported for the specified destChainId
    const isSupported = await proxiedContract["isSupportedToken(address, uint256)"](tokenAddress, destChainId);
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
    await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max);

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
        const destTokenService = 'aleo.bridge';
        const min = 1;
        const max = 100;

        // Add token with the owner
        await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max);

        // Try to add token with another account and expect it to revert
        await expect(
            proxiedContract.connect(otherAccount).addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max)
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
        await proxiedContract.addToken(tokenAddress, destChainId, destTokenAddress, destTokenService, min, max);

        // Try to remove token with another account and expect it to revert
        await expect(
            proxiedContract.connect(otherAccount).removeToken(tokenAddress)
        ).to.be.reverted;
    });

});
