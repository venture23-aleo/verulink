// Import necessary libraries
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;

// Define the test suite
describe('BridgeTokenServiceManager', () => {
    let owner, other, BridgeTokenServiceManager, bridgeTokenServiceManagerImpl, BridgeTokenServiceManagerProxy, initializeData, lib, proxiedV1;

    // Deploy a new BridgeTokenServiceManager contract before each test
    beforeEach(async () => {
        [owner, other] = await ethers.getSigners();

        BridgeTokenServiceManager = await ethers.getContractFactory("BridgeTokenServiceManager");
        let BridgeTokenServiceManagerABI = BridgeTokenServiceManager.interface.formatJson();

        bridgeTokenServiceManagerImpl = await BridgeTokenServiceManager.deploy();
        BridgeTokenServiceManagerProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.Interface(BridgeTokenServiceManagerABI).encodeFunctionData("initialize", [owner.address]);
        const proxy = await BridgeTokenServiceManagerProxy.deploy(bridgeTokenServiceManagerImpl.target, initializeData);
        proxiedV1 = BridgeTokenServiceManager.attach(proxy.target);
    });

    // Test deployment and initialization
    it('should deploy and initialize with the correct owner', async () => {
        const contractOwner = await proxiedV1.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    // Test adding a token service
    it('should add a token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;

        // Add token service
        await proxiedV1.addTokenService(newTokenService);

        // Check if the token service was added
        const isRegistered = await proxiedV1.isRegisteredTokenService(newTokenService);
        expect(isRegistered).to.be.true;
    });

    // Test attempting to add an existing token service
    it('should revert when trying to add an existing token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;

        // Add token service
        await proxiedV1.addTokenService(newTokenService);
        // Attempt to add an existing token service
        await expect(proxiedV1.addTokenService(newTokenService)).to.be.revertedWith('Token Service already exists');
    });

    // Test attempting to add a token service with zero address
    it('should revert when trying to add a token service with zero address', async () => {
        // Attempt to add a token service with zero address
        await expect(proxiedV1.addTokenService(ethers.ZeroAddress)).to.be.revertedWith('Zero Address');
    });

    // Test removing a token service
    it('should remove a token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;

        // Add token service
        await proxiedV1.addTokenService(newTokenService);

        // Remove token service
        await proxiedV1.removeTokenService(newTokenService);

        // Check if the token service was removed
        const isRegistered = await proxiedV1.isRegisteredTokenService(newTokenService);
        expect(isRegistered).to.be.false;
    });

    // Test attempting to remove a non-existing token service
    it('should revert when trying to remove a non-existing token service', async () => {
        const nonExistingTokenService = ethers.Wallet.createRandom().address;

        // Attempt to remove a non-existing token service
        await expect(proxiedV1.removeTokenService(nonExistingTokenService)).to.be.revertedWith('Unknown Token Service');
    });

    // Test attempting to remove a token service with zero address
    it('should revert when trying to remove a token service with zero address', async () => {
        // Attempt to remove a token service with zero address
        await expect(proxiedV1.removeTokenService(ethers.ZeroAddress)).to.be.revertedWith('Unknown Token Service');
    });

    it('should emit TokenServiceAdded event when adding a new token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;

        const addTokenServiceTx = await proxiedV1.addTokenService(newTokenService);

        // Check event emission
        await expect(addTokenServiceTx)
            .to.emit(proxiedV1, 'TokenServiceAdded')
            .withArgs(newTokenService);
    });

    it('should emit TokenServiceRemoved event when removing an existing token service', async () => {
        const existingTokenService = ethers.Wallet.createRandom().address;

        // Add token service first
        await proxiedV1.addTokenService(existingTokenService);

        const removeTokenServiceTx = await proxiedV1.removeTokenService(existingTokenService);

        // Check event emission
        await expect(removeTokenServiceTx)
            .to.emit(proxiedV1, 'TokenServiceRemoved')
            .withArgs(existingTokenService);
    });

    // Test that only the owner can add a token service
    it('should allow only owner to add a token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;

        // Add token service with the owner
        await proxiedV1.addTokenService(newTokenService);

        // Try to add token service with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).addTokenService(newTokenService)
        ).to.be.reverted;
    });

    // Test that only the owner can remove a token service
    it('should allow only owner to remove a token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;

        // Add token service with the owner
        await proxiedV1.addTokenService(newTokenService);

        // Try to remove token service with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).removeTokenService(newTokenService)
        ).to.be.reverted;
    });
});
