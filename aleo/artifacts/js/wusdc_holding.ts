import * as js2leo from './js2leo/common';
import * as leo2js from './leo2js/common';
import {
  zkRun,
  ContractConfig,
  snarkDeploy,
  zkGetMapping
} from './utils';

const networkConfig = require('../../aleo-config');

export class Wusdc_holdingContract {

  config: ContractConfig;

  constructor(config: ContractConfig = {}) {
    this.config = {
      appName: 'wusdc_holding',
      contractPath: 'artifacts/leo/wusdc_holding',
      fee: '0.01'
    };
    this.config = {
      ...this.config,
      ...config
    };
    if (!config.networkName)
      this.config.networkName = networkConfig.defaultNetwork;

    const networkName = this.config.networkName;
    if (networkName) {
      if (!networkConfig?.networks[networkName])
        throw Error(`Network config not defined for ${ networkName }.Please add the config in aleo - config.js file in root directory`)

      this.config = {
        ...this.config,
        network: networkConfig.networks[networkName]
      };
    }

    if (!this.config.privateKey)
      this.config.privateKey = networkConfig.networks[networkName].accounts[0];
  }

  async deploy(): Promise < any > {
    const result = await snarkDeploy({
      config: this.config,
    });

    return result;
  }
  async initialize_wusdc_holding() {

    const params = []
    const result = await zkRun({
      config: this.config,
      transition: 'initialize_wusdc_holding',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async transfer_ownership_wusdc_holdin(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'transfer_ownership_wusdc_holdin',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async hold_fund(r0: string, r1: bigint) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'hold_fund',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async release_fund(r0: string, r1: bigint) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'release_fund',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async owner_holding(key: boolean): Promise < string > {
    const keyLeo = js2leo.boolean(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'owner_holding',
      params,
    });
    return leo2js.address(result);
  }

  async holdings(key: string): Promise < bigint > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'holdings',
      params,
    });
    return leo2js.u64(result);
  }


}