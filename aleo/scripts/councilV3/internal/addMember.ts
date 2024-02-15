import { hashStruct } from "../../../utils/hash";

import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { validateExecution, validateProposer } from "../councilUtils";
import { AddMember } from "../../../artifacts/js/types/council_v0003";
import { getAddMemberLeo } from "../../../artifacts/js/js2leo/council_v0003";


const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposeAddMember = async (member: string, new_threshold: number): Promise<number> => {

  console.log(`👍 Proposing to add council Member: ${member}`)
  const isMember = await council.members(member, false);
  if (isMember) {
    throw Error(`${member} is already council memeber!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const addMemeberProposal: AddMember = {
    id: proposalId,
    new_member: member,
    new_threshold: new_threshold,
  };
  const addProposalHash = hashStruct(getAddMemberLeo(addMemeberProposal));

  const [addMemberTx] = await council.propose(proposalId, addProposalHash);
  await council.wait(addMemberTx);

  return proposalId
};


//////////////////////
///// Execute ////////
//////////////////////
export const execAddMember = async (proposalId: number, member: string, new_threshold: number, signers: string[], signs: string[]) => {

    console.log(`👍executing to add council Member: ${member}`)
    const isMember = await council.members(member, false);
    if (isMember) {
      throw Error(`${member} is not council memeber!`);
    }

    const addProposalHash = await council.proposals(proposalId);
    validateExecution(addProposalHash);

    const [addMemeberExecTx] = await council.add_member(proposalId, member, new_threshold, signers, signs);
    await council.wait(addMemeberExecTx);

    const isMemberAdded = await council.members(member, false);
    if (!isMemberAdded) {
        throw Error(`❌ Unknown error.`);
    }

    console.log(` ✅ Member: ${member} added successfully.`)
}