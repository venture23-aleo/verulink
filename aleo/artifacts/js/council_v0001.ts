import * as js2leo from './js2leo/common';
import * as leo2js from './leo2js/common';
import {
  ProposalVote,
  AddMember,
  RemoveMember,
  UpdateThreshold,
  TbUpdateGovernance,
  TbAddAttestor,
  TbRemoveAttestor,
  TbUpdateThreshold,
  TbEnableChain,
  TbDisableChain,
  TbEnableService,
  TbDisableService,
  TsTransferOwnership,
  TsAddToken,
  TsRemoveToken,
  TsUpdateMinTransfer,
  TsUpdateMaxTransfer,
  TsUpdateOutgoingPercentage,
  HoldingRelease,
  ConnectorUpdate,
  ExternalProposal,
  AleoProgram,
  ForeignContract,
  MsgTokenReceive,
  MsgTokenSend,
  InPacket,
  OutPacket,
  PacketId,
  PacketIdWithAttestor,
  InPacketWithScreening,
  OutgoingPercentageInTime,
} from "./types";
import {
  getProposalVoteLeo,
  getAddMemberLeo,
  getRemoveMemberLeo,
  getUpdateThresholdLeo,
  getTbUpdateGovernanceLeo,
  getTbAddAttestorLeo,
  getTbRemoveAttestorLeo,
  getTbUpdateThresholdLeo,
  getTbEnableChainLeo,
  getTbDisableChainLeo,
  getTbEnableServiceLeo,
  getTbDisableServiceLeo,
  getTsTransferOwnershipLeo,
  getTsAddTokenLeo,
  getTsRemoveTokenLeo,
  getTsUpdateMinTransferLeo,
  getTsUpdateMaxTransferLeo,
  getTsUpdateOutgoingPercentageLeo,
  getHoldingReleaseLeo,
  getConnectorUpdateLeo,
  getExternalProposalLeo,
  getAleoProgramLeo,
  getForeignContractLeo,
  getMsgTokenReceiveLeo,
  getMsgTokenSendLeo,
  getInPacketLeo,
  getOutPacketLeo,
  getPacketIdLeo,
  getPacketIdWithAttestorLeo,
  getInPacketWithScreeningLeo,
  getOutgoingPercentageInTimeLeo,
} from './js2leo';
import {
  getProposalVote,
  getAddMember,
  getRemoveMember,
  getUpdateThreshold,
  getTbUpdateGovernance,
  getTbAddAttestor,
  getTbRemoveAttestor,
  getTbUpdateThreshold,
  getTbEnableChain,
  getTbDisableChain,
  getTbEnableService,
  getTbDisableService,
  getTsTransferOwnership,
  getTsAddToken,
  getTsRemoveToken,
  getTsUpdateMinTransfer,
  getTsUpdateMaxTransfer,
  getTsUpdateOutgoingPercentage,
  getHoldingRelease,
  getConnectorUpdate,
  getExternalProposal,
  getAleoProgram,
  getForeignContract,
  getMsgTokenReceive,
  getMsgTokenSend,
  getInPacket,
  getOutPacket,
  getPacketId,
  getPacketIdWithAttestor,
  getInPacketWithScreening,
  getOutgoingPercentageInTime,
} from './leo2js';
import {
  zkRun,
  ContractConfig,
  snarkDeploy,
  zkGetMapping
} from './utils';

import networkConfig from '../../aleo-config';

export class Council_v0001Contract {

  config: ContractConfig;

  constructor(config: ContractConfig = {}) {
    this.config = {
      appName: 'council_v0001',
      contractPath: 'artifacts/leo/council_v0001',
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
  async initialize(r0: Array < string > , r1: number) {
    const r0Leo = js2leo.arr2string(js2leo.array(r0, js2leo.address));
    const r1Leo = js2leo.u8(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'initialize',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async update_member_key(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'update_member_key',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async propose(r0: number, r1: bigint) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.field(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'propose',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async vote(r0: bigint, r1: number) {
    const r0Leo = js2leo.field(r0);
    const r1Leo = js2leo.u8(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'vote',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async add_member(r0: number, r1: string, r2: number) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u8(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'add_member',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async remove_member(r0: number, r1: string, r2: number) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u8(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'remove_member',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async update_threshold(r0: number, r1: number) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u8(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'update_threshold',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async tb_update_governance(r0: number, r1: string) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'tb_update_governance',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async tb_add_attestor(r0: number, r1: string, r2: number) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u8(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'tb_add_attestor',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async tb_remove_attestor(r0: number, r1: string, r2: number) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u8(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'tb_remove_attestor',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async tb_update_threshold(r0: number, r1: number) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u8(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'tb_update_threshold',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async tb_enable_chain(r0: number, r1: bigint) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'tb_enable_chain',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async disapprove_chain_bridge(r0: number, r1: bigint) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'disapprove_chain_bridge',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async tb_enable_service(r0: number, r1: string) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'tb_enable_service',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async tb_disable_service(r0: number, r1: string) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'tb_disable_service',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async ts_transfer_ownership(r0: number, r1: string) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'ts_transfer_ownership',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async ts_support_token(r0: number, r1: string, r2: string, r3: bigint, r4: bigint, r5: number, r6: number, r7: bigint) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.u128(r3);
    const r4Leo = js2leo.u128(r4);
    const r5Leo = js2leo.u16(r5);
    const r6Leo = js2leo.u32(r6);
    const r7Leo = js2leo.u128(r7);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo, r6Leo, r7Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'ts_support_token',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async ts_remove_token(r0: number, r1: string) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'ts_remove_token',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async ts_update_min_transfer(r0: number, r1: string, r2: bigint) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'ts_update_min_transfer',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async ts_update_max_transfer(r0: number, r1: string, r2: bigint) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'ts_update_max_transfer',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async ts_update_outgoing_percentage(r0: number, r1: string, r2: number, r3: number, r4: bigint) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u16(r2);
    const r3Leo = js2leo.u32(r3);
    const r4Leo = js2leo.u128(r4);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'ts_update_outgoing_percentage',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async holding_release(r0: number, r1: string, r2: string, r3: bigint) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.u128(r3);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'holding_release',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async connector_update(r0: number, r1: string, r2: string) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.address(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'connector_update',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async external_execute(r0: number, r1: bigint) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.field(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'external_execute',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async members(key: string): Promise < boolean > {
    const keyLeo = js2leo.address(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'members',
      params,
    });
    return leo2js.boolean(result);
  }

  async settings(key: boolean): Promise < number > {
    const keyLeo = js2leo.boolean(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'settings',
      params,
    });
    return leo2js.u8(result);
  }

  async proposal_vote_counts(key: bigint): Promise < number > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'proposal_vote_counts',
      params,
    });
    return leo2js.u8(result);
  }

  async proposal_executed(key: bigint): Promise < boolean > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'proposal_executed',
      params,
    });
    return leo2js.boolean(result);
  }

  async proposals(key: number): Promise < bigint > {
    const keyLeo = js2leo.u32(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'proposals',
      params,
    });
    return leo2js.field(result);
  }

  async proposal_votes(key: bigint): Promise < boolean > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'proposal_votes',
      params,
    });
    return leo2js.boolean(result);
  }


}