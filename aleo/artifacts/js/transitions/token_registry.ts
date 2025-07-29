import {
  tx
} from "@doko-js/core";
import * as records from "../types/token_registry";


export type Token_registryTransfer_publicTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'token_registry', 'transfer_public' > , ] >
  export type Token_registryTransfer_public_as_signerTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'token_registry', 'transfer_public_as_signer' > , ] >
  export type Token_registryTransfer_privateTransition = tx.ExecutionReceipt < [tx.Transition < [tx.RecordOutput < records.Token > , tx.RecordOutput < records.Token > , tx.FutureOutput], 'token_registry', 'transfer_private' > , ] >
  export type Token_registryTransfer_private_to_publicTransition = tx.ExecutionReceipt < [tx.Transition < [tx.RecordOutput < records.Token > , tx.FutureOutput], 'token_registry', 'transfer_private_to_public' > , ] >
  export type Token_registryTransfer_public_to_privateTransition = tx.ExecutionReceipt < [tx.Transition < [tx.RecordOutput < records.Token > , tx.FutureOutput], 'token_registry', 'transfer_public_to_private' > , ] >
  export type Token_registryJoinTransition = tx.ExecutionReceipt < [tx.Transition < [tx.RecordOutput < records.Token > ], 'token_registry', 'join' > , ] >
  export type Token_registrySplitTransition = tx.ExecutionReceipt < [tx.Transition < [tx.RecordOutput < records.Token > , tx.RecordOutput < records.Token > ], 'token_registry', 'split' > , ] >
  export type Token_registryInitializeTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'token_registry', 'initialize' > , ] >
  export type Token_registryRegister_tokenTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'token_registry', 'register_token' > , ] >
  export type Token_registryUpdate_token_managementTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'token_registry', 'update_token_management' > , ] >
  export type Token_registrySet_roleTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'token_registry', 'set_role' > , ] >
  export type Token_registryRemove_roleTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'token_registry', 'remove_role' > , ] >
  export type Token_registryMint_publicTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'token_registry', 'mint_public' > , ] >
  export type Token_registryMint_privateTransition = tx.ExecutionReceipt < [tx.Transition < [tx.RecordOutput < records.Token > , tx.FutureOutput], 'token_registry', 'mint_private' > , ] >
  export type Token_registryBurn_publicTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'token_registry', 'burn_public' > , ] >
  export type Token_registryBurn_privateTransition = tx.ExecutionReceipt < [tx.Transition < [tx.RecordOutput < records.Token > , tx.FutureOutput], 'token_registry', 'burn_private' > , ] >
  export type Token_registryPrehook_publicTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'token_registry', 'prehook_public' > , ] >
  export type Token_registryPrehook_privateTransition = tx.ExecutionReceipt < [tx.Transition < [tx.RecordOutput < records.Token > , tx.RecordOutput < records.Token > , tx.FutureOutput], 'token_registry', 'prehook_private' > , ] >
  export type Token_registryApprove_publicTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'token_registry', 'approve_public' > , ] >
  export type Token_registryUnapprove_publicTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'token_registry', 'unapprove_public' > , ] >
  export type Token_registryTransfer_from_publicTransition = tx.ExecutionReceipt < [tx.Transition < [tx.FutureOutput], 'token_registry', 'transfer_from_public' > , ] >
  export type Token_registryTransfer_from_public_to_privateTransition = tx.ExecutionReceipt < [tx.Transition < [tx.RecordOutput < records.Token > , tx.FutureOutput], 'token_registry', 'transfer_from_public_to_private' > , ] >