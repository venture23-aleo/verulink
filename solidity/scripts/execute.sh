# Deployment using single owner:
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

# Deployment using multisig:
# node scripts/multisig/setup/001.deployERC20TokenBridgeImpl.js 
# node scripts/multisig/setup/002.deployERC20TokenBridgeProxy.js
# node scripts/multisig/setup/005.deployBlackListServiceImpl.js
# node scripts/multisig/setup/006.deployBlackListServiceProxy.js
# node scripts/multisig/setup/007.deployTokenServiceImpl.js
# node scripts/multisig/setup/008.deployTokenServiceProxy.js
# node scripts/multisig/setup/0017.deployHoldingImpl.js
# node scripts/multisig/setup/0018.deployHoldingProxy.js
# node scripts/multisig/setup/0010.deployErc20VaultServiceImplUSDC.js 
# node scripts/multisig/setup/0011.deployErc20VaultServiceProxyUSDC.js
# node scripts/multisig/setup/0021.deployErc20VaultServiceImplUSDT.js
# node scripts/multisig/setup/0022.deployErc20VaultServiceProxyUSDT.js
# node scripts/multisig/setup/0012.deployETHVaultServiceImpl.js
# node scripts/multisig/setup/0013.deployETHVaultServiceProxy.js
# node scripts/multisig/setup/009.addTokenService.js 
# node scripts/multisig/setup/0019.setHolding.js 
# node scripts/multisig/setup/004.addAttestor.js 
# node scripts/multisig/setup/0014.addTokenUSDC.js
node scripts/multisig/setup/0015.addTokenUSDT.js
node scripts/multisig/setup/0016.addTokenETH.js
# node scripts/multisig/setup/removeAttestor.js 