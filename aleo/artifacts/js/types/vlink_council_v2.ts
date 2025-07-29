import {
  z
} from "zod";
import {
  leoAddressSchema,
  leoPrivateKeySchema,
  leoViewKeySchema,
  leoTxIdSchema,
  leoScalarSchema,
  leoFieldSchema,
  leoBooleanSchema,
  leoU8Schema,
  leoU16Schema,
  leoU32Schema,
  leoU64Schema,
  leoU128Schema,
  leoGroupSchema,
  leoRecordSchema,
  leoTxSchema,
  leoSignatureSchema,
  LeoArray,
  LeoAddress,
  ExternalRecord,
  tx
} from "@doko-js/core";

export interface TokenMetadata {
  token_id: bigint;
  name: bigint;
  symbol: bigint;
  decimals: number;
  supply: bigint;
  max_supply: bigint;
  admin: LeoAddress;
  external_authorization_required: boolean;
  external_authorization_party: LeoAddress;
}

export const leoTokenMetadataSchema = z.object({
  token_id: leoFieldSchema,
  name: leoU128Schema,
  symbol: leoU128Schema,
  decimals: leoU8Schema,
  supply: leoU128Schema,
  max_supply: leoU128Schema,
  admin: leoAddressSchema,
  external_authorization_required: leoBooleanSchema,
  external_authorization_party: leoAddressSchema,
});
export type TokenMetadataLeo = z.infer < typeof leoTokenMetadataSchema > ;

export interface TokenOwner {
  account: LeoAddress;
  token_id: bigint;
}

export const leoTokenOwnerSchema = z.object({
  account: leoAddressSchema,
  token_id: leoFieldSchema,
});
export type TokenOwnerLeo = z.infer < typeof leoTokenOwnerSchema > ;

export interface ProposalVote {
  proposal: bigint;
  member: LeoAddress;
}

export const leoProposalVoteSchema = z.object({
  proposal: leoFieldSchema,
  member: leoAddressSchema,
});
export type ProposalVoteLeo = z.infer < typeof leoProposalVoteSchema > ;

export interface ProposalVoterKey {
  proposal: bigint;
  index: number;
}

export const leoProposalVoterKeySchema = z.object({
  proposal: leoFieldSchema,
  index: leoU8Schema,
});
export type ProposalVoterKeyLeo = z.infer < typeof leoProposalVoterKeySchema > ;

export interface AddMember {
  id: number;
  new_member: LeoAddress;
  new_threshold: number;
}

export const leoAddMemberSchema = z.object({
  id: leoU32Schema,
  new_member: leoAddressSchema,
  new_threshold: leoU8Schema,
});
export type AddMemberLeo = z.infer < typeof leoAddMemberSchema > ;

export interface RemoveMember {
  id: number;
  existing_member: LeoAddress;
  new_threshold: number;
}

export const leoRemoveMemberSchema = z.object({
  id: leoU32Schema,
  existing_member: leoAddressSchema,
  new_threshold: leoU8Schema,
});
export type RemoveMemberLeo = z.infer < typeof leoRemoveMemberSchema > ;

export interface Withdrawal {
  id: number;
  token_id: bigint;
  receiver: LeoAddress;
  amount: bigint;
}

export const leoWithdrawalSchema = z.object({
  id: leoU32Schema,
  token_id: leoFieldSchema,
  receiver: leoAddressSchema,
  amount: leoU128Schema,
});
export type WithdrawalLeo = z.infer < typeof leoWithdrawalSchema > ;

export interface UpdateThreshold {
  id: number;
  new_threshold: number;
}

export const leoUpdateThresholdSchema = z.object({
  id: leoU32Schema,
  new_threshold: leoU8Schema,
});
export type UpdateThresholdLeo = z.infer < typeof leoUpdateThresholdSchema > ;

export interface ExternalProposal {
  id: number;
  external_program: LeoAddress;
  proposal_hash: bigint;
}

export const leoExternalProposalSchema = z.object({
  id: leoU32Schema,
  external_program: leoAddressSchema,
  proposal_hash: leoFieldSchema,
});
export type ExternalProposalLeo = z.infer < typeof leoExternalProposalSchema > ;