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
import * as receipt from "./transitions/vlink_bridge_council_v2";

export class Vlink_bridge_council_v2Contract extends BaseContract {

  constructor(config: Partial < ContractConfig > = {
    mode: ExecutionMode.LeoRun
  }) {
    super({
      ...config,
      appName: 'vlink_bridge_council_v2',
      fee: '0.01',
      contractPath: 'artifacts/leo/vlink_bridge_council_v2',
      isImportedAleo: false
    });
  }
  async tb_transfer_ownership(r0: number, r1: LeoAddress, r2: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_bridge_council_v2Tb_transfer_ownershipTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('tb_transfer_ownership', params);
    return result
  }

  async tb_add_attestor(r0: number, r1: LeoAddress, r2: number, r3: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_bridge_council_v2Tb_add_attestorTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u8(r2);
    const r3Leo = js2leo.arr2string(js2leo.array(r3, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('tb_add_attestor', params);
    return result
  }

  async tb_remove_attestor(r0: number, r1: LeoAddress, r2: number, r3: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_bridge_council_v2Tb_remove_attestorTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u8(r2);
    const r3Leo = js2leo.arr2string(js2leo.array(r3, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await this.ctx.execute('tb_remove_attestor', params);
    return result
  }

  async tb_update_threshold(r0: number, r1: number, r2: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_bridge_council_v2Tb_update_thresholdTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u8(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('tb_update_threshold', params);
    return result
  }

  async tb_add_chain(r0: number, r1: bigint, r2: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_bridge_council_v2Tb_add_chainTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('tb_add_chain', params);
    return result
  }

  async tb_remove_chain(r0: number, r1: bigint, r2: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_bridge_council_v2Tb_remove_chainTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('tb_remove_chain', params);
    return result
  }

  async tb_add_service(r0: number, r1: LeoAddress, r2: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_bridge_council_v2Tb_add_serviceTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('tb_add_service', params);
    return result
  }

  async tb_remove_service(r0: number, r1: LeoAddress, r2: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_bridge_council_v2Tb_remove_serviceTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.address));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('tb_remove_service', params);
    return result
  }

  async tb_pause(r0: number, r1: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_bridge_council_v2Tb_pauseTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.address));

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('tb_pause', params);
    return result
  }

  async tb_unpause(r0: number, r1: Array < LeoAddress > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_bridge_council_v2Tb_unpauseTransition, [] >> {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.address));

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('tb_unpause', params);
    return result
  }


}