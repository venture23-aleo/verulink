import hardhat from 'hardhat';
const { ethers } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

// async function main() {
//     const provider = new ethers.providers.JsonRpcProvider(
//         process.env.PROVIDER
//     );
//     const [ owner, admin ] = await ethers.getSigners();
//     const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

//     const ERC20TokenService = await ethers.getContractFactory("TokenServiceWrapped");
//     const tokenServiceProxyAddress = process.env.WRAPPED_TOKENSERVICE_PROXY_ADDRESS;
//     const TokenServiceABI = ERC20TokenService.interface.format();
//     const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, TokenServiceABI, deployerSigner);

//     console.log("Withdrawing tokens from tokenservice...");

//     const YEA = 1;

//     const inPacket = [
//         1,
//         16,
//         [ 6694886634403, "aleo1ekhz75ffmguxcux7czmkry0ycrl4uwugcqc0qagn2y2qhm33lcpq74kmww" ],
//         [ 422842677857, tokenServiceProxyAddress ],
//         [ "aleo1ekhz75ffmguxcux7czmkry0ycrl4uwugcqc0qagn2y2qhm33lcpq74kmww",
//             process.env.WRAPPED_TOKEN_PROXY_ADDRESS,
//             18000000, owner.address ],
//         9987503
//     ];

//     console.log(inPacket);

//     const pktHash = inPacketHash(inPacket);
//     console.log("packethash: ", pktHash)

//     let hashOfPktHashAndVote = ethers.utils.solidityKeccak256(
//         [ 'bytes32', 'uint8' ],
//         [ pktHash, YEA ]
//     );

//     console.log("hashOfPktHashAndVote: ", hashOfPktHashAndVote);
//     const signature = await admin.signMessage(ethers.utils.arrayify(hashOfPktHashAndVote));
//     console.log("admin address: ", admin.address);
//     console.log("signature: ", signature);

//     // await TokenServiceContract.connect(owner).tokenReceive(inPacket, signature);

//     console.log("tokens withdrawan successfully!!!");
// }

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        process.env.PROVIDER
    );
    const [owner, admin] = await ethers.getSigners();
    const deployerSigner = new ethers.Wallet(process.env.DEPLOYER_PRIVATE_KEY, provider);

    const ERC20TokenService = await ethers.getContractFactory("TokenServiceWrapped");
    const tokenServiceProxyAddress = process.env.WRAPPED_TOKENSERVICE_PROXY_ADDRESS;
    const TokenServiceABI = ERC20TokenService.interface.format();
    const TokenServiceContract = new ethers.Contract(tokenServiceProxyAddress, TokenServiceABI, deployerSigner);

    console.log("Withdrawing tokens from tokenservice...");

    console.log(admin.address)

    const YEA = 1;

    // const inPacket = [
    //     1,
    //     3,
    //     [process.env.ALEO_CHAINID, "aleo1ekhz75ffmguxcux7czmkry0ycrl4uwugcqc0qagn2y2qhm33lcpq74kmww"],
    //     [process.env.ETHEREUM_CHAINID, tokenServiceProxyAddress],
    //     ["aleo1ekhz75ffmguxcux7czmkry0ycrl4uwugcqc0qagn2y2qhm33lcpq74kmww", process.env.WRAPPED_TOKEN_PROXY_ADDRESS, 12000000, owner.address],
    //     9959271
    // ];

    // const inPacket = [
    //     1,
    //     6,
    //     [process.env.ALEO_CHAINID, "aleo1ekhz75ffmguxcux7czmkry0ycrl4uwugcqc0qagn2y2qhm33lcpq74kmww"],
    //     [process.env.ETHEREUM_CHAINID, tokenServiceProxyAddress],
    //     ["aleo1ekhz75ffmguxcux7czmkry0ycrl4uwugcqc0qagn2y2qhm33lcpq74kmww", 
    //         process.env.WRAPPED_TOKEN_PROXY_ADDRESS, 
    //         17000000, owner.address],
    //     9965586
    // ];

     
    // const inPacket = [
    //     1,
    //     4,
    //     [process.env.ALEO_CHAINID, "aleo1ekhz75ffmguxcux7czmkry0ycrl4uwugcqc0qagn2y2qhm33lcpq74kmww"],
    //     [process.env.ETHEREUM_CHAINID, tokenServiceProxyAddress],
    //     ["aleo1ekhz75ffmguxcux7czmkry0ycrl4uwugcqc0qagn2y2qhm33lcpq74kmww", process.env.WRAPPED_TOKEN_PROXY_ADDRESS, 11000000, owner.address],
    //     9959714
    // ];


    // const inPacket = [
    //     1,
    //     1,
    //     [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
    //     [1, "0x2D9B1dF35e4fAc995377aD7f7a84070CD36400Ff"],
    //     ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", "0xc9788ef51c8deB28F3F205b0B2F124F6884541A4", 10, "0xBd31ba048373A07bE0357B7Ad3182F4206c8064d"],
    //     100
    // ];

    // const inPacket = [
    //     1,
    //     5,
    //     [6694886634403, "aleo1ekhz75ffmguxcux7czmkry0ycrl4uwugcqc0qagn2y2qhm33lcpq74kmww"],
    //     [422842677857, tokenServiceProxyAddress],
    //     ["aleo1ekhz75ffmguxcux7czmkry0ycrl4uwugcqc0qagn2y2qhm33lcpq74kmww", 
    //         process.env.WRAPPED_TOKEN_PROXY_ADDRESS, 
    //         13000000, owner.address],
    //     9959831
    // ];

    //     const inPacket = [
    //     1,
    //     12,
    //     [ 6694886634403, "aleo1xnlgcl9l7dyzqmc7nvym9sd7wuqqw9jjmg0f9cwquw3280c64sgs4p73qz" ],
    //     [ 111550639260264,"0x08aE9cB3B80a1E45dE62b5a1b299d2058fFa55F7" ],
    //     [ "aleo19lu7tcg5v3c7ke5gn98h0v7crsn4jcct4uck0u0q9ewuhtc0hc9s0rygds",
    //         "0x82e349a83D954A5cA049d4256B8dF3a7c8d5AB9b",
    //         119979600, owner.address ],
    //     9708598
    // ];

      const inPacket = [
        1,
        1,
        [ process.env.ALEO_CHAINID, process.env.DEST_TOKENSERVICE],
        [ process.env.ETHEREUM_CHAINID, tokenServiceProxyAddress ],
        [ "aleo1gnl5q0pp7kq04e00pfsdc6x3pz4lntsgaskdh50enxv9aq5eaggss0umwp",
            process.env.WRAPPED_TOKEN_PROXY_ADDRESS,
            18000000, owner.address ],
        10023336
    ];

    console.log(inPacket);

    // const packetHash = inPacketHash(inPacket);
    // console.log("packethash: ", packetHash)
    // let message = ethers.utils.solidityKeccak256(
    //     ['bytes32', 'uint8'],
    //     [packetHash, YEA]
    // );

    // console.log("message: ", message);

    // let message1 = Buffer.from("\x19Ethereum Signed Message:\n32","utf-8");
    // let message2 = Buffer.from(message.slice(2), "hex");

    // let messageHash = Buffer.concat([message1, message2]).toString('hex');

    // console.log("messageHash: ", messageHash);

    // let uintarray = Uint8Array.from(Buffer.from(messageHash, "hex"))

    // console.log("finalHash: ", ethers.utils.solidityKeccak256(["bytes"],[uintarray]))

    // const signature1 = await admin.signMessage(ethers.utils.arrayify(message));
    // console.log("admin address: ", admin.address);
    // console.log("signature1: ", signature1);
    // const signature2 = await owner.signMessage(ethers.utils.arrayify(message));
    // const signatures = signature1 + signature2.slice(2);

    // const signatures = "0xbf6a8864124199e51d88d90e934cd37b7cf69086b9f8fb4a1f7cc9807a2eb6b32d00bbcb99a242be6e7152553acab81886e4d02a2aa87aa66ea96adb3fb3712700";
    // const signatures = "0x43def4305656746610c9f978805b3669b6703d9a75e2e077d4aa97b79af10dd02ed235ddaeb626cb5f4eee234d1656704d1b111ca364ae2b63b8a867504d1a7000";
    
    // const signatures = "0xa8b50a3666eb35bde9dec8e5cea932302e587c9c3c80080a2434f8902449ce1845737769f7f5a0559c433c27d071e38d240cc1e8258a041ddef816539bdf783e00";
    // const signatures = "0x4c6eefa32471138c953cf95633f9c3f56c892284df575ed7d146f18afa99110c6998b512a648c93c1fc5142c43fb2b17213c10dc3e5735928e287d076caf514901";

    // const signatures = "0xdd2d09679127358a860e0e469678ab3b375b1363789b2c7a2a614d413ce3151569134e768833c7dc0f483f4d3fb20b1ae05177234c4f2ff09007cca3f9dbbfc700"
    const signatures = "0x534cea132a784dc04bc30d324f7bf5623b2bcf2819d410462f180366cfa89cd236d912f76c3ae9511f1ba4e6baf5d14fd5d8487264e1715484a0938975156dfc1c";
    console.log(signatures)

    // await TokenServiceContract.connect(owner).tokenReceive(inPacket, signatures);

    // await TokenServiceContract["transfer(address,uint256,string)"](usdcToken, 10000000000, "aleo1hkjqvh3qn4q3lr2sx5wqkt57c7heq826583duc6nlhfctkheyu8sf2qknh", {gasLimit: 1000000});
    // await TokenServiceContract["transfer(address,uint256,string)"](usdtToken, 10000000000, "aleo1hkjqvh3qn4q3lr2sx5wqkt57c7heq826583duc6nlhfctkheyu8sf2qknh", {gasLimit: 1000000});
    // await TokenServiceContract["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 10000000000000,  gasLimit:1000000 });
    
    console.log("tokens withdrawan successfully!!!");
}

// function inPacketHash(inPacket) {

//     const versionBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify(inPacket[ 0 ]), 32);
//     const sequenceBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify(inPacket[ 1 ]), 32);
//     const srcChainIDBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify(inPacket[ 2 ][ 0 ]), 32);
//     const dstChainIDBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify(inPacket[ 3 ][ 0 ]), 32);
//     const amountBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify(inPacket[ 4 ][ 2 ]), 32);
//     const heightBytes = ethers.utils.hexZeroPad(ethers.utils.hexlify(inPacket[ 5 ]), 32);

//     const concatenatedData = ethers.utils.concat([
//         versionBytes,
//         sequenceBytes,
//         srcChainIDBytes,
//         ethers.utils.toUtf8Bytes(inPacket[ 2 ][ 1 ]), // Source Aleo address
//         dstChainIDBytes,
//         ethers.utils.getAddress(inPacket[ 3 ][ 1 ]), // Destination Ethereum address
//         ethers.utils.toUtf8Bytes(inPacket[ 4 ][ 0 ]), // Message Sender Aleo address
//         ethers.utils.getAddress(inPacket[ 4 ][ 1 ]), // Message Dest Token address
//         amountBytes,
//         ethers.utils.getAddress(inPacket[ 4 ][ 3 ]), // Message Receiver address
//         heightBytes,
//     ]);

//     const pktHash = ethers.utils.keccak256(concatenatedData);
//     return pktHash;
// }

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