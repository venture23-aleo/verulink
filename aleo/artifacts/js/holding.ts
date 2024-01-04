import * as js2leo from './js2leo/common';
import * as leo2js from './leo2js/common';
import {
  TokenAccount,
  wrapped_token,
  WTForeignContract,
  TokenInfo,
  WrappedTokenInfo,
  TokenAccount,
} from "./types";
import {
  getTokenAccountLeo,
  getwrapped_tokenLeo,
  getWTForeignContractLeo,
  getTokenInfoLeo,
  getWrappedTokenInfoLeo,
  getTokenAccountLeo,
} from './js2leo';
import {
  getTokenAccount,
  getwrapped_token,
  getWTForeignContract,
  getTokenInfo,
  getWrappedTokenInfo,
  getTokenAccount,
} from './leo2js';
import {
  zkRun,
  ContractConfig,
  snarkDeploy,
  zkGetMapping
} from './utils';

const networkConfig = require('../../aleo-config');

export class HoldingContract {

  config: ContractConfig;

  constructor(config: ContractConfig = {}) {
    this.config = {
      appName: 'holding',
      contractPath: 'artifacts/leo/holding',
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
  async token_service_initialize(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'token_service_initialize',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async hold_fund(r0: string, r1: string, r2: BigInt) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u64(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'hold_fund',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async release_fund(r0: string, r1: string, r2: BigInt) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u64(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'release_fund',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async council_program_holding(key: boolean): Promise < string > {
    const keyLeo = js2leo.boolean(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'council_program_holding',
      params,
    });
    return leo2js.address(result);
  }

  async holdings(key: TokenAccount): Promise < BigInt > {
    const keyLeo = js2leo.json(getTokenAccountLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'holdings',
      params,
    });
    return leo2js.u64(result);
  }


}