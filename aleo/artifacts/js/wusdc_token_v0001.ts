import {
  token,
  Approval,
  TokenInfo
} from "./types";

import {
  gettokenLeo,
  getApprovalLeo,
  getTokenInfoLeo
} from "./js2leo";

import {
  gettoken,
  getApproval,
  getTokenInfo
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

export class Wusdc_token_v0001Contract extends BaseContract {

  config: ContractConfig;

  constructor(config: ContractConfig = {}) {
    super(config);
    this.config = {
      ...this.config,
      appName: 'wusdc_token_v0001',
      contractPath: 'artifacts/leo/wusdc_token_v0001',
      fee: '0.01'
    };
  }
  async initialize_token(r0: Array < number > , r1: Array < number > , r2: number) {
    const r0Leo = js2leo.arr2string(js2leo.array(r0, js2leo.u8));
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.u8));
    const r2Leo = js2leo.u8(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'initialize_token',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async transfer_ownership_token(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'transfer_ownership_token',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async mint_public(r0: string, r1: bigint) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'mint_public',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async burn_public(r0: string, r1: bigint) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'burn_public',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async transfer_public(r0: string, r1: bigint) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'transfer_public',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async transfer_private(r0: token, r1: string, r2: bigint): Promise < [token, token] | any > {
    const r0Leo = js2leo.json(gettokenLeo(r0));
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);

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

  async transfer_private_to_public(r0: token, r1: string, r2: bigint): Promise < token | any > {
    const r0Leo = js2leo.json(gettokenLeo(r0));
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);

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

  async transfer_public_to_private(r0: string, r1: bigint): Promise < token | any > {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u128(r1);

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

  async approve_public(r0: string, r1: bigint) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'approve_public',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async unapprove_public(r0: string, r1: bigint) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'unapprove_public',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async transfer_from_public(r0: string, r1: string, r2: bigint) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'transfer_from_public',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async account(key: string): Promise < bigint > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'account',
      params,
    });
    return leo2js.u128(result);
  }

  async approvals(key: bigint): Promise < bigint > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'approvals',
      params,
    });
    return leo2js.u128(result);
  }

  async token_owner(key: boolean): Promise < string > {
    const keyLeo = js2leo.boolean(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'token_owner',
      params,
    });
    return leo2js.address(result);
  }

  async info(key: boolean): Promise < TokenInfo > {
    const keyLeo = js2leo.boolean(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'info',
      params,
    });
    return getTokenInfo(result);
  }


}