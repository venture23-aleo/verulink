import {
  tx
} from "@doko-js/core";
import * as records from "../types/vlink_holding_v2";
import {
  Token_registryTransfer_publicTransition,
  Token_registryTransfer_public_to_privateTransition
} from "./token_registry";

export type Vlink_holding_v2Initialize_holdingTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_holding_v2', 'initialize_holding' > , ] >
  export type Vlink_holding_v2Transfer_ownership_holdingTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_holding_v2', 'transfer_ownership_holding' > , ] >
  export type Vlink_holding_v2Hold_fundTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'vlink_holding_v2', 'hold_fund' > , ] >
  export type Vlink_holding_v2Release_fundTransition = tx.ExecutionReceipt < [...Token_registryTransfer_publicTransition['execution']['transitions'],
    tx.Transition < [tx.FutureOutput], 'vlink_holding_v2', 'release_fund' > ,
  ] >
  export type Vlink_holding_v2Release_fund_privateTransition = tx.ExecutionReceipt < [...Token_registryTransfer_public_to_privateTransition['execution']['transitions'],
    tx.Transition < [tx.ExternalRecordOutput, tx.FutureOutput], 'vlink_holding_v2', 'release_fund_private' > ,
  ] >