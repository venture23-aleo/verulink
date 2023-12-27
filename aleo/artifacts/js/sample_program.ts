import * as js2leo from './js2leo/common';
import * as leo2js from './leo2js/common';
import {
  zkRun,
  ContractConfig,
  snarkDeploy,
  zkGetMapping
} from './utils';

const networkConfig = require('../../aleo-config');

export class Sample_programContract {

  config: ContractConfig;

  constructor(config: ContractConfig = {}) {
    this.config = {
      privateKey: 'APrivateKey1zkp95GqZzsZzhecJdF19jdTHwHsFj4SxyP1oGK2zRp9huPc',
      viewKey: 'APrivateKey1zkp95GqZzsZzhecJdF19jdTHwHsFj4SxyP1oGK2zRp9huPc',
      appName: 'sample_program',
      contractPath: 'artifacts/leo/sample_program',
      fee: '0.01'
    };
    this.config = {
      ...this.config,
      ...config
    };
    if (config.networkName) {
      if (!networkConfig?.[config.networkName])
        throw Error(`Network config not defined for ${config.networkName}. Please add the config in aleo-config.js file in root directory`)
      this.config = {
        ...this.config,
        network: networkConfig[config.networkName]
      };
    }
  }

  async deploy(): Promise < any > {
    const result = await snarkDeploy({
      config: this.config,
    });

    return result;
  }
  async main(r0: number, r1: number): Promise < number | any > {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u32(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'main',
      params,
    });
    if (this.config.mode === "execute") return result;
    const out0 = leo2js.u32(result.data[0] as string);
    return out0;
  }


}