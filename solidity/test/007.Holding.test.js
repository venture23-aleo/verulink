// Import necessary libraries
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;

const ADDRESS_ONE = "0x0000000000000000000000000000000000000001";

// Define the test suite
describe('Holding', () => {
    let deployer, owner, other, Holding, holdingImpl, HoldingProxy, initializeData, proxiedV1, tokenService, USDCMock, usdcMock;

    // Deploy a new Holding contract before each test
    beforeEach(async () => {
        [owner, other, tokenService, deployer] = await ethers.getSigners();
        USDCMock = await ethers.getContractFactory("USDCMock");
        usdcMock = await USDCMock.deploy();
        await usdcMock.deployed();

        Holding = await ethers.getContractFactory("Holding");
        holdingImpl = await Holding.deploy();
        await holdingImpl.deployed();
        let HoldingContractABI = Holding.interface.format();

        HoldingProxy = await ethers.getContractFactory('ProxyContract');
        // initializeData = new ethers.Interface(BlackListServiceABI).encodeFunctionData(["initialize(address)"](owner.address));
        initializeData = new ethers.utils.Interface(HoldingContractABI).encodeFunctionData("Holding_init(address,address)", [tokenService.address, owner.address]);
        const proxy = await HoldingProxy.deploy(holdingImpl.address, initializeData);
        await proxy.deployed();
        proxiedV1 = Holding.attach(proxy.address);
        // usdcMock.mint(proxy.address, "1000000000000000000000");
    });

    // Test deployment and initialization
    it('should initialize contract with the correct owner', async () => {
        const contractOwner = await proxiedV1.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    it('reverts if the contract is already initialized', async function () {
        await expect(proxiedV1["Holding_init(address,address)"](tokenService.address,owner.address)).to.be.revertedWithCustomError(proxiedV1, 'InvalidInitialization');
    });

    // Test that only the owner can update the token service
    it('should allow only owner to update the token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;

        // Update token service with the owner
        await (await proxiedV1.connect(owner)["addTokenService(address)"](newTokenService)).wait();
        expect(await proxiedV1.supportedTokenServices(newTokenService)).to.equal(true);

        // Try to update token service with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).addTokenService(newTokenService)
        ).to.be.revertedWithCustomError(proxiedV1, "OwnableUnauthorizedAccount");

        // Try to update existed token service and expect it to revert
        await expect(
            proxiedV1.connect(owner).addTokenService(newTokenService)
        ).to.be.revertedWith("Holding: known tokenService");  

        // Try to update token service with zero address and expect it to revert 
        await expect(
            proxiedV1.connect(owner).addTokenService("0x0000000000000000000000000000000000000000")
        ).to.be.revertedWith("Holding: zero address");  
    });

    it('should not allow a non-owner to update the token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;

        // Update token service with the owner
        // await (await proxiedV1.connect(other)["addTokenService(address)"](newTokenService)).wait();
        // expect(await proxiedV1.supportedTokenServices(newTokenService)).to.equal(true);

        // Try to update token service with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).addTokenService(newTokenService)
        ).to.be.revertedWithCustomError(proxiedV1, "OwnableUnauthorizedAccount");

        // Try to update existed token service and expect it to revert
        // await expect(
        //     proxiedV1.addTokenService(newTokenService)
        // ).to.be.revertedWith("Known TokenService");  

        // // Try to update token service with zero address and expect it to revert 
        // await expect(
        //     proxiedV1.addTokenService("0x0000000000000000000000000000000000000000")
        // ).to.be.revertedWith("Zero Address");  
    });

    // Test that only the owner can remove the token service
    it('should allow only owner to remove the token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;
    
        // Update token service with the owner
        await (await proxiedV1.connect(owner)["addTokenService(address)"](newTokenService)).wait();

        // Try to update token service with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).removeTokenService(newTokenService)
        ).to.be.revertedWithCustomError(proxiedV1, "OwnableUnauthorizedAccount");

        const tx = await proxiedV1.connect(owner).removeTokenService(newTokenService);
        await tx.wait();

        expect(await proxiedV1.supportedTokenServices(newTokenService)).to.equal(false);

        // try to remove non-exist token service and expect it to revert
        await expect(
            proxiedV1.connect(owner).removeTokenService(newTokenService)
        ).to.be.revertedWith("Holding: unKnown tokenService");
        
        // Try to update remove token service as zero address as parameter and expect it to revert 
        await expect(
            proxiedV1.removeTokenService("0x0000000000000000000000000000000000000000")
        ).to.be.revertedWith("Holding: zero address");  
    });

    it('should not allow a non-owner to remove the token service', async () => {
        const newTokenService = ethers.Wallet.createRandom().address;
    
        // Update token service with the owner
        await (await proxiedV1.connect(owner)["addTokenService(address)"](newTokenService)).wait();

        // Try to update token service with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).removeTokenService(newTokenService)
        ).to.be.revertedWithCustomError(proxiedV1, "OwnableUnauthorizedAccount");

        // const tx = await proxiedV1.removeTokenService(newTokenService);
        // await tx.wait();

        expect(await proxiedV1.supportedTokenServices(newTokenService)).to.equal(true);

        // try to remove non-exist token service and expect it to revert
        // await expect(
        //     proxiedV1.connect(other).removeTokenService(newTokenService)
        // ).to.be.revertedWith("UnKnown TokenService");
        
        // // Try to update remove token service as zero address as parameter and expect it to revert 
        // await expect(
        //     proxiedV1.removeTokenService("0x0000000000000000000000000000000000000000")
        // ).to.be.revertedWith("Zero Address");  
    });

    // Test that only the registered tokenservice can lock tokens
    it('should allow to lock tokens', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.address;
        const amount = 100;

        // Lock tokens with the owner
        await (await proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, amount)).wait();
        const lockAmount = await proxiedV1.locked(user, token);
        expect(lockAmount).to.be.equal(amount);
    });

    it('should revert when the amount passed is zero', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.address;
        const amount = 0; // Amount set to zero
    
        // Attempt to lock tokens with zero amount and expect it to revert
        await expect(proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, amount))
            .to.be.revertedWith("Holding: zero amount");
    });

    // Test that only the registered tokenservice can lock tokens
    it('should not allow to lock tokens if token address is zero address', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = ethers.constants.AddressZero;
        const amount = 100;

        // await (await usdcMock.mint(tokenService.address, amount)).wait();
        // await (await usdcMock.connect(tokenService).approve(proxiedV1.address, amount)).wait();
        // Lock tokens with the owner
        await expect(proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, amount)).to.be.revertedWith('Holding: zero address');
    });

    it('should not allow to lock tokens if user address is zero address', async () => {
        const user = ethers.constants.AddressZero;
        const token = usdcMock.address;
        const amount = 100;

        // Lock the ERC20 tokens
        await expect(proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, amount)).to.be.revertedWith('Holding: zero address');
    });

    it('should not allow to lock erc20 tokens if token address is eth address', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = ADDRESS_ONE;
        const amount = 100;

        // await (await usdcMock.mint(tokenService.address, amount)).wait();
        // await (await usdcMock.connect(tokenService).approve(proxiedV1.address, amount)).wait();
        // Lock tokens with the owner
        await expect(proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, amount))
            .to.be.revertedWith('Holding: eth token address');
    });

    // Test for fail case of Token Transfer Failed
    // it('should not allow to lock tokens if token transfer failed', async () => {
    //     const user = ethers.Wallet.createRandom().address;
    //     const token = usdcMock.address;
    //     const amount = 100;

    //     await (await usdcMock.mint(tokenService.address, amount)).wait();
    //     await (await usdcMock.connect(tokenService).approve(proxiedV1.address, amount)).wait();
    //     // add to blackist
    //     const tx = await (await usdcMock.addBlackList(proxiedV1.address)).wait();
    //     // Lock tokens with the owner
    //     await expect (proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, amount)).to.be.revertedWith("Token Transfer Failed");
    // });


    // Test that only the owner can unlock tokens
    it('should allow only owner to unlock tokens', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.address;
        const amount = 50;
        // await (await usdcMock.mint(tokenService.address, amount)).wait();
        // await (await usdcMock.connect(tokenService).approve(proxiedV1.address, amount)).wait();

        // Lock tokens with the owner
        await (await proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, amount)).wait();

        // Unlock tokens with the owner
        await (await proxiedV1.connect(owner).unlock(user, token, amount)).wait();
        expect(await proxiedV1.unlocked(user,token)).to.be.equal(amount);

        // Try to unlock tokens with another account and expect it to revert
        await expect(
            proxiedV1.connect(other).unlock(user, token, amount)
        ).to.be.revertedWithCustomError(proxiedV1, "OwnableUnauthorizedAccount");
    });

    // Test the unlock function and the require statement for "Insufficient amount"
    it('should revert when unlocking an amount greater than locked', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.address;
        const lockAmount = 100;
        const unlockAmount = 150; // Attempting to unlock more than what is locked
        // await (await usdcMock.mint(tokenService.address, lockAmount)).wait();
        // await (await usdcMock.connect(tokenService).approve(proxiedV1.address, lockAmount)).wait();
        // Lock tokens
        await (await proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, lockAmount)).wait();

        // Try to unlock an amount greater than what is locked and expect it to revert
        await expect(
            proxiedV1.connect(owner).unlock(user, token, unlockAmount)
        ).to.be.revertedWith("Holding: insufficient amount");
    });

    // Test the release function and the require statement for "Insufficient amount"
    // it('should revert when releasing an amount greater than unlocked', async () => {
    //     const user = ethers.Wallet.createRandom().address;
    //     const token = usdcMock.address;
    //     const lockAmount = 500;
    //     const unlockAmount = 100;
    //     const releaseAmount = 150; // Attempting to release more than what is unlocked
    //     await (await usdcMock.mint(proxiedV1.address, lockAmount)).wait();
    //     // await (await usdcMock.connect(tokenService).approve(proxiedV1.address, lockAmount)).wait();

    //     // Lock tokens
    //     await (await proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, lockAmount)).wait();
    //     // Unlock tokens
    //     await (await proxiedV1.unlock(user, token, unlockAmount)).wait();

    //     // Try to release an amount greater than what is unlocked and expect it to revert
    //     await expect(
    //         proxiedV1["release(address,address)"](user, token)
    //     ).to.be.revertedWith('Insufficient amount');
    // });

    
    it('should allow to release tokens', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.address;
        const amount = 50;
        await (await usdcMock.mint(proxiedV1.address, amount)).wait();

        // Lock tokens with the owner
        await (await proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, amount)).wait();

        // Unlock tokens with the owner
        await (await proxiedV1.connect(owner).unlock(user, token, amount)).wait();
        // Release tokens with the owner
        await (await proxiedV1["release(address,address)"](user, token)).wait();
        expect(await proxiedV1.unlocked(user, token)).to.be.equal(0);
    });

    it('should not allow to release tokens if zero address is given', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = ethers.constants.AddressZero;

        // Try to release token as zero address as parameter for token address and expect it to revert 
        await expect(proxiedV1.connect(tokenService)["release(address,address)"](user, token))
            .to.be.revertedWith("Holding: zero address"); 
    });

    it('should not allow to release tokens if user address is zero address', async () => {
        const user = ethers.constants.AddressZero;
        const token = usdcMock.address;
        
        await expect(proxiedV1.connect(tokenService)["release(address,address)"](user, token))
            .to.be.revertedWith("Holding: zero address"); 
    });

    it('should not allow to release erc20 tokens if token address is eth address', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = ADDRESS_ONE;
        
        await expect(proxiedV1.connect(tokenService)["release(address,address)"](user, token))
            .to.be.revertedWith('Holding: eth token Address');
    });

    // Test for contract is paused and then tried to release
    it('should not release if contract is paused', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.address;
        const amount = 50;
        // await (await usdcMock.mint(proxiedV1.address, amount)).wait();
        // await (await usdcMock.connect(tokenService).approve(proxiedV1.address, amount)).wait();
    
        // Lock tokens with the owner
        await (await proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, amount)).wait();
    
        // Unlock tokens with the owner
        await (await proxiedV1.connect(owner).unlock(user, token, amount)).wait();
        // contract is paued here
        const tx = await proxiedV1.connect(owner).pause();
        // Release tokens with the owner, should revert back
        await expect(proxiedV1["release(address,address)"](user, token)).to.be.revertedWithCustomError(proxiedV1, "EnforcedPause");
    });

    // Test for holding contract is blacklisted before releasing
    it('should not release in case of ERC20 Token Transfer Failed', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.address;
        const amount = 50;
        await (await usdcMock.mint(proxiedV1.address, amount)).wait();
        // await (await usdcMock.connect(tokenService).approve(proxiedV1.address, amount)).wait();
    
        // Lock tokens with the owner
        await (await proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, amount)).wait();
    
        // Unlock tokens with the owner
        await (await proxiedV1.connect(owner).unlock(user, token, amount)).wait();
        // contract is blackListed here to make it fail on token transfer
        const tx = await usdcMock.addBlackList(proxiedV1.address);
        // Release tokens with the owner, should revert back
        await expect(proxiedV1["release(address,address)"](user, token)).to.be.revertedWithCustomError(proxiedV1, "SafeERC20FailedOperation");
    });

    it('should not release if release to user is blacklisted', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.address;
        const amount = 50;
        // await (await usdcMock.mint(tokenService.address, amount)).wait();
        // await (await usdcMock.connect(tokenService).approve(proxiedV1.address, amount)).wait();
    
        // Lock tokens with the owner
        await (await proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, amount)).wait();
    
        // Unlock tokens with the owner
        await (await proxiedV1.connect(owner).unlock(user, token, amount)).wait();
        // contract is blackListed here to make it fail on token transfer
        const tx = await usdcMock.addBlackList(user);
        // Release tokens with the owner, should revert back
        await expect(proxiedV1["release(address,address)"](user, token)).to.be.revertedWithCustomError(proxiedV1, "SafeERC20FailedOperation");
    });

    // Test for holding contract is blacklisted before releasing
    it('should not lock in case of zero address user', async () => {
        const user = ethers.constants.AddressZero;
        const token = usdcMock.address;
        const amount = 50;
        // await (await usdcMock.mint(tokenService.address, amount)).wait();
        // await (await usdcMock.connect(tokenService).approve(proxiedV1.address, amount)).wait();
    
        // Lock tokens with the owner
        await expect(proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, amount)).to.be.revertedWith("Holding: zero address");
    
        // Unlock tokens with the owner
        // await (await proxiedV1.unlock(user, token, amount)).wait();

        // // Release tokens with the owner, should revert back
        // expect(proxiedV1["release(address,address,uint256)"](user, token, amount)).to.be.revertedWith("Zero Address");
    });

    // Test lockETH function
    it('should allow Token Service to lock ETH for a user', async () => {
        const amount = 100;
        const tokenAddress = ADDRESS_ONE;
        // Ensure the Token Service can lock ETH
        await (await proxiedV1.connect(tokenService)["lock(address)"](other.address, { value: 100 })).wait();

        // Check the locked balance for the user and token
        const lockedBalance = await proxiedV1.locked(other.address, tokenAddress);
        expect(lockedBalance).to.equal(amount);
    });

    // it('should not lock if contract is paused', async() => {
    //     const tx = await proxiedV1.pause();
    //     await tx.wait();
    //     // lock reverted due to pause 
    //     await expect(proxiedV1.connect(tokenService)["lock(address)"](other.address, { value: 100 })).to.be.revertedWith("help");

    // })

    it('should allow only registered Token Service to lock ETH for a user', async () => {
        const amount = 100;
        const tokenAddress = ethers.constants.AddressZero;
        // Ensure the Token Service can lock ETH
        await expect(proxiedV1.connect(other)["lock(address)"](other.address, { value: 100 }))
            .to.be.revertedWith("Holding: unknown tokenService");
    });

    // it('should revert if ETH transfer fails', async () => {
    //     const user = ethers.Wallet.createRandom().address;
    //     const token = ADDRESS_ONE;
    //     const amount = 100;
    //     // const randomAccount = ethers.Wallet.createRandom();
    //     // await proxiedV1.updateTokenService(randomAccount.address);
    //     // Lock ETH for the user
    //     await proxiedV1.connect(tokenService)["lock(address)"](user, { value: 20 });

    //     // Unlock tokens with the owner
    //     await expect(proxiedV1.unlock(user, token, 100)).to.be.revertedWith("Insufficient amount");
    //     // await proxiedV1.release(user, token, amount);
    //     // await proxiedV1.release(user, token, amount);
    //     // Call the 'release' function to trigger the ETH transfer failure
    //     // Expect it to revert with an error message
    //     await expect(
    //         proxiedV1["release(address)"](user)
    //     ).to.be.revertedWith("Insufficient amount");
    // });


    it('should revert locking ETH for a user if ETH value is less than or equal to zero', async () => {
        // Ensure the Token Service can lock ETH
        await expect(proxiedV1.connect(tokenService)["lock(address)"](other.address, { value: 0 })).to.be.revertedWith("Holding: requires eth transfer");
    });

    it('should emit Locked event after locking ETH for a user', async () => {
        const amount = 100;
        const tokenAddress = ADDRESS_ONE;
        // Ensure the Token Service can lock ETH
        await expect(await proxiedV1.connect(tokenService)["lock(address)"](other.address, { value: 100 }))
            .to.emit(proxiedV1, 'Locked')
            .withArgs(other.address, tokenAddress, amount);
    });

    it('should release ETH when token is address(1)', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = ADDRESS_ONE;
        const amount = 100;

        await (await proxiedV1.connect(tokenService)["lock(address)"](user, { value: amount })).wait();
        expect(await ethers.provider.getBalance(proxiedV1.address)).to.be.equal(100);
        // Unlock tokens with the owner
        await (await proxiedV1.connect(owner).unlock(user, token, amount)).wait();
        // Call the 'release' function with token set to address(0) for ETH transfer
        await (await proxiedV1["release(address)"](user)).wait();
        expect(await ethers.provider.getBalance(proxiedV1.address)).to.be.equal(0);
    });

    // it('should not release ETH when token is address(1) and amount send is greater than balance', async () => {
    //     const user = ethers.Wallet.createRandom().address;
    //     const token = ADDRESS_ONE;
    //     const amount = 100;

    //     await (await proxiedV1.connect(tokenService)["lock(address)"](user, { value: amount })).wait();
    //     expect(await ethers.provider.getBalance(proxiedV1.address)).to.be.equal(100);
    //     // Unlock tokens with the owner
    //     await (await proxiedV1.unlock(user, token, amount)).wait();
    //     // Call the 'release' function with token set to address(0) for ETH transfer
    //     await expect(proxiedV1["release(address)"](user)).to.be.revertedWith("Insufficient amount");
    // });

    it('should not release ETH if something wrong happens', async () => {
        Holding = await ethers.getContractFactory("HoldingMock");
        holdingImpl = await Holding.deploy();
        await holdingImpl.deployed();
        let HoldingContractABI = Holding.interface.format();

        HoldingProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(HoldingContractABI).encodeFunctionData("Holding_init(address,address)", [tokenService.address,owner.address]);
        const proxy = await HoldingProxy.deploy(holdingImpl.address, initializeData);
        await proxy.deployed();
        let proxiedHolding = Holding.attach(proxy.address);

        const user = ethers.Wallet.createRandom().address;
        const token = ADDRESS_ONE;
        const amount = 100;

        await (await proxiedHolding.connect(tokenService)["lock(address)"](user, { value: amount })).wait();
        expect(await ethers.provider.getBalance(proxiedHolding.address)).to.be.equal(100);
        // Unlock tokens with the owner
        await (await proxiedHolding.unlock(user, token, 100)).wait();
        await(await proxiedHolding.transferETH(other.address, 90)).wait();
        await expect(proxiedHolding["release(address)"](user)).to.be.revertedWith("Holding: eth release failed");
    });

    it('should not release ETH if there is insufficient eth', async () => {
        Holding = await ethers.getContractFactory("HoldingMock");
        holdingImpl = await Holding.deploy();
        await holdingImpl.deployed();
        let HoldingContractABI = Holding.interface.format();

        HoldingProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(HoldingContractABI).encodeFunctionData("Holding_init(address,address)", [tokenService.address,owner.address]);
        const proxy = await HoldingProxy.deploy(holdingImpl.address, initializeData);
        await proxy.deployed();
        let proxiedHolding = Holding.attach(proxy.address);

        // const user = ethers.Wallet.createRandom().address;
        // const token = ethers.constants.AddressZero;
        // const amount = 100;

        // await (await proxiedHolding.connect(tokenService)["lock(address)"](user, { value: amount })).wait();
        // expect(await ethers.provider.getBalance(proxiedHolding.address)).to.be.equal(100);
        // Unlock tokens with the owner
        // await (await proxiedHolding.unlock(user, token, 100)).wait();
        await expect(proxiedHolding.transferETH(other.address, 90)).to.be.revertedWith("ETH Release Failed");
        // expect(proxiedHolding["release(address,uint256)"](user, amount)).to.be.revertedWith("ETH Release Failed");
    });

    // Test the 'Locked' event
    it('should emit a Locked event when locking tokens', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.address;
        const amount = 100;
        await (await usdcMock.mint(tokenService.address, amount)).wait();
        await (await usdcMock.connect(tokenService).approve(proxiedV1.address, amount)).wait();

        // Lock tokens with the owner
        const tx = await proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, amount);

        // Ensure the 'Locked' event is emitted with the correct values
        await expect(tx)
            .to.emit(proxiedV1, 'Locked')
            .withArgs(user, token, amount);
    });

    // Test the 'Unlocked' event
    it('should emit an Unlocked event when unlocking tokens', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.address;
        const amount = 50;
        await (await usdcMock.mint(tokenService.address, amount)).wait();
        await (await usdcMock.connect(tokenService).approve(proxiedV1.address, amount)).wait();

        // Lock tokens with the owner
        await (await proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, amount)).wait();

        // Unlock tokens with the owner
        const tx = await proxiedV1.unlock(user, token, amount);

        // Ensure the 'Unlocked' event is emitted with the correct values
        await expect(tx)
            .to.emit(proxiedV1, 'Unlocked')
            .withArgs(user, token, amount);
    });

    // Test the 'Released' event
    it('should emit a Released event when releasing tokens', async () => {
        const user = ethers.Wallet.createRandom().address;
        const token = usdcMock.address;
        const amount = 30;
        await (await usdcMock.mint(tokenService.address, amount)).wait();
        await (await usdcMock.mint(proxiedV1.address, amount)).wait();
        await (await usdcMock.connect(tokenService).approve(proxiedV1.address, amount)).wait();

        // Lock tokens with the owner
        await (await proxiedV1.connect(tokenService)["lock(address,address,uint256)"](user, token, amount)).wait();

        // Unlock and release tokens with the owner
        await (await proxiedV1.connect(owner).unlock(user, token, amount)).wait();
        const tx = await proxiedV1["release(address,address)"](user, token);

        // Ensure the 'Released' event is emitted with the correct values
        await expect(tx)
            .to.emit(proxiedV1, 'Released')
            .withArgs(user, token, amount);
    });
});

// Define the test suite for HoldingV2
describe('Upgradeabilty: HoldingV2', () => {
    let deployer, owner, other, HoldingV2, holdingV1Impl, HoldingProxy, initializeData, proxied, tokenService, HoldingV1, holdingV2Impl, upgradeData;

    // Deploy a new HoldingV2 contract before each test
    beforeEach(async () => {
        [deployer, owner, tokenService, other] = await ethers.getSigners();
        HoldingV1 = await ethers.getContractFactory("Holding");
        holdingV1Impl = await HoldingV1.deploy();
        await holdingV1Impl.deployed();
        let HoldingContractABI = HoldingV1.interface.format();

        HoldingProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(HoldingContractABI).encodeFunctionData("Holding_init(address,address)", [tokenService.address,owner.address]);
        const proxy = await HoldingProxy.deploy(holdingV1Impl.address, initializeData);
        await proxy.deployed();
        proxied = HoldingV1.attach(proxy.address);

        HoldingV2 = await ethers.getContractFactory("HoldingV2");
        holdingV2Impl = await HoldingV2.deploy();
        await holdingV2Impl.deployed();
        let HoldingContractV2ABI = HoldingV2.interface.format();

        upgradeData = new ethers.utils.Interface(HoldingContractV2ABI).encodeFunctionData("initializev2", [5]);
        await proxied.connect(owner).upgradeToAndCall(holdingV2Impl.address, upgradeData);
        proxied = HoldingV2.attach(proxy.address);
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

    it('only owner should be able to upgrade', async () => {
        await expect(proxied.connect(other).upgradeToAndCall(holdingV2Impl.address, upgradeData)).to.be.reverted;
    });

    it('reverts if the contract is initialized twice', async function () {
        await expect(proxied.initializev2(100)).to.be.revertedWithCustomError(proxied, 'InvalidInitialization');
    });
})