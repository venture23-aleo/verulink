import * as js2leo from './js2leo/common';
import * as leo2js from './leo2js/common';
import {
  wrapped_token,
  WTForeignContract,
  TokenInfo,
  WrappedTokenInfo,
  TokenAccount,
} from "./types";
import {
  getwrapped_tokenLeo,
  getWTForeignContractLeo,
  getTokenInfoLeo,
  getWrappedTokenInfoLeo,
  getTokenAccountLeo,
} from './js2leo';
import {
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

export class Wrapped_tokenContract {

  config: ContractConfig;

  constructor(config: ContractConfig = {}) {
    this.config = {
      appName: 'wrapped_token',
      contractPath: 'artifacts/leo/wrapped_token',
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
  async wrapped_token_initialize(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'wrapped_token_initialize',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async add_token(r0: Array < number > , r1: Array < number > , r2: number, r3: number, r4: Array < number > ) {
    const r0Leo = js2leo.arr2string(js2leo.array(r0, js2leo.u8));
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.u8));
    const r2Leo = js2leo.u8(r2);
    const r3Leo = js2leo.u32(r3);
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.u8));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'add_token',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async transfer_public(r0: string, r1: BigInt, r2: string) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);
    const r2Leo = js2leo.address(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'transfer_public',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async transfer_private(r0: wrapped_token, r1: string, r2: BigInt): Promise < [wrapped_token, wrapped_token] | any > {
    const r0Leo = js2leo.json(getwrapped_tokenLeo(r0));
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u64(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'transfer_private',
      params,
    });
    if (this.config.mode === "execute") return result;
    const out0 = getwrapped_token(result.data[0]);
    const out1 = getwrapped_token(result.data[1]);
    return [out0, out1];
  }

  async transfer_private_to_public(r0: wrapped_token, r1: string, r2: BigInt): Promise < wrapped_token | any > {
    const r0Leo = js2leo.json(getwrapped_tokenLeo(r0));
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u64(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'transfer_private_to_public',
      params,
    });
    if (this.config.mode === "execute") return result;
    const out0 = getwrapped_token(result.data[0]);
    return out0;
  }

  async transfer_public_to_private(r0: string, r1: BigInt, r2: string): Promise < wrapped_token | any > {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);
    const r2Leo = js2leo.address(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'transfer_public_to_private',
      params,
    });
    if (this.config.mode === "execute") return result;
    const out0 = getwrapped_token(result.data[0]);
    return out0;
  }

  async mint(r0: string, r1: BigInt, r2: string, r3: number, r4: Array < number > ) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.u32(r3);
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.u8));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'mint',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async burn(r0: BigInt, r1: string, r2: number, r3: Array < number > ) {
    const r0Leo = js2leo.u64(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u32(r2);
    const r3Leo = js2leo.arr2string(js2leo.array(r3, js2leo.u8));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'burn',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async token_info(key: string): Promise < TokenInfo > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'token_info',
      params,
    });
    return getTokenInfo(result);
  }

  async token_origin(key: string): Promise < WTForeignContract > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'token_origin',
      params,
    });
    return getWTForeignContract(result);
  }

  async token_supply(key: string): Promise < BigInt > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'token_supply',
      params,
    });
    return leo2js.u64(result);
  }

  async token_balances(key: TokenAccount): Promise < BigInt > {
    const keyLeo = js2leo.json(getTokenAccountLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'token_balances',
      params,
    });
    return leo2js.u64(result);
  }

  async council_program_WT(key: boolean): Promise < string > {
    const keyLeo = js2leo.boolean(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'council_program_WT',
      params,
    });
    return leo2js.address(result);
  }


}