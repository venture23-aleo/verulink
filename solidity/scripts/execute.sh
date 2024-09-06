# Deployment, Setup and transferOwnerShip to Multisig using single owner:
npx hardhat run scripts/deployLib/deployLib.js --network sepolia
npx hardhat run scripts/deployLib/deployAleoAddressLib.js --network sepolia
npx hardhat run scripts/deploy/deployBridge.js --network sepolia
npx hardhat run scripts/deploy/deployBlackListService.js --network sepolia
npx hardhat run scripts/deploy/deployTokenService.js --network sepolia
npx hardhat run scripts/deploy/deployHolding.js --network sepolia
npx hardhat run scripts/deploy/deployERC20VaultServiceUSDC.js --network sepolia
npx hardhat run scripts/deploy/deployERC20VaultServiceUSDT.js --network sepolia
npx hardhat run scripts/deploy/deployETHVaultService.js --network sepolia
npx hardhat run scripts/deploy/addTokenService.js --network sepolia
npx hardhat run scripts/deploy/setHolding.js --network sepolia
npx hardhat run scripts/deploy/addTokenUSDC.js --network sepolia
npx hardhat run scripts/deploy/addTokenUSDT.js --network sepolia
npx hardhat run scripts/deploy/addTokenETH.js --network sepolia
npx hardhat run scripts/deploy/transferOwnerShipBridge.js --network sepolia
npx hardhat run scripts/deploy/transferOwnerShipBlackListService.js --network sepolia
npx hardhat run scripts/deploy/transferOwnershipTokenservice.js --network sepolia
npx hardhat run scripts/deploy/transferOwnerShipHolding.js --network sepolia
npx hardhat run scripts/deploy/transferOwnerShipERC20VaultServiceUSDC.js --network sepolia
npx hardhat run scripts/deploy/transferOwnerShipERC20VaultServiceUSDT.js --network sepolia
npx hardhat run scripts/deploy/transferOwnerShipETHVaultService.js  --network sepolia


# Deployment, Setup and transferOwnerShip to Multisig using single owner:
# npx hardhat run scripts/deployLib/deployLib.js --network sepolia
# npx hardhat run scripts/deployLib/deployAleoAddressLib.js --network sepolia
# npx hardhat run scripts/deploy/deployBridge.js --network sepolia
# npx hardhat run scripts/deploy/deployBlackListService.js --network sepolia
# npx hardhat run scripts/deploy/deployTokenService.js --network sepolia
# npx hardhat run scripts/deploy/deployHolding.js --network sepolia
# npx hardhat run scripts/deploy/deployERC20VaultServiceUSDC.js --network sepolia
# npx hardhat run scripts/deploy/deployERC20VaultServiceUSDT.js --network sepolia
# npx hardhat run scripts/deploy/deployETHVaultService.js --network sepolia
# npx hardhat run scripts/deploy/addTokenService.js --network sepolia
# npx hardhat run scripts/deploy/setHolding.js --network sepolia
# npx hardhat run scripts/deploy/addTokenUSDC.js --network sepolia
# npx hardhat run scripts/deploy/addTokenUSDT.js --network sepolia
# npx hardhat run scripts/deploy/addTokenETH.js --network sepolia
# npx hardhat run scripts/deploy/transferOwnerShipBridge.js --network sepolia
# npx hardhat run scripts/deploy/transferOwnerShipBlackListService.js --network sepolia
# npx hardhat run scripts/deploy/transferOwnershipTokenservice.js --network sepolia
# npx hardhat run scripts/deploy/transferOwnerShipHolding.js --network sepolia
# npx hardhat run scripts/deploy/transferOwnerShipERC20VaultServiceUSDC.js --network sepolia
# npx hardhat run scripts/deploy/transferOwnerShipERC20VaultServiceUSDT.js --network sepolia
# npx hardhat run scripts/deploy/transferOwnerShipETHVaultService.js --network sepolia 