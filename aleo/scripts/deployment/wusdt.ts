import { ExecutionMode } from "@doko-js/core";
import { Token_service_dev_v2Contract } from "../../artifacts/js/token_service_dev_v2";
import { Council_dev_v2Contract } from "../../artifacts/js/council_dev_v2";
import { getRegisterToken } from "../../artifacts/js/leo2js/token_service_council_dev_v2";
import { hashStruct } from "../../utils/hash";
import { RegisterToken, RegisterTokenLeo } from "../../artifacts/js/types/token_service_council_dev_v2";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../utils/constants";
import { Token_service_council_dev_v2Contract } from "../../artifacts/js/token_service_council_dev_v2";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../utils/voters";
import { getRegisterTokenLeo } from "../../artifacts/js/js2leo/token_service_council_dev_v2";

const mode = ExecutionMode.SnarkExecute;
export const deployWusdt = async (token_name, symbol, decimals, max_supply) => {

  const tokenService = new Token_service_dev_v2Contract({ mode, priorityFee: 10_000 });
  const tokenServiceCouncil = new Token_service_council_dev_v2Contract({ mode, priorityFee: 10_000 })
  const council = new Council_dev_v2Contract({ mode, priorityFee: 10_000 });

  // Propose wusdc registration
  const proposalId = (parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1);
  const register_token: RegisterToken = {
    id: proposalId,
    token_name: token_name,
    symbol: symbol,
    decimals: decimals,
    max_supply: max_supply
  };
  const registerTokenProposalHash = hashStruct(getRegisterTokenLeo(register_token));
  const [proposeWusdtTx] = await council.propose(proposalId, registerTokenProposalHash)
  await council.wait(proposeWusdtTx)


  const voters = padWithZeroAddress(await getVotersWithYesVotes(registerTokenProposalHash), SUPPORTED_THRESHOLD);
  // Register wusdc
  const [registerWusdTTx] = await tokenServiceCouncil.ts_register_token(proposalId, token_name, symbol, decimals, max_supply, voters)
  await tokenService.wait(registerWusdTTx)

}