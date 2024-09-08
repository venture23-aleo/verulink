import { hashStruct } from "../../../utils/hash";
import { Council_dev_v2Contract } from "../../../artifacts/js/council_dev_v2";
import { ALEO_ZERO_ADDRESS, COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD, ethChainId, usdcContractAddr } from "../../../utils/constants";
import { Token_service_dev_v2Contract } from "../../../artifacts/js/token_service_dev_v2";
import { getProposalStatus, validateExecution, validateProposer, validateVote } from "../councilUtils";
import { SetRoleForToken } from "../../../artifacts/js/types/token_service_council_dev_v2";
import { getSetRoleForTokenLeo, getTsAddTokenLeo } from "../../../artifacts/js/js2leo/token_service_council_dev_v2";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../../utils/voters";
import { ExecutionMode } from "@doko-js/core";

import { Token_service_council_dev_v2Contract } from "../../../artifacts/js/token_service_council_dev_v2";
import { hash } from "aleo-hasher";
import { evm2AleoArr, evm2AleoArrWithoutPadding } from "../../../utils/ethAddress";
import { getSetRoleForToken } from "../../../artifacts/js/leo2js/token_service_council_dev_v2";

const mode = ExecutionMode.SnarkExecute;
const serviceCouncil = new Token_service_council_dev_v2Contract({ mode, priorityFee: 10_000 });

const council = new Council_dev_v2Contract({ mode, priorityFee: 10_000 });
const tokenService = new Token_service_dev_v2Contract({ mode, priorityFee: 10_000 });

//////////////////////
///// Propose ////////
//////////////////////
export const proposeRole = async (
  tokenId: bigint,
  role: number
): Promise<number> => {

  
  console.log(`👍 Proposing to add role: ${tokenId}`)
  // const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  // if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
  //   throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
  // }

  const proposer = council.getAccounts()[0];
  validateProposer(proposer);

  const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tsSetRole: SetRoleForToken = {
      id: proposalId,
      token_id: tokenId,
      account: tokenService.address(),
      role: role
  };
  const tsSetRoleProposalHash = hashStruct(getSetRoleForTokenLeo(tsSetRole));

  const [proposeSetRoleTx] = await council.propose(proposalId, tsSetRoleProposalHash);

  await council.wait(proposeSetRoleTx);

  getProposalStatus(tsSetRoleProposalHash);
  return proposalId
};

///////////////////
///// Vote ////////
///////////////////
export const voteRole = async (
  proposalId: number,
  tokenId: bigint,
  role: number
) => {
  console.log(`👍 Voting to add token: ${tokenId}`)
  // const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  // if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
  //   throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
  // }

  const voter = council.getAccounts()[0];
  const tsSetRole: SetRoleForToken = {
    id: proposalId,
    token_id: tokenId,
    account: tokenService.address(),
    role: role
  };
  const tsSetRoleProposalHash = hashStruct(getSetRoleForTokenLeo(tsSetRole));

  validateVote(tsSetRoleProposalHash, voter);

  const [voteSetRoleTx] = await council.vote(tsSetRoleProposalHash, true);

  await council.wait(voteSetRoleTx);

  getProposalStatus(tsSetRoleProposalHash);

}

//////////////////////
///// Execute ////////
//////////////////////
export const execRole = async (
  //token_name
  proposalId: number,
  tokenId: bigint,
  role: number
) => {
  console.log(`Adding token ${tokenId}`)
  // const storedTokenConnector = await tokenService.token_connectors(tokenAddress, ALEO_ZERO_ADDRESS);
  // if (storedTokenConnector != ALEO_ZERO_ADDRESS) {
  //   throw Error(`Token ${tokenAddress} is already supported with ${tokenConnector} as connector`);
  // }

  const tokenServiceOwner = await tokenService.owner_TS(true);
  if (tokenServiceOwner != serviceCouncil.address()) {
    throw Error("Council is not the owner of tokenService program");
  }

  const tsSetRole: SetRoleForToken = {
    id: proposalId,
    token_id: tokenId,
    account: tokenService.address(),
    role: role
  };
  const tsSetRoleProposalHash = hashStruct(getSetRoleForTokenLeo(tsSetRole));


  validateExecution(tsSetRoleProposalHash);

  const voters = padWithZeroAddress(await getVotersWithYesVotes(tsSetRoleProposalHash), SUPPORTED_THRESHOLD);
  const [setRoleTx] = await serviceCouncil.set_role_token(
    proposalId,
    tokenId, 
    tokenService.address(),
    role,
    voters
  )

  await serviceCouncil.wait(setRoleTx);

  // const updatedConnector = await tokenService.token_connectors(tokenAddress);
  // if (updatedConnector != tokenConnector) {
  //   throw Error(`❌ Unknown error.`);
  // }

  console.log(` ✅ Token: ${tokenId} has successfully been assigned minter/burner role.`)

}