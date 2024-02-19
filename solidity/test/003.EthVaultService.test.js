// Import necessary libraries
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;
// Define the test suite
describe('EthVaultService', () => {
    let owner, other,EthVaultServiceImpl, ethVaultServiceInstance, initializeData, EthVaultServiceProxy, proxiedEthVaultService;
    let abi;

    beforeEach(async () => {
        [owner, other] = await ethers.getSigners();

        EthVaultServiceImpl = await ethers.getContractFactory('EthVaultService');
        ethVaultServiceInstance = await EthVaultServiceImpl.deploy();
        await ethVaultServiceInstance.deployed();
        EthVaultServiceProxy = await ethers.getContractFactory('ProxyContract');
        abi = EthVaultServiceImpl.interface.format();
        initializeData = new ethers.utils.Interface(abi).encodeFunctionData("EthVaultService_init", ["ETH Vault"]);
        const ethVaultServiceProxy = await EthVaultServiceProxy.deploy(ethVaultServiceInstance.address, initializeData);
        await ethVaultServiceProxy.deployed();
        proxiedEthVaultService = EthVaultServiceImpl.attach(ethVaultServiceProxy.address);
    });

    // Test deployment and initialization
    it('should initialize contract with the correct owner', async () => {
        const contractOwner = await proxiedEthVaultService.connect(owner).owner();
        expect(contractOwner).to.equal(owner.address);
    });

    // it('should not initialize faulty', async () => {
    //     const faulty_initializeData = new ethers.utils.Interface(abi).encodeFunctionData("EthVaultService_init_faulty", ["ETH Faulty Vault"]);
    //     await expect(EthVaultServiceProxy.deploy(ethVaultServiceInstance.address, faulty_initializeData))
    //         .to.be.revertedWith("Initializable: contract is not initializing");
    // });

    // Test for second time initialize and revert
    it('reverts if the contract is already initialized', async function () {
        await expect(proxiedEthVaultService["EthVaultService_init(string)"]("ETH Vault 1.5"))
            .to.be.revertedWith('Initializable: contract is already initialized');
    });

    it('should not transfer if caller is not admin', async() => {
        await expect(proxiedEthVaultService.connect(other).transfer(1000))
            .to.be.revertedWith('Ownable: caller is not the owner');
    });

    it('should not transfer if balance is less than send amount', async() => {
        await expect(proxiedEthVaultService.transfer(100000000000000)).to.be.revertedWith("EthVaultService: eth approval failed");
    });

    it('should transfer', async() => {
        // await(await ethers.provider.transfer(Proxy.address)).wait();
        await owner.sendTransaction({
            to: proxiedEthVaultService.address,
            value: ethers.utils.parseEther('10'),
          });
        await(await proxiedEthVaultService.transfer(ethers.utils.parseEther('10'))).wait();
        expect(await ethers.provider.getBalance(proxiedEthVaultService.address)).to.be.equal(0);
        
    })

    // it('should not transfer if sender is blacklisted', async() => {
    //     expect(await proxiedOwner.transfer(1000)).to.be.revertedWith('ERC20: transfer amount exceeds balance');
    // });


});


describe("Erc20VaultService Upgradeability", () => {
    let owner,upgradeData, newOwner, other, initializeData, Erc20VaultServiceProxy, EthVaultServiceV2, erc20VaultServiceV2Instance, ethVaultServiceV2Instance, EthVaultServiceImpl, ethVaultServiceInstance, EthVaultServiceProxy, proxiedEthVaultService;
    let abi;
        // Deploy a new Pausable contract before each test
    beforeEach(async () => {
        [owner,  newOwner, other] = await ethers.getSigners();

        EthVaultServiceImpl = await ethers.getContractFactory('EthVaultService');
        ethVaultServiceInstance = await EthVaultServiceImpl.deploy();
        await ethVaultServiceInstance.deployed();
        EthVaultServiceProxy = await ethers.getContractFactory('ProxyContract');
        abi = EthVaultServiceImpl.interface.format();
        initializeData = new ethers.utils.Interface(abi).encodeFunctionData("EthVaultService_init", ["ETH"]);
        const ethVaultServiceProxy = await EthVaultServiceProxy.deploy(ethVaultServiceInstance.address, initializeData);
        await ethVaultServiceProxy.deployed();
        proxiedEthVaultService = EthVaultServiceImpl.attach(ethVaultServiceProxy.address);


        EthVaultServiceV2 = await ethers.getContractFactory('EthVaultServiceV2');
        ethVaultServiceV2Instance = await EthVaultServiceV2.deploy();
        await ethVaultServiceV2Instance.deployed();

        let EthVaultServiceV2ABI = EthVaultServiceV2.interface.format();
        upgradeData = new ethers.utils.Interface(EthVaultServiceV2ABI).encodeFunctionData("initializev2", [5]);
        await proxiedEthVaultService.upgradeToAndCall(ethVaultServiceV2Instance.address, upgradeData);
        Erc20VaultServiceProxy = EthVaultServiceV2.attach(ethVaultServiceProxy.address);
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
        await expect(Erc20VaultServiceProxy.connect(other).upgradeToAndCall(ethVaultServiceV2Instance.address, upgradeData)).to.be.reverted;
    });

    it('reverts if the contract is initialized twice', async function () {
        await expect(Erc20VaultServiceProxy.initializev2(100)).to.be.revertedWith('Initializable: contract is already initialized');
    });


});
