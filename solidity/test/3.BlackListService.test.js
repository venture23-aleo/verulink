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
        await usdcMock.waitForDeployment();

        const USDTMock = await ethers.getContractFactory("USDTMock");
        usdtMock = await USDTMock.deploy();
        await usdtMock.waitForDeployment();

        BlackListService = await ethers.getContractFactory("BlackListService");
        blackListServiceImpl = await BlackListService.deploy();
        await blackListServiceImpl.waitForDeployment();
        BlackListServiceProxy = await ethers.getContractFactory('ProxyContract');
        // initializeData = new ethers.Interface(BlackListServiceABI).encodeFunctionData(["initialize(address)"](owner.address));
        initializeData = new ethers.Interface([{
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
        }]).encodeFunctionData("initialize", [owner.address, usdcMock.target, usdtMock.target]);
        const proxy = await BlackListServiceProxy.deploy(blackListServiceImpl.target, initializeData);
        await proxy.waitForDeployment();
        proxiedContract = BlackListService.attach(proxy.target);
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

    it("should allow only owner to remove from the black list", async () => {
        // Add to the black list with the owner
        await (await proxiedContract.connect(owner).addToBlackList(other.address)).wait();

        // Try to remove from the black list with the owner
        await (await proxiedContract.connect(owner).removeFromBlackList(other.address)).wait();

        // Check if the account is removed from the black list
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;

        // Try to remove from the black list with another account and expect it to revert
        await expect(
            proxiedContract.connect(other).removeFromBlackList(owner.address)
        ).to.be.reverted;
    });

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
