import {
  tx
} from "@doko-js/core";
import * as records from "../types/vlink_council_v2";
import {
  Token_registryTransfer_publicTransition
} from "./token_registry";

export type Vlink_council_v2InitializeTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_council_v2', 'initialize' > , ] >
  export type Vlink_council_v2ProposeTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_council_v2', 'propose' > , ] >
  export type Vlink_council_v2VoteTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_council_v2', 'vote' > , ] >
  export type Vlink_council_v2Update_voteTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_council_v2', 'update_vote' > , ] >
  export type Vlink_council_v2Add_memberTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_council_v2', 'add_member' > , ] >
  export type Vlink_council_v2Remove_memberTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_council_v2', 'remove_member' > , ] >
  export type Vlink_council_v2Withdraw_feesTransition = tx.ExecutionReceipt < [...Token_registryTransfer_publicTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_council_v2', 'withdraw_fees' > ,
  ] >
  export type Vlink_council_v2Update_thresholdTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_council_v2', 'update_threshold' > , ] >
  export type Vlink_council_v2External_executeTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_council_v2', 'external_execute' > , ] >