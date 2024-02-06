import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;

describe("BlackListService", () => {
    let owner, other, blackListServiceImpl, usdcMock, usdtMock, BlackListService, BlackListServiceProxy, initializeData, proxiedContract, attestor, otherAddress;

    beforeEach(async () => {
        [owner, other] = await ethers.getSigners();

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
        // initializeData = new ethers.utils.Interface(BlackListService.interface.format()).encodeFunctionData(["initializemock"](owner.address, usdcMock.address, usdtMock.address));
        initializeData = new ethers.utils.Interface([{
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_owner",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_usdc",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_usdt",
                    "type": "address"
                }
            ],
            "name": "initialize",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }]).encodeFunctionData("initialize", [owner.address, usdcMock.address, usdtMock.address]);
        const proxy = await BlackListServiceProxy.deploy(blackListServiceImpl.address, initializeData);
        await proxy.deployed();
        proxiedContract = BlackListService.attach(proxy.address);
    });

    it('reverts if the contract is already initialized', async function () {
        expect(proxiedContract["initialize(address,address,address)"](owner.address, usdcMock.address, usdtMock.address)).to.be.revertedWith('Initializable: contract is already initialized');
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

        // Remove from the black list
        await (await usdcMock.removeBlackList(other.address)).wait();

        // Check if removed
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;
    });

    it("should add to and remove from the black list for usdt", async () => {
        // Check initial status
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;

        // Add to the black list
        await (await usdtMock.addBlackList(other.address)).wait();

        // Check if added
        expect(await proxiedContract.isBlackListed(other.address)).to.be.true;

        // Remove from the black list
        await (await usdtMock.removeBlackList(other.address)).wait();

        // Check if removed
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;
    });

    it("should allow only owner to add to the black list", async () => {
        // Try to add to the black list with the owner
        await (await proxiedContract.connect(owner).addToBlackList(other.address)).wait();

        // Check if the account is added to the black list
        expect(await proxiedContract.isBlackListed(other.address)).to.be.true;

        // Try to add to the black list with another account and expect it to revert
        await expect(
            proxiedContract.connect(other).addToBlackList(owner.address)
        ).to.be.reverted;
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
        ).to.be.reverted;
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

        // Remove from blacklists
        await (await usdcMock.removeBlackList(other.address)).wait();

        // Check if removed from BlackListService
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;
    });
});

// Define the test suite for ERC20TokenBridgeV2
describe('Upgradeabilty: BlacklistServiceV2', () => {
    let owner, other, blackListServiceImpl, blackListServiceImplV2, usdcMock, usdtMock, BlackListService,BlackListServiceV2, BlackListServiceProxy, initializeData, upgradeData, proxied, otherAddress;

    beforeEach(async () => {
        [owner, other] = await ethers.getSigners();

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
        // initializeData = new ethers.utils.Interface(BlackListService.interface.format()).encodeFunctionData(["initializemock"](owner.address, usdcMock.address, usdtMock.address));
        initializeData = new ethers.utils.Interface([{
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_owner",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_usdc",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_usdt",
                    "type": "address"
                }
            ],
            "name": "initialize",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }]).encodeFunctionData("initialize", [owner.address, usdcMock.address, usdtMock.address]);
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
        expect(proxied.connect(other).upgradeToAndCall(blackListServiceImplV2.address, upgradeData)).to.be.revertedWith("Only owner can upgrade");
    });

    it('reverts if the contract is initialized twice', async function () {
        expect(proxied.initializev2(100)).to.be.revertedWith('Initializable: contract is already initialized');
    });
});