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
        1,
        2,
        ["6694886634403", "aleo1z0fa6zr78sppt6ph4kaardmkjn2vme55n8hq8ej2ds7rayxzvq8s6p9p3y"],
        ["28556963657430695", "0x5554f1660e1464a86E9155374ea33b0Ab7b890Bd"],
        ["aleo1s9jt6t6esqg4caw0lzhr393f80jd5mw2w4mn0hudze60fvnrlq9s9ryctf", "0xD99e898842c566be038bf898b3e406f028a031E0", "10000", "0x0e27875afe33Ea44a9720fE0D70b1Cb9dc57aCC2"],
        88058
    ];
    // const packetHash = inPacketHash(inPacket);
    // console.log("packetHash = ", packetHash);
    // let message = ethers.utils.solidityKeccak256(
    //     ['bytes32', 'uint8'],
    //     [packetHash, 1]
    // );
    const provider = new ethers.providers.JsonRpcProvider(
        "https://rpc2.sepolia.org"
    );
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const ERC20TokenService = await ethers.getContractFactory("TokenService");
    // const signature = await deployerSigner.signMessage(ethers.utils.arrayify(message));
    const signatures = "0x3c73d37e8659ec9e63394291ea53b8a27e661de6de583297473009485082cfb0024c37d819f2561b238b86036305e404931fd83906db4cf3011773b76b42de0b01";
    // console.log("sig = ", signatures);
    const tokenServiceProxy = "0x5554f1660e1464a86E9155374ea33b0Ab7b890Bd";
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
