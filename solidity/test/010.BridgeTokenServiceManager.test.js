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

        BridgeTokenServiceManager = await ethers.getContractFactory("BridgeTokenServiceManagerMock");
        let BridgeTokenServiceManagerABI = BridgeTokenServiceManager.interface.format();

        bridgeTokenServiceManagerImpl = await BridgeTokenServiceManager.deploy();
        await bridgeTokenServiceManagerImpl.deployed();
        BridgeTokenServiceManagerProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(BridgeTokenServiceManagerABI).encodeFunctionData("BridgeTokenServiceManager_init", []);
        const proxy = await BridgeTokenServiceManagerProxy.deploy(bridgeTokenServiceManagerImpl.address, initializeData);
        await proxy.deployed();
        proxiedV1 = BridgeTokenServiceManager.attach(proxy.address);
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
        await (await proxiedV1.addTokenService(newTokenService)).wait();

        // Check if the token service was added
        const isRegistered = await proxiedV1.isRegisteredTokenService(newTokenService);
        expect(isRegistered).to.be.true;
    });

    // Test adding a token service
    // it('should call isRegisteredTokenService and return bool only through proxy', async () => {
    //     const newTokenService = ethers.Wallet.createRandom().address;

    //     // Add token service
    //     await (await proxiedV1.addTokenService(newTokenService)).wait();

    //     // Check if the token service was added
    //     expect(bridgeTokenServiceManagerImpl.isRegisteredTokenService(newTokenService)).to.be.reverted;
    // });

    // it('should call add token service only through proxy', async () => {
    //     const newTokenService = ethers.Wallet.createRandom().address;

    //     // Add token service
    //     expect(bridgeTokenServiceManagerImpl.addTokenService(newTokenService)).to.be.reverted;
    // });

    // Test attempting to add an existing token service
    it('should revert when trying to add an existing token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;

        // Add token service
        await (await proxiedV1.addTokenService(newTokenService)).wait();
        // Attempt to add an existing token service
        expect(proxiedV1.addTokenService(newTokenService)).to.be.revertedWith('Token Service already exists');
    });

    // Test attempting to add a token service with zero address
    it('should revert when trying to add a token service with zero address', async () => {
        // Attempt to add a token service with zero address
        expect(proxiedV1.addTokenService(ethers.constants.AddressZero)).to.be.revertedWith('Zero Address');
    });

    // Test removing a token service
    it('should remove a token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;

        // Add token service
        await (await proxiedV1.addTokenService(newTokenService)).wait();

        // Remove token service
        await (await proxiedV1.removeTokenService(newTokenService)).wait();

        // Check if the token service was removed
        const isRegistered = await proxiedV1.isRegisteredTokenService(newTokenService);
        expect(isRegistered).to.be.false;
    });

    // it('should call remove a token service only through proxy', async () => {
    //     const newTokenService = ethers.Wallet.createRandom().address;

    //     // Add token service
    //     await (await proxiedV1.addTokenService(newTokenService)).wait();

    //     // Remove token service
    //     expect(bridgeTokenServiceManagerImpl.removeTokenService(newTokenService)).to.be.reverted;
    // });

    // Test attempting to remove a non-existing token service
    it('should revert when trying to remove a non-existing token service', async () => {
        const nonExistingTokenService = ethers.Wallet.createRandom().address;

        // Attempt to remove a non-existing token service
        expect(proxiedV1.removeTokenService(nonExistingTokenService)).to.be.revertedWith('Unknown Token Service');
    });

    // Test attempting to remove a token service with zero address
    it('should revert when trying to remove a token service with zero address', async () => {
        // Attempt to remove a token service with zero address
        expect(proxiedV1.removeTokenService(ethers.constants.AddressZero)).to.be.revertedWith('Unknown Token Service');
    });

    it('should emit TokenServiceAdded event when adding a new token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;

        const addTokenServiceTx = await (await proxiedV1.addTokenService(newTokenService)).wait();

        // Check event emission
        expect(addTokenServiceTx)
            .to.emit(proxiedV1, 'TokenServiceAdded')
            .withArgs(newTokenService);
    });

    it('should emit TokenServiceRemoved event when removing an existing token service', async () => {
        const existingTokenService = ethers.Wallet.createRandom().address;

        // Add token service first
        await (await proxiedV1.addTokenService(existingTokenService)).wait();

        const removeTokenServiceTx = await (await proxiedV1.removeTokenService(existingTokenService)).wait();

        // Check event emission
        expect(removeTokenServiceTx)
            .to.emit(proxiedV1, 'TokenServiceRemoved')
            .withArgs(existingTokenService);
    });

    // Test that only the owner can add a token service
    it('should allow only owner to add a token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;

        // Add token service with the owner
        await (await proxiedV1.addTokenService(newTokenService)).wait();

        // Try to add token service with another account and expect it to revert
        expect(
            proxiedV1.connect(other).addTokenService(newTokenService)
        ).to.be.reverted;
    });

    // Test that only the owner can remove a token service
    it('should allow only owner to remove a token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;

        // Add token service with the owner
        await (await proxiedV1.addTokenService(newTokenService)).wait();

        // Try to remove token service with another account and expect it to revert
        expect(
            proxiedV1.connect(other).removeTokenService(newTokenService)
        ).to.be.reverted;
    });
});
