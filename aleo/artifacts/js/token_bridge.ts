import * as js2leo from './js2leo/common';
import * as leo2js from './leo2js/common';
import {
  AleoProgram,
  ForeignContract,
  MsgTokenReceive,
  MsgTokenSend,
  InPacketFull,
  InPacket,
  OutPacket,
  PacketId,
  PacketIdWithAttestor,
  InPacketFullAttestorKey,
  InPacketFullScreeningKey,
} from "./types";
import {
  getAleoProgramLeo,
  getForeignContractLeo,
  getMsgTokenReceiveLeo,
  getMsgTokenSendLeo,
  getInPacketFullLeo,
  getInPacketLeo,
  getOutPacketLeo,
  getPacketIdLeo,
  getPacketIdWithAttestorLeo,
  getInPacketFullAttestorKeyLeo,
  getInPacketFullScreeningKeyLeo,
} from './js2leo';
import {
  getAleoProgram,
  getForeignContract,
  getMsgTokenReceive,
  getMsgTokenSend,
  getInPacketFull,
  getInPacket,
  getOutPacket,
  getPacketId,
  getPacketIdWithAttestor,
  getInPacketFullAttestorKey,
  getInPacketFullScreeningKey,
} from './leo2js';
import {
  zkRun,
  ContractConfig,
  snarkDeploy,
  zkGetMapping
} from './utils';

const networkConfig = require('../../aleo-config');

export class Token_bridgeContract {

  config: ContractConfig;

  constructor(config: ContractConfig = {}) {
    this.config = {
      appName: 'token_bridge',
      contractPath: 'artifacts/leo/token_bridge',
      fee: '0.01'
    };
    this.config = {
      ...this.config,
      ...config
    };
    if (config.networkName) {
      if (!networkConfig?.networks[config.networkName])
        throw Error(`Network config not defined for ${config.networkName}. Please add the config in aleo-config.js file in root directory`)
      this.config = {
        ...this.config,
        network: networkConfig.networks[config.networkName]
      };
    }
  }

  async deploy(): Promise < any > {
    const result = await snarkDeploy({
      config: this.config,
    });

    return result;
  }
  async bridge_initialize(r0: number, r1: string, r2: string, r3: string, r4: string, r5: string, r6: string) {
    const r0Leo = js2leo.u8(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.address(r3);
    const r4Leo = js2leo.address(r4);
    const r5Leo = js2leo.address(r5);
    const r6Leo = js2leo.address(r6);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'bridge_initialize',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async update_bridge_governance(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'update_bridge_governance',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async update_bridge_threshold(r0: number) {
    const r0Leo = js2leo.u8(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'update_bridge_threshold',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async add_service(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'add_service',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async remove_service(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'remove_service',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async add_attestor(r0: string, r1: number) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u8(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'add_attestor',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async remove_attestor(r0: string, r1: number) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u8(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'remove_attestor',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async approve_chain(r0: BigInt) {
    const r0Leo = js2leo.u128(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'approve_chain',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async disapprove_chain(r0: BigInt) {
    const r0Leo = js2leo.u128(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'disapprove_chain',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async publish(r0: BigInt, r1: Array < number > , r2: Array < number > , r3: string, r4: Array < number > , r5: BigInt) {
    const r0Leo = js2leo.u128(r0);
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.u8));
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.u8));
    const r3Leo = js2leo.address(r3);
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.u8));
    const r5Leo = js2leo.u64(r5);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'publish',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async attest(r0: InPacketFull, r1: boolean) {
    const r0Leo = js2leo.json(getInPacketFullLeo(r0));
    const r1Leo = js2leo.boolean(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'attest',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async consume(r0: BigInt, r1: Array < number > , r2: string, r3: Array < number > , r4: string, r5: string, r6: BigInt, r7: number, r8: number) {
    const r0Leo = js2leo.u128(r0);
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.u8));
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.arr2string(js2leo.array(r3, js2leo.u8));
    const r4Leo = js2leo.address(r4);
    const r5Leo = js2leo.address(r5);
    const r6Leo = js2leo.u64(r6);
    const r7Leo = js2leo.u32(r7);
    const r8Leo = js2leo.u32(r8);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo, r7Leo, r8Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'consume',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async bridge_settings(key: number): Promise < number > {
    const keyLeo = js2leo.u8(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'bridge_settings',
      params,
    });
    return leo2js.u8(result);
  }

  async governance_TB(key: boolean): Promise < string > {
    const keyLeo = js2leo.boolean(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'governance_TB',
      params,
    });
    return leo2js.address(result);
  }

  async attestors(key: string): Promise < boolean > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'attestors',
      params,
    });
    return leo2js.boolean(result);
  }

  async in_packet_attestations(key: BigInt): Promise < number > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'in_packet_attestations',
      params,
    });
    return leo2js.u8(result);
  }

  async in_packet_consumed(key: PacketId): Promise < boolean > {
    const keyLeo = js2leo.json(getPacketIdLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'in_packet_consumed',
      params,
    });
    return leo2js.boolean(result);
  }

  async in_packet_hash(key: PacketId): Promise < BigInt > {
    const keyLeo = js2leo.json(getPacketIdLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'in_packet_hash',
      params,
    });
    return leo2js.field(result);
  }

  async out_packets(key: PacketId): Promise < OutPacket > {
    const keyLeo = js2leo.json(getPacketIdLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'out_packets',
      params,
    });
    return getOutPacket(result);
  }

  async in_packet_attestors(key: PacketIdWithAttestor): Promise < boolean > {
    const keyLeo = js2leo.json(getPacketIdWithAttestorLeo(key));

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'in_packet_attestors',
      params,
    });
    return leo2js.boolean(result);
  }

  async supported_chains(key: BigInt): Promise < boolean > {
    const keyLeo = js2leo.u128(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'supported_chains',
      params,
    });
    return leo2js.boolean(result);
  }

  async supported_services(key: string): Promise < boolean > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'supported_services',
      params,
    });
    return leo2js.boolean(result);
  }

  async sequences(key: BigInt): Promise < number > {
    const keyLeo = js2leo.u128(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'sequences',
      params,
    });
    return leo2js.u32(result);
  }


}