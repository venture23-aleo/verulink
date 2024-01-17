import * as js2leo from './js2leo/common';
import * as leo2js from './leo2js/common';
import {
  UpdateConnector,
  WUsdcRelease,
  ProposalSign,
  ExternalProposal,
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
  TsSupportChain,
  TsRemoveChain,
  TsSupportToken,
  TsRemoveToken,
  TsUpdateConnector,
  TsUpdateMinimumTransfer,
  TsUpdateOutgoingPercentage,
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
  OutgoingPercentageInTime,
  token,
  Approval,
} from "./types";
import {
  getUpdateConnectorLeo,
  getWUsdcReleaseLeo,
  getProposalSignLeo,
  getExternalProposalLeo,
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
  getTsSupportChainLeo,
  getTsRemoveChainLeo,
  getTsSupportTokenLeo,
  getTsRemoveTokenLeo,
  getTsUpdateConnectorLeo,
  getTsUpdateMinimumTransferLeo,
  getTsUpdateOutgoingPercentageLeo,
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
  getOutgoingPercentageInTimeLeo,
  gettokenLeo,
  getApprovalLeo,
} from './js2leo';
import {
  getUpdateConnector,
  getWUsdcRelease,
  getProposalSign,
  getExternalProposal,
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
  getTsSupportChain,
  getTsRemoveChain,
  getTsSupportToken,
  getTsRemoveToken,
  getTsUpdateConnector,
  getTsUpdateMinimumTransfer,
  getTsUpdateOutgoingPercentage,
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
  getOutgoingPercentageInTime,
  gettoken,
  getApproval,
} from './leo2js';
import {
  zkRun,
  ContractConfig,
  snarkDeploy,
  zkGetMapping
} from './utils';

const networkConfig = require('../../aleo-config');

export class Wusdc_connectorContract {

  config: ContractConfig;

  constructor(config: ContractConfig = {}) {
    this.config = {
      appName: 'wusdc_connector',
      contractPath: 'artifacts/leo/wusdc_connector',
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
  async initialize_wusdc() {

    const params = []
    const result = await zkRun({
      config: this.config,
      transition: 'initialize_wusdc',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async wusdc_receive(r0: Array < number > , r1: string, r2: string, r3: bigint, r4: number, r5: number) {
    const r0Leo = js2leo.arr2string(js2leo.array(r0, js2leo.u8));
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.address(r2);
    const r3Leo = js2leo.u128(r3);
    const r4Leo = js2leo.u32(r4);
    const r5Leo = js2leo.u32(r5);

    const params = [r0Leo, r1Leo, r2Leo, r3Leo, r4Leo, r5Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'wusdc_receive',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async wusdc_send(r0: Array < number > , r1: bigint) {
    const r0Leo = js2leo.arr2string(js2leo.array(r0, js2leo.u8));
    const r1Leo = js2leo.u128(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'wusdc_send',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async update_wusdc_connector(r0: number, r1: string) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);

    const params = [r0Leo, r1Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'update_wusdc_connector',
      params,
    });
    if (this.config.mode === "execute") return result;
  }

  async wusdc_release(r0: number, r1: string, r2: bigint) {
    const r0Leo = js2leo.u32(r0);
    const r1Leo = js2leo.address(r1);
    const r2Leo = js2leo.u128(r2);

    const params = [r0Leo, r1Leo, r2Leo]
    const result = await zkRun({
      config: this.config,
      transition: 'wusdc_release',
      params,
    });
    if (this.config.mode === "execute") return result;
  }


}