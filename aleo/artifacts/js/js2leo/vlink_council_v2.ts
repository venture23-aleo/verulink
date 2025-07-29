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

export function getProposalVoteLeo(proposalVote: ProposalVote): ProposalVoteLeo {
  const result: ProposalVoteLeo = {
    proposal: js2leo.field(proposalVote.proposal),
    member: js2leo.address(proposalVote.member),
  }
  return result;
}

export function getProposalVoterKeyLeo(proposalVoterKey: ProposalVoterKey): ProposalVoterKeyLeo {
  const result: ProposalVoterKeyLeo = {
    proposal: js2leo.field(proposalVoterKey.proposal),
    index: js2leo.u8(proposalVoterKey.index),
  }
  return result;
}

export function getAddMemberLeo(addMember: AddMember): AddMemberLeo {
  const result: AddMemberLeo = {
    id: js2leo.u32(addMember.id),
    new_member: js2leo.address(addMember.new_member),
    new_threshold: js2leo.u8(addMember.new_threshold),
  }
  return result;
}

export function getRemoveMemberLeo(removeMember: RemoveMember): RemoveMemberLeo {
  const result: RemoveMemberLeo = {
    id: js2leo.u32(removeMember.id),
    existing_member: js2leo.address(removeMember.existing_member),
    new_threshold: js2leo.u8(removeMember.new_threshold),
  }
  return result;
}

export function getWithdrawalLeo(withdrawal: Withdrawal): WithdrawalLeo {
  const result: WithdrawalLeo = {
    id: js2leo.u32(withdrawal.id),
    token_id: js2leo.field(withdrawal.token_id),
    receiver: js2leo.address(withdrawal.receiver),
    amount: js2leo.u128(withdrawal.amount),
  }
  return result;
}

export function getUpdateThresholdLeo(updateThreshold: UpdateThreshold): UpdateThresholdLeo {
  const result: UpdateThresholdLeo = {
    id: js2leo.u32(updateThreshold.id),
    new_threshold: js2leo.u8(updateThreshold.new_threshold),
  }
  return result;
}

export function getExternalProposalLeo(externalProposal: ExternalProposal): ExternalProposalLeo {
  const result: ExternalProposalLeo = {
    id: js2leo.u32(externalProposal.id),
    external_program: js2leo.address(externalProposal.external_program),
    proposal_hash: js2leo.field(externalProposal.proposal_hash),
  }
  return result;
}