import * as js2leo from './js2leo/common';
import * as leo2js from './leo2js/common';
import {
  token,
} from "./types";
import {
  gettokenLeo,
} from './js2leo';
import {
  gettoken,
} from './leo2js';
import {
  zkRun,
  ContractConfig,
  snarkDeploy,
  zkGetMapping
} from './utils';

const networkConfig = require('../../aleo-config');

export class TokenContract {

  config: ContractConfig;

  constructor(config: ContractConfig = {}) {
    this.config = {
      privateKey: 'APrivateKey1zkp5aBpUZcnqEmVFq74kmuS2642fKDEHpzRbSRLrD4UGDbv',
      viewKey: 'APrivateKey1zkp5aBpUZcnqEmVFq74kmuS2642fKDEHpzRbSRLrD4UGDbv',
      appName: 'token',
      contractPath: 'artifacts/leo/token',
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
  async mint_public(r0: string, r1: BigInt) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'mint_public',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async mint_private(r0: string, r1: BigInt): Promise < token | any > {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'mint_private',
      params,
    });
    if (this.config.mode === "execute") return result;
    const out0 = gettoken(result.data[0]);
    return out0;
  }

  async transfer_public(r0: string, r1: BigInt) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'transfer_public',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async transfer_private(r0: token, r1: string, r2: BigInt): Promise < [token, token] | any > {
    const r0Leo = js2leo.json(gettokenLeo(r0));
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u64(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'transfer_private',
      params,
    });
    if (this.config.mode === "execute") return result;
    const out0 = gettoken(result.data[0]);
    const out1 = gettoken(result.data[1]);
    return [out0, out1];
  }

  async transfer_private_to_public(r0: token, r1: string, r2: BigInt): Promise < token | any > {
    const r0Leo = js2leo.json(gettokenLeo(r0));
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u64(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'transfer_private_to_public',
      params,
    });
    if (this.config.mode === "execute") return result;
    const out0 = gettoken(result.data[0]);
    return out0;
  }

  async transfer_public_to_private(r0: string, r1: BigInt): Promise < token | any > {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'transfer_public_to_private',
      params,
    });
    if (this.config.mode === "execute") return result;
    const out0 = gettoken(result.data[0]);
    return out0;
  }

  async account(key: string): Promise < BigInt > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'account',
      params,
    });
    return leo2js.u64(result);
  }


}