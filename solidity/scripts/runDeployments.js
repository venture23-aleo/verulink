import hardhat from 'hardhat';
const { ethers } = hardhat;

const provider = new ethers.providers.JsonRpcProvider(
    "https://rpc2.sepolia.org"
);

async function runDeployments(runs) {
    const deployer = new ethers.Wallet(process.env.SECRET_KEY1, provider);
    const deployCommands = [
        "scripts/deployLib/deployLib.js",
        "scripts/deployLib/deployAleoAddressLib.js",
        "scripts/deploy/deployBridge.js",
        "scripts/deploy/deployBlackListService.js",
        "scripts/deploy/deployTokenService.js",
        "scripts/deploy/deployHolding.js",
        "scripts/deploy/deployERC20VaultServiceUSDC.js",
        "scripts/deploy/deployERC20VaultServiceUSDT.js",
        "scripts/deploy/deployETHVaultService.js",
        "scripts/deploy/addTokenService.js",
        "scripts/deploy/setHolding.js",
        "scripts/deploy/addTokenUSDC.js",
        "scripts/deploy/addTokenUSDT.js",
        "scripts/deploy/addTokenETH.js",
        "scripts/deploy/transferOwnerShipBridge.js",
        "scripts/deploy/transferOwnerShipBlackListService.js",
        "scripts/deploy/transferOwnershipTokenservice.js",
        "scripts/deploy/transferOwnerShipHolding.js",
        "scripts/deploy/transferOwnerShipERC20VaultServiceUSDC.js",
        "scripts/deploy/transferOwnerShipERC20VaultServiceUSDT.js",
        "scripts/deploy/transferOwnerShipETHVaultService.js",
    ];

    let totalCost = ethers.BigNumber.from(0); // Initialize total cost

    for (let i = 0; i < runs; i++) {
        console.log(`Run ${i + 1} of ${runs} started...`);
        const startBalance = await ethers.provider.getBalance(deployer.address);

        for (const command of deployCommands) {
            try {
                run("run", { script: command, network: "sepolia" });
            } catch (error) {
                console.error(`Error executing ${command}:`, error);
            }
        }

        const endBalance = await ethers.provider.getBalance(deployer.address);
        const runCost = startBalance.sub(endBalance);
        totalCost = totalCost.add(runCost);

        console.log(`Run ${i + 1} cost: ${ethers.utils.formatEther(runCost)} ETH`);
    }

    const averageCost = totalCost.div(runs);

    console.log(`Total cost: ${ethers.utils.formatEther(totalCost)} ETH`);
    console.log(`Average cost per run: ${ethers.utils.formatEther(averageCost)} ETH`);
}

async function main() {
    const runs = 10; // Number of runs
    await runDeployments(runs);
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
