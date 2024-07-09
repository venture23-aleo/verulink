import dotenv from 'dotenv';
dotenv.config();

export default {
  mode: "execute",
  mainnet: {},
  networks: {
    testnet: {
      endpoint: "http://localhost:3030",
      accounts: [process.env.ALEO_DEVNET_PRIVATE_KEY1, process.env.ALEO_DEVNET_PRIVATE_KEY2, process.env.ALEO_DEVNET_PRIVATE_KEY3, process.env.ALEO_DEVNET_PRIVATE_KEY4],
      priorityFee: 0.01,
    },
    // testnet: {
    //   endpoint: `0`,
    //   accounts: [process.env.ALEO_DEVNET_PRIVATE_KEY1],
    //   priorityFee: 0.01,
    // },
  },
  defaultNetwork: "testnet",
};