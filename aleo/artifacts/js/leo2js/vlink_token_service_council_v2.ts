import {
  TokenMetadata,
  TokenMetadataLeo,
  TokenOwner,
  TokenOwnerLeo,
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
  ChainToken,
  ChainTokenLeo,
  TsTransferOwnership,
  TsTransferOwnershipLeo,
  TsAddToken,
  TsAddTokenLeo,
  TsRemoveToken,
  TsRemoveTokenLeo,
  TsUpdateMaxMinTransfer,
  TsUpdateMaxMinTransferLeo,
  TsPauseToken,
  TsPauseTokenLeo,
  TsUnpauseToken,
  TsUnpauseTokenLeo,
  TsUpdateWithdrawalLimit,
  TsUpdateWithdrawalLimitLeo,
  HoldingRelease,
  HoldingReleaseLeo,
  HoldingReleasePrivate,
  HoldingReleasePrivateLeo,
  TransferOwnershipHolding,
  TransferOwnershipHoldingLeo,
  RegisterToken,
  RegisterTokenLeo,
  UpdateTokenMetadata,
  UpdateTokenMetadataLeo,
  SetRoleForToken,
  SetRoleForTokenLeo,
  UpdateTokenServiceSetting,
  UpdateTokenServiceSettingLeo,
  AddChainExistingToken,
  AddChainExistingTokenLeo,
  RemoveOtherChainAddresses,
  RemoveOtherChainAddressesLeo,
  UpdateFees,
  UpdateFeesLeo,
  RemoveRole,
  RemoveRoleLeo
} from "../types/vlink_token_service_council_v2";
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

export function getChainToken(chainToken: ChainTokenLeo): ChainToken {
  const result: ChainToken = {
    chain_id: leo2js.u128(chainToken.chain_id),
    token_id: leo2js.field(chainToken.token_id),
  }
  return result;
}

export function getTsTransferOwnership(tsTransferOwnership: TsTransferOwnershipLeo): TsTransferOwnership {
  const result: TsTransferOwnership = {
    id: leo2js.u32(tsTransferOwnership.id),
    new_owner: leo2js.address(tsTransferOwnership.new_owner),
  }
  return result;
}

export function getTsAddToken(tsAddToken: TsAddTokenLeo): TsAddToken {
  const result: TsAddToken = {
    id: leo2js.u32(tsAddToken.id),
    token_id: leo2js.field(tsAddToken.token_id),
    min_transfer: leo2js.u128(tsAddToken.min_transfer),
    max_transfer: leo2js.u128(tsAddToken.max_transfer),
    outgoing_percentage: leo2js.u32(tsAddToken.outgoing_percentage),
    time: leo2js.u32(tsAddToken.time),
    max_no_cap: leo2js.u128(tsAddToken.max_no_cap),
    token_address: leo2js.array(tsAddToken.token_address, leo2js.u8),
    token_service: leo2js.array(tsAddToken.token_service, leo2js.u8),
    chain_id: leo2js.u128(tsAddToken.chain_id),
    pub_platform_fee: leo2js.u32(tsAddToken.pub_platform_fee),
    pri_platform_fee: leo2js.u32(tsAddToken.pri_platform_fee),
    pub_relayer_fee: leo2js.u128(tsAddToken.pub_relayer_fee),
    pri_relayer_fee: leo2js.u128(tsAddToken.pri_relayer_fee),
  }
  return result;
}

export function getTsRemoveToken(tsRemoveToken: TsRemoveTokenLeo): TsRemoveToken {
  const result: TsRemoveToken = {
    id: leo2js.u32(tsRemoveToken.id),
    chain_id: leo2js.u128(tsRemoveToken.chain_id),
    token_id: leo2js.field(tsRemoveToken.token_id),
  }
  return result;
}

export function getTsUpdateMaxMinTransfer(tsUpdateMaxMinTransfer: TsUpdateMaxMinTransferLeo): TsUpdateMaxMinTransfer {
  const result: TsUpdateMaxMinTransfer = {
    id: leo2js.u32(tsUpdateMaxMinTransfer.id),
    token_id: leo2js.field(tsUpdateMaxMinTransfer.token_id),
    max_transfer: leo2js.u128(tsUpdateMaxMinTransfer.max_transfer),
    min_transfer: leo2js.u128(tsUpdateMaxMinTransfer.min_transfer),
  }
  return result;
}

export function getTsPauseToken(tsPauseToken: TsPauseTokenLeo): TsPauseToken {
  const result: TsPauseToken = {
    id: leo2js.u32(tsPauseToken.id),
    token_id: leo2js.field(tsPauseToken.token_id),
  }
  return result;
}

export function getTsUnpauseToken(tsUnpauseToken: TsUnpauseTokenLeo): TsUnpauseToken {
  const result: TsUnpauseToken = {
    id: leo2js.u32(tsUnpauseToken.id),
    token_id: leo2js.field(tsUnpauseToken.token_id),
  }
  return result;
}

export function getTsUpdateWithdrawalLimit(tsUpdateWithdrawalLimit: TsUpdateWithdrawalLimitLeo): TsUpdateWithdrawalLimit {
  const result: TsUpdateWithdrawalLimit = {
    id: leo2js.u32(tsUpdateWithdrawalLimit.id),
    token_id: leo2js.field(tsUpdateWithdrawalLimit.token_id),
    percentage: leo2js.u32(tsUpdateWithdrawalLimit.percentage),
    duration: leo2js.u32(tsUpdateWithdrawalLimit.duration),
    threshold_no_limit: leo2js.u128(tsUpdateWithdrawalLimit.threshold_no_limit),
  }
  return result;
}

export function getHoldingRelease(holdingRelease: HoldingReleaseLeo): HoldingRelease {
  const result: HoldingRelease = {
    id: leo2js.u32(holdingRelease.id),
    token_id: leo2js.field(holdingRelease.token_id),
    receiver: leo2js.address(holdingRelease.receiver),
    amount: leo2js.u128(holdingRelease.amount),
  }
  return result;
}

export function getHoldingReleasePrivate(holdingReleasePrivate: HoldingReleasePrivateLeo): HoldingReleasePrivate {
  const result: HoldingReleasePrivate = {
    id: leo2js.u32(holdingReleasePrivate.id),
    token_id: leo2js.field(holdingReleasePrivate.token_id),
    pre_image: leo2js.field(holdingReleasePrivate.pre_image),
    receiver: leo2js.address(holdingReleasePrivate.receiver),
    amount: leo2js.u128(holdingReleasePrivate.amount),
  }
  return result;
}

export function getTransferOwnershipHolding(transferOwnershipHolding: TransferOwnershipHoldingLeo): TransferOwnershipHolding {
  const result: TransferOwnershipHolding = {
    id: leo2js.u32(transferOwnershipHolding.id),
    new_owner: leo2js.address(transferOwnershipHolding.new_owner),
  }
  return result;
}

export function getRegisterToken(registerToken: RegisterTokenLeo): RegisterToken {
  const result: RegisterToken = {
    id: leo2js.u32(registerToken.id),
    token_name: leo2js.u128(registerToken.token_name),
    symbol: leo2js.u128(registerToken.symbol),
    decimals: leo2js.u8(registerToken.decimals),
    max_supply: leo2js.u128(registerToken.max_supply),
  }
  return result;
}

export function getUpdateTokenMetadata(updateTokenMetadata: UpdateTokenMetadataLeo): UpdateTokenMetadata {
  const result: UpdateTokenMetadata = {
    id: leo2js.u32(updateTokenMetadata.id),
    token_id: leo2js.field(updateTokenMetadata.token_id),
    admin: leo2js.address(updateTokenMetadata.admin),
    external_authorization_party: leo2js.address(updateTokenMetadata.external_authorization_party),
  }
  return result;
}

export function getSetRoleForToken(setRoleForToken: SetRoleForTokenLeo): SetRoleForToken {
  const result: SetRoleForToken = {
    id: leo2js.u32(setRoleForToken.id),
    token_id: leo2js.field(setRoleForToken.token_id),
    account: leo2js.address(setRoleForToken.account),
    role: leo2js.u8(setRoleForToken.role),
  }
  return result;
}

export function getUpdateTokenServiceSetting(updateTokenServiceSetting: UpdateTokenServiceSettingLeo): UpdateTokenServiceSetting {
  const result: UpdateTokenServiceSetting = {
    id: leo2js.u32(updateTokenServiceSetting.id),
    chain_id: leo2js.u128(updateTokenServiceSetting.chain_id),
    token_id: leo2js.field(updateTokenServiceSetting.token_id),
    token_service_address: leo2js.array(updateTokenServiceSetting.token_service_address, leo2js.u8),
    token_address: leo2js.array(updateTokenServiceSetting.token_address, leo2js.u8),
  }
  return result;
}

export function getAddChainExistingToken(addChainExistingToken: AddChainExistingTokenLeo): AddChainExistingToken {
  const result: AddChainExistingToken = {
    id: leo2js.u32(addChainExistingToken.id),
    chain_id: leo2js.u128(addChainExistingToken.chain_id),
    token_id: leo2js.field(addChainExistingToken.token_id),
    token_service_address: leo2js.array(addChainExistingToken.token_service_address, leo2js.u8),
    token_address: leo2js.array(addChainExistingToken.token_address, leo2js.u8),
    pub_platform_fee: leo2js.u32(addChainExistingToken.pub_platform_fee),
    pri_platform_fee: leo2js.u32(addChainExistingToken.pri_platform_fee),
    pub_relayer_fee: leo2js.u128(addChainExistingToken.pub_relayer_fee),
    pri_relayer_fee: leo2js.u128(addChainExistingToken.pri_relayer_fee),
  }
  return result;
}

export function getRemoveOtherChainAddresses(removeOtherChainAddresses: RemoveOtherChainAddressesLeo): RemoveOtherChainAddresses {
  const result: RemoveOtherChainAddresses = {
    id: leo2js.u32(removeOtherChainAddresses.id),
    chain_id: leo2js.u128(removeOtherChainAddresses.chain_id),
    token_id: leo2js.field(removeOtherChainAddresses.token_id),
  }
  return result;
}

export function getUpdateFees(updateFees: UpdateFeesLeo): UpdateFees {
  const result: UpdateFees = {
    id: leo2js.u32(updateFees.id),
    chain_id: leo2js.u128(updateFees.chain_id),
    token_id: leo2js.field(updateFees.token_id),
    public_relayer_fee: leo2js.u128(updateFees.public_relayer_fee),
    private_relayer_fee: leo2js.u128(updateFees.private_relayer_fee),
    public_platform_fee: leo2js.u32(updateFees.public_platform_fee),
    private_platform_fee: leo2js.u32(updateFees.private_platform_fee),
  }
  return result;
}

export function getRemoveRole(removeRole: RemoveRoleLeo): RemoveRole {
  const result: RemoveRole = {
    id: leo2js.u32(removeRole.id),
    token_id: leo2js.field(removeRole.token_id),
    account: leo2js.address(removeRole.account),
  }
  return result;
}