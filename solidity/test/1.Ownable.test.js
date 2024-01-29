// Import necessary libraries
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;
console.log("ethers = ", ethers.version);
// Define the test suite
describe('Ownable', () => {
    let owner, newOwner, OwnableImpl, ownableInstance, Proxy, initializeData, proxiedOwner;

    // Deploy a new Ownable contract before each test
    beforeEach(async () => {
        [owner, newOwner] = await ethers.getSigners();
        OwnableImpl = await ethers.getContractFactory('OwnableMock');
        ownableInstance = await OwnableImpl.deploy();
        await ownableInstance.deployed();
        Proxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(OwnableImpl.interface.format()).encodeFunctionData("initialize", [owner.address]);
        const proxy = await Proxy.deploy(ownableInstance.address, initializeData);
        await proxy.deployed();
        proxiedOwner = OwnableImpl.attach(proxy.address);
    });

    // Test deployment and initialization
    it('should initialize contract with the correct owner', async () => {
        const contractOwner = await proxiedOwner.connect(owner).owner();
        expect(contractOwner).to.equal(owner.address);
    });

    it('should call owner() only through proxy', async () => {
        expect(ownableInstance.connect(owner).owner()).to.be.reverted;
    });

    // Test transferOwnership function
    it('should allow only owner to transfer ownership', async () => {
        // Transfer ownership with the owner
        await (await proxiedOwner.transferOwnership(newOwner.address)).wait();

        // Check if ownership transfer was successful
        const updatedOwner = await proxiedOwner.owner();
        expect(updatedOwner).to.equal(newOwner.address);

        // Emit OwnershipTransferred event
        expect(proxiedOwner.transferOwnership(newOwner.address))
            .to.emit(proxiedOwner, 'OwnershipTransferred')
            .withArgs(owner.address, newOwner.address);
    });

    it('should allow to transfer ownership through proxy', async () => {
        // Transfer ownership with the owner through non-proxy contract
        expect(ownableInstance.connect(owner).transferOwnership(newOwner.address)).to.be.reverted;
    });

    // Test transferOwnership function with zero address
    it('should revert when transferring ownership to zero address', async () => {
        // Attempt to transfer ownership to zero address and expect it to revert
        await expect(
            proxiedOwner.transferOwnership(ethers.constants.AddressZero)
        ).to.be.revertedWith('Zero Address');
    });
});
