import hardhat from 'hardhat';
const { ethers } = hardhat;

async function main() {
    console.log("🚀 Starting Blacklist Service Upgrade Test");
    console.log("==========================================");

    const [owner, user1] = await ethers.getSigners();

    // 1. Deploy Mock Tokens
    const USDCMock = await ethers.getContractFactory("USDCMock");
    const usdcMock = await USDCMock.deploy();
    await usdcMock.deployed();
    console.log("✅ USDCMock deployed at:", usdcMock.address);

    const USDTMock = await ethers.getContractFactory("USDTMock");
    const usdtMock = await USDTMock.deploy();
    await usdtMock.deployed();
    console.log("✅ USDTMock deployed at:", usdtMock.address);

    // 2. Deploy V1 Implementation
    const BlackListServiceV1 = await ethers.getContractFactory("BlackListService");
    const blackListServiceV1Impl = await BlackListServiceV1.deploy();
    await blackListServiceV1Impl.deployed();
    console.log("✅ BlackListService V1 Impl deployed at:", blackListServiceV1Impl.address);

    // 3. Deploy ProxyContract
    const ProxyContract = await ethers.getContractFactory("ProxyContract");

    const initializeData = BlackListServiceV1.interface.encodeFunctionData("initialize", [
        usdcMock.address,
        usdtMock.address,
        owner.address,
    ]);

    const proxy = await ProxyContract.deploy(blackListServiceV1Impl.address, initializeData);
    await proxy.deployed();
    console.log("✅ ProxyContract deployed at:", proxy.address);

    // 4. Attach Proxy to V1 ABI and test functionality
    const blackListServiceV1 = BlackListServiceV1.attach(proxy.address);
    await blackListServiceV1.connect(owner).addToBlackList(user1.address);

    const isUser1BlacklistedV1 = await blackListServiceV1.isBlackListed(user1.address);
    console.log("✅ V1: user1 isBlackListed:", isUser1BlacklistedV1);

    // 5. Deploy V2 Implementation
    const BlackListServiceV2 = await ethers.getContractFactory("BlackListServiceV2");
    const blackListServiceV2Impl = await BlackListServiceV2.deploy();
    await blackListServiceV2Impl.deployed();
    console.log("✅ BlackListService V2 Impl deployed at:", blackListServiceV2Impl.address);

    // 6. Upgrade the proxy to V2
    const proxyAsAdmin = await ethers.getContractAt("ProxyContract", proxy.address);
    const tx = await proxyAsAdmin.connect(owner).upgradeTo(blackListServiceV2Impl.address);
    await tx.wait();
    console.log("✅ Proxy upgraded to BlackListServiceV2");

    // 7. Attach Proxy to V2 ABI and test V2 function
    const blackListServiceV2 = BlackListServiceV2.attach(proxy.address);
    const version = await blackListServiceV2.getVersion();
    console.log("✅ V2: getVersion() =>", version);

    // 8. Verify storage preservation
    const isUser1BlacklistedV2 = await blackListServiceV2.isBlackListed(user1.address);

    if (isUser1BlacklistedV2 === isUser1BlacklistedV1) {
        console.log("✅ Storage preserved: user1 is still blacklisted");
    } else {
        console.error("❌ Storage mismatch: user1 blacklist status changed after upgrade");
    }

    console.log("\n🎉 Blacklist Service Upgrade Test Completed Successfully");
}

main().then(() => process.exit(0)).catch((err) => {
    console.error("❌ Test failed:", err);
    process.exit(1);
});
