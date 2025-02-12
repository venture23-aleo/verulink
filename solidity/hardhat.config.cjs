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
        }
    },
    etherscan: {
        apiKey: {
            sepolia: process.env.ETHERSCAN_API_KEY,
            holesky: process.env.ETHERSCAN_API_KEY,
        },
        customChains: [
            {
                network: "holesky",
                chainId: 17000,
                urls: {
                    apiURL: "https://api-holesky.etherscan.io/api",
                    browserURL: "https://holesky.etherscan.io/",
                },
            },
        ]
    },
    // contractSizer: {
    //   alphaSort: true,
    //   runOnCompile: true
    // },
    mocha: {
        timeout: 100000000
    },
};
