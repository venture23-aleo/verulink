import {
  TbAddAttestor,
} from "../artifacts/js/types";
import { hashStruct } from "../utils/utils";

import * as js2leo from "../artifacts/js/js2leo";

import {
  TOTAL_PROPOSALS_INDEX, councilProgramAddr,
} from "./data/testnet.data";
import { Token_bridge_v0001Contract } from "../artifacts/js/token_bridge_v0001";
import { Council_v0001Contract } from "../artifacts/js/council_v0001";
import { THRESHOLD_INDEX, TOTAL_ATTESTORS_INDEX } from "../test/mockData";

const setup = async () => {
  const bridge = new Token_bridge_v0001Contract({
    mode: "execute",
    priorityFee: 10_000,
  });
  const council = new Council_v0001Contract({
    mode: "execute",
    priorityFee: 10_000,
  });

  const newAttestorAddress = "aleo1sfgaysqchded39ge2pk3prk92k267yd5qgc93wgeqh77njfx6v8syd6vfc"
  const newThreshold = 1;
  
  const currentThreshold = await bridge.attestor_settings(THRESHOLD_INDEX);
  const currentTotalAttestors = await bridge.attestor_settings(TOTAL_ATTESTORS_INDEX);  
  const currentOwner = await bridge.owner_TB(true);
  console.log(currentOwner)
  console.log(councilProgramAddr)

  console.log("Current Threshold", currentThreshold)
  console.log("Current Total Attestors", currentTotalAttestors)


  const proposalId =
    parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const addAttestor: TbAddAttestor = {
    id: proposalId,
    new_attestor: newAttestorAddress,
    new_threshold: newThreshold,
  };
  const addAttestorHash = hashStruct(js2leo.getTbAddAttestorLeo(addAttestor));

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
  const updatedThreshold = await bridge.attestor_settings(THRESHOLD_INDEX)
  const updatedTotalAttestors = await bridge.attestor_settings(TOTAL_ATTESTORS_INDEX)

  console.log("Proposal Executed", isProposalExecuted)
  console.log("Attestor Added", isAttestor)
  console.log(`Threshold: ${currentThreshold} -> ${updatedThreshold}`)
  console.log(`Total Attestors: ${currentTotalAttestors} -> ${updatedTotalAttestors}`)

};

setup();
