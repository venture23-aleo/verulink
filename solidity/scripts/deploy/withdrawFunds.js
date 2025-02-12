import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const [owner, admin] = await ethers.getSigners();
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    const usdcToken = process.env.USDC_ADDR;
    const usdcTokenAddress = await ethers.getContractFactory("USDCMock");
    const usdcTokenContract = new ethers.Contract(usdcToken, usdcTokenAddress.interface.format(), deployerSigner);

    const usdtToken = process.env.USDT_ADDR;
    const usdtTokenAddress = await ethers.getContractFactory("USDTMock");
    const usdtTokenContract = new ethers.Contract(usdtToken, usdtTokenAddress.interface.format(), deployerSigner);

    const ethToken = process.env.ONE_ADDRESS;

    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const tokenServiceProxyAddress = process.env.TOKENSERVICE_PROXY_ADDRESS;
    const TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, TokenServiceABI, deployerSigner);

    console.log("Withdrawing tokens from tokenservice...");

    const YEA = 1;
    const inPacket = [
        1,
        4,
        [2, "aleo1hkjqvh3qn4q3lr2sx5wqkt57c7heq826583duc6nlhfctkheyu8sf2qknh"],
        [1, tokenServiceProxyAddress],
        ["aleo1hkjqvh3qn4q3lr2sx5wqkt57c7heq826583duc6nlhfctkheyu8sf2qknh", ethToken, 9000000000000000, owner.address],
        9000000000000000
    ];
    const packetHash = inPacketHash(inPacket);
    let message = ethers.utils.solidityKeccak256(
        ['bytes32', 'uint8'],
        [packetHash, YEA]
    );
    
    const signature1 = await owner.signMessage(ethers.utils.arrayify(message));
    const signature2 = await admin.signMessage(ethers.utils.arrayify(message));
    const signatures = signature1 + signature2.slice(2)

    console.log(signatures)

    await TokenServiceContract.connect(owner).withdraw(inPacket, signatures);

    await TokenServiceContract["transfer(address,uint256,string)"](usdcToken, 10000000000, "aleo1hkjqvh3qn4q3lr2sx5wqkt57c7heq826583duc6nlhfctkheyu8sf2qknh", {gasLimit: 1000000});
    await TokenServiceContract["transfer(address,uint256,string)"](usdtToken, 10000000000, "aleo1hkjqvh3qn4q3lr2sx5wqkt57c7heq826583duc6nlhfctkheyu8sf2qknh", {gasLimit: 1000000});
    await TokenServiceContract["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 10000000000000,  gasLimit:1000000 });
    
    console.log("tokens withdrawan successfully!!!");
}

function inPacketHash(inPacket) {
    let packetHash = ethers.utils.solidityKeccak256([
        "uint256",
        "uint256",
        "uint256", "string",
        "uint256", "address",
        "string", "address", "uint256", "address",
        "uint256"
    ], [
        inPacket[0],
        inPacket[1],
        inPacket[2][0], inPacket[2][1],
        inPacket[3][0], inPacket[3][1],
        inPacket[4][0], inPacket[4][1], inPacket[4][2], inPacket[4][3],
        inPacket[5]
    ]);
    return packetHash;
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });