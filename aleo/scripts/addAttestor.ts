import { hashStruct } from "../utils/hash";

import { Token_bridge_v0003Contract } from "../artifacts/js/token_bridge_v0003";
import { Council_v0003Contract } from "../artifacts/js/council_v0003";
import { BRIDGE_THRESHOLD_INDEX, BRIDGE_TOTAL_ATTESTORS_INDEX, COUNCIL_TOTAL_PROPOSALS_INDEX } from "../utils/constants";
import { TbAddAttestor } from "../artifacts/js/types/council_v0003";
import { getTbAddAttestorLeo } from "../artifacts/js/js2leo/council_v0003";

const addAttestor = async (newAttestorAddress: string, newThreshold: number) => {
  const bridge = new Token_bridge_v0003Contract({
    mode: "execute",
    priorityFee: 10_000,
  });
  const council = new Council_v0003Contract({
    mode: "execute",
    priorityFee: 10_000,
  });

  const currentThreshold = await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX);
  const currentTotalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);  
  const currentOwner = await bridge.owner_TB(true);
  console.log(currentOwner)
  console.log(council.address())

  console.log("Current Threshold", currentThreshold)
  console.log("Current Total Attestors", currentTotalAttestors)

  const proposalId =
    parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const addAttestor: TbAddAttestor = {
    id: proposalId,
    new_attestor: newAttestorAddress,
    new_threshold: newThreshold,
  };
  const addAttestorHash = hashStruct(getTbAddAttestorLeo(addAttestor));

  // propose to add attestor
  const addAttestorProposalTx = await council.propose(proposalId, addAttestorHash);
  
  // @ts-ignore
  await addAttestorProposalTx.wait();

  // execute to add attestor
  const addAttestorTx = await council.tb_add_attestor(
    proposalId,
    newAttestorAddress,
    newThreshold
  );
  
  // @ts-ignore
  await addAttestorTx.wait();

  const isProposalExecuted = await council.proposal_executed(addAttestorHash)
  const isAttestor = await bridge.attestors(newAttestorAddress)
  const updatedThreshold = await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX)
  const updatedTotalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX)

  console.log("Proposal Executed", isProposalExecuted)
  console.log("Attestor Added", isAttestor)
  console.log(`Threshold: ${currentThreshold} -> ${updatedThreshold}`)
  console.log(`Total Attestors: ${currentTotalAttestors} -> ${updatedTotalAttestors}`)
};

addAttestor(
  "aleo1zgyyxkjxadc4y7aks4rscmz6sq59wljrjckuwgrwsx034uxkkuyqmtjdw7", // Address of the new attestor
  1 // Updated threshold
);