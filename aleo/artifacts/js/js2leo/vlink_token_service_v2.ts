import {
  TokenMetadata,
  TokenMetadataLeo,
  TokenOwner,
  TokenOwnerLeo,
  Image,
  ImageLeo,
  Holder,
  HolderLeo,
  AleoProgram,
  AleoProgramLeo,
  ForeignContract,
  ForeignContractLeo,
  OutTokenMessage,
  OutTokenMessageLeo,
  InTokenMessage,
  InTokenMessageLeo,
  WithdrawalLimit,
  WithdrawalLimitLeo,
  ChainToken,
  ChainTokenLeo
} from "../types/vlink_token_service_v2";
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

export function getImageLeo(image: Image): ImageLeo {
  const result: ImageLeo = {
    pre_image: js2leo.field(image.pre_image),
    receiver: js2leo.address(image.receiver),
  }
  return result;
}

export function getHolderLeo(holder: Holder): HolderLeo {
  const result: HolderLeo = {
    account: js2leo.address(holder.account),
    token_id: js2leo.field(holder.token_id),
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

export function getWithdrawalLimitLeo(withdrawalLimit: WithdrawalLimit): WithdrawalLimitLeo {
  const result: WithdrawalLimitLeo = {
    percentage: js2leo.u32(withdrawalLimit.percentage),
    duration: js2leo.u32(withdrawalLimit.duration),
    threshold_no_limit: js2leo.u128(withdrawalLimit.threshold_no_limit),
  }
  return result;
}

export function getChainTokenLeo(chainToken: ChainToken): ChainTokenLeo {
  const result: ChainTokenLeo = {
    chain_id: js2leo.u128(chainToken.chain_id),
    token_id: js2leo.field(chainToken.token_id),
  }
  return result;
}