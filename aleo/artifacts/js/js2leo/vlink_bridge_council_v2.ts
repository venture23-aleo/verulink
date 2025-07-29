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
  js2leo
} from "@doko-js/core";


export function getTokenMetadataLeo(tokenMetadata: TokenMetadata): TokenMetadataLeo {
  const result: TokenMetadataLeo = {
    token_id: js2leo.field(tokenMetadata.token_id),
    name: js2leo.u128(tokenMetadata.name),
    symbol: js2leo.u128(tokenMetadata.symbol),
    decimals: js2leo.u8(tokenMetadata.decimals),
    supply: js2leo.u128(tokenMetadata.supply),
    max_supply: js2leo.u128(tokenMetadata.max_supply),
    admin: js2leo.address(tokenMetadata.admin),
    external_authorization_required: js2leo.boolean(tokenMetadata.external_authorization_required),
    external_authorization_party: js2leo.address(tokenMetadata.external_authorization_party),
  }
  return result;
}

export function getTokenOwnerLeo(tokenOwner: TokenOwner): TokenOwnerLeo {
  const result: TokenOwnerLeo = {
    account: js2leo.address(tokenOwner.account),
    token_id: js2leo.field(tokenOwner.token_id),
  }
  return result;
}

export function getAleoProgramLeo(aleoProgram: AleoProgram): AleoProgramLeo {
  const result: AleoProgramLeo = {
    chain_id: js2leo.u128(aleoProgram.chain_id),
    addr: js2leo.address(aleoProgram.addr),
  }
  return result;
}

export function getForeignContractLeo(foreignContract: ForeignContract): ForeignContractLeo {
  const result: ForeignContractLeo = {
    chain_id: js2leo.u128(foreignContract.chain_id),
    addr: js2leo.array(foreignContract.addr, js2leo.u8),
  }
  return result;
}

export function getOutTokenMessageLeo(outTokenMessage: OutTokenMessage): OutTokenMessageLeo {
  const result: OutTokenMessageLeo = {
    sender_address: js2leo.address(outTokenMessage.sender_address),
    dest_token_address: js2leo.array(outTokenMessage.dest_token_address, js2leo.u8),
    amount: js2leo.u128(outTokenMessage.amount),
    receiver_address: js2leo.array(outTokenMessage.receiver_address, js2leo.u8),
  }
  return result;
}

export function getInTokenMessageLeo(inTokenMessage: InTokenMessage): InTokenMessageLeo {
  const result: InTokenMessageLeo = {
    sender_address: js2leo.array(inTokenMessage.sender_address, js2leo.u8),
    dest_token_id: js2leo.field(inTokenMessage.dest_token_id),
    amount: js2leo.u128(inTokenMessage.amount),
    receiver_address: js2leo.address(inTokenMessage.receiver_address),
  }
  return result;
}

export function getTbTransferOwnershipLeo(tbTransferOwnership: TbTransferOwnership): TbTransferOwnershipLeo {
  const result: TbTransferOwnershipLeo = {
    id: js2leo.u32(tbTransferOwnership.id),
    new_owner: js2leo.address(tbTransferOwnership.new_owner),
  }
  return result;
}

export function getTbAddAttestorLeo(tbAddAttestor: TbAddAttestor): TbAddAttestorLeo {
  const result: TbAddAttestorLeo = {
    id: js2leo.u32(tbAddAttestor.id),
    new_attestor: js2leo.address(tbAddAttestor.new_attestor),
    new_threshold: js2leo.u8(tbAddAttestor.new_threshold),
  }
  return result;
}

export function getTbRemoveAttestorLeo(tbRemoveAttestor: TbRemoveAttestor): TbRemoveAttestorLeo {
  const result: TbRemoveAttestorLeo = {
    id: js2leo.u32(tbRemoveAttestor.id),
    existing_attestor: js2leo.address(tbRemoveAttestor.existing_attestor),
    new_threshold: js2leo.u8(tbRemoveAttestor.new_threshold),
  }
  return result;
}

export function getTbUpdateThresholdLeo(tbUpdateThreshold: TbUpdateThreshold): TbUpdateThresholdLeo {
  const result: TbUpdateThresholdLeo = {
    id: js2leo.u32(tbUpdateThreshold.id),
    new_threshold: js2leo.u8(tbUpdateThreshold.new_threshold),
  }
  return result;
}

export function getTbAddChainLeo(tbAddChain: TbAddChain): TbAddChainLeo {
  const result: TbAddChainLeo = {
    id: js2leo.u32(tbAddChain.id),
    chain_id: js2leo.u128(tbAddChain.chain_id),
  }
  return result;
}

export function getTbRemoveChainLeo(tbRemoveChain: TbRemoveChain): TbRemoveChainLeo {
  const result: TbRemoveChainLeo = {
    id: js2leo.u32(tbRemoveChain.id),
    chain_id: js2leo.u128(tbRemoveChain.chain_id),
  }
  return result;
}

export function getTbAddServiceLeo(tbAddService: TbAddService): TbAddServiceLeo {
  const result: TbAddServiceLeo = {
    id: js2leo.u32(tbAddService.id),
    service: js2leo.address(tbAddService.service),
  }
  return result;
}

export function getTbRemoveServiceLeo(tbRemoveService: TbRemoveService): TbRemoveServiceLeo {
  const result: TbRemoveServiceLeo = {
    id: js2leo.u32(tbRemoveService.id),
    service: js2leo.address(tbRemoveService.service),
  }
  return result;
}

export function getTbPauseLeo(tbPause: TbPause): TbPauseLeo {
  const result: TbPauseLeo = {
    id: js2leo.u32(tbPause.id),
  }
  return result;
}

export function getTbUnpauseLeo(tbUnpause: TbUnpause): TbUnpauseLeo {
  const result: TbUnpauseLeo = {
    id: js2leo.u32(tbUnpause.id),
  }
  return result;
}