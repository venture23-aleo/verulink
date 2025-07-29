import {
  tx
} from "@doko-js/core";
import * as records from "../types/vlink_token_bridge_v2";


export type Vlink_token_bridge_v2Initialize_tbTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_bridge_v2', 'initialize_tb' > , ] >
  export type Vlink_token_bridge_v2Transfer_ownership_tbTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_bridge_v2', 'transfer_ownership_tb' > , ] >
  export type Vlink_token_bridge_v2Add_attestor_tbTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_bridge_v2', 'add_attestor_tb' > , ] >
  export type Vlink_token_bridge_v2Remove_attestor_tbTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_bridge_v2', 'remove_attestor_tb' > , ] >
  export type Vlink_token_bridge_v2Update_threshold_tbTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_bridge_v2', 'update_threshold_tb' > , ] >
  export type Vlink_token_bridge_v2Add_chain_tbTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_bridge_v2', 'add_chain_tb' > , ] >
  export type Vlink_token_bridge_v2Remove_chain_tbTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_bridge_v2', 'remove_chain_tb' > , ] >
  export type Vlink_token_bridge_v2Add_service_tbTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_bridge_v2', 'add_service_tb' > , ] >
  export type Vlink_token_bridge_v2Remove_service_tbTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_bridge_v2', 'remove_service_tb' > , ] >
  export type Vlink_token_bridge_v2Pause_tbTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_bridge_v2', 'pause_tb' > , ] >
  export type Vlink_token_bridge_v2Unpause_tbTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_bridge_v2', 'unpause_tb' > , ] >
  export type Vlink_token_bridge_v2PublishTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_token_bridge_v2', 'publish' > , ] >
  export type Vlink_token_bridge_v2ConsumeTransition = tx.ExecutionReceipt < [tx.Transition < [tx.PublicOutput, tx.FutureOutput], 'vlink_token_bridge_v2', 'consume' > , ] >