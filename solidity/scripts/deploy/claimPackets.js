import hardhat from "hardhat";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();

const { ethers } = hardhat;

async function main() {
    const API_URL = "http://213.136.94.95:8003/v1/unclaimed/packets";

    // --- Provider and signer setup ---
    const provider = new ethers.providers.JsonRpcProvider(process.env.PROVIDER);
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);
    const [, claimWallet] = await ethers.getSigners();

    // --- Load TokenServiceV2 contract ---
    const ERC20TokenService = await ethers.getContractFactory("TokenServiceV2");
    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    const TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, TokenServiceABI, deployerSigner);

    console.log("🔗 Connected to:", tokenServiceProxyAddress);
    console.log("👤 Signer:", await claimWallet.getAddress());

    // --- Fetch unclaimed packets from API ---
    const { data } = await axios.get(API_URL);
    const packets = data.data.returnPacket;

    if (!packets.length) {
        console.log("✅ No unclaimed packets found.");
        return;
    }

    console.log(`📦 Found ${packets.length} unclaimed packets. Using first one...`);

    const packet = packets[0];
    const msg = packet.message;
    const status = packet.status;

    // --- Construct the InPacket struct in your contract’s format ---
    const inPacket = [
        packet.version,                                 // uint256 version
        packet.sequence,                                // uint256 sequence
        [packet.sourceChain, packet.sourceAddress],      // OutNetworkAddress
        [packet.destinationChain, packet.destinationAddress], // InNetworkAddress
        [msg.sender, msg.denom, msg.amount, msg.receiver], // InTokenMessage
        packet.height                                   // uint256 height
    ];

    // --- Encode all signatures into bytes[] ---
    const signatures = ethers.utils.defaultAbiCoder.encode(
        ["bytes[]"],
        [status.signatures.map((s) => s.sign)]
    );

    console.log(" Signature Details:",  signatures);

    console.log("🧾 inPacket:", inPacket);
    console.log("🧩 signatures count:", status.signatures.length);

    // --- Call withdraw() ---
    console.log("🚀 Sending withdraw transaction...");
    const tx = await TokenServiceContract.connect(claimWallet).withdraw(inPacket, signatures);
    console.log("⏳ Waiting for confirmation...");
    const receipt = await tx.wait();

    console.log("✅ Tokens withdrawn successfully!");
    console.log("📜 Tx hash:", receipt.transactionHash);
}

main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});
