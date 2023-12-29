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

        // Deploy ERC20TokenBridge
        lib = await ethers.getContractFactory("PacketLibrary");
        const libInstance = await lib.deploy();
        AttestorManager = await ethers.getContractFactory("ERC20TokenBridge", {
            libraries: {
                PacketLibrary: libInstance.target,
            },
        });
        let abi = AttestorManager.interface.format();
        // console.log("ABI = ", abi);

        attestorManagerImpl = await AttestorManager.deploy();
        AttestorManagerProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.Interface(abi).encodeFunctionData("initialize", [owner.address]);
        const proxy = await AttestorManagerProxy.deploy(attestorManagerImpl.target, initializeData);
        proxiedV1 = AttestorManager.attach(proxy.target);
    });

    // Test deployment and initialization
    it('should deploy and initialize with the correct owner', async () => {
        const contractOwner = await proxiedV1.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    // Test adding an attestor
    it('should add an attestor', async () => {
        const newAttestor = ethers.Wallet.createRandom().address;
        const chainId = 5;
        const quorumRequired = 2;

        // Add attestor
        await proxiedV1.addAttestor(newAttestor, chainId, quorumRequired);

        // Check if the attestor was added
        const isAttestor = await proxiedV1.isAttestor(newAttestor, chainId);
        expect(isAttestor).to.be.true;
        // Check if the quorum was updated
        const newQuorum = await proxiedV1.quorumRequired(chainId);
        expect(newQuorum).to.equal(quorumRequired);
    });

    // Test attempting to add an existing attestor
    it('should revert when trying to add an existing attestor', async () => {
        const newAttestor = ethers.Wallet.createRandom().address;
        const chainId = 5;
        const quorumRequired = 2;

        // Add attestor
        await proxiedV1.addAttestor(newAttestor, chainId, quorumRequired);
        const isAttestor = await proxiedV1.isAttestor(newAttestor, chainId);
        expect(isAttestor).to.be.true;
        const newQuorum = await proxiedV1.quorumRequired(chainId);
        expect(newQuorum).to.equal(quorumRequired);
        // Attempt to add an existing attestor
        expect(proxiedV1.addAttestor(newAttestor, chainId, quorumRequired)).to.be.revertedWith('Attestor already exists');
    });

    // Test attempting to add an attestor with zero address
    it('should revert when trying to add an attestor with zero address', async () => {
        // Attempt to add an attestor with zero address
        expect(proxiedV1.addAttestor(ethers.ZeroAddress, 5, 2)).to.be.revertedWith('Zero Address');
    });

    // Test removing an attestor
    it('should remove an attestor', async () => {
        const newAttestor = ethers.Wallet.createRandom().address;
        const chainId = 5;
        const quorumRequired = 2;

        // Add attestor
        await proxiedV1.addAttestor(newAttestor, chainId, quorumRequired);

        // Remove attestor
        await proxiedV1.removeAttestor(newAttestor, chainId, quorumRequired);

        // Check if the attestor was removed
        const isAttestor = await proxiedV1.isAttestor(newAttestor, chainId);
        expect(isAttestor).to.be.false;

        // Check if the quorum was updated
        const newQuorum = await proxiedV1.quorumRequired(chainId);
        expect(newQuorum).to.equal(quorumRequired);
    });

    // Test attempting to remove a non-existing attestor
    it('should revert when trying to remove a non-existing attestor', async () => {
        const nonExistingAttestor = ethers.Wallet.createRandom().address;

        // Attempt to remove a non-existing attestor
        expect(proxiedV1.removeAttestor(nonExistingAttestor, 5, 2)).to.be.revertedWith('Unknown Attestor');
    });

    // Test attempting to remove an attestor with zero address
    it('should revert when trying to remove an attestor with zero address', async () => {
        // Attempt to remove an attestor with zero address
        expect(proxiedV1.removeAttestor(ethers.ZeroAddress, 5, 2)).to.be.revertedWith('Unknown Attestor');
    });

    // Test onlyOwner modifier for addAttestor function
    it('should allow only owner to add an attestor', async () => {
        const newAttestor = ethers.Wallet.createRandom().address;
        const chainId = 5;
        const quorumRequired = 2;

        // Add attestor with the owner
        await proxiedV1.addAttestor(newAttestor, chainId, quorumRequired);

        // Try to add attestor with another account and expect it to revert
        expect(
            proxiedV1.connect(other).addAttestor(newAttestor, chainId, quorumRequired)
        ).to.be.reverted;
    });

    // Test onlyOwner modifier for removeAttestor function
    it('should allow only owner to remove an attestor', async () => {
        const existingAttestor = ethers.Wallet.createRandom().address;
        const chainId = 5;
        const quorumRequired = 2;

        // Add attestor with the owner
        await proxiedV1.addAttestor(existingAttestor, chainId, quorumRequired);

        // Try to remove attestor with another account and expect it to revert
        expect(
            proxiedV1.connect(other).removeAttestor(existingAttestor, chainId, quorumRequired)
        ).to.be.reverted;
    });

    it('should emit AttestorAdded event when adding a new attestor', async () => {
        const newAttestor = ethers.Wallet.createRandom().address;
        const chainId = 5;
        const quorumRequired = 2;

        const addAttestorTx = await proxiedV1.addAttestor(newAttestor, chainId, quorumRequired);

        // Check event emission
        expect(addAttestorTx)
            .to.emit(proxiedV1, 'AttestorAdded')
            .withArgs(newAttestor, chainId, quorumRequired);
    });

    it('should emit AttestorRemoved event when removing an existing attestor', async () => {
        const existingAttestor = ethers.Wallet.createRandom().address;
        const chainId = 5;
        const quorumRequired = 2;

        // Add attestor first
        proxiedV1.addAttestor(existingAttestor, chainId, quorumRequired);

        const removeAttestorTx = await proxiedV1.removeAttestor(existingAttestor, chainId, quorumRequired);

        // Check event emission
        expect(removeAttestorTx)
            .to.emit(proxiedV1, 'AttestorRemoved')
            .withArgs(existingAttestor, chainId, quorumRequired);
    });
});
