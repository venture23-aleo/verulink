import * as js2leo from './js2leo/common';
import * as leo2js from './leo2js/common';
import {
  ProposalSign,
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
  WtUpdateGovernance,
  WtAddToken,
  TsSupportChain,
  TsRemoveChain,
  TsManageToken,
  TokenAcc,
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
  TSForeignContract,
  TokenOrigin,
  wrapped_token,
  WTForeignContract,
  TokenInfo,
  WrappedTokenInfo,
  TokenAccount,
} from "./types";
import {
  getProposalSignLeo,
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
  getWtUpdateGovernanceLeo,
  getWtAddTokenLeo,
  getTsSupportChainLeo,
  getTsRemoveChainLeo,
  getTsManageTokenLeo,
  getTokenAccLeo,
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
  getTSForeignContractLeo,
  getTokenOriginLeo,
  getwrapped_tokenLeo,
  getWTForeignContractLeo,
  getTokenInfoLeo,
  getWrappedTokenInfoLeo,
  getTokenAccountLeo,
} from './js2leo';
import {
  getProposalSign,
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
  getWtUpdateGovernance,
  getWtAddToken,
  getTsSupportChain,
  getTsRemoveChain,
  getTsManageToken,
  getTokenAcc,
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
  getTSForeignContract,
  getTokenOrigin,
  getwrapped_token,
  getWTForeignContract,
  getTokenInfo,
  getWrappedTokenInfo,
  getTokenAccount,
} from './leo2js';
import {
  zkRun,
  ContractConfig,
  snarkDeploy,
  zkGetMapping
} from './utils';

const networkConfig = require('../../aleo-config');

export class CouncilContract {

  config: ContractConfig;

  constructor(config: ContractConfig = {}) {
    this.config = {
      appName: 'council',
      contractPath: 'artifacts/leo/council',
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
  async initialize(r0: string, r1: string, r2: string, r3: string, r4: string, r5: number) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.address(r3);
    const r4Leo = js2leo.address(r4);
    const r5Leo = js2leo.u8(r5);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'initialize',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async propose(r0: number, r1: BigInt) {
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

  async vote(r0: BigInt, r1: number) {
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

  async tb_enable_chain(r0: number, r1: BigInt) {
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

  async disapprove_chain_bridge(r0: number, r1: BigInt) {
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

  async wt_update_governance(r0: number, r1: string) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'wt_update_governance',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async wt_add_token(r0: number, r1: Array < number > , r2: Array < number > , r3: number, r4: BigInt, r5: Array < number > ) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.u8));
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.u8));
    const r3Leo = js2leo.u8(r3);
    const r4Leo = js2leo.u128(r4);
    const r5Leo = js2leo.arr2string(js2leo.array(r5, js2leo.u8));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'wt_add_token',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async ts_support_chain(r0: number, r1: BigInt, r2: Array < number > ) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u128(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.u8));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'ts_support_chain',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async ts_remove_chain(r0: number, r1: BigInt) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'ts_remove_chain',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async ts_manage_token(r0: number, r1: string, r2: BigInt, r3: number, r4: number) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u64(r2);
    const r3Leo = js2leo.u16(r3);
    const r4Leo = js2leo.u32(r4);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'ts_manage_token',
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

  async proposal_vote_counts(key: BigInt): Promise < number > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'proposal_vote_counts',
      params,
    });
    return leo2js.u8(result);
  }

  async proposal_executed(key: BigInt): Promise < boolean > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'proposal_executed',
      params,
    });
    return leo2js.boolean(result);
  }

  async proposals(key: number): Promise < BigInt > {
    const keyLeo = js2leo.u32(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'proposals',
      params,
    });
    return leo2js.field(result);
  }

  async proposal_vote_signs(key: BigInt): Promise < boolean > {
    const keyLeo = js2leo.field(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'proposal_vote_signs',
      params,
    });
    return leo2js.boolean(result);
  }


}