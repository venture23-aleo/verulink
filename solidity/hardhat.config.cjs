require("@nomicfoundation/hardhat-toolbox");
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
            runs: 200,
            details: { yul: false },
          }
        }
      }
    ]
  },
  networks: {
    goerli: {
      url: "https://eth-goerli.g.alchemy.com/v2/fLCeKO4GA9Gc3js8MUt9Djy7WHCFxATq",
      accounts: [process.env.SECRET_KEY1]
    },
    sepolia: {
      url: "https://rpc2.sepolia.org/",
      accounts: [process.env.SECRET_KEY1,
      process.env.SECRET_KEY2,
      process.env.SECRET_KEY3,
      process.env.SECRET_KEY4,
      process.env.SECRET_KEY5,
      process.env.SECRET_KEY6,
      process.env.SECRET_KEY7]
    },
  },

  contractSizer: {
    alphaSort: true,
    runOnCompile: true
  },
  mocha: {
    timeout: 100000000
  }
};
