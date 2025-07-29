import {
  tx
} from "@doko-js/core";
import * as records from "../types/vlink_token_service_v2";
import {
  Token_registryBurn_publicTransition,
  Token_registryMint_publicTransition,
  Token_registryBurn_privateTransition,
  Token_registryMint_privateTransition
} from "./token_registry";
import {
  Vlink_token_bridge_v2PublishTransition,
  Vlink_token_bridge_v2ConsumeTransition
} from "./vlink_token_bridge_v2";
import {
  Vlink_holding_v2Hold_fundTransition,
  Vlink_holding_v2Release_fundTransition,
  Vlink_holding_v2Release_fund_privateTransition,
  Vlink_holding_v2Transfer_ownership_holdingTransition
} from "./vlink_holding_v2";

export type Vlink_token_service_v2Initialize_tsTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'initialize_ts' > , ] >
  export type Vlink_token_service_v2Transfer_ownership_tsTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'transfer_ownership_ts' > , ] >
  export type Vlink_token_service_v2Update_other_chain_tokenserviceTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'update_other_chain_tokenservice' > , ] >
  export type Vlink_token_service_v2Update_other_chain_tokenaddressTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'update_other_chain_tokenaddress' > , ] >
  export type Vlink_token_service_v2Remove_other_chain_addressesTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'remove_other_chain_addresses' > , ] >
  export type Vlink_token_service_v2Add_token_tsTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'add_token_ts' > , ] >
  export type Vlink_token_service_v2Remove_token_tsTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'remove_token_ts' > , ] >
  export type Vlink_token_service_v2Pause_token_tsTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'pause_token_ts' > , ] >
  export type Vlink_token_service_v2Unpause_token_tsTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'unpause_token_ts' > , ] >
  export type Vlink_token_service_v2Update_min_transfer_tsTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'update_min_transfer_ts' > , ] >
  export type Vlink_token_service_v2Update_max_transfer_tsTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'update_max_transfer_ts' > , ] >
  export type Vlink_token_service_v2Update_withdrawal_limitTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'update_withdrawal_limit' > , ] >
  export type Vlink_token_service_v2Token_send_publicTransition = tx.ExecutionReceipt < [...Token_registryBurn_publicTransition['execution']['transitions'],
    ...Token_registryMint_publicTransition['execution']['transitions'],
    ...Vlink_token_bridge_v2PublishTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'token_send_public' > ,
  ] >
  export type Vlink_token_service_v2Token_send_privateTransition = tx.ExecutionReceipt < [...Token_registryBurn_privateTransition['execution']['transitions'],
    ...Token_registryMint_publicTransition['execution']['transitions'],
    ...Vlink_token_bridge_v2PublishTransition['execution']['transitions'],
    tx.Transition < [tx.ExternalRecordOutput, tx.FutureOutput], 'vlink_token_service_v2', 'token_send_private' > ,
  ] >
  export type Vlink_token_service_v2Token_receive_publicTransition = tx.ExecutionReceipt < [...Vlink_token_bridge_v2ConsumeTransition['execution']['transitions'],
    ...Token_registryMint_publicTransition['execution']['transitions'],
    ...Token_registryMint_publicTransition['execution']['transitions'],
    ...Vlink_holding_v2Hold_fundTransition['execution']['transitions'],
    tx.Transition < [tx.PublicOutput, tx.FutureOutput], 'vlink_token_service_v2', 'token_receive_public' > ,
  ] >
  export type Vlink_token_service_v2Token_receive_privateTransition = tx.ExecutionReceipt < [...Vlink_token_bridge_v2ConsumeTransition['execution']['transitions'],
    ...Token_registryMint_privateTransition['execution']['transitions'],
    ...Token_registryMint_privateTransition['execution']['transitions'],
    ...Vlink_holding_v2Hold_fundTransition['execution']['transitions'],
    tx.Transition < [tx.PublicOutput, tx.ExternalRecordOutput, tx.ExternalRecordOutput, tx.FutureOutput], 'vlink_token_service_v2', 'token_receive_private' > ,
  ] >
  export type Vlink_token_service_v2Add_chain_to_existing_tokenTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'add_chain_to_existing_token' > , ] >
  export type Vlink_token_service_v2Holding_releaseTransition = tx.ExecutionReceipt < [...Vlink_holding_v2Release_fundTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'holding_release' > ,
  ] >
  export type Vlink_token_service_v2Holding_release_privateTransition = tx.ExecutionReceipt < [...Vlink_holding_v2Release_fund_privateTransition['execution']['transitions'],
    tx.Transition < [tx.ExternalRecordOutput, tx.FutureOutput], 'vlink_token_service_v2', 'holding_release_private' > ,
  ] >
  export type Vlink_token_service_v2Holding_transfer_ownershipTransition = tx.ExecutionReceipt < [...Vlink_holding_v2Transfer_ownership_holdingTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'holding_transfer_ownership' > ,
  ] >
  export type Vlink_token_service_v2Update_platform_feeTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'update_platform_fee' > , ] >
  export type Vlink_token_service_v2Update_relayer_feeTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_service_v2', 'update_relayer_fee' > , ] >