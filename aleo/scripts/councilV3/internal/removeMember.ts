import { hashStruct } from "../../../utils/hash";

import { Council_v0003Contract } from "../../../artifacts/js/council_v0003";
import { COUNCIL_TOTAL_PROPOSALS_INDEX } from "../../../utils/constants";
import { validateExecution, validateProposer } from "../councilUtils";
import { RemoveMember } from "../../../artifacts/js/types/council_v0003";
import { getRemoveMemberLeo } from "../../../artifacts/js/js2leo/council_v0003";


const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});

//////////////////////
///// Propose ////////
//////////////////////
export const proposeRemoveMember = async (member: string, new_threshold: number): Promise<number> => {

  console.log(`👍 Proposing to remove council Member: ${member}`)
  const isMember = await council.members(member, false);
  if (!isMember) {
    throw Error(`${member} is not council memeber!`);
  }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const removeMemeberProposal: RemoveMember = {
    id: proposalId,
    existing_member: member,
    new_threshold: new_threshold,
  };
  const removeProposalHash = hashStruct(getRemoveMemberLeo(removeMemeberProposal));

  const [removeMemberTx] = await council.propose(proposalId, removeProposalHash);
  await council.wait(removeMemberTx);

  return proposalId
};


//////////////////////
///// Execute ////////
//////////////////////
export const execRemoveMember = async (proposalId: number, member: string, new_threshold: number, signers: string[], signs: string[]) => {

    console.log(`👍executing to remove council Member: ${member}`)
    const isMember = await council.members(member, false);
    if (!isMember) {
      throw Error(`${member} is not council memeber!`);
    }

    const removeProposalHash = await council.proposals(proposalId);
    validateExecution(removeProposalHash);

    const [removeMemeberExecTx] = await council.remove_member(proposalId, member, new_threshold, signers, signs);
    await council.wait(removeMemeberExecTx);

    const isMemberRemoved = await council.members(member, false);
    if (isMemberRemoved) {
        throw Error(`❌ Unknown error.`);
    }

    console.log(` ✅ Member: ${member} removed successfully.`)
}