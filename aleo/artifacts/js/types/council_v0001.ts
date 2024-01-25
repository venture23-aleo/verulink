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
  LeoArray
} from "./leo-types";

export interface ProposalVote {
  proposal: bigint;
  member: string;
}

export const leoProposalVoteSchema = z.object({
  proposal: leoFieldSchema,
  member: leoAddressSchema,
});
export type ProposalVoteLeo = z.infer < typeof leoProposalVoteSchema > ;

export interface AddMember {
  id: number;
  new_member: string;
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
  existing_member: string;
  new_threshold: number;
}

export const leoRemoveMemberSchema = z.object({
  id: leoU32Schema,
  existing_member: leoAddressSchema,
  new_threshold: leoU8Schema,
});
export type RemoveMemberLeo = z.infer < typeof leoRemoveMemberSchema > ;

export interface UpdateThreshold {
  id: number;
  new_threshold: number;
}

export const leoUpdateThresholdSchema = z.object({
  id: leoU32Schema,
  new_threshold: leoU8Schema,
});
export type UpdateThresholdLeo = z.infer < typeof leoUpdateThresholdSchema > ;

export interface TbUpdateGovernance {
  id: number;
  new_owner: string;
}

export const leoTbUpdateGovernanceSchema = z.object({
  id: leoU32Schema,
  new_owner: leoAddressSchema,
});
export type TbUpdateGovernanceLeo = z.infer < typeof leoTbUpdateGovernanceSchema > ;

export interface TbAddAttestor {
  id: number;
  new_attestor: string;
  new_threshold: number;
}

export const leoTbAddAttestorSchema = z.object({
  id: leoU32Schema,
  new_attestor: leoAddressSchema,
  new_threshold: leoU8Schema,
});
export type TbAddAttestorLeo = z.infer < typeof leoTbAddAttestorSchema > ;

export interface TbRemoveAttestor {
  id: number;
  existing_attestor: string;
  new_threshold: number;
}

export const leoTbRemoveAttestorSchema = z.object({
  id: leoU32Schema,
  existing_attestor: leoAddressSchema,
  new_threshold: leoU8Schema,
});
export type TbRemoveAttestorLeo = z.infer < typeof leoTbRemoveAttestorSchema > ;

export interface TbUpdateThreshold {
  id: number;
  new_threshold: number;
}

export const leoTbUpdateThresholdSchema = z.object({
  id: leoU32Schema,
  new_threshold: leoU8Schema,
});
export type TbUpdateThresholdLeo = z.infer < typeof leoTbUpdateThresholdSchema > ;

export interface TbEnableChain {
  id: number;
  chain_id: bigint;
}

export const leoTbEnableChainSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
});
export type TbEnableChainLeo = z.infer < typeof leoTbEnableChainSchema > ;

export interface TbDisableChain {
  id: number;
  chain_id: bigint;
}

export const leoTbDisableChainSchema = z.object({
  id: leoU32Schema,
  chain_id: leoU128Schema,
});
export type TbDisableChainLeo = z.infer < typeof leoTbDisableChainSchema > ;

export interface TbEnableService {
  id: number;
  service: string;
}

export const leoTbEnableServiceSchema = z.object({
  id: leoU32Schema,
  service: leoAddressSchema,
});
export type TbEnableServiceLeo = z.infer < typeof leoTbEnableServiceSchema > ;

export interface TbDisableService {
  id: number;
  service: string;
}

export const leoTbDisableServiceSchema = z.object({
  id: leoU32Schema,
  service: leoAddressSchema,
});
export type TbDisableServiceLeo = z.infer < typeof leoTbDisableServiceSchema > ;

export interface TsTransferOwnership {
  id: number;
  new_owner: string;
}

export const leoTsTransferOwnershipSchema = z.object({
  id: leoU32Schema,
  new_owner: leoAddressSchema,
});
export type TsTransferOwnershipLeo = z.infer < typeof leoTsTransferOwnershipSchema > ;

export interface TsAddToken {
  id: number;
  token_id: string;
  connector: string;
  min_transfer: bigint;
  max_transfer: bigint;
  outgoing_percentage: number;
  time: number;
  max_no_cap: bigint;
}

export const leoTsAddTokenSchema = z.object({
  id: leoU32Schema,
  token_id: leoAddressSchema,
  connector: leoAddressSchema,
  min_transfer: leoU128Schema,
  max_transfer: leoU128Schema,
  outgoing_percentage: leoU16Schema,
  time: leoU32Schema,
  max_no_cap: leoU128Schema,
});
export type TsAddTokenLeo = z.infer < typeof leoTsAddTokenSchema > ;

export interface TsRemoveToken {
  id: number;
  token_id: string;
}

export const leoTsRemoveTokenSchema = z.object({
  id: leoU32Schema,
  token_id: leoAddressSchema,
});
export type TsRemoveTokenLeo = z.infer < typeof leoTsRemoveTokenSchema > ;

export interface TsUpdateMinTransfer {
  id: number;
  token_id: string;
  min_transfer: bigint;
}

export const leoTsUpdateMinTransferSchema = z.object({
  id: leoU32Schema,
  token_id: leoAddressSchema,
  min_transfer: leoU128Schema,
});
export type TsUpdateMinTransferLeo = z.infer < typeof leoTsUpdateMinTransferSchema > ;

export interface TsUpdateMaxTransfer {
  id: number;
  token_id: string;
  max_transfer: bigint;
}

export const leoTsUpdateMaxTransferSchema = z.object({
  id: leoU32Schema,
  token_id: leoAddressSchema,
  max_transfer: leoU128Schema,
});
export type TsUpdateMaxTransferLeo = z.infer < typeof leoTsUpdateMaxTransferSchema > ;

export interface TsUpdateOutgoingPercentage {
  id: number;
  token_id: string;
  outgoing_percentage: number;
  timeframe: number;
  max_no_cap: bigint;
}

export const leoTsUpdateOutgoingPercentageSchema = z.object({
  id: leoU32Schema,
  token_id: leoAddressSchema,
  outgoing_percentage: leoU16Schema,
  timeframe: leoU32Schema,
  max_no_cap: leoU128Schema,
});
export type TsUpdateOutgoingPercentageLeo = z.infer < typeof leoTsUpdateOutgoingPercentageSchema > ;

export interface HoldingRelease {
  id: number;
  token_id: string;
  connector: string;
  receiver: string;
  amount: bigint;
}

export const leoHoldingReleaseSchema = z.object({
  id: leoU32Schema,
  token_id: leoAddressSchema,
  connector: leoAddressSchema,
  receiver: leoAddressSchema,
  amount: leoU128Schema,
});
export type HoldingReleaseLeo = z.infer < typeof leoHoldingReleaseSchema > ;

export interface ConnectorUpdate {
  id: number;
  token_id: string;
  connector: string;
  new_connector: string;
}

export const leoConnectorUpdateSchema = z.object({
  id: leoU32Schema,
  token_id: leoAddressSchema,
  connector: leoAddressSchema,
  new_connector: leoAddressSchema,
});
export type ConnectorUpdateLeo = z.infer < typeof leoConnectorUpdateSchema > ;

export interface ExternalProposal {
  id: number;
  external_program: string;
  proposal_hash: bigint;
}

export const leoExternalProposalSchema = z.object({
  id: leoU32Schema,
  external_program: leoAddressSchema,
  proposal_hash: leoFieldSchema,
});
export type ExternalProposalLeo = z.infer < typeof leoExternalProposalSchema > ;