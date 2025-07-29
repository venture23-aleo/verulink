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
import * as receipt from "./transitions/vlink_token_service_council_v2";

export class Vlink_token_service_council_v2Contract extends BaseContract {

  constructor(config: Partial < ContractConfig > = {
    mode: ExecutionMode.LeoRun
  }) {
    super({
      ...config,
      appName: 'vlink_token_service_council_v2',
      fee: '0.01',
      contractPath: 'artifacts/leo/vlink_token_service_council_v2',
      isImportedAleo: false
    });
  }
  async remove_role(r0: number, r1: bigint, r2: LeoAddress, r3: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Remove_roleTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.arr2string(js2leo.array(r3, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('remove_role', params);
    return result
  }

  async holding_release(r0: number, r1: bigint, r2: LeoAddress, r3: bigint, r4: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Holding_releaseTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.u128(r3);
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo]
    const result = await this.ctx.execute('holding_release', params);
    return result
  }

  async holding_release_private(r0: number, r1: bigint, r2: LeoAddress, r3: bigint, r4: bigint, r5: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Holding_release_privateTransition, [ExternalRecord < 'token_registry', 'Token' > ] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.field(r3);
    const r4Leo = js2leo.u128(r4);
    const r5Leo = js2leo.arr2string(js2leo.array(r5, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo]
    const result = await this.ctx.execute('holding_release_private', params);
    result.set_converter_fn([
      [leo2js.externalRecord, 'token_registry.aleo/Token']
    ]);
    return result
  }

  async ts_transfer_ownership(r0: number, r1: LeoAddress, r2: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Ts_transfer_ownershipTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('ts_transfer_ownership', params);
    return result
  }

  async ts_add_token(r0: number, r1: bigint, r2: bigint, r3: bigint, r4: number, r5: number, r6: bigint, r7: Array < LeoAddress > , r8: Array < number > , r9: Array < number > , r10: bigint, r11: number, r12: number, r13: bigint, r14: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Ts_add_tokenTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.u128(r2);
    const r3Leo = js2leo.u128(r3);
    const r4Leo = js2leo.u32(r4);
    const r5Leo = js2leo.u32(r5);
    const r6Leo = js2leo.u128(r6);
    const r7Leo = js2leo.arr2string(js2leo.array(r7, js2leo.address));
    const r8Leo = js2leo.arr2string(js2leo.array(r8, js2leo.u8));
    const r9Leo = js2leo.arr2string(js2leo.array(r9, js2leo.u8));
    const r10Leo = js2leo.u128(r10);
    const r11Leo = js2leo.u32(r11);
    const r12Leo = js2leo.u32(r12);
    const r13Leo = js2leo.u128(r13);
    const r14Leo = js2leo.u128(r14);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo, r7Leo, r8Leo, r9Leo, r10Leo, r11Leo, r12Leo, r13Leo, r14Leo]
    const result = await this.ctx.execute('ts_add_token', params);
    return result
  }

  async ts_remove_token(r0: number, r1: bigint, r2: bigint, r3: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Ts_remove_tokenTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.field(r2);
    const r3Leo = js2leo.arr2string(js2leo.array(r3, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('ts_remove_token', params);
    return result
  }

  async ts_update_max_min_transfer(r0: number, r1: bigint, r2: bigint, r3: bigint, r4: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Ts_update_max_min_transferTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.u128(r2);
    const r3Leo = js2leo.u128(r3);
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo]
    const result = await this.ctx.execute('ts_update_max_min_transfer', params);
    return result
  }

  async ts_pause_token(r0: number, r1: bigint, r2: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Ts_pause_tokenTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('ts_pause_token', params);
    return result
  }

  async ts_unpause_token(r0: number, r1: bigint, r2: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Ts_unpause_tokenTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('ts_unpause_token', params);
    return result
  }

  async ts_update_outgoing_percentage(r0: number, r1: bigint, r2: number, r3: number, r4: bigint, r5: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Ts_update_outgoing_percentageTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.u32(r2);
    const r3Leo = js2leo.u32(r3);
    const r4Leo = js2leo.u128(r4);
    const r5Leo = js2leo.arr2string(js2leo.array(r5, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo]
    const result = await this.ctx.execute('ts_update_outgoing_percentage', params);
    return result
  }

  async holding_ownership_transfer(r0: number, r1: LeoAddress, r2: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Holding_ownership_transferTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('holding_ownership_transfer', params);
    return result
  }

  async ts_register_token(r0: number, r1: bigint, r2: bigint, r3: number, r4: bigint, r5: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Ts_register_tokenTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.u128(r2);
    const r3Leo = js2leo.u8(r3);
    const r4Leo = js2leo.u128(r4);
    const r5Leo = js2leo.arr2string(js2leo.array(r5, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo]
    const result = await this.ctx.execute('ts_register_token', params);
    return result
  }

  async update_token_metadata(r0: number, r1: bigint, r2: LeoAddress, r3: LeoAddress, r4: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Update_token_metadataTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.address(r3);
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo]
    const result = await this.ctx.execute('update_token_metadata', params);
    return result
  }

  async set_role_token(r0: number, r1: bigint, r2: LeoAddress, r3: number, r4: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Set_role_tokenTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.field(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.u8(r3);
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo]
    const result = await this.ctx.execute('set_role_token', params);
    return result
  }

  async ts_update_token_service_setting(r0: number, r1: bigint, r2: bigint, r3: Array < number > , r4: Array < number > , r5: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Ts_update_token_service_settingTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.field(r2);
    const r3Leo = js2leo.arr2string(js2leo.array(r3, js2leo.u8));
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.u8));
    const r5Leo = js2leo.arr2string(js2leo.array(r5, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo]
    const result = await this.ctx.execute('ts_update_token_service_setting', params);
    return result
  }

  async ts_add_chain_to_existing_token(r0: number, r1: bigint, r2: bigint, r3: Array < number > , r4: Array < number > , r5: Array < LeoAddress > , r6: number, r7: number, r8: bigint, r9: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Ts_add_chain_to_existing_tokenTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.field(r2);
    const r3Leo = js2leo.arr2string(js2leo.array(r3, js2leo.u8));
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.u8));
    const r5Leo = js2leo.arr2string(js2leo.array(r5, js2leo.address));
    const r6Leo = js2leo.u32(r6);
    const r7Leo = js2leo.u32(r7);
    const r8Leo = js2leo.u128(r8);
    const r9Leo = js2leo.u128(r9);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo, r7Leo, r8Leo, r9Leo]
    const result = await this.ctx.execute('ts_add_chain_to_existing_token', params);
    return result
  }

  async ts_remove_other_chain_addresses(r0: number, r1: bigint, r2: bigint, r3: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Ts_remove_other_chain_addressesTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.field(r2);
    const r3Leo = js2leo.arr2string(js2leo.array(r3, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('ts_remove_other_chain_addresses', params);
    return result
  }

  async ts_update_fees(r0: number, r1: bigint, r2: bigint, r3: bigint, r4: bigint, r5: number, r6: number, r7: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_service_council_v2Ts_update_feesTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.field(r2);
    const r3Leo = js2leo.u128(r3);
    const r4Leo = js2leo.u128(r4);
    const r5Leo = js2leo.u32(r5);
    const r6Leo = js2leo.u32(r6);
    const r7Leo = js2leo.arr2string(js2leo.array(r7, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo, r7Leo]
    const result = await this.ctx.execute('ts_update_fees', params);
    return result
  }


}