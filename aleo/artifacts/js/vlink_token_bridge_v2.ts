import {
  PacketId,
  OutPacket
} from "./types/vlink_token_bridge_v2";
import {
  getPacketIdLeo,
  getOutPacketLeo
} from "./js2leo/vlink_token_bridge_v2";
import {
  getPacketId,
  getOutPacket
} from "./leo2js/vlink_token_bridge_v2";
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
import * as receipt from "./transitions/vlink_token_bridge_v2";

export class Vlink_token_bridge_v2Contract extends BaseContract {

  constructor(config: Partial < ContractConfig > = {
    mode: ExecutionMode.LeoRun
  }) {
    super({
      ...config,
      appName: 'vlink_token_bridge_v2',
      fee: '0.01',
      contractPath: 'artifacts/leo/vlink_token_bridge_v2',
      isImportedAleo: false
    });
  }
  async initialize_tb(r0: Array < LeoAddress > , r1: number, r2: LeoAddress): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_bridge_v2Initialize_tbTransition, [] >> {
    const r0Leo = js2leo.arr2string(js2leo.array(r0, js2leo.address));
    const r1Leo = js2leo.u8(r1);
    const r2Leo = js2leo.address(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await this.ctx.execute('initialize_tb', params);
    return result
  }

  async transfer_ownership_tb(r0: LeoAddress): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_bridge_v2Transfer_ownership_tbTransition, [] >> {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await this.ctx.execute('transfer_ownership_tb', params);
    return result
  }

  async add_attestor_tb(r0: LeoAddress, r1: number): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_bridge_v2Add_attestor_tbTransition, [] >> {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u8(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('add_attestor_tb', params);
    return result
  }

  async remove_attestor_tb(r0: LeoAddress, r1: number): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_bridge_v2Remove_attestor_tbTransition, [] >> {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u8(r1);

    const params = [r0Leo, r1Leo]
    const result = await this.ctx.execute('remove_attestor_tb', params);
    return result
  }

  async update_threshold_tb(r0: number): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_bridge_v2Update_threshold_tbTransition, [] >> {
    const r0Leo = js2leo.u8(r0);

    const params = [r0Leo]
    const result = await this.ctx.execute('update_threshold_tb', params);
    return result
  }

  async add_chain_tb(r0: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_bridge_v2Add_chain_tbTransition, [] >> {
    const r0Leo = js2leo.u128(r0);

    const params = [r0Leo]
    const result = await this.ctx.execute('add_chain_tb', params);
    return result
  }

  async remove_chain_tb(r0: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_bridge_v2Remove_chain_tbTransition, [] >> {
    const r0Leo = js2leo.u128(r0);

    const params = [r0Leo]
    const result = await this.ctx.execute('remove_chain_tb', params);
    return result
  }

  async add_service_tb(r0: LeoAddress): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_bridge_v2Add_service_tbTransition, [] >> {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await this.ctx.execute('add_service_tb', params);
    return result
  }

  async remove_service_tb(r0: LeoAddress): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_bridge_v2Remove_service_tbTransition, [] >> {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await this.ctx.execute('remove_service_tb', params);
    return result
  }

  async pause_tb(): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_bridge_v2Pause_tbTransition, [] >> {

    const params = []
    const result = await this.ctx.execute('pause_tb', params);
    return result
  }

  async unpause_tb(): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_bridge_v2Unpause_tbTransition, [] >> {

    const params = []
    const result = await this.ctx.execute('unpause_tb', params);
    return result
  }

  async publish(r0: number, r1: bigint, r2: Array < number > , r3: Array < number > , r4: LeoAddress, r5: Array < number > , r6: bigint): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_bridge_v2PublishTransition, [] >> {
    const r0Leo = js2leo.u8(r0);
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.u8));
    const r3Leo = js2leo.arr2string(js2leo.array(r3, js2leo.u8));
    const r4Leo = js2leo.address(r4);
    const r5Leo = js2leo.arr2string(js2leo.array(r5, js2leo.u8));
    const r6Leo = js2leo.u128(r6);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo]
    const result = await this.ctx.execute('publish', params);
    return result
  }

  async consume(r0: number, r1: bigint, r2: Array < number > , r3: bigint, r4: Array < number > , r5: LeoAddress, r6: bigint, r7: bigint, r8: bigint, r9: Array < LeoAddress > , r10: Array < string > ): Promise < TransactionResponse < TransactionModel & receipt.Vlink_token_bridge_v2ConsumeTransition, [boolean] >> {
    const r0Leo = js2leo.u8(r0);
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.u8));
    const r3Leo = js2leo.field(r3);
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.u8));
    const r5Leo = js2leo.address(r5);
    const r6Leo = js2leo.u128(r6);
    const r7Leo = js2leo.u64(r7);
    const r8Leo = js2leo.u64(r8);
    const r9Leo = js2leo.arr2string(js2leo.array(r9, js2leo.address));
    const r10Leo = js2leo.arr2string(js2leo.array(r10, js2leo.signature));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo, r7Leo, r8Leo, r9Leo, r10Leo]
    const result = await this.ctx.execute('consume', params);
    result.set_converter_fn([leo2js.boolean]);
    return result
  }

  async bridge_settings(key: number, defaultValue ? : number): Promise < number > {
    const keyLeo = js2leo.u8(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'bridge_settings',
      params[0],
    );

    if (result != null)
      return leo2js.u8(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`bridge_settings returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async owner_TB(key: boolean, defaultValue ? : LeoAddress): Promise < LeoAddress > {
    const keyLeo = js2leo.boolean(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'owner_TB',
      params[0],
    );

    if (result != null)
      return leo2js.address(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`owner_TB returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async attestors(key: LeoAddress, defaultValue ? : boolean): Promise < boolean > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'attestors',
      params[0],
    );

    if (result != null)
      return leo2js.boolean(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`attestors returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async in_packet_consumed(key: PacketId, defaultValue ? : boolean): Promise < boolean > {
    const keyLeo = js2leo.json(getPacketIdLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'in_packet_consumed',
      params[0],
    );

    if (result != null)
      return leo2js.boolean(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`in_packet_consumed returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async in_packet_hash(key: PacketId, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.json(getPacketIdLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'in_packet_hash',
      params[0],
    );

    if (result != null)
      return leo2js.field(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`in_packet_hash returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async out_packets(key: PacketId, defaultValue ? : OutPacket): Promise < OutPacket > {
    const keyLeo = js2leo.json(getPacketIdLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'out_packets',
      params[0],
    );

    if (result != null)
      return getOutPacket(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`out_packets returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async supported_chains(key: bigint, defaultValue ? : boolean): Promise < boolean > {
    const keyLeo = js2leo.u128(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'supported_chains',
      params[0],
    );

    if (result != null)
      return leo2js.boolean(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`supported_chains returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async supported_services(key: LeoAddress, defaultValue ? : boolean): Promise < boolean > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'supported_services',
      params[0],
    );

    if (result != null)
      return leo2js.boolean(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`supported_services returned invalid value[input: ${key}, output: ${result}`);
    }
  }

  async sequences(key: bigint, defaultValue ? : bigint): Promise < bigint > {
    const keyLeo = js2leo.u128(key);

    const params = [keyLeo]
    const result = await zkGetMapping(
      this.config,
      'sequences',
      params[0],
    );

    if (result != null)
      return leo2js.u64(result);
    else {
      if (defaultValue != undefined) return defaultValue;
      throw new Error(`sequences returned invalid value[input: ${key}, output: ${result}`);
    }
  }


}