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
    if (!config.networkName)
      this.config.networkName = networkConfig.defaultNetwork;

    const networkName = this.config.networkName;
    if (networkName) {
      if (!networkConfig?.networks[networkName])
        throw Error(`Network config not defined for ${ networkName }.Please add the config in aleo - config.js file in root directory`)

      this.config = {
        ...this.config,
        network: networkConfig.networks[networkName]
      };
    }

    if (!this.config.privateKey)
      this.config.privateKey = networkConfig.networks[networkName].accounts[0];
  }

  async deploy(): Promise < any > {
    const result = await snarkDeploy({
      config: this.config,
    });

    return result;
  }
  async initialize_tb(r0: number, r1: Array < string > , r2: string) {
    const r0Leo = js2leo.u8(r0);
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.address));
    const r2Leo = js2leo.address(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'initialize_tb',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async update_governance_tb(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'update_governance_tb',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async update_attestor(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'update_attestor',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async add_attestor_tb(r0: string, r1: number) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u8(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'add_attestor_tb',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async remove_attestor_tb(r0: string, r1: number) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u8(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'remove_attestor_tb',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async update_threshold_tb(r0: number) {
    const r0Leo = js2leo.u8(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'update_threshold_tb',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async enable_chain_tb(r0: bigint) {
    const r0Leo = js2leo.u128(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'enable_chain_tb',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async disable_chain_tb(r0: bigint) {
    const r0Leo = js2leo.u128(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'disable_chain_tb',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async enable_service_tb(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'enable_service_tb',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async disable_service_tb(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'disable_service_tb',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async publish(r0: bigint, r1: Array < number > , r2: Array < number > , r3: string, r4: Array < number > , r5: bigint) {
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

  async consume(r0: bigint, r1: Array < number > , r2: string, r3: Array < number > , r4: string, r5: string, r6: bigint, r7: number, r8: number) {
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

  async attestor_settings(key: boolean): Promise < number > {
    const keyLeo = js2leo.boolean(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'attestor_settings',
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

  async in_packet_attestations(key: bigint): Promise < number > {
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

  async in_packet_hash(key: PacketId): Promise < bigint > {
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

  async supported_chains(key: bigint): Promise < boolean > {
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

  async sequences(key: bigint): Promise < number > {
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