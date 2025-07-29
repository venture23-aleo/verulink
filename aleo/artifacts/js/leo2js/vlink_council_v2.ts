import {
  TokenMetadata,
  TokenMetadataLeo,
  TokenOwner,
  TokenOwnerLeo,
  ProposalVote,
  ProposalVoteLeo,
  ProposalVoterKey,
  ProposalVoterKeyLeo,
  AddMember,
  AddMemberLeo,
  RemoveMember,
  RemoveMemberLeo,
  Withdrawal,
  WithdrawalLeo,
  UpdateThreshold,
  UpdateThresholdLeo,
  ExternalProposal,
  ExternalProposalLeo
} from "../types/vlink_council_v2";
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

export function getProposalVote(proposalVote: ProposalVoteLeo): ProposalVote {
  const result: ProposalVote = {
    proposal: leo2js.field(proposalVote.proposal),
    member: leo2js.address(proposalVote.member),
  }
  return result;
}

export function getProposalVoterKey(proposalVoterKey: ProposalVoterKeyLeo): ProposalVoterKey {
  const result: ProposalVoterKey = {
    proposal: leo2js.field(proposalVoterKey.proposal),
    index: leo2js.u8(proposalVoterKey.index),
  }
  return result;
}

export function getAddMember(addMember: AddMemberLeo): AddMember {
  const result: AddMember = {
    id: leo2js.u32(addMember.id),
    new_member: leo2js.address(addMember.new_member),
    new_threshold: leo2js.u8(addMember.new_threshold),
  }
  return result;
}

export function getRemoveMember(removeMember: RemoveMemberLeo): RemoveMember {
  const result: RemoveMember = {
    id: leo2js.u32(removeMember.id),
    existing_member: leo2js.address(removeMember.existing_member),
    new_threshold: leo2js.u8(removeMember.new_threshold),
  }
  return result;
}

export function getWithdrawal(withdrawal: WithdrawalLeo): Withdrawal {
  const result: Withdrawal = {
    id: leo2js.u32(withdrawal.id),
    token_id: leo2js.field(withdrawal.token_id),
    receiver: leo2js.address(withdrawal.receiver),
    amount: leo2js.u128(withdrawal.amount),
  }
  return result;
}

export function getUpdateThreshold(updateThreshold: UpdateThresholdLeo): UpdateThreshold {
  const result: UpdateThreshold = {
    id: leo2js.u32(updateThreshold.id),
    new_threshold: leo2js.u8(updateThreshold.new_threshold),
  }
  return result;
}

export function getExternalProposal(externalProposal: ExternalProposalLeo): ExternalProposal {
  const result: ExternalProposal = {
    id: leo2js.u32(externalProposal.id),
    external_program: leo2js.address(externalProposal.external_program),
    proposal_hash: leo2js.field(externalProposal.proposal_hash),
  }
  return result;
}