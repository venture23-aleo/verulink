require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config()

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.19",
  networks: {
    goerli: {
      url: "https://eth-goerli.g.alchemy.com/v2/fLCeKO4GA9Gc3js8MUt9Djy7WHCFxATq",
      accounts: [process.env.secret_key1]
    }
  }
};
