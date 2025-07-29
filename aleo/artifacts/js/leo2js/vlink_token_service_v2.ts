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

export function getImage(image: ImageLeo): Image {
  const result: Image = {
    pre_image: leo2js.field(image.pre_image),
    receiver: leo2js.address(image.receiver),
  }
  return result;
}

export function getHolder(holder: HolderLeo): Holder {
  const result: Holder = {
    account: leo2js.address(holder.account),
    token_id: leo2js.field(holder.token_id),
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

export function getWithdrawalLimit(withdrawalLimit: WithdrawalLimitLeo): WithdrawalLimit {
  const result: WithdrawalLimit = {
    percentage: leo2js.u32(withdrawalLimit.percentage),
    duration: leo2js.u32(withdrawalLimit.duration),
    threshold_no_limit: leo2js.u128(withdrawalLimit.threshold_no_limit),
  }
  return result;
}

export function getChainToken(chainToken: ChainTokenLeo): ChainToken {
  const result: ChainToken = {
    chain_id: leo2js.u128(chainToken.chain_id),
    token_id: leo2js.field(chainToken.token_id),
  }
  return result;
}