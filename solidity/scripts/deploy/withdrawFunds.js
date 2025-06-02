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

    // const YEA = 1;
    // const inPacket = [
    //     100,
    //     1,
    //     ["6694886634401", "aleo199ts3h95xl7mvwzy3empcxdnhrw675wvehru0yy8jyaezrydruysl9ylel"],
    //     ["28556963657430695", tokenServiceProxyAddress],
    //     ["aleo1wfaqpfc57m0wxmr9l6r8a5g95c0cthe54shzmcyu6wf6tqvady9syt27xt", ethToken, 1000000000000000, owner.address],
    //     6045766
    // ];

    // const inPacket = [
    //     200,
    //     2,
    //     ["6694886634401", "aleo199ts3h95xl7mvwzy3empcxdnhrw675wvehru0yy8jyaezrydruysl9ylel"],
    //     ["28556963657430695", tokenServiceProxyAddress],
    //     ["aleo199ts3h95xl7mvwzy3empcxdnhrw675wvehru0yy8jyaezrydruysl9ylel", ethToken, 1000000000000000, owner.address],
    //     6046054
    // ];
    // const packetHash = inPacketHash(inPacket);
    // let message = ethers.utils.solidityKeccak256(
    //     ['bytes32', 'uint8'],
    //     [packetHash, YEA]
    // );


    const inPacket = [
        200,
        2,
        ["6694886634401", "aleo199ts3h95xl7mvwzy3empcxdnhrw675wvehru0yy8jyaezrydruysl9ylel"],
        ["443067135441324596", tokenServiceProxyAddress],
        ["aleo199ts3h95xl7mvwzy3empcxdnhrw675wvehru0yy8jyaezrydruysl9ylel", ethToken, 1000000000000000, owner.address],
        6055096
    ];

    console.log(inPacket);
    
    // const signature1 = await owner.signMessage(ethers.utils.arrayify(message));
    // const signature2 = await admin.signMessage(ethers.utils.arrayify(message));
    // const signatures = signature1 + signature2.slice(2);

    // const signatures = "0xbf6a8864124199e51d88d90e934cd37b7cf69086b9f8fb4a1f7cc9807a2eb6b32d00bbcb99a242be6e7152553acab81886e4d02a2aa87aa66ea96adb3fb3712700";
    // const signatures = "0x43def4305656746610c9f978805b3669b6703d9a75e2e077d4aa97b79af10dd02ed235ddaeb626cb5f4eee234d1656704d1b111ca364ae2b63b8a867504d1a7000";
    const signatures = "0x068ba98de7a132cb9729a548ca81f4e1a22080a9f6e6fc8aea3ab2528434e6b257d6c1dca8608ffe2d256b76c2c4085d791b9853932ea9251e39daf67cb5288801";


    console.log(signatures)

    await TokenServiceContract.connect(owner).withdraw(inPacket, signatures);

    // await TokenServiceContract["transfer(address,uint256,string)"](usdcToken, 10000000000, "aleo1hkjqvh3qn4q3lr2sx5wqkt57c7heq826583duc6nlhfctkheyu8sf2qknh", {gasLimit: 1000000});
    // await TokenServiceContract["transfer(address,uint256,string)"](usdtToken, 10000000000, "aleo1hkjqvh3qn4q3lr2sx5wqkt57c7heq826583duc6nlhfctkheyu8sf2qknh", {gasLimit: 1000000});
    // await TokenServiceContract["transfer(string)"]("aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", { value: 10000000000000,  gasLimit:1000000 });
    
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