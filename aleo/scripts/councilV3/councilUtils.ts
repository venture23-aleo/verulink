import { hashStruct } from "../../utils/hash";

import { Council_v0003Contract } from "../../artifacts/js/council_v0003";
import { COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_MEMBERS_INDEX } from "../../utils/constants";


const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});

export const validateProposer = async (proposer: string) => {
  const isMember = await council.members(proposer, false);
  if (!isMember) {
    throw Error(`${proposer} is not a valid council member`);
  }
};



export const validateExecution = async (proposalHash: bigint) => {
  const proposalAlreadyExecuted = await council.proposal_executed(proposalHash, false);
  if (proposalAlreadyExecuted) {
    throw Error(`Proposal has already been executed`);
  }

}
