import hardhat from 'hardhat';
const { ethers, run } = hardhat;
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    const SimpleAdder = await ethers.getContractFactory("SimpleAdder");
    console.log("Deploying SimpleAdder...");

    const number1 = 5;      // Example constructor argument
    const number2 = 10;     // Example constructor argument
    const simpleAdder = await SimpleAdder.deploy(number1, number2); // Pass constructor arguments

    // await simpleAdder.deployed(); // Wait for the deployment to be confirmed
    await simpleAdder.deployTransaction.wait(5);
    console.log("SimpleAdder deployed at:", simpleAdder.address);
    
    // Verification process
    console.log("Verifying contract...");
    await run("verify:verify", {
        address: simpleAdder.address,
        constructorArguments: [number1, number2] // Pass the constructor arguments here
    });
    console.log("Contract verified successfully on Etherscan.");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Error:", error);
        process.exit(1);
    });
