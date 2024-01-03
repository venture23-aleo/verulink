import * as js2leo from './js2leo/common';
import * as leo2js from './leo2js/common';
import {
  ProposalSign,
  AddMemberProposal,
  RemoveMemberProposal,
  UpdateThresholdProposal,
  InitializeBridge,
  InitializeTokenService,
  InitializeWrappedToken,
  SupportToken,
  EnableToken,
  EnableService,
  ApproveChainBridge,
  DisapproveChainBridge,
  SupportChainTS,
  AleoProgram,
  ForeignContract,
  MsgTokenReceive,
  MsgTokenSend,
  InPacketFull,
  InPacket,
  OutPacket,
  PacketId,
  InPacketFullAttestorKey,
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
  getInitializeBridgeLeo,
  getInitializeTokenServiceLeo,
  getInitializeWrappedTokenLeo,
  getSupportTokenLeo,
  getEnableTokenLeo,
  getEnableServiceLeo,
  getApproveChainBridgeLeo,
  getDisapproveChainBridgeLeo,
  getSupportChainTSLeo,
  getAleoProgramLeo,
  getForeignContractLeo,
  getMsgTokenReceiveLeo,
  getMsgTokenSendLeo,
  getInPacketFullLeo,
  getInPacketLeo,
  getOutPacketLeo,
  getPacketIdLeo,
  getInPacketFullAttestorKeyLeo,
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
  getInitializeBridge,
  getInitializeTokenService,
  getInitializeWrappedToken,
  getSupportToken,
  getEnableToken,
  getEnableService,
  getApproveChainBridge,
  getDisapproveChainBridge,
  getSupportChainTS,
  getAleoProgram,
  getForeignContract,
  getMsgTokenReceive,
  getMsgTokenSend,
  getInPacketFull,
  getInPacket,
  getOutPacket,
  getPacketId,
  getInPacketFullAttestorKey,
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
      if (!networkConfig?.[config.networkName])
        throw Error(`Network config not defined for ${config.networkName}. Please add the config in aleo-config.js file in root directory`)
      this.config = {
        ...this.config,
        network: networkConfig[config.networkName]
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

  async add_member(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'add_member',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_add_member(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_add_member',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async remove_member(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'remove_member',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_remove_member(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_remove_member',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async update_threshold(r0: number) {
    const r0Leo = js2leo.u8(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'update_threshold',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_update_threshold(r0: number) {
    const r0Leo = js2leo.u8(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_update_threshold',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async initialize_bridge(r0: number, r1: string, r2: string, r3: string, r4: string, r5: string) {
    const r0Leo = js2leo.u8(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.address(r3);
    const r4Leo = js2leo.address(r4);
    const r5Leo = js2leo.address(r5);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'initialize_bridge',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_initialize_bridge(r0: number, r1: string, r2: string, r3: string, r4: string, r5: string) {
    const r0Leo = js2leo.u8(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.address(r3);
    const r4Leo = js2leo.address(r4);
    const r5Leo = js2leo.address(r5);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_initialize_bridge',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async initialize_token_service() {

    const params = []
    const result = await zkRun({
      config: this.config,
      transition: 'initialize_token_service',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_initialize_token_service() {

    const params = []
    const result = await zkRun({
      config: this.config,
      transition: 'exec_initialize_token_service',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async initialize_wrapped_token() {

    const params = []
    const result = await zkRun({
      config: this.config,
      transition: 'initialize_wrapped_token',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_initialize_wrapped_token() {

    const params = []
    const result = await zkRun({
      config: this.config,
      transition: 'exec_initialize_wrapped_token',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async add_new_token(r0: Array < number > , r1: Array < number > , r2: number, r3: number, r4: Array < number > ) {
    const r0Leo = js2leo.arr2string(js2leo.array(r0, js2leo.u8));
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.u8));
    const r2Leo = js2leo.u8(r2);
    const r3Leo = js2leo.u32(r3);
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.u8));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'add_new_token',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_add_new_token(r0: Array < number > , r1: Array < number > , r2: number, r3: number, r4: Array < number > ) {
    const r0Leo = js2leo.arr2string(js2leo.array(r0, js2leo.u8));
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.u8));
    const r2Leo = js2leo.u8(r2);
    const r3Leo = js2leo.u32(r3);
    const r4Leo = js2leo.arr2string(js2leo.array(r4, js2leo.u8));

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_add_new_token',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async enable_new_token(r0: string, r1: BigInt) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'enable_new_token',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_enable_new_token(r0: string, r1: BigInt) {
    const r0Leo = js2leo.address(r0);
    const r1Leo = js2leo.u64(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_enable_new_token',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async enable_service(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'enable_service',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_enable_service(r0: string) {
    const r0Leo = js2leo.address(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_enable_service',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async approve_chain_bridge(r0: number) {
    const r0Leo = js2leo.u32(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'approve_chain_bridge',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_approve_chain_bridge(r0: number) {
    const r0Leo = js2leo.u32(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_approve_chain_bridge',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async disapprove_chain_bridge(r0: number) {
    const r0Leo = js2leo.u32(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'disapprove_chain_bridge',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_disapprove_chain_bridge(r0: number) {
    const r0Leo = js2leo.u32(r0);

    const params = [r0Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_disapprove_chain_bridge',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async support_chain_ts(r0: number, r1: Array < number > ) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.u8));

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'support_chain_ts',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async exec_support_chain_ts(r0: number, r1: Array < number > ) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.arr2string(js2leo.array(r1, js2leo.u8));

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'exec_support_chain_ts',
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

  async settings(key: number): Promise < number > {
    const keyLeo = js2leo.u8(key);

    const params = [keyLeo]
    const result = await zkGetMapping({
      config: this.config,
      transition: 'settings',
      params,
    });
    return leo2js.u8(result);
  }


}