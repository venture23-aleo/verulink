// Import necessary libraries
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;

// Define the test suite
describe('AttestorManager', () => {
    let owner, attestorManagerImpl, AttestorManager, AttestorManagerProxy, initializeData, lib, proxiedV1, attestor, other, signer;

    // Deploy a new AttestorManager contract before each test
    beforeEach(async () => {
        [owner, attestor, other, signer] = await ethers.getSigners();

        // Deploy AttestorManager
        AttestorManager = await ethers.getContractFactory("AttestorManagerMock");
        let abi = AttestorManager.interface.format();

        attestorManagerImpl = await AttestorManager.deploy();
        await attestorManagerImpl.deployed();
        AttestorManagerProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(abi).encodeFunctionData("initializemock", [owner.address]);
        const proxy = await AttestorManagerProxy.deploy(attestorManagerImpl.address, initializeData);
        await proxy.deployed();
        proxiedV1 = AttestorManager.attach(proxy.address);
    });

    // Test deployment and initialization
    it('should deploy and initialize with the correct owner', async () => {
        const contractOwner = await proxiedV1.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    // Test adding an attestor
    it('should add an attestor', async () => {
        const newAttestor = ethers.Wallet.createRandom().address;
        const quorumRequired = 2;

        // Add attestor
        await (await proxiedV1.addAttestor(newAttestor, quorumRequired)).wait();

        // Check if the attestor was added
        const isAttestor = await proxiedV1.isAttestor(newAttestor);
        expect(isAttestor).to.be.true;
        // Check if the quorum was updated
        const newQuorum = await proxiedV1.quorumRequired();
        expect(newQuorum).to.equal(quorumRequired);
    });

    // it('should call addAttestor only through proxy', async () => {
    //     const newAttestor = ethers.Wallet.createRandom().address;
    //     const quorumRequired = 2;

    //     // Add attestor
    //     expect(attestorManagerImpl.addAttestor(newAttestor, quorumRequired)).to.be.reverted;
    // });

    it('should add attestors in batch by Owner', async () => {
        const attestors = [ethers.Wallet.createRandom().address, ethers.Wallet.createRandom().address, ethers.Wallet.createRandom().address];
        const quorumRequired = 2;

        // Add attestors
        await (await proxiedV1.addAttestors(attestors, quorumRequired)).wait();

        // Check if the attestor was added
        const isAttestor0 = await proxiedV1.isAttestor(attestors[0]);
        expect(isAttestor0).to.be.true;
        const isAttestor1 = await proxiedV1.isAttestor(attestors[1]);
        expect(isAttestor1).to.be.true;
        const isAttestor2 = await proxiedV1.isAttestor(attestors[2]);
        expect(isAttestor2).to.be.true;
        // Check if the quorum was updated
        const newQuorum = await proxiedV1.quorumRequired();
        expect(newQuorum).to.equal(quorumRequired);
    });

    // it('should call addAttestors only through proxy', async () => {
    //     const attestors = [ethers.Wallet.createRandom().address, ethers.Wallet.createRandom().address, ethers.Wallet.createRandom().address];
    //     const quorumRequired = 2;

    //     // Add attestors
    //     expect(attestorManagerImpl.addAttestors(attestors, quorumRequired)).to.be.reverted;
    // });

    it('should add attestors in batch by a non-owner', async () => {
        const attestors = [ethers.Wallet.createRandom().address, ethers.Wallet.createRandom().address, ethers.Wallet.createRandom().address];
        const quorumRequired = 2;

        // Add attestors
        expect(proxiedV1.connect(other).addAttestors(attestors, quorumRequired)).to.be.reverted;

        // Check if the attestor was added
        const isAttestor0 = await proxiedV1.isAttestor(attestors[0]);
        expect(isAttestor0).to.be.false;
        const isAttestor1 = await proxiedV1.isAttestor(attestors[1]);
        expect(isAttestor1).to.be.false;
        const isAttestor2 = await proxiedV1.isAttestor(attestors[2]);
        expect(isAttestor2).to.be.false;
        // Check if the quorum was updated
        const newQuorum = await proxiedV1.quorumRequired();
        expect(newQuorum).to.equal(0);
    });

    // Test attempting to add an existing attestor
    it('should revert when trying to add an existing attestor', async () => {
        const newAttestor = ethers.Wallet.createRandom().address;
        const quorumRequired = 2;

        // Add attestor
        await (await proxiedV1.addAttestor(newAttestor, quorumRequired)).wait();
        const isAttestor = await proxiedV1.isAttestor(newAttestor);
        expect(isAttestor).to.be.true;
        const newQuorum = await proxiedV1.quorumRequired();
        expect(newQuorum).to.equal(quorumRequired);
        // Attempt to add an existing attestor
        expect(proxiedV1.addAttestor(newAttestor, quorumRequired)).to.be.revertedWith('Attestor already exists');
    });

    // Test attempting to add an attestor with zero address
    it('should revert when trying to add an attestor with zero address', async () => {
        // Attempt to add an attestor with zero address
        expect(proxiedV1.addAttestor(ethers.constants.AddressZero, 2)).to.be.revertedWith('Zero Address');
    });

    // Test removing an attestor
    it('should remove an attestor', async () => {
        const newAttestor = ethers.Wallet.createRandom().address;
        const quorumRequired = 2;

        // Add attestor
        await (await proxiedV1.addAttestor(newAttestor, quorumRequired)).wait();

        // Remove attestor
        await (await proxiedV1.removeAttestor(newAttestor, quorumRequired)).wait();

        // Check if the attestor was removed
        const isAttestor = await proxiedV1.isAttestor(newAttestor);
        expect(isAttestor).to.be.false;

        // Check if the quorum was updated
        const newQuorum = await proxiedV1.quorumRequired();
        expect(newQuorum).to.equal(quorumRequired);
    });

    // it('should call removeAttestor only through proxy', async () => {
    //     const newAttestor = ethers.Wallet.createRandom().address;
    //     const quorumRequired = 2;

    //     // Add attestor
    //     await (await proxiedV1.addAttestor(newAttestor, quorumRequired)).wait();

    //     // Remove attestor
    //     expect(attestorManagerImpl.removeAttestor(newAttestor, quorumRequired)).to.be.reverted;
    // });

    // Test attempting to remove a non-existing attestor
    it('should revert when trying to remove a non-existing attestor', async () => {
        const nonExistingAttestor = ethers.Wallet.createRandom().address;

        // Attempt to remove a non-existing attestor
        expect(proxiedV1.removeAttestor(nonExistingAttestor, 2)).to.be.revertedWith('Unknown Attestor');
    });

    // Test attempting to remove an attestor with zero address
    it('should revert when trying to remove an attestor with zero address', async () => {
        // Attempt to remove an attestor with zero address
        expect(proxiedV1.removeAttestor(ethers.constants.AddressZero, 2)).to.be.revertedWith('Unknown Attestor');
    });

    // Test onlyOwner modifier for addAttestor function
    it('should allow only owner to add an attestor', async () => {
        const newAttestor = ethers.Wallet.createRandom().address;
        const quorumRequired = 2;

        // Add attestor with the owner
        await (await proxiedV1.addAttestor(newAttestor, quorumRequired)).wait();

        // Try to add attestor with another account and expect it to revert
        expect(
            proxiedV1.connect(other).addAttestor(newAttestor, quorumRequired)
        ).to.be.reverted;
    });

    // Test onlyOwner modifier for removeAttestor function
    it('should allow only owner to remove an attestor', async () => {
        const existingAttestor = ethers.Wallet.createRandom().address;
        const quorumRequired = 2;

        // Add attestor with the owner
        await (await proxiedV1.addAttestor(existingAttestor, quorumRequired)).wait();

        // Try to remove attestor with another account and expect it to revert
        expect(
            proxiedV1.connect(other).removeAttestor(existingAttestor, quorumRequired)
        ).to.be.reverted;
    });

    it('should emit AttestorAdded event when adding a new attestor', async () => {
        const newAttestor = ethers.Wallet.createRandom().address;
        const quorumRequired = 2;

        const addAttestorTx = await (await proxiedV1.addAttestor(newAttestor, quorumRequired)).wait();

        // Check event emission
        expect(addAttestorTx)
            .to.emit(proxiedV1, 'AttestorAdded')
            .withArgs(newAttestor, quorumRequired);
    });

    it('should emit AttestorRemoved event when removing an existing attestor', async () => {
        const existingAttestor = ethers.Wallet.createRandom().address;
        const quorumRequired = 2;

        // Add attestor first
        await (await proxiedV1.addAttestor(existingAttestor, quorumRequired)).wait();

        const removeAttestorTx = await (await proxiedV1.removeAttestor(existingAttestor, quorumRequired)).wait();

        // Check event emission
        expect(removeAttestorTx)
            .to.emit(proxiedV1, 'AttestorRemoved')
            .withArgs(existingAttestor, quorumRequired);
    });
});
