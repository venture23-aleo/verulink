import { BridgeContract } from "../artifacts/js/bridge";
import { CouncilContract } from "../artifacts/js/council";
import { Token_serviceContract } from "../artifacts/js/token_service";
import { Wrapped_tokenContract } from "../artifacts/js/wrapped_token";

const setup = async () => {
  const bridge = new BridgeContract();
  const tokenService = new Token_serviceContract();
  const wrappedToken = new Wrapped_tokenContract();
  const council = new CouncilContract();

  // Before running any transaction
  //
  // 1. make sure that the transaction can be built, one can dry run the transaction first.
  // This can be done by setting `--dry-run` in `snarkos developer deploy/execute` command.
  // Example: Instead of:
  // snarkos developer deploy bridge.aleo --private-key $PRIVATE_KEY --query $QUERY_API --broadcast $BROADCAST_ENDPOINT --priority-fee 1000
  // Try
  // snarkos developer deploy bridge.aleo --private-key $PRIVATE_KEY --query $QUERY_API --dry-run $BROADCAST_ENDPOINT
  // 
  // 2. Make sure there is enough credits in the account to cover for the cost
  // This can be done by either querying the balance in credits.aleo program (public balance) or checking the private balance
  // For now let's just go with public balance.
  // 
  // 3. Once the above checks are finalized maybe directly broadcast the transaction object generated at step 1 to the $BROADCAST_ENDPOINT
  let tx;

  // The following is resolved once the txId is generated
  tx = await bridge.deploy();
  // This broadcasts the transaction
  tx.broadcast();
  // The following is resolved once the transaction is included in the ledger
  await tx.wait();

  // Maybe add the option to chain it as following
  tx = await tokenService.deploy().broadcast();
  await tx.wait();

  tx = await wrappedToken.deploy().broadcast();
  await tx.wait();

  tx = await council.deploy().broadcast();
  tx.broadcast();
  await tx.wait()

  // Initialize council program with a single council member and 1/5 threshold
  const councilMember = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px"
  const councilThreshold = 1
  tx = await council.initialize(
    councilMember,
    councilMember,
    councilMember,
    councilMember,
    councilMember,
    councilThreshold
  )
  tx.broadcast()
  tx.wait()

  

};
