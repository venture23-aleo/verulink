// Import necessary libraries
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;
// Define the test suite
describe('Pausable', () => {
    let owner, newOwner, other, PausableImpl, pausableInstance, pausable, OwnableImpl, ownableInstance, Proxy, initializeData, proxiedOwner;

    // Deploy a new Pausable contract before each test
    beforeEach(async () => {
        [owner, newOwner, other] = await ethers.getSigners();
        PausableImpl = await ethers.getContractFactory('PausableMock');
        pausableInstance = await PausableImpl.deploy();
        await pausableInstance.deployed();
        Proxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(PausableImpl.interface.format()).encodeFunctionData("Pausable_init", [owner.address]);
        const proxy = await Proxy.deploy(pausableInstance.address, initializeData);
        await proxy.deployed();
        proxiedOwner = PausableImpl.attach(proxy.address);
    });

    // Test deployment and initialization
    it('should initialize contract with the correct owner', async () => {
        const contractOwner = await proxiedOwner.connect(owner).owner();
        expect(contractOwner).to.equal(owner.address);
    });

    // Test for second time initialize and revert
    it('should not initialize contract twice', async () => {
        await expect(proxiedOwner["Pausable_init"](owner.address)).to.be.revertedWithCustomError(proxiedOwner, 'InvalidInitialization');
    });

    it('should start with not paused state', async () => {
        expect(await proxiedOwner.paused()).to.equal(false);
      });

    // it('should call pause() only through proxy', async () => {
    //     expect(pausableInstance.connect(owner).pause()).to.be.reverted;
    // });

    it('should allow owner to pause', async() => {
        await(await proxiedOwner.pause()).wait();
        expect(await proxiedOwner.paused()).to.equal(true);
    });

    it('only owner should pause contract', async() => {
        await expect(proxiedOwner.connect(other).pause()).to.be.revertedWithCustomError(proxiedOwner, "OwnableUnauthorizedAccount");
        expect(await proxiedOwner.paused()).to.equal(false);
    });

    // it('should call unpause() only through proxy', async () => {
    //     expect(pausableInstance.connect(owner).unpause()).to.be.reverted;
    // });

    it('should allow owner to unpause the contract', async () => {
        await(await proxiedOwner.connect(owner).pause()).wait();
        await(await proxiedOwner.connect(owner).unpause()).wait();
        expect(await proxiedOwner.paused()).to.equal(false);
    });

    it('only owner can unpause the contract', async () => {
        await(await proxiedOwner.connect(owner).pause()).wait();
        await expect(proxiedOwner.connect(other).unpause()).to.be.revertedWithCustomError(proxiedOwner, "OwnableUnauthorizedAccount");
        // expect(await proxiedOwner.paused()).to.equal(false);
    });

    it('should prevent actions when paused', async () => {
        await(await proxiedOwner.pause()).wait();
        await expect(proxiedOwner.pause()).to.be.revertedWithCustomError(proxiedOwner, "EnforcedPause");
    });

    it('should prevent actions when unpaused', async () => {
        await expect(proxiedOwner.unpause()).to.be.revertedWithCustomError(proxiedOwner, "ExpectedPause");
    });

});
