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
        process.env.SECRET_KEY1,
        process.env.SECRET_KEY2,
        process.env.SECRET_KEY3,
        process.env.SECRET_KEY4,
        process.env.SECRET_KEY5,
        process.env.SECRET_KEY6,
        process.env.SECRET_KEY7]
    },
    base: {
      url: "https://sepolia.base.org",
      accounts: [
        process.env.SECRET_KEY1,
        process.env.SECRET_KEY2,
        process.env.SECRET_KEY3,
        process.env.SECRET_KEY4,
        process.env.SECRET_KEY5,
        process.env.SECRET_KEY6,
        process.env.SECRET_KEY7]
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
