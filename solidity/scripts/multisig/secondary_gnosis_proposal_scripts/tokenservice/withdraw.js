import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

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

async function main() {
    const inPacket = [
        2,
        561,
        ["6694886634403", "aleo18wf4ggxpmey0hk3drgefdgup9xnudgekas9lvpzut3f4cf8scuzq78j08l"],
        ["28556963657430695", "0xC57a8671191f18dB46221289391f6a6389F7B4E9"],
        ["aleo1tvuwdl7remyvccqypa5lzehrdd5tnqpuy49jv7h6uw5au67pkupsjljwgn", "0xD342C031453c66A6D6c2a23D6dA86c30adA08C79", "1000000000000000000000", "0x0e27875afe33Ea44a9720fE0D70b1Cb9dc57aCC2"],
        50050
    ];
    const packetHash = inPacketHash(inPacket);
    let message = ethers.utils.solidityKeccak256(
        ['bytes32', 'uint8'],
        [packetHash, 2]
    );
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    const signature = await deployerSigner.signMessage(ethers.utils.arrayify(message));
    const signatures = [signature, signature, signature];
    // console.log("sig = ", signatures);
    const tokenServiceProxy = "0xC57a8671191f18dB46221289391f6a6389F7B4E9";
    const TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceCotract = new ethers.Contract(tokenServiceProxy, TokenServiceABI, deployerSigner);
    // console.log("tokensevice contract = ", TokenServiceCotract);
    await TokenServiceCotract.withdraw(inPacket, signatures);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
