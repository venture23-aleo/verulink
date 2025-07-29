import {
  TokenMetadata,
  TokenMetadataLeo,
  TokenOwner,
  TokenOwnerLeo,
  AleoProgram,
  AleoProgramLeo,
  ForeignContract,
  ForeignContractLeo,
  OutTokenMessage,
  OutTokenMessageLeo,
  InTokenMessage,
  InTokenMessageLeo,
  TbTransferOwnership,
  TbTransferOwnershipLeo,
  TbAddAttestor,
  TbAddAttestorLeo,
  TbRemoveAttestor,
  TbRemoveAttestorLeo,
  TbUpdateThreshold,
  TbUpdateThresholdLeo,
  TbAddChain,
  TbAddChainLeo,
  TbRemoveChain,
  TbRemoveChainLeo,
  TbAddService,
  TbAddServiceLeo,
  TbRemoveService,
  TbRemoveServiceLeo,
  TbPause,
  TbPauseLeo,
  TbUnpause,
  TbUnpauseLeo
} from "../types/vlink_bridge_council_v2";
import {
  leo2js,
  tx,
  parseJSONLikeString
} from "@doko-js/core";
import {
  PrivateKey
} from "@provablehq/sdk"


export function getTokenMetadata(tokenMetadata: TokenMetadataLeo): TokenMetadata {
  const result: TokenMetadata = {
    token_id: leo2js.field(tokenMetadata.token_id),
    name: leo2js.u128(tokenMetadata.name),
    symbol: leo2js.u128(tokenMetadata.symbol),
    decimals: leo2js.u8(tokenMetadata.decimals),
    supply: leo2js.u128(tokenMetadata.supply),
    max_supply: leo2js.u128(tokenMetadata.max_supply),
    admin: leo2js.address(tokenMetadata.admin),
    external_authorization_required: leo2js.boolean(tokenMetadata.external_authorization_required),
    external_authorization_party: leo2js.address(tokenMetadata.external_authorization_party),
  }
  return result;
}

export function getTokenOwner(tokenOwner: TokenOwnerLeo): TokenOwner {
  const result: TokenOwner = {
    account: leo2js.address(tokenOwner.account),
    token_id: leo2js.field(tokenOwner.token_id),
  }
  return result;
}

export function getAleoProgram(aleoProgram: AleoProgramLeo): AleoProgram {
  const result: AleoProgram = {
    chain_id: leo2js.u128(aleoProgram.chain_id),
    addr: leo2js.address(aleoProgram.addr),
  }
  return result;
}

export function getForeignContract(foreignContract: ForeignContractLeo): ForeignContract {
  const result: ForeignContract = {
    chain_id: leo2js.u128(foreignContract.chain_id),
    addr: leo2js.array(foreignContract.addr, leo2js.u8),
  }
  return result;
}

export function getOutTokenMessage(outTokenMessage: OutTokenMessageLeo): OutTokenMessage {
  const result: OutTokenMessage = {
    sender_address: leo2js.address(outTokenMessage.sender_address),
    dest_token_address: leo2js.array(outTokenMessage.dest_token_address, leo2js.u8),
    amount: leo2js.u128(outTokenMessage.amount),
    receiver_address: leo2js.array(outTokenMessage.receiver_address, leo2js.u8),
  }
  return result;
}

export function getInTokenMessage(inTokenMessage: InTokenMessageLeo): InTokenMessage {
  const result: InTokenMessage = {
    sender_address: leo2js.array(inTokenMessage.sender_address, leo2js.u8),
    dest_token_id: leo2js.field(inTokenMessage.dest_token_id),
    amount: leo2js.u128(inTokenMessage.amount),
    receiver_address: leo2js.address(inTokenMessage.receiver_address),
  }
  return result;
}

export function getTbTransferOwnership(tbTransferOwnership: TbTransferOwnershipLeo): TbTransferOwnership {
  const result: TbTransferOwnership = {
    id: leo2js.u32(tbTransferOwnership.id),
    new_owner: leo2js.address(tbTransferOwnership.new_owner),
  }
  return result;
}

export function getTbAddAttestor(tbAddAttestor: TbAddAttestorLeo): TbAddAttestor {
  const result: TbAddAttestor = {
    id: leo2js.u32(tbAddAttestor.id),
    new_attestor: leo2js.address(tbAddAttestor.new_attestor),
    new_threshold: leo2js.u8(tbAddAttestor.new_threshold),
  }
  return result;
}

export function getTbRemoveAttestor(tbRemoveAttestor: TbRemoveAttestorLeo): TbRemoveAttestor {
  const result: TbRemoveAttestor = {
    id: leo2js.u32(tbRemoveAttestor.id),
    existing_attestor: leo2js.address(tbRemoveAttestor.existing_attestor),
    new_threshold: leo2js.u8(tbRemoveAttestor.new_threshold),
  }
  return result;
}

export function getTbUpdateThreshold(tbUpdateThreshold: TbUpdateThresholdLeo): TbUpdateThreshold {
  const result: TbUpdateThreshold = {
    id: leo2js.u32(tbUpdateThreshold.id),
    new_threshold: leo2js.u8(tbUpdateThreshold.new_threshold),
  }
  return result;
}

export function getTbAddChain(tbAddChain: TbAddChainLeo): TbAddChain {
  const result: TbAddChain = {
    id: leo2js.u32(tbAddChain.id),
    chain_id: leo2js.u128(tbAddChain.chain_id),
  }
  return result;
}

export function getTbRemoveChain(tbRemoveChain: TbRemoveChainLeo): TbRemoveChain {
  const result: TbRemoveChain = {
    id: leo2js.u32(tbRemoveChain.id),
    chain_id: leo2js.u128(tbRemoveChain.chain_id),
  }
  return result;
}

export function getTbAddService(tbAddService: TbAddServiceLeo): TbAddService {
  const result: TbAddService = {
    id: leo2js.u32(tbAddService.id),
    service: leo2js.address(tbAddService.service),
  }
  return result;
}

export function getTbRemoveService(tbRemoveService: TbRemoveServiceLeo): TbRemoveService {
  const result: TbRemoveService = {
    id: leo2js.u32(tbRemoveService.id),
    service: leo2js.address(tbRemoveService.service),
  }
  return result;
}

export function getTbPause(tbPause: TbPauseLeo): TbPause {
  const result: TbPause = {
    id: leo2js.u32(tbPause.id),
  }
  return result;
}

export function getTbUnpause(tbUnpause: TbUnpauseLeo): TbUnpause {
  const result: TbUnpause = {
    id: leo2js.u32(tbUnpause.id),
  }
  return result;
}