// Import necessary libraries
import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;

// Define the test suite
describe('TokenSupport', () => {
    let owner, otherAccount, tokenSupportImpl, ERC20TokenSupport, ERC20TokenSupportProxy, initializeData, proxiedContract, erc20VaultServiceProxy, USDCMock, USDTMock, usdcMock, usdTMock, destChainId;

    // Deploy a new ERC20TokenSupport contract before each test
    beforeEach(async () => {
        [owner, otherAccount] = await ethers.getSigners();
        {
            USDCMock = await ethers.getContractFactory("USDCMock");
            usdcMock = await USDCMock.deploy();
            await usdcMock.deployed();

            USDTMock = await ethers.getContractFactory("USDTMock");
            usdTMock = await USDTMock.deploy();
            await usdTMock.deployed();

            const Erc20VaultService = await ethers.getContractFactory("Erc20VaultService");
            const erc20VaultServiceImpl = await Erc20VaultService.deploy();
            await erc20VaultServiceImpl.deployed();
            const Erc20VaultServiceProxy = await ethers.getContractFactory('ProxyContract');

            let abi = Erc20VaultService.interface.format();
            // initializeData = new ethers.utils.Interface(Erc20VaultService.interface.format()).encodeFunctionData(["initialize"](usdcMock.address, "vaultservice", owner.address));
            initializeData = new ethers.utils.Interface(abi).encodeFunctionData("Erc20VaultService_init", [usdcMock.address, "USDC Vault"]);
            erc20VaultServiceProxy = await Erc20VaultServiceProxy.deploy(erc20VaultServiceImpl.address, initializeData);
            await erc20VaultServiceProxy.deployed();
            erc20VaultServiceProxy = Erc20VaultService.attach(erc20VaultServiceProxy.address);
        }

        destChainId = 1;

        // USDCMock = await ethers.getContractFactory("USDCMock");
        // usdcMock = await USDCMock.deploy();
        // await usdcMock.deployed();

        // USDTMock = await ethers.getContractFactory("USDTMock");
        // usdTMock = await USDTMock.deploy();
        // await usdTMock.deployed();

        ERC20TokenSupport = await ethers.getContractFactory("TokenSupport");
        tokenSupportImpl = await ERC20TokenSupport.deploy();
        await tokenSupportImpl.deployed();
        let ERC20TokenSupportABI = ERC20TokenSupport.interface.format();

        ERC20TokenSupportProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.utils.Interface(ERC20TokenSupportABI).encodeFunctionData("TokenSupport_init", [destChainId]);
        const proxy = await ERC20TokenSupportProxy.deploy(tokenSupportImpl.address, initializeData);
        await proxy.deployed();
        proxiedContract = ERC20TokenSupport.attach(proxy.address);
    });

    // Test deployment and initialization
    it('should deploy and initialize with the correct owner', async () => {
        const contractOwner = await proxiedContract.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    // Test adding a token
    it('should add a token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();
        // Check if the token was added
        const isSupported = await proxiedContract.isSupportedToken(tokenAddress);
        expect(isSupported).to.be.true;

        // Check if the added token matches the expected values
        const addedToken = await proxiedContract.supportedTokens(tokenAddress);
        expect(addedToken.tokenAddress).to.equal(tokenAddress);
        expect(addedToken.vault).to.equal(erc20VaultServiceProxy.address);
        expect(addedToken.destTokenAddress).to.equal(destTokenAddress);
        expect(addedToken.destTokenService).to.equal(destTokenService);
        expect(addedToken.minValue).to.equal(min);
        expect(addedToken.maxValue).to.equal(max);
        expect(addedToken.enabled).to.be.true;
    });

    it('should update vault by owner', async () => {
        const ADDRESS_ONE = "0x0000000000000000000000000000000000000001";
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();
        await (await proxiedContract.updateVault(tokenAddress, ADDRESS_ONE)).wait();
        const addedToken = await proxiedContract.supportedTokens(tokenAddress);
        expect(addedToken.vault).to.equal(ADDRESS_ONE);
    })

    it('should revert on adding a token if target chain is mismatched', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 2;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await expect(proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).to.be.revertedWith("Target Chain Mismatch");
    });

    // it('should call addToken only through proxy', async () => {
    //     const tokenAddress = usdcMock.address;
    //     const destChainId = 1;
    //     const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
    //     const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
    //     const min = 1;
    //     const max = 100;

    //     // Add token
    //     expect(tokenSupportImpl.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).to.be.reverted;
    // });

    // it('check isSupportedToken only through proxy ', async () => {
    //     const tokenAddress = usdcMock.address;
    //     const destChainId = 1;
    //     const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
    //     const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
    //     const min = 1;
    //     const max = 100;

    //     // Add token
    //     await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max);

    //     // Check if the token was added
    //     expect(tokenSupportImpl.isSupportedToken(tokenAddress)).to.be.reverted;
    // });

    // Test attempting to add an existing token
    it('should revert when trying to add an existing token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add a token
        await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();

        // Attempt to add the same token again
        await expect(proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).to.be.revertedWith("Token already supported");
    });

    // Test removing a token
    it('should remove a token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();

        // Remove token
        await (await proxiedContract.removeToken(tokenAddress, destChainId)).wait();

        // Check if the token was removed
        const isSupported = await proxiedContract.isSupportedToken(tokenAddress);
        expect(isSupported).to.be.false;
    });

    it('should revert on removing a token if target chain is mismatched', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();

        // Remove token
        await expect(proxiedContract.removeToken(tokenAddress, 2)).to.be.revertedWith("Target Chain Mismatch");
    });

    // expect(proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).to.be.revertedWith("Target Chain Mismatch");

    // it('should call removeToken only through proxy', async () => {
    //     const tokenAddress = usdcMock.address;
    //     const destChainId = 1;
    //     const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
    //     const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
    //     const min = 1;
    //     const max = 100;

    //     // Add token
    //     await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();
    //     expect(tokenSupportImpl.removeToken(tokenAddress, destChainId)).to.be.reverted;
    // });

    // Test attempting to remove a non-existing token
    it('should revert when trying to remove a non-existing token', async () => {
        const nonExistingToken = ethers.Wallet.createRandom().address;

        // Attempt to remove a non-existing token
        await expect(proxiedContract.removeToken(nonExistingToken, 1)).to.be.revertedWith('Token not supported');
    });

    // ...

    // Test isSupportedToken function
    it('should return true for a supported token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();

        // Check if the token is supported for the specified destChainId
        const isSupported = await proxiedContract["isSupportedToken(address)"](tokenAddress);
        expect(isSupported).to.be.true;
    });

    // it('should return false for a supported token and non-matching destChainId', async () => {
    //     const tokenAddress = usdcMock.address;
    //     const destChainId = 1;
    //     const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
    //     const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
    //     const min = 1;
    //     const max = 100;

    //     // Add token
    //     await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();

    //     // Check if the token is not supported for a different destChainId
    //     const nonMatchingDestChainId = 2;
    //     const isSupported = await proxiedContract["isSupportedToken(address)"](tokenAddress, nonMatchingDestChainId);
    //     expect(isSupported).to.be.false;
    // });

    it('should return false for a non-existing token', async () => {
        const nonExistingToken = ethers.Wallet.createRandom().address;
        // Check if the non-existing token is not supported for any destChainId
        const isSupported = await proxiedContract["isSupportedToken(address)"](nonExistingToken);
        expect(isSupported).to.be.false;
    });

    // Test onlyOwner modifier for addToken function
    it('should allow only owner to add a token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27';
        const destTokenService = 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27';
        const min = 1;
        const max = 100;

        // Add token with the owner
        await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();
    });

    it('should revert when non-owner tries to add a token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27';
        const destTokenService = 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27';
        const min = 1;
        const max = 100;

        // Try to add token with another account and expect it to revert
        await expect(proxiedContract.connect(otherAccount).addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    // Test onlyOwner modifier for removeToken function
    it('should allow only owner to remove a token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27';
        const destTokenService = 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27';
        const min = 1;
        const max = 100;

        // Add token with the owner
        await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();

        // Owner tries to remove the token 
        await (await proxiedContract.removeToken(tokenAddress, destChainId)).wait();
    });

    it('should revert when non-owner tries to remove a token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27';
        const destTokenService = 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27';
        const min = 1;
        const max = 100;

        // Add token with the owner
        await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();

        // Try to remove token with another account and expect it to revert
        await expect(
            proxiedContract.connect(otherAccount).removeToken(tokenAddress, destChainId)
        ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    // Test enable function
    it('only owner can enable a token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;

        // Add token
        expect(proxiedContract.connect(otherAccount).enable(tokenAddress, destChainId)).to.be.revertedWith("Not owner");
        // Check if the token is enabled
        const isEnabled = await proxiedContract.isEnabledToken(tokenAddress);
        expect(isEnabled).to.be.false;
    });

    it('should revert on re-enabling a token if Target Chain Mismatch', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add a token
        await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();
        await (await proxiedContract.disable(tokenAddress, destChainId)).wait();

        const wrong_destChainId = 2;
        // Enable token
        // await proxiedContract.connect(owner).enable(tokenAddress, destChainId);
        await expect(proxiedContract.connect(owner).enable(tokenAddress, wrong_destChainId)).to.be.revertedWith("Target Chain Mismatch");
        // Check if the token is enabled
        const isEnabled = await proxiedContract.isEnabledToken(tokenAddress);
        expect(isEnabled).to.be.false;
    });

    it('should revert when trying to enable an already enabled token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
    
        // Add token
        await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, "abc.aleo", "xyz.aleo", 1, 100);
    
        // Enable token for the specified destination chain
        // await proxiedContract.enable(tokenAddress, destChainId);
    
        // Try to enable the token again and expect it to revert
        await expect(
            proxiedContract.enable(tokenAddress, destChainId)
        ).to.be.revertedWith("Token already enabled");
    });
    

    it('should revert when enabling an unsupported token', async () => {
        const tokenAddress = ethers.Wallet.createRandom().address;
        const destChainId = 1;

        // Try to Enable an unsupported token
        // let issup = await proxiedContract.isEnabledToken(tokenAddress);
        // console.log("issup======", issup);
        // await (await proxiedContract.enable(tokenAddress, destChainId)).wait();
        await expect(proxiedContract.enable(tokenAddress, destChainId)).to.be.revertedWith("Token not supported");
        // issup = await proxiedContract.isEnabledToken(tokenAddress);
        // console.log("issup======", issup);
    });

    it('should revert when non-owner tries to enable a supported token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Try to Add token
        expect(proxiedContract.connect(otherAccount).addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).to.be.revertedWith("Not owner");
        // Check if the token is enabled
        const isEnabled = await proxiedContract.isEnabledToken(tokenAddress);
        expect(isEnabled).to.be.false;
    });

    // Test disable function
    it('only owner should disable an enabled token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();
        // Disable the token
        expect(proxiedContract.connect(otherAccount).disable(tokenAddress, destChainId)).to.be.revertedWith("Not owner");
        const isEnabled = await proxiedContract.isEnabledToken(tokenAddress);

        // Check if the token is not disabled
        expect(isEnabled).to.be.true;
    });

    it('should revert on disabling a token if Target Chain Mismatch', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();
        expect(proxiedContract.connect(owner).disable(tokenAddress, 3)).to.be.revertedWith("Target Chain Mismatch");
    });

    // it('should disable an enabled token only through proxy', async () => {
    //     const tokenAddress = usdcMock.address;
    //     const destChainId = 1;
    //     const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
    //     const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
    //     const min = 1;
    //     const max = 100;

    //     // Add token
    //     await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();

    //     // Enable the token
    //     await (await proxiedContract.enable(tokenAddress, destChainId)).wait();
    //     // Disable the token
    //     expect(tokenSupportImpl.connect(owner).disable(tokenAddress, destChainId)).to.be.reverted;
    // });

    it('should revert when owner tries to disable an unenabled token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();

        // Disable the token
        await (await proxiedContract.disable(tokenAddress, destChainId)).wait();
        await expect(proxiedContract.disable(tokenAddress, destChainId)).to.be.revertedWith("Token already disabled");
        const isEnabled = await proxiedContract.isEnabledToken(tokenAddress);
        // // Check if the token is disabled
        expect(isEnabled).to.be.false;
    });

    it('should revert when non-owner tries to disable an enabled token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
        const min = 1;
        const max = 100;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();
        // Disable the token
        await expect(proxiedContract.connect(otherAccount).disable(tokenAddress, destChainId)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    // it('should revert when non-proxy contract tries to disable an enabled token', async () => {
    //     const tokenAddress = usdcMock.address;
    //     const destChainId = 1;
    //     const destTokenAddress = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
    //     const destTokenService = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27";
    //     const min = 1;
    //     const max = 100;

    //     // Add token
    //     await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, destTokenAddress, destTokenService, min, max)).wait();

    //     // Enable the token
    //     await (await proxiedContract.enable(tokenAddress, destChainId)).wait();
    //     // Disable the token
    //     expect(tokenSupportImpl.connect(owner).disable(tokenAddress, destChainId)).to.be.reverted;
    // });

    // Test TokenRemoved event
    it('should emit TokenRemoved event when removing a token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;

        // Add token
        await (await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", 1, 100)).wait();

        await expect(
            proxiedContract.removeToken(tokenAddress, destChainId)
        ).to.emit(proxiedContract, 'TokenRemoved')
            .withArgs(tokenAddress, destChainId);
    });

    // Test TokenEnabled event
    it('should emit TokenEnabled event when enabling a token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;

        // Add token
        await(await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", 1, 100)).wait();
        await (await(proxiedContract.disable(tokenAddress,destChainId))).wait();
        let tx = await proxiedContract.enable(tokenAddress, destChainId);
        await expect(tx).to.emit(proxiedContract, 'TokenEnabled')
            .withArgs(tokenAddress, destChainId);
    });

    // Test TokenDisabled event
    it('should emit TokenDisabled event when disabling a token', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;

        // Add token
        await(await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", 1, 100)).wait();

        await expect(
            proxiedContract.disable(tokenAddress, destChainId)
        ).to.emit(proxiedContract, 'TokenDisabled')
            .withArgs(tokenAddress, destChainId);
    });

    it('should update min value', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const minValue = 10;

        await(await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27', 'destTokenService', minValue, 100)).wait();

        // Call the updateMinValue function
        await(await proxiedContract.updateMinValue(tokenAddress, 20)).wait();

        // Check if the min value was updated
        const updatedToken = await proxiedContract.supportedTokens(tokenAddress);
        expect(updatedToken.minValue).to.equal(20);
    });

    it('should update max value', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const maxValue = 100;

        await(await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27', 'destTokenService', 1, maxValue)).wait();

        // Call the updateMaxValue function
        await(await proxiedContract.updateMaxValue(tokenAddress, 90));

        // Check if the max value was updated
        const updatedToken = await proxiedContract.supportedTokens(tokenAddress);
        expect(updatedToken.maxValue).to.equal(90);
    });

    it('should owner update min value', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const minValue = 10;

        await(await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27', 'destTokenService', minValue, 100)).wait();

        // Call the updateMinValue function
        await expect(proxiedContract.connect(otherAccount).updateMinValue(tokenAddress, 20)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it('should owner update max value', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const maxValue = 10000;

        await(await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27', 'destTokenService', 100, maxValue)).wait();

        // Call the updateMinValue function
        await expect(proxiedContract.connect(otherAccount).updateMaxValue(tokenAddress, 200)).to.be.revertedWith("Ownable: caller is not the owner");
    });

    // it('should update max value only through proxy', async () => {
    //     const tokenAddress = usdcMock.address;
    //     const destChainId = 1;
    //     const maxValue = 100;

    //     await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27', 'destTokenService', 1, maxValue);

    //     // Call the updateMaxValue function
    //     expect(tokenSupportImpl.updateMaxValue(tokenAddress, destChainId, 90)).to.be.reverted;
    // });

    // it('should update min value only through proxy', async () => {
    //     const tokenAddress = usdcMock.address;
    //     const destChainId = 1;
    //     const minValue = 10;

    //     await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27', 'destTokenService', minValue, 100);
    //     // console.log("val1 = ", await proxiedContract.supportedTokens(tokenAddress));
    //     // Call the updateMinValue function
    //     expect(tokenSupportImpl.updateMinValue(tokenAddress, destChainId, 20)).to.be.reverted;
    // });

    it('should revert when updating min value for unsupported token', async () => {
        const tokenAddress = usdcMock.address;

        // Attempt to update min value for an unsupported token
        await expect(
            proxiedContract.updateMinValue(tokenAddress, 20)
        ).to.be.revertedWith("Token not supported");
    });

    it('should revert when updating max value for unsupported token', async () => {
        const tokenAddress = usdcMock.address;

        // Attempt to update max value for an unsupported token
        await expect(
            proxiedContract.updateMaxValue(tokenAddress, 90)
        ).to.be.revertedWith("Token not supported");
    });

    it('should emit events when updating min value', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const minValue = 10;

        await(await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27', 'destTokenService', minValue, 100)).wait();

        // Call the updateMinValue function and check emitted events
        await expect(
            proxiedContract.updateMinValue(tokenAddress, 20)
        ).to.emit(proxiedContract, 'TokenMinValueUpdated')
            .withArgs(tokenAddress, destChainId, minValue, 20);
    });

    it('should emit events when updating max value', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const maxValue = 100;

        await(await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, 'aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27', 'destTokenService', 1, maxValue)).wait();

        // Call the updateMaxValue function and check emitted events
        await expect(
            proxiedContract.updateMaxValue(tokenAddress, 90)
        ).to.emit(proxiedContract, 'TokenMaxValueUpdated')
            .withArgs(tokenAddress, destChainId, maxValue, 90);
    });

    it('should return true if the amount is within the specified range', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const min = 1;
        const max = 100;
    
        // Add token and set its range
        await(await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, "", "", min, max)).wait();
    
        // Check if an amount within the range is considered in range
        const amountInRange = await proxiedContract.isAmountInRange(tokenAddress, min + 1);
        expect(amountInRange).to.be.true;
    });
    
    it('should return false if the amount is below the specified range', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const min = 1;
        const max = 100;
    
        // Add token and set its range
        await(await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, "", "", min, max)).wait();
    
        // Check if an amount below the range is considered out of range
        const amountOutOfRange = await proxiedContract.isAmountInRange(tokenAddress, min - 1);
        expect(amountOutOfRange).to.be.false;
    });
    
    it('should return false if the amount is above the specified range', async () => {
        const tokenAddress = usdcMock.address;
        const destChainId = 1;
        const min = 1;
        const max = 100;
    
        // Add token and set its range
        await(await proxiedContract.addToken(tokenAddress, destChainId, erc20VaultServiceProxy.address, "", "", min, max)).wait();
    
        // Check if an amount above the range is considered out of range
        const amountOutOfRange = await proxiedContract.isAmountInRange(tokenAddress, max + 1);
        expect(amountOutOfRange).to.be.false;
    });
});
