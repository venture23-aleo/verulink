require('dotenv').config()

module.exports = {
  accounts: [process.env.ALEO_PRIVATE_KEY],
  mode: "execute",
  mainnet: {},
  networks: {
    local: {
      endpoint: "http://localhost:3030",
      accounts: [process.env.ALEO_TESTNET_PRIVATE_KEY],
      priorityFee: 0.01,
    },
    testnet3: {
      endpoint: "https://api.explorer.aleo.org/v1",
      accounts: [process.env.ALEO_TESTNET3_PRIVATE_KEY],
      priorityFee: 0.001,
    },
  },
  defaultNetwork: "testnet3",
};
