require("@nomicfoundation/hardhat-toolbox");
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
      url: "https://rpc2.sepolia.org/",
      accounts: [
        process.env.SECRET_KEY1]
    },
  },
  // etherscan: {
  //   apiKey: {
  //     sepolia: process.env.ETHERSCAN_API_KEY,
  //   }
  // },
  contractSizer: {
    alphaSort: true,
    runOnCompile: true
  },
  mocha: {
    timeout: 100000000
  },
};
