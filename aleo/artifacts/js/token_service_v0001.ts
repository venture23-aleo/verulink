import {
  WithdrawalLimit
} from "./types";

import {
  getWithdrawalLimitLeo
} from "./js2leo";

import {
  getWithdrawalLimit
} from "./leo2js";

import {
  zkRun,
  ContractConfig,
  snarkDeploy,
  zkGetMapping,
  js2leo,
  leo2js
} from "@aleojs/core";

import {
  BaseContract
} from "../../contract/base-contract";

export class Token_service_v0001Contract extends BaseContract {

  config: ContractConfig;

  constructor(config: ContractConfig = {}) {
    super(config);
    this.config = {
      ...this.config,
      appName: 'token_service_v0001',
      contractPath: 'artifacts/leo/token_service_v0001',
      fee: '0.01'
    };
  }
  async initialize_ts(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'initialize_ts',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async transfer_ownership_ts(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'transfer_ownership_ts',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async add_token_ts(r0: string, r1: string, r2: bigint, r3: bigint, r4: number, r5: number, r6: bigint) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);
    const r3Leo = js2leo.u128(r3);
    const r4Leo = js2leo.u16(r4);
    const r5Leo = js2leo.u32(r5);
    const r6Leo = js2leo.u128(r6);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'add_token_ts',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async remove_token_ts(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'remove_token_ts',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async update_connector_ts(r0: string, r1: string) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.address(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'update_connector_ts',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async update_min_transfer_ts(r0: string, r1: bigint) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'update_min_transfer_ts',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async update_max_transfer_ts(r0: string, r1: bigint) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'update_max_transfer_ts',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async update_withdrawal_limit(r0: string, r1: number, r2: number, r3: bigint) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u16(r1);
    const r2Leo = js2leo.u32(r2);
    const r3Leo = js2leo.u128(r3);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'update_withdrawal_limit',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async token_send(r0: string, r1: string, r2: Array < number > , r3: bigint, r4: bigint, r5: Array < number > , r6: Array < number > ) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.u8));
    const r3Leo = js2leo.u128(r3);
    const r4Leo = js2leo.u128(r4);
    const r5Leo = js2leo.arr2string(js2leo.array(r5, js2leo.u8));
    const r6Leo = js2leo.arr2string(js2leo.array(r6, js2leo.u8));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'token_send',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async token_receive(r0: bigint, r1: Array < number > , r2: Array < number > , r3: string, r4: Array < number > , r5: string, r6: string, r7: bigint, r8: bigint, r9: number, r10: Array < string > , r11: Array < string > ) {
    const r0Leo = js2leo.u128(r0);
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.u8));
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.u8));
    const r3Leo = js2leo.address(r3);
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.u8));
    const r5Leo = js2leo.address(r5);
    const r6Leo = js2leo.address(r6);
    const r7Leo = js2leo.u128(r7);
    const r8Leo = js2leo.u64(r8);
    const r9Leo = js2leo.u32(r9);
    const r10Leo = js2leo.arr2string(js2leo.array(r10, js2leo.address));
    const r11Leo = js2leo.arr2string(js2leo.array(r11, js2leo.signature));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo, r7Leo, r8Leo, r9Leo, r10Leo, r11Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'token_receive',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async owner_TS(key: boolean): Promise < string > {
    const keyLeo = js2leo.boolean(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'owner_TS',
      params,
    });
    return leo2js.address(result);
  }

  async total_supply(key: string): Promise < bigint > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'total_supply',
      params,
    });
    return leo2js.u128(result);
  }

  async token_connectors(key: string): Promise < string > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'token_connectors',
      params,
    });
    return leo2js.address(result);
  }

  async min_transfers(key: string): Promise < bigint > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'min_transfers',
      params,
    });
    return leo2js.u128(result);
  }

  async max_transfers(key: string): Promise < bigint > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'max_transfers',
      params,
    });
    return leo2js.u128(result);
  }

  async token_withdrawal_limits(key: string): Promise < WithdrawalLimit > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'token_withdrawal_limits',
      params,
    });
    return getWithdrawalLimit(result);
  }

  async token_snapshot_withdrawal(key: string): Promise < bigint > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'token_snapshot_withdrawal',
      params,
    });
    return leo2js.u128(result);
  }

  async token_snapshot_height(key: string): Promise < number > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'token_snapshot_height',
      params,
    });
    return leo2js.u32(result);
  }

  async token_amount_withdrawn(key: string): Promise < bigint > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'token_amount_withdrawn',
      params,
    });
    return leo2js.u128(result);
  }


}