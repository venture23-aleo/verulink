import {
  Holder
} from "./types/vlink_holding_v2";
import {
  getHolderLeo
} from "./js2leo/vlink_holding_v2";
import {
  getHolder
} from "./leo2js/vlink_holding_v2";
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
import * as receipt from "./transitions/vlink_holding_v2";

export class Vlink_holding_v2Contract extends BaseContract {

  constructor(config: Partial < ContractConfig > = {
    mode: ExecutionMode.LeoRun
  }) {
    super({
      ...config,
      appName: 'vlink_holding_v2',
      fee: '0.01',
      contractPath: 'artifacts/leo/vlink_holding_v2',
      isImportedAleo: false
    });
  }
  async initialize_holding(r0: LeoAddress): Promise < TransactionResponse < TransactionModel & receipt.Vlink_holding_v2Initialize_holdingTransition, [] >> {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await this.ctx.execute('initialize_holding', params);
    return result
  }

  async transfer_ownership_holding(r0: LeoAddress): Promise < TransactionResponse < TransactionModel & receipt.Vlink_holding_v2Transfer_ownership_holdingTransition, [] >> {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await this.ctx.execute('transfer_ownership_holding', params);
    return result
  }

  async hold_fund(r0: LeoAddress, r1: bigint, r2: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_holding_v2Hold_fundTransition, [] >> {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.u128(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('hold_fund', params);
    return result
  }

  async release_fund(r0: LeoAddress, r1: bigint, r2: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_holding_v2Release_fundTransition, [] >> {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.u128(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('release_fund', params);
    return result
  }

  async release_fund_private(r0: LeoAddress, r1: bigint, r2: bigint, r3: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_holding_v2Release_fund_privateTransition, [ExternalRecord < 'token_registry', 'Token' > ] >> {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.field(r2);
    const r3Leo = js2leo.u128(r3);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('release_fund_private', params);
    result.set_converter_fn([
      [leo2js.externalRecord, 'token_registry.aleo/Token']
    ]);
    return result
  }

  async holdings(key: Holder, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.json(getHolderLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'holdings',
      params[0],
    );

    if (result != null)
      return leo2js.u128(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`holdings returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async owner_holding(key: boolean, defaultValue ? : LeoAddress): Promise < LeoAddress > {
    const keyLeo = js2leo.boolean(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'owner_holding',
      params[0],
    );

    if (result != null)
      return leo2js.address(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`owner_holding returned invalid value[input: ${key}, output: ${result}`);
    }
  }


}