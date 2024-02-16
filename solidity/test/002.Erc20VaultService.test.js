// Import necessary libraries
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;
// console.log("ethers = ", ethers.version);
// Define the test suite
describe('Erc20VaultService', () => {
    let owner, newOwner,usdcMock, other,Erc20VaultServiceImpl, erc20VaultServiceInstance, Proxy, initializeData, Erc20VaultServiceProxy;
    let abi;
    // Deploy a new Pausable contract before each test
    beforeEach(async () => {
        [owner, newOwner, other] = await ethers.getSigners();

        const USDCMock = await ethers.getContractFactory("USDCMock");
        usdcMock = await USDCMock.deploy();
        await usdcMock.deployed();

        Erc20VaultServiceImpl = await ethers.getContractFactory('Erc20VaultService');
        erc20VaultServiceInstance = await Erc20VaultServiceImpl.deploy();
        await erc20VaultServiceInstance.deployed();
        Proxy = await ethers.getContractFactory('ProxyContract');
        abi = Erc20VaultServiceImpl.interface.format();

        initializeData = new ethers.utils.Interface(abi).encodeFunctionData("Erc20VaultService_init", [usdcMock.address, "USDC Vault"]);
        const proxy = await Proxy.deploy(erc20VaultServiceInstance.address, initializeData);
        await proxy.deployed();
        Erc20VaultServiceProxy = Erc20VaultServiceImpl.attach(proxy.address);
    });

    it("should not initialize if token address is zero", async() => {
        initializeData = new ethers.utils.Interface(abi).encodeFunctionData("Erc20VaultService_init", [ethers.constants.AddressZero, "USDC"]);
        expect(Proxy.deploy(erc20VaultServiceInstance.address, initializeData)).to.be.revertedWith('Only ERC20 Address');
    });

    // Test deployment and initialization
    it('should initialize contract with the correct owner', async () => {
        const contractOwner = await Erc20VaultServiceProxy.connect(owner).owner();
        expect(contractOwner).to.equal(owner.address);
    });

    it('should initialize contract with the correct name', async () => {
        const name = await Erc20VaultServiceProxy.name();
        expect(name).to.equal("USDC Vault");
    });

    // Test for second time initialize and revert
    it('reverts if the contract is already initialized', async function () {
        expect(Erc20VaultServiceProxy["Erc20VaultService_init(address,string)"](usdcMock.address, "USDC")).to.be.revertedWith('Initializable: contract is already initialized');
    });

    it('should not transfer if caller is not admin', async() => {
        expect(Erc20VaultServiceProxy.connect(other).transfer(1000)).to.be.revertedWith('Not owner');
    });

    it('should not transfer if balance is less than send amount', async() => {
        expect(Erc20VaultServiceProxy.transfer(1000)).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    });

    it('should not transfer if sender is blacklisted', async() => {
        await (await usdcMock.mint(Erc20VaultServiceProxy.address, 150)).wait();
        await (await usdcMock.addBlackList(Erc20VaultServiceProxy.address)).wait();
        expect(Erc20VaultServiceProxy.connect(owner).transfer(10)).to.be.revertedWith('ERC20 Transfer Failed');
    });

    it('should transfer', async() => {
        await (await usdcMock.mint(Erc20VaultServiceProxy.address, 150)).wait();
        const tx = await Erc20VaultServiceProxy.connect(owner).transfer(10);
        expect(await usdcMock.balanceOf(owner.address)).to.equal(10);
    });

});

describe("Erc20VaultService Upgradeability", () => {
    let owner,upgradeData, newOwner,usdcMock, other,Erc20VaultServiceV1, erc20VaultServiceInstance, Proxy, initializeData, Erc20VaultServiceProxy, Erc20VaultServiceV2, erc20VaultServiceV2Instance;
    let abi;
        // Deploy a new Pausable contract before each test
    beforeEach(async () => {
        [owner, newOwner, other] = await ethers.getSigners();

        const USDCMock = await ethers.getContractFactory("USDCMock");
        usdcMock = await USDCMock.deploy();
        await usdcMock.deployed();

        Erc20VaultServiceV1 = await ethers.getContractFactory('Erc20VaultService');
        erc20VaultServiceInstance = await Erc20VaultServiceV1.deploy();
        await erc20VaultServiceInstance.deployed();
        Proxy = await ethers.getContractFactory('ProxyContract');
        abi = Erc20VaultServiceV1.interface.format();

        initializeData = new ethers.utils.Interface(abi).encodeFunctionData("Erc20VaultService_init", [usdcMock.address, "USDC Vault 2"]);
        const proxy = await Proxy.deploy(erc20VaultServiceInstance.address, initializeData);
        await proxy.deployed();
        Erc20VaultServiceProxy = Erc20VaultServiceV1.attach(proxy.address);


        Erc20VaultServiceV2 = await ethers.getContractFactory('Erc20VaultServiceV2');
        erc20VaultServiceV2Instance = await Erc20VaultServiceV2.deploy();
        await erc20VaultServiceV2Instance.deployed();

        let Erc20VaultServiceV2ABI = Erc20VaultServiceV2.interface.format();
        upgradeData = new ethers.utils.Interface(Erc20VaultServiceV2ABI).encodeFunctionData("initializev2", [5]);
        await Erc20VaultServiceProxy.upgradeToAndCall(erc20VaultServiceV2Instance.address, upgradeData);
        Erc20VaultServiceProxy = Erc20VaultServiceV2.attach(proxy.address);
    });

        // Test deployment and initialization
    it('should give the correct owner', async () => {
        const contractOwner = await Erc20VaultServiceProxy.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    // Test the value set by the multiply function
    it('should set the correct value', async () => {
        const val = await Erc20VaultServiceProxy.val();
        expect(val).to.equal(5);
    });

    it('only owner should be able to upgrade', async () => {
        expect(Erc20VaultServiceProxy.connect(other).upgradeToAndCall(erc20VaultServiceV2Instance.address, upgradeData)).to.be.revertedWith("Only owner can upgrade");
    });

    it('reverts if the contract is initialized twice', async function () {
        expect(Erc20VaultServiceProxy.initializev2(100)).to.be.revertedWith('Initializable: contract is already initialized');
    });


});