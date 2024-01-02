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

        BridgeTokenServiceManager = await ethers.getContractFactory("BridgeERC20TokenServiceManager");
        let BridgeTokenServiceManagerABI = BridgeTokenServiceManager.interface.formatJson();

        bridgeTokenServiceManagerImpl = await BridgeTokenServiceManager.deploy();
        await bridgeTokenServiceManagerImpl.waitForDeployment();
        BridgeTokenServiceManagerProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.Interface(BridgeTokenServiceManagerABI).encodeFunctionData("initialize", [owner.address]);
        const proxy = await BridgeTokenServiceManagerProxy.deploy(bridgeTokenServiceManagerImpl.target, initializeData);
        await proxy.waitForDeployment();
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
        const chainId = 5;

        // Add token service
        await (await proxiedV1.addTokenService(newTokenService, chainId)).wait();

        // Check if the token service was added
        const isRegistered = await proxiedV1.isRegisteredTokenService(newTokenService, chainId);
        expect(isRegistered).to.be.true;
    });

    // Test attempting to add an existing token service
    it('should revert when trying to add an existing token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;
        const chainId = 5;

        // Add token service
        await (await proxiedV1.addTokenService(newTokenService, chainId)).wait();
        // Attempt to add an existing token service
        expect(proxiedV1.addTokenService(newTokenService, chainId)).to.be.revertedWith('Token Service already exists');
    });

    // Test attempting to add a token service with zero address
    it('should revert when trying to add a token service with zero address', async () => {
        // Attempt to add a token service with zero address
        expect(proxiedV1.addTokenService(ethers.ZeroAddress, 5)).to.be.revertedWith('Zero Address');
    });

    // Test removing a token service
    it('should remove a token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;
        const chainId = 5;

        // Add token service
        await (await proxiedV1.addTokenService(newTokenService, chainId)).wait();

        // Remove token service
        await (await proxiedV1.removeTokenService(newTokenService, chainId)).wait();

        // Check if the token service was removed
        const isRegistered = await proxiedV1.isRegisteredTokenService(newTokenService, chainId);
        expect(isRegistered).to.be.false;
    });

    // Test attempting to remove a non-existing token service
    it('should revert when trying to remove a non-existing token service', async () => {
        const nonExistingTokenService = ethers.Wallet.createRandom().address;

        // Attempt to remove a non-existing token service
        expect(proxiedV1.removeTokenService(nonExistingTokenService, 5)).to.be.revertedWith('Unknown Token Service');
    });

    // Test attempting to remove a token service with zero address
    it('should revert when trying to remove a token service with zero address', async () => {
        // Attempt to remove a token service with zero address
        expect(proxiedV1.removeTokenService(ethers.ZeroAddress, 5)).to.be.revertedWith('Unknown Token Service');
    });

    it('should emit TokenServiceAdded event when adding a new token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;
        const chainId = 5;

        const addTokenServiceTx = await (await proxiedV1.addTokenService(newTokenService, chainId)).wait();

        // Check event emission
        expect(addTokenServiceTx)
            .to.emit(proxiedV1, 'TokenServiceAdded')
            .withArgs(newTokenService, chainId);
    });

    it('should emit TokenServiceRemoved event when removing an existing token service', async () => {
        const existingTokenService = ethers.Wallet.createRandom().address;
        const chainId = 5;

        // Add token service first
        await (await proxiedV1.addTokenService(existingTokenService, chainId)).wait();

        const removeTokenServiceTx = await (await proxiedV1.removeTokenService(existingTokenService, chainId)).wait();

        // Check event emission
        expect(removeTokenServiceTx)
            .to.emit(proxiedV1, 'TokenServiceRemoved')
            .withArgs(existingTokenService, chainId);
    });

    // Test that only the owner can add a token service
    it('should allow only owner to add a token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;
        const chainId = 5;

        // Add token service with the owner
        await (await proxiedV1.addTokenService(newTokenService, chainId)).wait();

        // Try to add token service with another account and expect it to revert
        expect(
            proxiedV1.connect(other).addTokenService(newTokenService, chainId)
        ).to.be.reverted;
    });

    // Test that only the owner can remove a token service
    it('should allow only owner to remove a token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;
        const chainId = 5;

        // Add token service with the owner
        await (await proxiedV1.addTokenService(newTokenService, chainId)).wait();

        // Try to remove token service with another account and expect it to revert
        expect(
            proxiedV1.connect(other).removeTokenService(newTokenService, chainId)
        ).to.be.reverted;
    });
});
