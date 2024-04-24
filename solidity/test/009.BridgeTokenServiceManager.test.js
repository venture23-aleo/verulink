// Import necessary libraries
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;

// Define the test suite
describe('BridgeTokenServiceManager', () => {
    let owner, other, BridgeTokenServiceManager, bridgeTokenServiceManagerImpl, BridgeTokenServiceManagerProxy, initializeData, aleolib, proxiedV1;

    // Deploy a new BridgeTokenServiceManager contract before each test
    beforeEach(async () => {
        [owner, other] = await ethers.getSigners();
        const lib = await ethers.getContractFactory("PacketLibrary", { from: owner.address });
        const libInstance = await lib.deploy();
        await libInstance.deployed();

        aleolib = await ethers.getContractFactory("AleoAddressLibrary", { from: owner.address });
        const aleoLibInstance = await aleolib.deploy();
        await aleoLibInstance.deployed();

        BridgeTokenServiceManager = await ethers.getContractFactory("Bridge",{
            libraries: {
                PacketLibrary: libInstance.address,
                AleoAddressLibrary: aleoLibInstance.address,
            },
        });
        let BridgeTokenServiceManagerABI = BridgeTokenServiceManager.interface.format();

        bridgeTokenServiceManagerImpl = await BridgeTokenServiceManager.deploy();
        await bridgeTokenServiceManagerImpl.deployed();
        BridgeTokenServiceManagerProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(BridgeTokenServiceManagerABI).encodeFunctionData("Bridge_init", [2]);
        const proxy = await BridgeTokenServiceManagerProxy.deploy(bridgeTokenServiceManagerImpl.address, initializeData);
        await proxy.deployed();
        proxiedV1 = BridgeTokenServiceManager.attach(proxy.address);
    });

    // Test deployment and initialization
    it('should deploy and initialize with the correct owner', async () => {
        const contractOwner = await proxiedV1.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    it('reverts if the contract is already initialized', async function () {
        initializeData = new ethers.utils.Interface(BridgeTokenServiceManager.interface.format())
            .encodeFunctionData("BridgeTokenServiceManager_init", []);
        const proxy = await BridgeTokenServiceManagerProxy.deploy(bridgeTokenServiceManagerImpl.address, initializeData);
        await proxy.deployed();
        await expect(proxiedV1["BridgeTokenServiceManager_init"]())
            .to.be.revertedWith('Initializable: contract is already initialized');
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
        await expect(proxiedV1.addTokenService(newTokenService)).to.be.revertedWith('BridgeTokenServiceManager: token service already exists');
    });

    // Test attempting to add a token service with zero address
    it('should revert when trying to add a token service with zero address', async () => {
        // Attempt to add a token service with zero address
        await expect(proxiedV1.addTokenService(ethers.constants.AddressZero)).to.be.revertedWith('BridgeTokenServiceManager: zero address');
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
        await expect(proxiedV1.removeTokenService(nonExistingTokenService)).to.be.revertedWith('BridgeTokenServiceManager: unknown token service');
    });

    // Test attempting to remove a token service with zero address
    it('should revert when trying to remove a token service with zero address', async () => {
        // Attempt to remove a token service with zero address
        await expect(proxiedV1.removeTokenService(ethers.constants.AddressZero)).to.be.revertedWith('BridgeTokenServiceManager: unknown token service');
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
        await (await proxiedV1.addTokenService(existingTokenService)).wait();

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
        await (await proxiedV1.addTokenService(newTokenService)).wait();

        // Try to add token service with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).addTokenService(newTokenService)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    // Test that only the owner can remove a token service
    it('should allow only owner to remove a token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;

        // Add token service with the owner
        await (await proxiedV1.addTokenService(newTokenService)).wait();

        // Try to remove token service with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).removeTokenService(newTokenService)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });
});
