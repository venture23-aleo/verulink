import {
  credits,
  committee_state,
  bond_state,
  unbond_state
} from "./types/credits";
import {
  getcreditsLeo,
  getcommittee_stateLeo,
  getbond_stateLeo,
  getunbond_stateLeo
} from "./js2leo/credits";
import {
  getcredits,
  getcommittee_state,
  getbond_state,
  getunbond_state
} from "./leo2js/credits";
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
import * as receipt from "./transitions/credits";

export class CreditsContract extends BaseContract {

  constructor(config: Partial < ContractConfig > = {
    mode: ExecutionMode.LeoRun
  }) {
    super({
      ...config,
      appName: 'credits',
      fee: '0.01',
      contractPath: 'imports/credits',
      isImportedAleo: true
    });
  }
  async bond_validator(r0: LeoAddress, r1: bigint, r2: number): Promise < TransactionResponse < TransactionModel & receipt.CreditsBond_validatorTransition, [] >> {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);
    const r2Leo = js2leo.u8(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('bond_validator', params);
    return result
  }

  async bond_public(r0: LeoAddress, r1: LeoAddress, r2: bigint): Promise < TransactionResponse < TransactionModel & receipt.CreditsBond_publicTransition, [] >> {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u64(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('bond_public', params);
    return result
  }

  async unbond_public(r0: LeoAddress, r1: bigint): Promise < TransactionResponse < TransactionModel & receipt.CreditsUnbond_publicTransition, [] >> {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('unbond_public', params);
    return result
  }

  async claim_unbond_public(r0: LeoAddress): Promise < TransactionResponse < TransactionModel & receipt.CreditsClaim_unbond_publicTransition, [] >> {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await this.ctx.execute('claim_unbond_public', params);
    return result
  }

  async set_validator_state(r0: boolean): Promise < TransactionResponse < TransactionModel & receipt.CreditsSet_validator_stateTransition, [] >> {
    const r0Leo = js2leo.boolean(r0);

    const params = [r0Leo]
    const result = await this.ctx.execute('set_validator_state', params);
    return result
  }

  async transfer_public(r0: LeoAddress, r1: bigint): Promise < TransactionResponse < TransactionModel & receipt.CreditsTransfer_publicTransition, [] >> {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('transfer_public', params);
    return result
  }

  async transfer_public_as_signer(r0: LeoAddress, r1: bigint): Promise < TransactionResponse < TransactionModel & receipt.CreditsTransfer_public_as_signerTransition, [] >> {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('transfer_public_as_signer', params);
    return result
  }

  async transfer_private(r0: credits, r1: LeoAddress, r2: bigint): Promise < TransactionResponse < TransactionModel & receipt.CreditsTransfer_privateTransition, [LeoRecord, LeoRecord] >> {
    const r0Leo = js2leo.json(getcreditsLeo(r0));
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u64(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('transfer_private', params);
    result.set_converter_fn([leo2js.record, leo2js.record]);
    return result
  }

  async transfer_private_to_public(r0: credits, r1: LeoAddress, r2: bigint): Promise < TransactionResponse < TransactionModel & receipt.CreditsTransfer_private_to_publicTransition, [LeoRecord] >> {
    const r0Leo = js2leo.json(getcreditsLeo(r0));
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u64(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('transfer_private_to_public', params);
    result.set_converter_fn([leo2js.record]);
    return result
  }

  async transfer_public_to_private(r0: LeoAddress, r1: bigint): Promise < TransactionResponse < TransactionModel & receipt.CreditsTransfer_public_to_privateTransition, [LeoRecord] >> {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('transfer_public_to_private', params);
    result.set_converter_fn([leo2js.record]);
    return result
  }

  async join(r0: credits, r1: credits): Promise < TransactionResponse < TransactionModel & receipt.CreditsJoinTransition, [LeoRecord] >> {
    const r0Leo = js2leo.json(getcreditsLeo(r0));
    const r1Leo = js2leo.json(getcreditsLeo(r1));

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('join', params);
    result.set_converter_fn([leo2js.record]);
    return result
  }

  async split(r0: credits, r1: bigint): Promise < TransactionResponse < TransactionModel & receipt.CreditsSplitTransition, [LeoRecord, LeoRecord] >> {
    const r0Leo = js2leo.json(getcreditsLeo(r0));
    const r1Leo = js2leo.u64(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('split', params);
    result.set_converter_fn([leo2js.record, leo2js.record]);
    return result
  }

  async fee_private(r0: credits, r1: bigint, r2: bigint, r3: bigint): Promise < TransactionResponse < TransactionModel & receipt.CreditsFee_privateTransition, [LeoRecord] >> {
    const r0Leo = js2leo.json(getcreditsLeo(r0));
    const r1Leo = js2leo.u64(r1);
    const r2Leo = js2leo.u64(r2);
    const r3Leo = js2leo.field(r3);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('fee_private', params);
    result.set_converter_fn([leo2js.record]);
    return result
  }

  async fee_public(r0: bigint, r1: bigint, r2: bigint): Promise < TransactionResponse < TransactionModel & receipt.CreditsFee_publicTransition, [] >> {
    const r0Leo = js2leo.u64(r0);
    const r1Leo = js2leo.u64(r1);
    const r2Leo = js2leo.field(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('fee_public', params);
    return result
  }

  async committee(key: LeoAddress, defaultValue ? : committee_state): Promise < committee_state > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'committee',
      params[0],
    );

    if (result != null)
      return getcommittee_state(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`committee returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async delegated(key: LeoAddress, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'delegated',
      params[0],
    );

    if (result != null)
      return leo2js.u64(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`delegated returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async metadata(key: LeoAddress, defaultValue ? : number): Promise < number > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'metadata',
      params[0],
    );

    if (result != null)
      return leo2js.u32(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`metadata returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async bonded(key: LeoAddress, defaultValue ? : bond_state): Promise < bond_state > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'bonded',
      params[0],
    );

    if (result != null)
      return getbond_state(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`bonded returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async unbonding(key: LeoAddress, defaultValue ? : unbond_state): Promise < unbond_state > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'unbonding',
      params[0],
    );

    if (result != null)
      return getunbond_state(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`unbonding returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async account(key: LeoAddress, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'account',
      params[0],
    );

    if (result != null)
      return leo2js.u64(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`account returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async withdraw(key: LeoAddress, defaultValue ? : LeoAddress): Promise < LeoAddress > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'withdraw',
      params[0],
    );

    if (result != null)
      return leo2js.address(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`withdraw returned invalid value[input: ${key}, output: ${result}`);
    }
  }


}