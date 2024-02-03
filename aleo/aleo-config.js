import dotenv from 'dotenv';
dotenv.config();

export default {
  accounts: [process.env.ALEO_PRIVATE_KEY],
  mode: "execute",
  mainnet: {},
  networks: {
    testnet3: {
      endpoint: "http://localhost:3030",
      accounts: [process.env.ALEO_DEVNET_PRIVATE_KEY1, process.env.ALEO_DEVNET_PRIVATE_KEY2, process.env.ALEO_DEVNET_PRIVATE_KEY3, process.env.ALEO_DEVNET_PRIVATE_KEY4],
      priorityFee: 0.01,
    },
    // testnet3: {
    //   endpoint: "https://api.explorer.aleo.org/v1",
    //   accounts: [process.env.ALEO_TESTNET3_PRIVATE_KEY],
    //   priorityFee: 0.001,
    // },
  },
  defaultNetwork: "testnet3",
};
