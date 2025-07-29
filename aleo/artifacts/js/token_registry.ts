import {
  Token,
  TokenOwner,
  TokenMetadata,
  Balance
} from "./types/token_registry";
import {
  getTokenLeo,
  getTokenOwnerLeo,
  getTokenMetadataLeo,
  getBalanceLeo
} from "./js2leo/token_registry";
import {
  getToken,
  getTokenOwner,
  getTokenMetadata,
  getBalance
} from "./leo2js/token_registry";
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
import * as receipt from "./transitions/token_registry";

export class Token_registryContract extends BaseContract {

  constructor(config: Partial < ContractConfig > = {
    mode: ExecutionMode.LeoRun
  }) {
    super({
      ...config,
      appName: 'token_registry',
      fee: '0.01',
      contractPath: 'imports/token_registry',
      isImportedAleo: true
    });
  }
  async transfer_public(r0: bigint, r1: LeoAddress, r2: bigint): Promise < TransactionResponse < TransactionModel & receipt.Token_registryTransfer_publicTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('transfer_public', params);
    return result
  }

  async transfer_public_as_signer(r0: bigint, r1: LeoAddress, r2: bigint): Promise < TransactionResponse < TransactionModel & receipt.Token_registryTransfer_public_as_signerTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('transfer_public_as_signer', params);
    return result
  }

  async transfer_private(r0: LeoAddress, r1: bigint, r2: Token): Promise < TransactionResponse < TransactionModel & receipt.Token_registryTransfer_privateTransition, [LeoRecord, LeoRecord] >> {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.json(getTokenLeo(r2));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('transfer_private', params);
    result.set_converter_fn([leo2js.record, leo2js.record]);
    return result
  }

  async transfer_private_to_public(r0: LeoAddress, r1: bigint, r2: Token): Promise < TransactionResponse < TransactionModel & receipt.Token_registryTransfer_private_to_publicTransition, [LeoRecord] >> {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.json(getTokenLeo(r2));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('transfer_private_to_public', params);
    result.set_converter_fn([leo2js.record]);
    return result
  }

  async transfer_public_to_private(r0: bigint, r1: LeoAddress, r2: bigint, r3: boolean): Promise < TransactionResponse < TransactionModel & receipt.Token_registryTransfer_public_to_privateTransition, [LeoRecord] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);
    const r3Leo = js2leo.boolean(r3);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('transfer_public_to_private', params);
    result.set_converter_fn([leo2js.record]);
    return result
  }

  async join(r0: Token, r1: Token): Promise < TransactionResponse < TransactionModel & receipt.Token_registryJoinTransition, [LeoRecord] >> {
    const r0Leo = js2leo.json(getTokenLeo(r0));
    const r1Leo = js2leo.json(getTokenLeo(r1));

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('join', params);
    result.set_converter_fn([leo2js.record]);
    return result
  }

  async split(r0: Token, r1: bigint): Promise < TransactionResponse < TransactionModel & receipt.Token_registrySplitTransition, [LeoRecord, LeoRecord] >> {
    const r0Leo = js2leo.json(getTokenLeo(r0));
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('split', params);
    result.set_converter_fn([leo2js.record, leo2js.record]);
    return result
  }

  async initialize(): Promise < TransactionResponse < TransactionModel & receipt.Token_registryInitializeTransition, [] >> {

    const params = []
    const result = await this.ctx.execute('initialize', params);
    return result
  }

  async register_token(r0: bigint, r1: bigint, r2: bigint, r3: number, r4: bigint, r5: boolean, r6: LeoAddress): Promise < TransactionResponse < TransactionModel & receipt.Token_registryRegister_tokenTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.u128(r2);
    const r3Leo = js2leo.u8(r3);
    const r4Leo = js2leo.u128(r4);
    const r5Leo = js2leo.boolean(r5);
    const r6Leo = js2leo.address(r6);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo]
    const result = await this.ctx.execute('register_token', params);
    return result
  }

  async update_token_management(r0: bigint, r1: LeoAddress, r2: LeoAddress): Promise < TransactionResponse < TransactionModel & receipt.Token_registryUpdate_token_managementTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.address(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('update_token_management', params);
    return result
  }

  async set_role(r0: bigint, r1: LeoAddress, r2: number): Promise < TransactionResponse < TransactionModel & receipt.Token_registrySet_roleTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u8(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('set_role', params);
    return result
  }

  async remove_role(r0: bigint, r1: LeoAddress): Promise < TransactionResponse < TransactionModel & receipt.Token_registryRemove_roleTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.address(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('remove_role', params);
    return result
  }

  async mint_public(r0: bigint, r1: LeoAddress, r2: bigint, r3: number): Promise < TransactionResponse < TransactionModel & receipt.Token_registryMint_publicTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);
    const r3Leo = js2leo.u32(r3);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('mint_public', params);
    return result
  }

  async mint_private(r0: bigint, r1: LeoAddress, r2: bigint, r3: boolean, r4: number): Promise < TransactionResponse < TransactionModel & receipt.Token_registryMint_privateTransition, [LeoRecord] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);
    const r3Leo = js2leo.boolean(r3);
    const r4Leo = js2leo.u32(r4);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo]
    const result = await this.ctx.execute('mint_private', params);
    result.set_converter_fn([leo2js.record]);
    return result
  }

  async burn_public(r0: bigint, r1: LeoAddress, r2: bigint): Promise < TransactionResponse < TransactionModel & receipt.Token_registryBurn_publicTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('burn_public', params);
    return result
  }

  async burn_private(r0: Token, r1: bigint): Promise < TransactionResponse < TransactionModel & receipt.Token_registryBurn_privateTransition, [LeoRecord] >> {
    const r0Leo = js2leo.json(getTokenLeo(r0));
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('burn_private', params);
    result.set_converter_fn([leo2js.record]);
    return result
  }

  async prehook_public(r0: TokenOwner, r1: bigint, r2: number): Promise < TransactionResponse < TransactionModel & receipt.Token_registryPrehook_publicTransition, [] >> {
    const r0Leo = js2leo.json(getTokenOwnerLeo(r0));
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.u32(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('prehook_public', params);
    return result
  }

  async prehook_private(r0: Token, r1: bigint, r2: number): Promise < TransactionResponse < TransactionModel & receipt.Token_registryPrehook_privateTransition, [LeoRecord, LeoRecord] >> {
    const r0Leo = js2leo.json(getTokenLeo(r0));
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.u32(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('prehook_private', params);
    result.set_converter_fn([leo2js.record, leo2js.record]);
    return result
  }

  async approve_public(r0: bigint, r1: LeoAddress, r2: bigint): Promise < TransactionResponse < TransactionModel & receipt.Token_registryApprove_publicTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('approve_public', params);
    return result
  }

  async unapprove_public(r0: bigint, r1: LeoAddress, r2: bigint): Promise < TransactionResponse < TransactionModel & receipt.Token_registryUnapprove_publicTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('unapprove_public', params);
    return result
  }

  async transfer_from_public(r0: bigint, r1: LeoAddress, r2: LeoAddress, r3: bigint): Promise < TransactionResponse < TransactionModel & receipt.Token_registryTransfer_from_publicTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.u128(r3);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('transfer_from_public', params);
    return result
  }

  async transfer_from_public_to_private(r0: bigint, r1: LeoAddress, r2: LeoAddress, r3: bigint, r4: boolean): Promise < TransactionResponse < TransactionModel & receipt.Token_registryTransfer_from_public_to_privateTransition, [LeoRecord] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.u128(r3);
    const r4Leo = js2leo.boolean(r4);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo]
    const result = await this.ctx.execute('transfer_from_public_to_private', params);
    result.set_converter_fn([leo2js.record]);
    return result
  }

  async registered_tokens(key: bigint, defaultValue ? : TokenMetadata): Promise < TokenMetadata > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'registered_tokens',
      params[0],
    );

    if (result != null)
      return getTokenMetadata(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`registered_tokens returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async balances(key: bigint, defaultValue ? : Balance): Promise < Balance > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'balances',
      params[0],
    );

    if (result != null)
      return getBalance(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`balances returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async authorized_balances(key: bigint, defaultValue ? : Balance): Promise < Balance > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'authorized_balances',
      params[0],
    );

    if (result != null)
      return getBalance(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`authorized_balances returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async allowances(key: bigint, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'allowances',
      params[0],
    );

    if (result != null)
      return leo2js.u128(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`allowances returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async roles(key: bigint, defaultValue ? : number): Promise < number > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'roles',
      params[0],
    );

    if (result != null)
      return leo2js.u8(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`roles returned invalid value[input: ${key}, output: ${result}`);
    }
  }


}