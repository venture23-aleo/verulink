// SPDX-License-Identifier: MIT
import { use } from "chai";
import hardhat from "hardhat";
const { ethers, upgrades } = hardhat;
async function main() {
    console.log("Starting Bridge Upgrade Test on Local Hardhat Network");
    console.log("=====================================================");
    // Get signers
    const [deployer, user1, user2,user3, user4] = await ethers.getSigners();
    console.log("Deployer:", deployer.address);
    console.log("User1:", user1.address);
    console.log("User2:", user2.address);
    // Step 1: Deploy Libraries
    console.log("\nStep 1: Deploying Libraries");
    console.log("-------------------------------");
    const PacketLibrary = await ethers.getContractFactory("PacketLibrary");
    const packetLibrary = await PacketLibrary.deploy();
    await packetLibrary.deployed();
    console.log("✅ PacketLibrary deployed to:", packetLibrary.address);
    const AleoAddressLibrary = await ethers.getContractFactory("AleoAddressLibrary");
    const aleoAddressLibrary = await AleoAddressLibrary.deploy();
    await aleoAddressLibrary.deployed();
    console.log("✅ AleoAddressLibrary deployed to:",aleoAddressLibrary.address);
    // Step 2: Deploy Bridge V1 Implementation
    console.log("\nStep 2: Deploying Bridge V1 Implementation");
    console.log("---------------------------------------------");
    const BridgeV1 = await ethers.getContractFactory("Bridge", {
        libraries: {
            PacketLibrary: packetLibrary.address,
            AleoAddressLibrary: aleoAddressLibrary.address,
        },
    });
    const bridgeV1Impl = await BridgeV1.deploy();
    await bridgeV1Impl.deployed();
    console.log("✅ Bridge V1 Implementation deployed to:", bridgeV1Impl.address);

    console.log("\nStep 3: Deploying Proxy Contract");
    console.log("-----------------------------------");
    const ProxyContract = await ethers.getContractFactory("ProxyContract");
    // Initialize data for Bridge V1
    const destChainId = 1; // Aleo chain ID
    const initializeData = new ethers.utils.Interface(BridgeV1.interface.format())
        .encodeFunctionData("Bridge_init", [destChainId, deployer.address]);
    const bridgeProxy = await ProxyContract.deploy(bridgeV1Impl.address, initializeData);
    await bridgeProxy.deployed();
    console.log("✅ Bridge Proxy deployed to:", bridgeProxy.address);
    // Step 4: Create Bridge V1 Contract Instance
    console.log("\nStep 4: Creating Bridge V1 Contract Instance");
    console.log("-----------------------------------------------");
    const bridgeV1 = BridgeV1.attach(bridgeProxy.address);
    console.log("✅ Bridge V1 contract instance created");
    // Step 5: Test Bridge V1 Functionality
    console.log("\nStep 5: Log Destination Chain ID:");
    console.log("------------------------------------------");
    // Test basic functions
    const destinationChainId = await bridgeV1.destinationChainId();

    await bridgeV1.addAttestor(user1.address, 1);
    await bridgeV1.addAttestor(user2.address, 2);

    console.log("✅ Destination Chain ID:", destinationChainId.toString());
    // Step 6: Deploy Bridge V2 Implementation
    console.log("\nStep 6: Deploying Bridge V2 Implementation");
    console.log("----------------------------------------------");
    const BridgeV2 = await ethers.getContractFactory("BridgeV2", {
        libraries: {
            PacketLibrary: packetLibrary.address,
            AleoAddressLibrary: aleoAddressLibrary.address,
        },
    });
    const bridgeV2Impl = await BridgeV2.deploy();
    await bridgeV2Impl.deployed();
    console.log("✅ Bridge V2 Implementation deployed to:", bridgeV2Impl.address);
    // Step 7: Upgrade Bridge to V2
    console.log("\nStep 7: Upgrading Bridge to V2");
    console.log("---------------------------------");
    // Manual upgrade using the proxy's upgradeTo function
    const upgradeTx = await bridgeV1.upgradeTo(bridgeV2Impl.address);
    await upgradeTx.wait();
    console.log("✅ Bridge upgraded to V2 successfully!");
    // Step 8: Create Bridge V2 Contract Instance
    console.log("\nStep 8: Creating Bridge V2 Contract Instance");
    console.log("-----------------------------------------------");
    const bridgeV2 = BridgeV2.attach(bridgeProxy.address);
    console.log("✅ Bridge V2 contract instance created");
    // Step 9: Test Bridge V2 Functionality
    console.log("\nStep 9: Testing Bridge V2 Functionality");
    console.log("------------------------------------------");
    // Test that V1 functionality still works
    const destinationChainIdV2 = await bridgeV2.destinationChainId();
    console.log("✅ Destination Chain ID (V2):" ,destinationChainIdV2.toString());
    // Step 10: Verify Storage Preservation
    console.log("\nStep 10: Verifying Storage Preservation");
    console.log("------------------------------------------");
    // Check that storage variables are preserved
    if (destinationChainId.toString() === destinationChainIdV2.toString()) {
        console.log("✅ Storage preservation verified - destinationChainIdmaintained");
    } else {
        console.log("❌ Storage preservation failed - destinationChainIdchanged");
    }
    console.log("\nBridge Upgrade Test Completed");
    console.log("=============================================");
    console.log("Summary:");
    console.log("- Bridge V1 deployed and tested");
    console.log("- Bridge V2 deployed");
    console.log("- Upgrade completed successfully");
    console.log("\nContract Addresses:");
    console.log("- PacketLibrary:", packetLibrary.address);
    console.log("- AleoAddressLibrary:", aleoAddressLibrary.address);
    console.log("- Bridge V1 Implementation:", bridgeV1Impl.address);
    console.log("- Bridge V2 Implementation:", bridgeV2Impl.address);
    console.log("- Bridge Proxy:", bridgeProxy.address);

     console.log("✅ Updating Attestor Count to 2");
    await bridgeV2.setAttestorCount(2);
    
    console.log("✅ Updating Max Attestor Count to 5");
    await bridgeV2.updateMaxAttestorCount(5);

    console.log("\nFinal Tests on Bridge V2:");
    console.log("✅ Getting Destination Chain ID");
    const finalDestChainId = await bridgeV2 .destinationChainId();
    console.log("✅ Destination Chain ID (Final):", finalDestChainId.toString());

    console.log("✅ Getting Source Chain ID");
    const isAttestor = await bridgeV2.isAttestor(user1.address);
    const isAttestor2 = await bridgeV2.isAttestor(user2.address);
    console.log("✅ Source Chain ID (Final):", isAttestor.toString());
    console.log("✅ Source Chain ID (Final):", isAttestor2.toString());

     let quorumRequired = await bridgeV2.quorumRequired();
    console.log("✅ Quorum Required:", quorumRequired.toString());


    console.log("✅ Getting Attestor Count, Max Attestor Count, and Quorum Required");
    quorumRequired = await bridgeV2.quorumRequired();
    console.log("✅ Quorum Required:", quorumRequired.toString());

    await bridgeV2.addAttestor(user3.address, 3);
    let attestorCount = await bridgeV2.attestorCount();
    console.log("✅ Attestor Count:", attestorCount.toString());
    let maxAttestorCount = await bridgeV2.maxAttestorCount();
    console.log("✅ Max Attestor Count:", maxAttestorCount.toString());
    quorumRequired = await bridgeV2.quorumRequired();
    console.log("✅ Quorum Required:", quorumRequired.toString());

    await bridgeV2.addAttestor(user4.address, 4);
    attestorCount = await bridgeV2.attestorCount();
    console.log("✅ Attestor Count:", attestorCount.toString());
    maxAttestorCount = await bridgeV2.maxAttestorCount();
    console.log("✅ Max Attestor Count:", maxAttestorCount.toString());
    quorumRequired = await bridgeV2.quorumRequired();
    console.log("✅ Quorum Required:", quorumRequired.toString());
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Test failed:", error);
        process.exit(1);
    });