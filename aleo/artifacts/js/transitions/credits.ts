import {
  tx
} from "@doko-js/core";
import * as records from "../types/credits";


export type CreditsBond_validatorTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'credits', 'bond_validator' > , ] >
  export type CreditsBond_publicTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'credits', 'bond_public' > , ] >
  export type CreditsUnbond_publicTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'credits', 'unbond_public' > , ] >
  export type CreditsClaim_unbond_publicTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'credits', 'claim_unbond_public' > , ] >
  export type CreditsSet_validator_stateTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'credits', 'set_validator_state' > , ] >
  export type CreditsTransfer_publicTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'credits', 'transfer_public' > , ] >
  export type CreditsTransfer_public_as_signerTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'credits', 'transfer_public_as_signer' > , ] >
  export type CreditsTransfer_privateTransition = tx.ExecutionReceipt < [tx.Transition < [tx.RecordOutput < records.credits > , tx.RecordOutput < records.credits > ], 'credits', 'transfer_private' > , ] >
  export type CreditsTransfer_private_to_publicTransition = tx.ExecutionReceipt < [tx.Transition < [tx.RecordOutput < records.credits > , tx.FutureOutput], 'credits', 'transfer_private_to_public' > , ] >
  export type CreditsTransfer_public_to_privateTransition = tx.ExecutionReceipt < [tx.Transition < [tx.RecordOutput < records.credits > , tx.FutureOutput], 'credits', 'transfer_public_to_private' > , ] >
  export type CreditsJoinTransition = tx.ExecutionReceipt < [tx.Transition < [tx.RecordOutput < records.credits > ], 'credits', 'join' > , ] >
  export type CreditsSplitTransition = tx.ExecutionReceipt < [tx.Transition < [tx.RecordOutput < records.credits > , tx.RecordOutput < records.credits > ], 'credits', 'split' > , ] >
  export type CreditsFee_privateTransition = tx.ExecutionReceipt < [tx.Transition < [tx.RecordOutput < records.credits > ], 'credits', 'fee_private' > , ] >
  export type CreditsFee_publicTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'credits', 'fee_public' > , ] >