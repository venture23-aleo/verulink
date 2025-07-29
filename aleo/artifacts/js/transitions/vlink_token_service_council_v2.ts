import {
  tx
} from "@doko-js/core";
import * as records from "../types/vlink_token_service_council_v2";
import {
  Token_registryRemove_roleTransition,
  Token_registryRegister_tokenTransition,
  Token_registryUpdate_token_managementTransition,
  Token_registrySet_roleTransition
} from "./token_registry";
import {
  Vlink_council_v2External_executeTransition
} from "./vlink_council_v2";
import {
  Vlink_token_service_v2Holding_releaseTransition,
  Vlink_token_service_v2Holding_release_privateTransition,
  Vlink_token_service_v2Transfer_ownership_tsTransition,
  Vlink_token_service_v2Add_token_tsTransition,
  Vlink_token_service_v2Remove_token_tsTransition,
  Vlink_token_service_v2Update_min_transfer_tsTransition,
  Vlink_token_service_v2Update_max_transfer_tsTransition,
  Vlink_token_service_v2Pause_token_tsTransition,
  Vlink_token_service_v2Unpause_token_tsTransition,
  Vlink_token_service_v2Update_withdrawal_limitTransition,
  Vlink_token_service_v2Holding_transfer_ownershipTransition,
  Vlink_token_service_v2Update_other_chain_tokenserviceTransition,
  Vlink_token_service_v2Update_other_chain_tokenaddressTransition,
  Vlink_token_service_v2Add_chain_to_existing_tokenTransition,
  Vlink_token_service_v2Remove_other_chain_addressesTransition,
  Vlink_token_service_v2Update_relayer_feeTransition,
  Vlink_token_service_v2Update_platform_feeTransition
} from "./vlink_token_service_v2";

export type Vlink_token_service_council_v2Remove_roleTransition = tx.ExecutionReceipt < [...Token_registryRemove_roleTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'remove_role' > ,
  ] >
  export type Vlink_token_service_council_v2Holding_releaseTransition = tx.ExecutionReceipt < [...Vlink_token_service_v2Holding_releaseTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'holding_release' > ,
  ] >
  export type Vlink_token_service_council_v2Holding_release_privateTransition = tx.ExecutionReceipt < [...Vlink_token_service_v2Holding_release_privateTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.ExternalRecordOutput, tx.FutureOutput], 'vlink_token_service_council_v2', 'holding_release_private' > ,
  ] >
  export type Vlink_token_service_council_v2Ts_transfer_ownershipTransition = tx.ExecutionReceipt < [...Vlink_token_service_v2Transfer_ownership_tsTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'ts_transfer_ownership' > ,
  ] >
  export type Vlink_token_service_council_v2Ts_add_tokenTransition = tx.ExecutionReceipt < [...Vlink_token_service_v2Add_token_tsTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'ts_add_token' > ,
  ] >
  export type Vlink_token_service_council_v2Ts_remove_tokenTransition = tx.ExecutionReceipt < [...Vlink_token_service_v2Remove_token_tsTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'ts_remove_token' > ,
  ] >
  export type Vlink_token_service_council_v2Ts_update_max_min_transferTransition = tx.ExecutionReceipt < [...Vlink_token_service_v2Update_min_transfer_tsTransition['execution']['transitions'],
    ...Vlink_token_service_v2Update_max_transfer_tsTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'ts_update_max_min_transfer' > ,
  ] >
  export type Vlink_token_service_council_v2Ts_pause_tokenTransition = tx.ExecutionReceipt < [...Vlink_token_service_v2Pause_token_tsTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'ts_pause_token' > ,
  ] >
  export type Vlink_token_service_council_v2Ts_unpause_tokenTransition = tx.ExecutionReceipt < [...Vlink_token_service_v2Unpause_token_tsTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'ts_unpause_token' > ,
  ] >
  export type Vlink_token_service_council_v2Ts_update_outgoing_percentageTransition = tx.ExecutionReceipt < [...Vlink_token_service_v2Update_withdrawal_limitTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'ts_update_outgoing_percentage' > ,
  ] >
  export type Vlink_token_service_council_v2Holding_ownership_transferTransition = tx.ExecutionReceipt < [...Vlink_token_service_v2Holding_transfer_ownershipTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'holding_ownership_transfer' > ,
  ] >
  export type Vlink_token_service_council_v2Ts_register_tokenTransition = tx.ExecutionReceipt < [...Token_registryRegister_tokenTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'ts_register_token' > ,
  ] >
  export type Vlink_token_service_council_v2Update_token_metadataTransition = tx.ExecutionReceipt < [...Token_registryUpdate_token_managementTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'update_token_metadata' > ,
  ] >
  export type Vlink_token_service_council_v2Set_role_tokenTransition = tx.ExecutionReceipt < [...Token_registrySet_roleTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'set_role_token' > ,
  ] >
  export type Vlink_token_service_council_v2Ts_update_token_service_settingTransition = tx.ExecutionReceipt < [...Vlink_token_service_v2Update_other_chain_tokenserviceTransition['execution']['transitions'],
    ...Vlink_token_service_v2Update_other_chain_tokenaddressTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'ts_update_token_service_setting' > ,
  ] >
  export type Vlink_token_service_council_v2Ts_add_chain_to_existing_tokenTransition = tx.ExecutionReceipt < [...Vlink_token_service_v2Add_chain_to_existing_tokenTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'ts_add_chain_to_existing_token' > ,
  ] >
  export type Vlink_token_service_council_v2Ts_remove_other_chain_addressesTransition = tx.ExecutionReceipt < [...Vlink_token_service_v2Remove_other_chain_addressesTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'ts_remove_other_chain_addresses' > ,
  ] >
  export type Vlink_token_service_council_v2Ts_update_feesTransition = tx.ExecutionReceipt < [...Vlink_token_service_v2Update_relayer_feeTransition['execution']['transitions'],
    ...Vlink_token_service_v2Update_platform_feeTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_token_service_council_v2', 'ts_update_fees' > ,
  ] >