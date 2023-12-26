// BlackListService.test.js
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;
import { BlackListServiceABI } from "../scripts/ABI/ABI.js"

describe("BlackListService", () => {
    let owner, other, blackListServiceImpl, usdcMock, usdtMock, BlackListService, BlackListServiceProxy, initializeData, proxiedContract, attestor, otherAddress;

    beforeEach(async () => {
        [owner, other] = await ethers.getSigners();

        // Deploy mock contracts or use your preferred testing library for mocks
        const USDCMock = await ethers.getContractFactory("USDCMock");
        usdcMock = await USDCMock.deploy();

        const USDTMock = await ethers.getContractFactory("USDTMock");
        usdtMock = await USDTMock.deploy();

        BlackListService = await ethers.getContractFactory("BlackListService");
        blackListServiceImpl = await BlackListService.deploy();
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
        proxiedContract = BlackListService.attach(proxy.target);
    });

    it("should add to and remove from the black list", async () => {
        // Check initial status
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;

        // Add to the black list
        await proxiedContract.addToBlackList(other.address);

        // Check if added
        expect(await proxiedContract.isBlackListed(other.address)).to.be.true;

        // Remove from the black list
        await proxiedContract.removeFromBlackList(other.address);

        // Check if removed
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;
    });

    it("should add to and remove from the black list for usdc", async () => {
        // Check initial status
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;

        // Add to the black list
        await usdcMock.addBlackList(other.address);

        // Check if added
        expect(await proxiedContract.isBlackListed(other.address)).to.be.true;

        // Remove from the black list
        await usdcMock.removeBlackList(other.address);

        // Check if removed
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;
    });

    it("should add to and remove from the black list for usdt", async () => {
        // Check initial status
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;

        // Add to the black list
        await usdtMock.addBlackList(other.address);

        // Check if added
        expect(await proxiedContract.isBlackListed(other.address)).to.be.true;

        // Remove from the black list
        await usdtMock.removeBlackList(other.address);

        // Check if removed
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;
    });

    it("should allow only owner to add to the black list", async () => {
        // Try to add to the black list with the owner
        await proxiedContract.connect(owner).addToBlackList(other.address);

        // Check if the account is added to the black list
        expect(await proxiedContract.isBlackListed(other.address)).to.be.true;

        // Try to add to the black list with another account and expect it to revert
        await expect(
            proxiedContract.connect(other).addToBlackList(owner.address)
        ).to.be.reverted;
    });

    it("should allow only owner to remove from the black list", async () => {
        // Add to the black list with the owner
        await proxiedContract.connect(owner).addToBlackList(other.address);

        // Try to remove from the black list with the owner
        await proxiedContract.connect(owner).removeFromBlackList(other.address);

        // Check if the account is removed from the black list
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;

        // Try to remove from the black list with another account and expect it to revert
        await expect(
            proxiedContract.connect(other).removeFromBlackList(owner.address)
        ).to.be.reverted;
    });

    it("should include USDC and USDT blacklists", async () => {
        // Mock USDC and USDT contracts to simulate blacklisting
        await usdcMock.addBlackList(other.address);

        // Check if blacklisted in BlackListService
        expect(await proxiedContract.isBlackListed(other.address)).to.be.true;

        // Remove from blacklists
        await usdcMock.removeBlackList(other.address);

        // Check if removed from BlackListService
        expect(await proxiedContract.isBlackListed(other.address)).to.be.false;
    });
});
