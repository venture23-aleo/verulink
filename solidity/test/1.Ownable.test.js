// Import necessary libraries
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;

// Define the test suite
describe('Ownable', () => {
    let owner, newOwner, Ownable, ownableInstance;

    // Deploy a new Ownable contract before each test
    beforeEach(async () => {
        [owner, newOwner] = await ethers.getSigners();
        Ownable = await ethers.getContractFactory('Ownable');
        ownableInstance = await Ownable.deploy();
        await ownableInstance.initialize(owner.address);
    });

    // Test deployment and initialization
    it('should initialize contract with the correct owner', async () => {
        const contractOwner = await ownableInstance.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    // Test transferOwnership function
    it('should allow only owner to transfer ownership', async () => {
        // Attempt to transfer ownership with an account other than the owner and expect it to revert
        await expect(
            ownableInstance.connect(newOwner).transferOwnership(newOwner.address)
        ).to.be.revertedWith('Not owner');

        // Transfer ownership with the owner
        await ownableInstance.transferOwnership(newOwner.address);

        // Check if ownership transfer was successful
        const updatedOwner = await ownableInstance.owner();
        expect(updatedOwner).to.equal(newOwner.address);

        // Emit OwnershipTransferred event
        expect(ownableInstance.transferOwnership(newOwner.address))
            .to.emit(ownableInstance, 'OwnershipTransferred')
            .withArgs(owner.address, newOwner.address);
    });

    // Test transferOwnership function with zero address
    it('should revert when transferring ownership to zero address', async () => {
        // Attempt to transfer ownership to zero address and expect it to revert
        await expect(
            ownableInstance.transferOwnership(ethers.ZeroAddress)
        ).to.be.revertedWith('Zero Address');
    });
});
