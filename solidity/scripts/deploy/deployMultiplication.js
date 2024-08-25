import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const provider = new ethers.providers.JsonRpcProvider(
        "https://sepolia.base.org"
    );

    const SAFE_ADDRESS = process.env.SAFE_ADDRESS;
    const deployerSigner = new ethers.Wallet(process.env.SECRET_KEY1, provider);

    const MultiplicationContract = await ethers.getContractFactory("MultiplicationContract");
    const multiplicationContract = await MultiplicationContract.deploy(SAFE_ADDRESS);
    await multiplicationContract.deployed();

    console.log("MultiplicationContract Deployed to: ", multiplicationContract.address);

    // const MultiplicationContractABI = MultiplicationContract.interface.format();

    // const MultiplicationContractObj = new ethers.Contract(
    //     multiplicationContract.address,
    //     MultiplicationContractABI,
    //     deployerSigner
    // );

    // await MultiplicationContractObj.transferOwnership(SAFE_ADDRESS);

    // Verify the contract
    await run("verify:verify", {
        address: multiplicationContract.address,
        constructorArguments: [SAFE_ADDRESS], // Add constructor arguments if any
    });
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });