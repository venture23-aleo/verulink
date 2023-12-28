// Import necessary libraries
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;

// Define the test suite
describe('Holding', () => {
    let owner, other, Holding, holdingImpl, HoldingProxy, initializeData, proxiedV1, tokenService, USDCMock, usdcMock;

    // Deploy a new Holding contract before each test
    beforeEach(async () => {
        [owner, other, tokenService] = await ethers.getSigners();
        USDCMock = await ethers.getContractFactory("USDCMock");
        usdcMock = await USDCMock.deploy();

        Holding = await ethers.getContractFactory("Holding");
        holdingImpl = await Holding.deploy();
        let HoldingContractABI = Holding.interface.formatJson();

        HoldingProxy = await ethers.getContractFactory('ProxyContract');
        // initializeData = new ethers.Interface(BlackListServiceABI).encodeFunctionData(["initialize(address)"](owner.address));
        initializeData = new ethers.Interface(HoldingContractABI).encodeFunctionData("initialize(address,address)", [owner.address, tokenService.address]);
        const proxy = await HoldingProxy.deploy(holdingImpl.target, initializeData);
        proxiedV1 = Holding.attach(proxy.target);
        usdcMock.mint(proxy.target, "1000000000000000000000");
    });

    // Test deployment and initialization
    it('should deploy and initialize with the correct owner', async () => {
        const contractOwner = await proxiedV1.owner();
        // console.log("contractOwner = ", contractOwner);
        expect(contractOwner).to.equal(owner.address);
    });

    // Test that only the owner can update the token service
    it('should allow only owner to update the token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;

        // Update token service with the owner
        await proxiedV1.updateTokenService(newTokenService);

        // Try to update token service with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).updateTokenService(newTokenService)
        ).to.be.reverted;
    });

    // Test that only the owner can lock tokens
    it('should allow to lock tokens', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.target;
        const amount = 100;

        // Lock tokens with the owner
        await proxiedV1.connect(tokenService).lock(user, token, amount);
        const lockAmount = await proxiedV1.locked(user, token);
        expect(lockAmount).to.be.equal(amount);
        await expect(
            proxiedV1.connect(other).lock(user, token, amount)
        ).to.be.revertedWith("Caller is not registered Token Service");
    });

    // Test that only the owner can unlock tokens
    it('should allow only owner to unlock tokens', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.target;
        const amount = 50;

        // Lock tokens with the owner
        await proxiedV1.connect(tokenService).lock(user, token, amount);

        // Unlock tokens with the owner
        await proxiedV1.unlock(user, token, amount);

        // Try to unlock tokens with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).unlock(user, token, amount)
        ).to.be.reverted;
    });

    // Test the unlock function and the require statement for "Insufficient amount"
    it('should revert when unlocking an amount greater than locked', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.target;
        const lockAmount = 100;
        const unlockAmount = 150; // Attempting to unlock more than what is locked

        // Lock tokens
        await proxiedV1.connect(tokenService).lock(user, token, lockAmount);

        // Try to unlock an amount greater than what is locked and expect it to revert
        await expect(
            proxiedV1.unlock(user, token, unlockAmount)
        ).to.be.revertedWith("Insufficient amount");
    });

    // Test the release function and the require statement for "Insufficient amount"
    it('should revert when releasing an amount greater than unlocked', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.target;
        const lockAmount = 500;
        const unlockAmount = 100;
        const releaseAmount = 150; // Attempting to release more than what is unlocked

        // Lock tokens
        await proxiedV1.connect(tokenService).lock(user, token, lockAmount);
        // Unlock tokens
        await proxiedV1.unlock(user, token, unlockAmount);

        // Try to release an amount greater than what is unlocked and expect it to revert
        await expect(
            proxiedV1.release(user, token, releaseAmount)
        ).to.be.revertedWith('Insufficient amount');
    });

    // Test that only the owner can release tokens
    it('should allow to release tokens', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.target;
        const amount = 50;

        // Lock tokens with the owner
        await proxiedV1.connect(tokenService).lock(user, token, amount);

        // Unlock tokens with the owner
        await proxiedV1.unlock(user, token, amount);
        // Release tokens with the owner
        await proxiedV1.release(user, token, amount);
    });

    // Define the test suite for HoldingV2
    describe('Upgradeabilty: HoldingV2', () => {
        let owner, HoldingV2, holdingV1Impl, HoldingProxy, initializeData, proxied, tokenService, HoldingV1, holdingV2Impl, upgradeData;

        // Deploy a new HoldingV2 contract before each test
        beforeEach(async () => {
            [owner, tokenService] = await ethers.getSigners();

            HoldingV1 = await ethers.getContractFactory("Holding");
            holdingV1Impl = await HoldingV1.deploy();
            let HoldingContractABI = Holding.interface.formatJson();

            HoldingProxy = await ethers.getContractFactory('ProxyContract');
            initializeData = new ethers.Interface(HoldingContractABI).encodeFunctionData("initialize(address,address)", [owner.address, tokenService.address]);
            const proxy = await HoldingProxy.deploy(holdingV1Impl.target, initializeData);
            proxied = HoldingV1.attach(proxy.target);
            
            HoldingV2 = await ethers.getContractFactory("HoldingV2");
            holdingV2Impl = await HoldingV2.deploy();
            let HoldingContractV2ABI = HoldingV2.interface.formatJson();

            upgradeData = new ethers.Interface(HoldingContractV2ABI).encodeFunctionData("initializev2", [5]);
            await proxied.upgradeToAndCall(holdingV2Impl.target, upgradeData);
            proxied = HoldingV2.attach(proxy.target);
        });

        // Test deployment and initialization
        it('should give the correct owner', async () => {
            const contractOwner = await proxied.owner();
            expect(contractOwner).to.equal(owner.address);
        });

        // Test the value set by the multiply function
        it('should set the correct value', async () => {
            const val = await proxied.val(); 
            expect(val).to.equal(5);
        });

        // it('should prevent re-initializing the contract', async () => {
        //     expect(await proxied.initializev2(5)).to.be.reverted;
        // });
    });
});
