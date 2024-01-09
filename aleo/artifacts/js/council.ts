import * as js2leo from './js2leo/common';
import * as leo2js from './leo2js/common';
import {
  ProposalSign,
  AddMemberProposal,
  RemoveMemberProposal,
  UpdateThresholdProposal,
  ApproveChainBridgeProposal,
  EnableServiceProposal,
  DisapproveChainBridge,
  SupportChainTS,
  SupportToken,
  EnableToken,
  TokenAcc,
  AleoProgram,
  ForeignContract,
  MsgTokenReceive,
  MsgTokenSend,
  InPacketFull,
  InPacket,
  OutPacket,
  PacketId,
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
  getAddMemberProposalLeo,
  getRemoveMemberProposalLeo,
  getUpdateThresholdProposalLeo,
  getApproveChainBridgeProposalLeo,
  getEnableServiceProposalLeo,
  getDisapproveChainBridgeLeo,
  getSupportChainTSLeo,
  getSupportTokenLeo,
  getEnableTokenLeo,
  getTokenAccLeo,
  getAleoProgramLeo,
  getForeignContractLeo,
  getMsgTokenReceiveLeo,
  getMsgTokenSendLeo,
  getInPacketFullLeo,
  getInPacketLeo,
  getOutPacketLeo,
  getPacketIdLeo,
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
  getAddMemberProposal,
  getRemoveMemberProposal,
  getUpdateThresholdProposal,
  getApproveChainBridgeProposal,
  getEnableServiceProposal,
  getDisapproveChainBridge,
  getSupportChainTS,
  getSupportToken,
  getEnableToken,
  getTokenAcc,
  getAleoProgram,
  getForeignContract,
  getMsgTokenReceive,
  getMsgTokenSend,
  getInPacketFull,
  getInPacket,
  getOutPacket,
  getPacketId,
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
    const r5Leo = js2leo.u32(r5);

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

  async exec_add_member(r0: number, r1: string, r2: number) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u8(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_add_member',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_remove_member(r0: number, r1: string, r2: number) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u8(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_remove_member',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_update_threshold(r0: number, r1: number) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u8(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_update_threshold',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_approve_chain_bridge(r0: number, r1: number) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u32(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_approve_chain_bridge',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_enable_service(r0: number, r1: string) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_enable_service',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_disapprove_chain_bridge(r0: number, r1: number) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u32(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_disapprove_chain_bridge',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_support_chain_ts(r0: number, r1: number, r2: Array < number > ) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.u32(r1);
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.u8));

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_support_chain_ts',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_add_new_token(r0: number, r1: Array < number > , r2: Array < number > , r3: number, r4: number, r5: Array < number > ) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.u8));
    const r2Leo = js2leo.arr2string(js2leo.array(r2, js2leo.u8));
    const r3Leo = js2leo.u8(r3);
    const r4Leo = js2leo.u32(r4);
    const r5Leo = js2leo.arr2string(js2leo.array(r5, js2leo.u8));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_add_new_token',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_enable_new_token(r0: number, r1: string, r2: BigInt, r3: number, r4: number) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u64(r2);
    const r3Leo = js2leo.u16(r3);
    const r4Leo = js2leo.u32(r4);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_enable_new_token',
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

  async settings(key: number): Promise < number > {
    const keyLeo = js2leo.u8(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'settings',
      params,
    });
    return leo2js.u32(result);
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