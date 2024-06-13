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
    // testnet3: {
    //   endpoint: `https://explorer.hamp.app`,
    //   // endpoint: `https://aleo-testnet3.obscura.build/v1/${process.env.OBSCURA_TESTNET3_API}`,
    //   accounts: [process.env.ALEO_TESTNET3_PRIVATE_KEY],
    //   priorityFee: 0.001,
    // },
  },
  defaultNetwork: "testnet",
};