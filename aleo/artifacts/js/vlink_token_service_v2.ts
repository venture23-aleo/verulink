import {
  WithdrawalLimit,
  ChainToken
} from "./types/vlink_token_service_v2";
import {
  getWithdrawalLimitLeo,
  getChainTokenLeo
} from "./js2leo/vlink_token_service_v2";
import {
  getWithdrawalLimit,
  getChainToken
} from "./leo2js/vlink_token_service_v2";
import {
  Token as token_registry_Token
} from "./types/token_registry";
import {
  getTokenLeo as token_registry_getTokenLeo
} from "./js2leo/token_registry";
import {
  ContractConfig,
  zkGetMapping,
  LeoAddress,
  LeoRecord,
  js2leo,
  leo2js,
  ExternalRecord,
  ExecutionMode,
  ExecutionContext,
  CreateExecutionContext,
  TransactionResponse
} from "@doko-js/core";
import {
  BaseContract
} from "../../contract/base-contract";
import {
  TransactionModel
} from "@provablehq/sdk";
import * as receipt from "./transitions/vlink_token_service_v2";

export class Vlink_token_service_v2Contract extends BaseContract {

  constructor(config: Partial < ContractConfig > = {
    mode: ExecutionMode.LeoRun
  }) {
    super({
      ...config,
      appName: 'vlink_token_service_v2',
      fee: '0.01',
      contractPath: 'artifacts/leo/vlink_token_service_v2',
      isImportedAleo: false
    });
  }
  async initialize_ts(r0: LeoAddress): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Initialize_tsTransition, [] >> {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await this.ctx.execute('initialize_ts', params);
    return result
  }

  async transfer_ownership_ts(r0: LeoAddress): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Transfer_ownership_tsTransition, [] >> {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await this.ctx.execute('transfer_ownership_ts', params);
    return result
  }

  async update_other_chain_tokenservice(r0: bigint, r1: bigint, r2: Array < number > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Update_other_chain_tokenserviceTransition, [] >> {
    const r0Leo = js2leo.u128(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.u8));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('update_other_chain_tokenservice', params);
    return result
  }

  async update_other_chain_tokenaddress(r0: bigint, r1: bigint, r2: Array < number > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Update_other_chain_tokenaddressTransition, [] >> {
    const r0Leo = js2leo.u128(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.u8));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('update_other_chain_tokenaddress', params);
    return result
  }

  async remove_other_chain_addresses(r0: bigint, r1: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Remove_other_chain_addressesTransition, [] >> {
    const r0Leo = js2leo.u128(r0);
    const r1Leo = js2leo.field(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('remove_other_chain_addresses', params);
    return result
  }

  async add_token_ts(r0: bigint, r1: bigint, r2: bigint, r3: number, r4: number, r5: bigint, r6: Array < number > , r7: Array < number > , r8: bigint, r9: number, r10: number, r11: bigint, r12: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Add_token_tsTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.u128(r2);
    const r3Leo = js2leo.u32(r3);
    const r4Leo = js2leo.u32(r4);
    const r5Leo = js2leo.u128(r5);
    const r6Leo = js2leo.arr2string(js2leo.array(r6, js2leo.u8));
    const r7Leo = js2leo.arr2string(js2leo.array(r7, js2leo.u8));
    const r8Leo = js2leo.u128(r8);
    const r9Leo = js2leo.u32(r9);
    const r10Leo = js2leo.u32(r10);
    const r11Leo = js2leo.u128(r11);
    const r12Leo = js2leo.u128(r12);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo, r7Leo, r8Leo, r9Leo, r10Leo, r11Leo, r12Leo]
    const result = await this.ctx.execute('add_token_ts', params);
    return result
  }

  async remove_token_ts(r0: bigint, r1: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Remove_token_tsTransition, [] >> {
    const r0Leo = js2leo.u128(r0);
    const r1Leo = js2leo.field(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('remove_token_ts', params);
    return result
  }

  async pause_token_ts(r0: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Pause_token_tsTransition, [] >> {
    const r0Leo = js2leo.field(r0);

    const params = [r0Leo]
    const result = await this.ctx.execute('pause_token_ts', params);
    return result
  }

  async unpause_token_ts(r0: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Unpause_token_tsTransition, [] >> {
    const r0Leo = js2leo.field(r0);

    const params = [r0Leo]
    const result = await this.ctx.execute('unpause_token_ts', params);
    return result
  }

  async update_min_transfer_ts(r0: bigint, r1: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Update_min_transfer_tsTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('update_min_transfer_ts', params);
    return result
  }

  async update_max_transfer_ts(r0: bigint, r1: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Update_max_transfer_tsTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('update_max_transfer_ts', params);
    return result
  }

  async update_withdrawal_limit(r0: bigint, r1: number, r2: number, r3: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Update_withdrawal_limitTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.u32(r1);
    const r2Leo = js2leo.u32(r2);
    const r3Leo = js2leo.u128(r3);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('update_withdrawal_limit', params);
    return result
  }

  async token_send_public(r0: bigint, r1: Array < number > , r2: bigint, r3: bigint, r4: Array < number > , r5: Array < number > , r6: bigint, r7: boolean): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Token_send_publicTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.u8));
    const r2Leo = js2leo.u128(r2);
    const r3Leo = js2leo.u128(r3);
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.u8));
    const r5Leo = js2leo.arr2string(js2leo.array(r5, js2leo.u8));
    const r6Leo = js2leo.u128(r6);
    const r7Leo = js2leo.boolean(r7);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo, r7Leo]
    const result = await this.ctx.execute('token_send_public', params);
    return result
  }

  async token_send_private(r0: bigint, r1: Array < number > , r2: bigint, r3: bigint, r4: Array < number > , r5: Array < number > , r6: token_registry_Token, r7: bigint, r8: boolean): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Token_send_privateTransition, [ExternalRecord < 'token_registry', 'Token' > ] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.u8));
    const r2Leo = js2leo.u128(r2);
    const r3Leo = js2leo.u128(r3);
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.u8));
    const r5Leo = js2leo.arr2string(js2leo.array(r5, js2leo.u8));
    const r6Leo = js2leo.json(token_registry_getTokenLeo(r6));
    const r7Leo = js2leo.u128(r7);
    const r8Leo = js2leo.boolean(r8);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo, r7Leo, r8Leo]
    const result = await this.ctx.execute('token_send_private', params);
    result.set_converter_fn([
      [leo2js.externalRecord, 'token_registry.aleo/Token']
    ]);
    return result
  }

  async token_receive_public(r0: Array < number > , r1: bigint, r2: LeoAddress, r3: bigint, r4: bigint, r5: bigint, r6: Array < LeoAddress > , r7: Array < string > , r8: bigint, r9: Array < number > , r10: bigint, r11: number): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Token_receive_publicTransition, [boolean] >> {
    const r0Leo = js2leo.arr2string(js2leo.array(r0, js2leo.u8));
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.u128(r3);
    const r4Leo = js2leo.u64(r4);
    const r5Leo = js2leo.u64(r5);
    const r6Leo = js2leo.arr2string(js2leo.array(r6, js2leo.address));
    const r7Leo = js2leo.arr2string(js2leo.array(r7, js2leo.signature));
    const r8Leo = js2leo.u128(r8);
    const r9Leo = js2leo.arr2string(js2leo.array(r9, js2leo.u8));
    const r10Leo = js2leo.u128(r10);
    const r11Leo = js2leo.u8(r11);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo, r7Leo, r8Leo, r9Leo, r10Leo, r11Leo]
    const result = await this.ctx.execute('token_receive_public', params);
    result.set_converter_fn([leo2js.boolean]);
    return result
  }

  async token_receive_private(r0: Array < number > , r1: bigint, r2: bigint, r3: bigint, r4: bigint, r5: Array < LeoAddress > , r6: Array < string > , r7: bigint, r8: Array < number > , r9: bigint, r10: LeoAddress, r11: number, r12: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Token_receive_privateTransition, [boolean, ExternalRecord < 'token_registry', 'Token' > , ExternalRecord < 'token_registry', 'Token' > ] >> {
    const r0Leo = js2leo.arr2string(js2leo.array(r0, js2leo.u8));
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.u128(r2);
    const r3Leo = js2leo.u64(r3);
    const r4Leo = js2leo.u64(r4);
    const r5Leo = js2leo.arr2string(js2leo.array(r5, js2leo.address));
    const r6Leo = js2leo.arr2string(js2leo.array(r6, js2leo.signature));
    const r7Leo = js2leo.u128(r7);
    const r8Leo = js2leo.arr2string(js2leo.array(r8, js2leo.u8));
    const r9Leo = js2leo.field(r9);
    const r10Leo = js2leo.address(r10);
    const r11Leo = js2leo.u8(r11);
    const r12Leo = js2leo.u128(r12);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo, r7Leo, r8Leo, r9Leo, r10Leo, r11Leo, r12Leo]
    const result = await this.ctx.execute('token_receive_private', params);
    result.set_converter_fn([leo2js.boolean, [leo2js.externalRecord, 'token_registry.aleo/Token'],
      [leo2js.externalRecord, 'token_registry.aleo/Token']
    ]);
    return result
  }

  async add_chain_to_existing_token(r0: bigint, r1: bigint, r2: Array < number > , r3: Array < number > , r4: number, r5: number, r6: bigint, r7: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Add_chain_to_existing_tokenTransition, [] >> {
    const r0Leo = js2leo.u128(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.u8));
    const r3Leo = js2leo.arr2string(js2leo.array(r3, js2leo.u8));
    const r4Leo = js2leo.u32(r4);
    const r5Leo = js2leo.u32(r5);
    const r6Leo = js2leo.u128(r6);
    const r7Leo = js2leo.u128(r7);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo, r7Leo]
    const result = await this.ctx.execute('add_chain_to_existing_token', params);
    return result
  }

  async holding_release(r0: bigint, r1: LeoAddress, r2: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Holding_releaseTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('holding_release', params);
    return result
  }

  async holding_release_private(r0: bigint, r1: LeoAddress, r2: bigint, r3: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Holding_release_privateTransition, [ExternalRecord < 'token_registry', 'Token' > ] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.field(r2);
    const r3Leo = js2leo.u128(r3);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('holding_release_private', params);
    result.set_converter_fn([
      [leo2js.externalRecord, 'token_registry.aleo/Token']
    ]);
    return result
  }

  async holding_transfer_ownership(r0: LeoAddress): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Holding_transfer_ownershipTransition, [] >> {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await this.ctx.execute('holding_transfer_ownership', params);
    return result
  }

  async update_platform_fee(r0: bigint, r1: bigint, r2: number, r3: number): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Update_platform_feeTransition, [] >> {
    const r0Leo = js2leo.u128(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.u32(r2);
    const r3Leo = js2leo.u32(r3);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('update_platform_fee', params);
    return result
  }

  async update_relayer_fee(r0: bigint, r1: bigint, r2: bigint, r3: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_v2Update_relayer_feeTransition, [] >> {
    const r0Leo = js2leo.u128(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.u128(r2);
    const r3Leo = js2leo.u128(r3);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('update_relayer_fee', params);
    return result
  }

  async owner_TS(key: boolean, defaultValue ? : LeoAddress): Promise < LeoAddress > {
    const keyLeo = js2leo.boolean(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'owner_TS',
      params[0],
    );

    if (result != null)
      return leo2js.address(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`owner_TS returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async total_supply(key: bigint, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'total_supply',
      params[0],
    );

    if (result != null)
      return leo2js.u128(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`total_supply returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async added_tokens(key: bigint, defaultValue ? : boolean): Promise < boolean > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'added_tokens',
      params[0],
    );

    if (result != null)
      return leo2js.boolean(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`added_tokens returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async min_transfers(key: bigint, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'min_transfers',
      params[0],
    );

    if (result != null)
      return leo2js.u128(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`min_transfers returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async max_transfers(key: bigint, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'max_transfers',
      params[0],
    );

    if (result != null)
      return leo2js.u128(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`max_transfers returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async token_withdrawal_limits(key: bigint, defaultValue ? : WithdrawalLimit): Promise < WithdrawalLimit > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'token_withdrawal_limits',
      params[0],
    );

    if (result != null)
      return getWithdrawalLimit(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`token_withdrawal_limits returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async token_snapshot_withdrawal(key: bigint, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'token_snapshot_withdrawal',
      params[0],
    );

    if (result != null)
      return leo2js.u128(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`token_snapshot_withdrawal returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async token_snapshot_supply(key: bigint, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'token_snapshot_supply',
      params[0],
    );

    if (result != null)
      return leo2js.u128(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`token_snapshot_supply returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async token_snapshot_height(key: bigint, defaultValue ? : number): Promise < number > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'token_snapshot_height',
      params[0],
    );

    if (result != null)
      return leo2js.u32(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`token_snapshot_height returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async token_amount_withdrawn(key: bigint, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'token_amount_withdrawn',
      params[0],
    );

    if (result != null)
      return leo2js.u128(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`token_amount_withdrawn returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async token_status(key: bigint, defaultValue ? : boolean): Promise < boolean > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'token_status',
      params[0],
    );

    if (result != null)
      return leo2js.boolean(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`token_status returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async token_holding(key: bigint, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'token_holding',
      params[0],
    );

    if (result != null)
      return leo2js.u128(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`token_holding returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async other_chain_token_service(key: ChainToken, defaultValue ? : Array < number > ): Promise < Array < number >> {
    const keyLeo = js2leo.json(getChainTokenLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'other_chain_token_service',
      params[0],
    );

    if (result != null)
      return leo2js.array(result, leo2js.u8);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`other_chain_token_service returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async other_chain_token_address(key: ChainToken, defaultValue ? : Array < number > ): Promise < Array < number >> {
    const keyLeo = js2leo.json(getChainTokenLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'other_chain_token_address',
      params[0],
    );

    if (result != null)
      return leo2js.array(result, leo2js.u8);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`other_chain_token_address returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async public_platform_fee(key: ChainToken, defaultValue ? : number): Promise < number > {
    const keyLeo = js2leo.json(getChainTokenLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'public_platform_fee',
      params[0],
    );

    if (result != null)
      return leo2js.u32(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`public_platform_fee returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async private_platform_fee(key: ChainToken, defaultValue ? : number): Promise < number > {
    const keyLeo = js2leo.json(getChainTokenLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'private_platform_fee',
      params[0],
    );

    if (result != null)
      return leo2js.u32(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`private_platform_fee returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async public_relayer_fee(key: ChainToken, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.json(getChainTokenLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'public_relayer_fee',
      params[0],
    );

    if (result != null)
      return leo2js.u128(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`public_relayer_fee returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async private_relayer_fee(key: ChainToken, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.json(getChainTokenLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'private_relayer_fee',
      params[0],
    );

    if (result != null)
      return leo2js.u128(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`private_relayer_fee returned invalid value[input: ${key}, output: ${result}`);
    }
  }


}