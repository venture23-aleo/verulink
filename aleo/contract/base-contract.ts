import { ContractConfig, snarkDeploy } from "@aleojs/core";
import networkConfig from '../aleo-config'
import { to_address } from "aleo-program-to-address";
import { PrivateKey } from "@aleohq/sdk";

export class BaseContract {
    public config: ContractConfig = {};

    constructor(config: ContractConfig) {
        if (config) {
            this.config = {
                ...this.config,
                ...config
            };
        }

        if (!this.config.networkName)
            this.config.networkName = networkConfig.defaultNetwork;

        const networkName = this.config.networkName;
        if (networkName) {
            if (!networkConfig?.networks[networkName])
                throw Error(`Network config not defined for ${networkName}.Please add the config in aleo - config.js file in root directory`)

            this.config = {
                ...this.config,
                network: networkConfig.networks[networkName]
            };
        }

        if (!this.config.privateKey && networkName)
            this.config.privateKey = networkConfig.networks[networkName].accounts[0];

    }

    async deploy(): Promise<any> {
        const result = await snarkDeploy({
            config: this.config,
        });

        return result;
    }

    address(): string {
        return to_address(`${this.config.appName}.aleo`);
    }

    // TODO: handle properly
    getAccounts(): string[] {
        const accounts = this.config.network.accounts.map((pvtKey) => {
            return PrivateKey.from_string(pvtKey).to_address().to_string();
        })
        return accounts
    }

    // TODO: Handle properly
    connect(account: string) {
        const accounts = this.config.network.accounts.map((pvtKey) => {
            return PrivateKey.from_string(pvtKey).to_address().to_string();
        })
        const accountIndex = accounts.indexOf(account);
        if (accountIndex == -1) {
            throw Error(`Account ${account} not found!`);
        } else {
            const privateKeys = this.config.network.accounts;
            const accountPrivateKey = privateKeys[accountIndex];
            const defaultPrivateKey = privateKeys[0];
            privateKeys[0] = accountPrivateKey;
            privateKeys[accountIndex] = defaultPrivateKey;
            this.config.network.accounts = privateKeys;
        }
    }

}