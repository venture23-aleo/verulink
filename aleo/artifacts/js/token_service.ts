import * as js2leo from './js2leo/common';
import * as leo2js from './leo2js/common';
import {
  TSForeignContract,
  TokenOrigin,
} from "./types";
import {
  getTSForeignContractLeo,
  getTokenOriginLeo,
} from './js2leo';
import {
  getTSForeignContract,
  getTokenOrigin,
} from './leo2js';
import {
  zkRun,
  ContractConfig,
  snarkDeploy,
  zkGetMapping
} from './utils';

const networkConfig = require('../../aleo-config');

export class Token_serviceContract {

  config: ContractConfig;

  constructor(config: ContractConfig = {}) {
    this.config = {
      appName: 'token_service',
      contractPath: 'artifacts/leo/token_service',
      fee: '0.01'
    };
    this.config = {
      ...this.config,
      ...config
    };
    if (config.networkName) {
      if (!networkConfig?.networks[config.networkName])
        throw Error(`Network config not defined for ${config.networkName}. Please add the config in aleo-config.js file in root directory`)
      this.config = {
        ...this.config,
        network: networkConfig.networks[config.networkName]
      };
    }
  }

  async deploy(): Promise < any > {
    const result = await snarkDeploy({
      config: this.config,
    });

    return result;
  }
  async token_service_initialize(r0: string, r1: string) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.address(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'token_service_initialize',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async support_chain(r0: number, r1: Array < number > ) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.u8));

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'support_chain',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async enable_token(r0: string, r1: BigInt, r2: number, r3: number) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);
    const r2Leo = js2leo.u16(r2);
    const r3Leo = js2leo.u32(r3);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'enable_token',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async token_send(r0: string, r1: Array < number > , r2: BigInt, r3: TokenOrigin) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.u8));
    const r2Leo = js2leo.u64(r2);
    const r3Leo = js2leo.json(getTokenOriginLeo(r3));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'token_send',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async token_receive(r0: TokenOrigin, r1: string, r2: Array < number > , r3: string, r4: string, r5: BigInt, r6: number, r7: number) {
    const r0Leo = js2leo.json(getTokenOriginLeo(r0));
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.u8));
    const r3Leo = js2leo.address(r3);
    const r4Leo = js2leo.address(r4);
    const r5Leo = js2leo.u64(r5);
    const r6Leo = js2leo.u32(r6);
    const r7Leo = js2leo.u32(r7);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo, r7Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'token_receive',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async token_service_contracts(key: number): Promise < Array < number >> {
    const keyLeo = js2leo.u32(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'token_service_contracts',
      params,
    });
    return leo2js.array(result, leo2js.u8);
  }

  async governance_TS(key: boolean): Promise < string > {
    const keyLeo = js2leo.boolean(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'governance_TS',
      params,
    });
    return leo2js.address(result);
  }

  async holding_program_TS(key: boolean): Promise < string > {
    const keyLeo = js2leo.boolean(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'holding_program_TS',
      params,
    });
    return leo2js.address(result);
  }

  async total_supply(key: string): Promise < BigInt > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'total_supply',
      params,
    });
    return leo2js.u64(result);
  }

  async minimum_transfers(key: string): Promise < BigInt > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'minimum_transfers',
      params,
    });
    return leo2js.u64(result);
  }

  async max_outgoing_percentage(key: string): Promise < number > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'max_outgoing_percentage',
      params,
    });
    return leo2js.u16(result);
  }

  async timeframe(key: string): Promise < number > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'timeframe',
      params,
    });
    return leo2js.u32(result);
  }

  async maximum_liquidity_for_no_cap(key: string): Promise < number > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'maximum_liquidity_for_no_cap',
      params,
    });
    return leo2js.u32(result);
  }

  async last_token_update(key: string): Promise < number > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'last_token_update',
      params,
    });
    return leo2js.u32(result);
  }

  async last_min_supply(key: string): Promise < BigInt > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'last_min_supply',
      params,
    });
    return leo2js.u64(result);
  }


}