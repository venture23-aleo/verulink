require("@nomicfoundation/hardhat-toolbox");
require('@nomiclabs/hardhat-ethers');
require("@nomiclabs/hardhat-etherscan");
require("hardhat-contract-sizer");
require('solidity-coverage')
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
                        details: {yul: false},
                    }
                }
            }
        ]
    },
    networks: {
        hardhat: {
            allowUnlimitedContractSize: true,
        },
        sepolia: {
            url: process.env.PROVIDER || "",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
        holesky: {
            url: process.env.PROVIDER || "",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
        mainnet: {
            url: process.env.PROVIDER || "",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
        },
        "base-sepolia": {
            url: process.env.PROVIDER || "",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
        },
        "arbitrum-sepolia": {
            url: process.env.PROVIDER || "",
            accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : []
        },
    },
    etherscan: {
        apiKey: {
            sepolia: process.env.ETHERSCAN_API_KEY,
            holesky: process.env.ETHERSCAN_API_KEY,
            "base-sepolia": process.env.ETHERSCAN_API_KEY,
            "arbitrum-sepolia": process.env.ETHERSCAN_API_KEY,
        },
        customChains: [
            {
                network: "base",
                chainId: 8453,
                urls: {
                  apiURL: "https://api.basescan.org/api",
                  browserURL: "https://basescan.org"
                }
              },
              {
                network: "base-sepolia",
                chainId: 84532,
                urls: {
                  apiURL: "https://api-sepolia.basescan.org/api",
                  browserURL: "https://sepolia.basescan.org"
                }
              },
            {
                network: "holesky",
                chainId: 17000,
                urls: {
                    apiURL: "https://api-holesky.etherscan.io/api",
                    browserURL: "https://holesky.etherscan.io/",
                },
            },
            {
                network: "arbitrum-sepolia",
                chainId: 421614,
                urls: {
                  apiURL: "https://api-sepolia.arbiscan.io/api",
                  browserURL: "https://sepolia.arbiscan.io/",
                }
              }
        ]
    },
    contractSizer: {
      alphaSort: true,
      runOnCompile: true
    },
    mocha: {
        timeout: 100000000
    },
};
