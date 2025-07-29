import {
  ProposalVoterKey
} from "./types/vlink_council_v2";
import {
  getProposalVoterKeyLeo
} from "./js2leo/vlink_council_v2";
import {
  getProposalVoterKey
} from "./leo2js/vlink_council_v2";
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
import * as receipt from "./transitions/vlink_council_v2";

export class Vlink_council_v2Contract extends BaseContract {

  constructor(config: Partial < ContractConfig > = {
    mode: ExecutionMode.LeoRun
  }) {
    super({
      ...config,
      appName: 'vlink_council_v2',
      fee: '0.01',
      contractPath: 'artifacts/leo/vlink_council_v2',
      isImportedAleo: false
    });
  }
  async initialize(r0: Array < LeoAddress > , r1: number): Promise < TransactionResponse < TransactionModel & receipt.Vlink_council_v2InitializeTransition, [] >> {
    const r0Leo = js2leo.arr2string(js2leo.array(r0, js2leo.address));
    const r1Leo = js2leo.u8(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('initialize', params);
    return result
  }

  async propose(r0: number, r1: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_council_v2ProposeTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.field(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('propose', params);
    return result
  }

  async vote(r0: bigint, r1: boolean): Promise < TransactionResponse < TransactionModel & receipt.Vlink_council_v2VoteTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.boolean(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('vote', params);
    return result
  }

  async update_vote(r0: bigint, r1: boolean): Promise < TransactionResponse < TransactionModel & receipt.Vlink_council_v2Update_voteTransition, [] >> {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.boolean(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('update_vote', params);
    return result
  }

  async add_member(r0: number, r1: LeoAddress, r2: number, r3: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_council_v2Add_memberTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u8(r2);
    const r3Leo = js2leo.arr2string(js2leo.array(r3, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('add_member', params);
    return result
  }

  async remove_member(r0: number, r1: LeoAddress, r2: number, r3: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_council_v2Remove_memberTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u8(r2);
    const r3Leo = js2leo.arr2string(js2leo.array(r3, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('remove_member', params);
    return result
  }

  async withdraw_fees(r0: number, r1: bigint, r2: LeoAddress, r3: bigint, r4: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_council_v2Withdraw_feesTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.u128(r3);
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo]
    const result = await this.ctx.execute('withdraw_fees', params);
    return result
  }

  async update_threshold(r0: number, r1: number, r2: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_council_v2Update_thresholdTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u8(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('update_threshold', params);
    return result
  }

  async external_execute(r0: number, r1: bigint, r2: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_council_v2External_executeTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('external_execute', params);
    return result
  }

  async members(key: LeoAddress, defaultValue ? : boolean): Promise < boolean > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'members',
      params[0],
    );

    if (result != null)
      return leo2js.boolean(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`members returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async settings(key: boolean, defaultValue ? : number): Promise < number > {
    const keyLeo = js2leo.boolean(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'settings',
      params[0],
    );

    if (result != null)
      return leo2js.u8(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`settings returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async proposals(key: number, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.u32(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'proposals',
      params[0],
    );

    if (result != null)
      return leo2js.field(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`proposals returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async proposal_vote_counts(key: bigint, defaultValue ? : number): Promise < number > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'proposal_vote_counts',
      params[0],
    );

    if (result != null)
      return leo2js.u8(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`proposal_vote_counts returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async proposal_votes(key: bigint, defaultValue ? : boolean): Promise < boolean > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'proposal_votes',
      params[0],
    );

    if (result != null)
      return leo2js.boolean(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`proposal_votes returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async proposal_voters(key: ProposalVoterKey, defaultValue ? : LeoAddress): Promise < LeoAddress > {
    const keyLeo = js2leo.json(getProposalVoterKeyLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'proposal_voters',
      params[0],
    );

    if (result != null)
      return leo2js.address(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`proposal_voters returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async proposal_executed(key: bigint, defaultValue ? : boolean): Promise < boolean > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'proposal_executed',
      params[0],
    );

    if (result != null)
      return leo2js.boolean(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`proposal_executed returned invalid value[input: ${key}, output: ${result}`);
    }
  }


}