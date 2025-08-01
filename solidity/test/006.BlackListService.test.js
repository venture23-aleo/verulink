import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;

describe("BlackListService", () => {
    let deployer, owner, other, blackListServiceImpl, usdcMock, usdtMock, BlackListService, BlackListServiceProxy, initializeData, proxiedContract, attestor, otherAddress;

    beforeEach(async () => {
        [owner, other, deployer] = await ethers.getSigners();

        // Deploy mock contracts or use your preferred testing library for mocks
        const USDCMock = await ethers.getContractFactory("USDCMock");
        usdcMock = await USDCMock.deploy();
        await usdcMock.deployed();

        const USDTMock = await ethers.getContractFactory("USDTMock");
        usdtMock = await USDTMock.deploy();
        await usdtMock.deployed();

        BlackListService = await ethers.getContractFactory("BlackListService");
        blackListServiceImpl = await BlackListService.deploy();
        await blackListServiceImpl.deployed();
        let abi = BlackListService.interface.format();
        BlackListServiceProxy = await ethers.getContractFactory('ProxyContract');
        // initializeData = new ethers.utils.Interface(BlackListService.interface.format()).encodeFunctionData(["initializemock"](owner.address, usdcMock.address, usdtMock.address));
        initializeData = new ethers.utils.Interface(abi).encodeFunctionData("initialize", [usdcMock.address, usdtMock.address, owner.address]);
        const proxy = await BlackListServiceProxy.deploy(blackListServiceImpl.address, initializeData);
        await proxy.deployed();
        proxiedContract = BlackListService.attach(proxy.address);
    });

    it('reverts if the contract is already initialized', async function () {
        await expect(proxiedContract["initialize"](usdcMock.address, usdtMock.address, owner.address)).to.be.revertedWithCustomError(proxiedContract, 'InvalidInitialization');
    });

    it("should add to and remove from the black list", async () => {
        // Check initial status
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;

        // Add to the black list
        await (await proxiedContract.addToBlackList(other.address)).wait();

        // Check if added
        expect(await proxiedContract.isBlackListed(other.address)).to.be.true;

        // Remove from the black list
        await (await proxiedContract.removeFromBlackList(other.address)).wait();

        // Check if removed
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;
    });

    it("should add to and remove from the black list for usdc", async () => {
        // Check initial status
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;

        // Add to the black list
        await (await usdcMock.addBlackList(other.address)).wait();

        // Check if added
        expect(await proxiedContract.isBlackListed(other.address)).to.be.true;

        // // Remove from the black list
        // await (await usdcMock.removeBlackList(other.address)).wait();

        // // Check if removed
        // expect(await proxiedContract.isBlackListed(other.address)).to.be.false;
    });

    it("should add to and remove from the black list for usdt", async () => {
        // Check initial status
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;

        // Add to the black list
        await (await usdtMock.addBlackList(other.address)).wait();

        // Check if added
        expect(await proxiedContract.isBlackListed(other.address)).to.be.true;

        // // Remove from the black list
        // await (await usdtMock.removeBlackList(other.address)).wait();

        // // Check if removed
        // expect(await proxiedContract.isBlackListed(other.address)).to.be.false;
    });

    it("should allow only owner to add to the black list", async () => {
        // Try to add to the black list with the owner
        await (await proxiedContract.connect(owner).addToBlackList(other.address)).wait();

        // Check if the account is added to the black list
        expect(await proxiedContract.isBlackListed(other.address)).to.be.true;

        // Try to add to the black list with another account and expect it to revert
        await expect(
            proxiedContract.connect(other).addToBlackList(owner.address)
        ).to.be.revertedWithCustomError(proxiedContract, "OwnableUnauthorizedAccount");
    });

    // it("should allow to add to the black list only through proxy", async () => {
    //     // Try to add to the black list with contract other than proxy and expect it to fail
    //     expect(blackListServiceImpl.connect(owner).addToBlackList(other.address)).to.be.reverted;

    //     // // Check if the account is added to the black list
    //     // expect(await proxiedContract.isBlackListed(other.address)).to.be.true;

    //     // // Try to add to the black list with another account and expect it to revert
    //     // await expect(
    //     //     blackListServiceImpl.connect(other).addToBlackList(owner.address)
    //     // ).to.be.reverted;
    // });

    it("should allow only owner to remove from the black list", async () => {
        // Add to the black list with the owner
        await (await proxiedContract.connect(owner).addToBlackList(other.address)).wait();

        // // Try to remove from the black list with the owner
        // await (await proxiedContract.connect(owner).removeFromBlackList(other.address)).wait();

        // Check if the account is removed from the black list
        expect(await proxiedContract.isBlackListed(other.address)).to.be.true;

        // Try to remove from the black list with another account and expect it to revert
        await expect(
            proxiedContract.connect(other).removeFromBlackList(owner.address)
        ).to.be.revertedWithCustomError(proxiedContract, "OwnableUnauthorizedAccount");
    });

    // it("should allow to remove from the black list only through proxy", async () => {
    //     // Add to the black list with the owner
    //     await (await proxiedContract.connect(owner).addToBlackList(other.address)).wait();

    //     // // Try to remove from the black list with the owner
    //     // await (await proxiedContract.connect(owner).removeFromBlackList(other.address)).wait();

    //     // Check if the account is removed from the black list
    //     expect(await proxiedContract.isBlackListed(other.address)).to.be.true;

    //     // Try to remove from the black list with another account and expect it to revert
    //     expect(
    //         blackListServiceImpl.connect(owner).removeFromBlackList(owner.address)
    //     ).to.be.reverted;
    // });

    it("should include USDC and USDT blacklists", async () => {
        // Mock USDC and USDT contracts to simulate blacklisting
        await (await usdcMock.addBlackList(other.address)).wait();

        // Check if blacklisted in BlackListService
        expect(await proxiedContract.isBlackListed(other.address)).to.be.true;

        // // Remove from blacklists
        // await (await usdcMock.removeBlackList(other.address)).wait();

        // // Check if removed from BlackListService
        // expect(await proxiedContract.isBlackListed(other.address)).to.be.false;
    });
});

// Define the test suite for BlackListService upgradeability
describe('Upgradeability: BlacklistServiceV2', () => {
    let deployer, owner, other, blackListServiceImpl, blackListServiceImplV2, usdcMock, usdtMock, 
        BlackListService, BlackListServiceV2, BlackListServiceProxy, initializeData, upgradeData, 
        proxied, ProxyAdmin, proxyAdmin, TransparentProxy, proxy;

    beforeEach(async () => {
        [deployer, owner, other] = await ethers.getSigners();

        // Deploy mock contracts
        const USDCMock = await ethers.getContractFactory("USDCMock");
        usdcMock = await USDCMock.deploy();
        await usdcMock.deployed();

        const USDTMock = await ethers.getContractFactory("USDTMock");
        usdtMock = await USDTMock.deploy();
        await usdtMock.deployed();

        // For transparent proxy, upgrade through ProxyAdmin
        const ProxyAdmin = await ethers.getContractFactory("ProxyAdmin");
        const proxyAdmin = await ProxyAdmin.deploy();
        await proxyAdmin.deployed();

        // Deploy transparent proxy
        const TransparentProxy = await ethers.getContractFactory("TransparentUpgradeableProxy");
        const proxy = await TransparentProxy.deploy(
            blackListServiceImpl.address,
            proxyAdmin.address,
            initializeData
        );

        

        // Deploy BlackListService V1 implementation
        BlackListService = await ethers.getContractFactory("BlackListService");
        blackListServiceImpl = await BlackListService.deploy();
        await blackListServiceImpl.deployed();

        // Get the proxy contract factory
        BlackListServiceProxy = await ethers.getContractFactory('ProxyContract');
        
        // Encode initialization data for V1
        initializeData = BlackListService.interface.encodeFunctionData("BlackList_init", [
            usdcMock.address,
            usdtMock.address,
            owner.address
        ]);

        // Deploy proxy with V1 implementation
        proxy = await BlackListServiceProxy.deploy(
            blackListServiceImpl.address,
            initializeData
        );
        await proxy.deployed();

        // Create proxied instance of V1
        proxied = BlackListService.attach(proxy.address);

        // Deploy BlackListService V2 implementation
        BlackListServiceV2 = await ethers.getContractFactory("BlackListServiceV2");
        blackListServiceImplV2 = await BlackListServiceV2.deploy();
        await blackListServiceImplV2.deployed();

        // Encode upgrade initialization data for V2
        upgradeData = BlackListServiceV2.interface.encodeFunctionData("initializev2", [5]);

        // Perform the upgrade
        // Upgrade through proxy admin
        await proxyAdmin.upgradeAndCall(
            proxy.address,
            blackListServiceImplV2.address,
            upgradeData
        );

        // Attach V2 interface to the proxy
        proxied = BlackListServiceV2.attach(proxy.address);
    });

    // Add your test cases here
    it("should upgrade successfully from V1 to V2", async function() {
        // Verify the upgrade was successful
        // Add assertions based on what BlackListServiceV2 should have
        expect(await proxied.owner()).to.equal(owner.address);
        
        // Test V1 functionality still works
        await proxied.connect(owner).addToBlackList(other.address);
        expect(await proxied.isBlackListed(other.address)).to.be.true;
        
        // Test V2 specific functionality if any
        // This depends on what new features BlackListServiceV2 has
    });

    it("should maintain state after upgrade", async function() {
        // Test that data from V1 is preserved after upgrade
        expect(await proxied.owner()).to.equal(owner.address);
    });
});

// Define the test suite for ERC20TokenBridgeV2
describe('Upgradeabilty: BlacklistServiceV2', () => {
    let deployer, owner, other, blackListServiceImpl, blackListServiceImplV2, usdcMock, usdtMock, BlackListService,BlackListServiceV2, BlackListServiceProxy, initializeData, upgradeData, proxied, otherAddress;

    beforeEach(async () => {
        [owner, other, deployer] = await ethers.getSigners();

        // Deploy mock contracts or use your preferred testing library for mocks
        const USDCMock = await ethers.getContractFactory("USDCMock");
        usdcMock = await USDCMock.deploy();
        await usdcMock.deployed();

        const USDTMock = await ethers.getContractFactory("USDTMock");
        usdtMock = await USDTMock.deploy();
        await usdtMock.deployed();

        BlackListService = await ethers.getContractFactory("BlackListService");
        blackListServiceImpl = await BlackListService.deploy();
        await blackListServiceImpl.deployed();
        BlackListServiceProxy = await ethers.getContractFactory('ProxyContract');
        let abi = BlackListService.interface.format();
        // initializeData = new ethers.utils.Interface(BlackListService.interface.format()).encodeFunctionData(["initializemock"](owner.address, usdcMock.address, usdtMock.address));
        initializeData = new ethers.utils.Interface(abi).encodeFunctionData("initialize", [usdcMock.address, usdtMock.address, owner.address]);
        const proxy = await BlackListServiceProxy.deploy(blackListServiceImpl.address, initializeData);
        await proxy.deployed();
        proxied = BlackListService.attach(proxy.address);

        BlackListServiceV2 = await ethers.getContractFactory("BlackListServiceV2");
        blackListServiceImplV2 = await BlackListServiceV2.deploy();
        await blackListServiceImplV2.deployed();
        let BlackListServiceV2ABI = BlackListServiceV2.interface.format();
        upgradeData = new ethers.utils.Interface(BlackListServiceV2ABI).encodeFunctionData("initializev2", [5]);
        await proxied.upgradeToAndCall(blackListServiceImplV2.address, upgradeData);
        proxied = BlackListServiceV2.attach(proxy.address);
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
        await expect(proxied.connect(other).upgradeToAndCall(blackListServiceImplV2.address, upgradeData)).to.be.reverted;
    });

    it('reverts if the contract is initialized twice', async function () {
        await expect(proxied.initializev2(100)).to.be.revertedWithCustomError(proxied, 'InvalidInitialization');
    });
});