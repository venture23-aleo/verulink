import {
  tx
} from "@doko-js/core";
import * as records from "../types/vlink_bridge_council_v2";
import {
  Vlink_token_bridge_v2Transfer_ownership_tbTransition,
  Vlink_token_bridge_v2Add_attestor_tbTransition,
  Vlink_token_bridge_v2Remove_attestor_tbTransition,
  Vlink_token_bridge_v2Update_threshold_tbTransition,
  Vlink_token_bridge_v2Add_chain_tbTransition,
  Vlink_token_bridge_v2Remove_chain_tbTransition,
  Vlink_token_bridge_v2Add_service_tbTransition,
  Vlink_token_bridge_v2Remove_service_tbTransition,
  Vlink_token_bridge_v2Pause_tbTransition,
  Vlink_token_bridge_v2Unpause_tbTransition
} from "./vlink_token_bridge_v2";
import {
  Vlink_council_v2External_executeTransition
} from "./vlink_council_v2";

export type Vlink_bridge_council_v2Tb_transfer_ownershipTransition = tx.ExecutionReceipt < [...Vlink_token_bridge_v2Transfer_ownership_tbTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_bridge_council_v2', 'tb_transfer_ownership' > ,
  ] >
  export type Vlink_bridge_council_v2Tb_add_attestorTransition = tx.ExecutionReceipt < [...Vlink_token_bridge_v2Add_attestor_tbTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_bridge_council_v2', 'tb_add_attestor' > ,
  ] >
  export type Vlink_bridge_council_v2Tb_remove_attestorTransition = tx.ExecutionReceipt < [...Vlink_token_bridge_v2Remove_attestor_tbTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_bridge_council_v2', 'tb_remove_attestor' > ,
  ] >
  export type Vlink_bridge_council_v2Tb_update_thresholdTransition = tx.ExecutionReceipt < [...Vlink_token_bridge_v2Update_threshold_tbTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_bridge_council_v2', 'tb_update_threshold' > ,
  ] >
  export type Vlink_bridge_council_v2Tb_add_chainTransition = tx.ExecutionReceipt < [...Vlink_token_bridge_v2Add_chain_tbTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_bridge_council_v2', 'tb_add_chain' > ,
  ] >
  export type Vlink_bridge_council_v2Tb_remove_chainTransition = tx.ExecutionReceipt < [...Vlink_token_bridge_v2Remove_chain_tbTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_bridge_council_v2', 'tb_remove_chain' > ,
  ] >
  export type Vlink_bridge_council_v2Tb_add_serviceTransition = tx.ExecutionReceipt < [...Vlink_token_bridge_v2Add_service_tbTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_bridge_council_v2', 'tb_add_service' > ,
  ] >
  export type Vlink_bridge_council_v2Tb_remove_serviceTransition = tx.ExecutionReceipt < [...Vlink_token_bridge_v2Remove_service_tbTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_bridge_council_v2', 'tb_remove_service' > ,
  ] >
  export type Vlink_bridge_council_v2Tb_pauseTransition = tx.ExecutionReceipt < [...Vlink_token_bridge_v2Pause_tbTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_bridge_council_v2', 'tb_pause' > ,
  ] >
  export type Vlink_bridge_council_v2Tb_unpauseTransition = tx.ExecutionReceipt < [...Vlink_token_bridge_v2Unpause_tbTransition['execution']['transitions'],
    ...Vlink_council_v2External_executeTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_bridge_council_v2', 'tb_unpause' > ,
  ] >