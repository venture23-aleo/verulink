require("@nomicfoundation/hardhat-toolbox");
require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.19",
        settings: {
          optimizer: {
            enabled: true,
            runs: 400,
            details: { yul: false },
          }
        }
      }
    ]
  },
  networks: {
    sepolia: {
      url: process.env.PROVIDER,
      accounts: [
        process.env.DEPLOYER_PRIVATE_KEY]
    },
    mainnet: {
      url: process.env.PROVIDER,
      accounts: [
        process.env.DEPLOYER_PRIVATE_KEY]
    },
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY,
    }
  },
  // contractSizer: {
  //   alphaSort: true,
  //   runOnCompile: true
  // },
  mocha: {
    timeout: 100000000
  },
};
