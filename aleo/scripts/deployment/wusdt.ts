import { ExecutionMode } from "@doko-js/core";
import { Vlink_token_service_v2Contract } from "../../artifacts/js/vlink_token_service_v2";
import { Vlink_council_v2Contract } from "../../artifacts/js/vlink_council_v2";
import { getRegisterToken } from "../../artifacts/js/leo2js/vlink_token_service_council_v2";
import { hashStruct } from "../../utils/hash";
import { RegisterToken, RegisterTokenLeo } from "../../artifacts/js/types/vlink_token_service_council_v2";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../utils/testdata.data";
import { Vlink_token_service_council_v2Contract } from "../../artifacts/js/vlink_token_service_council_v2";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../utils/voters";
import { getRegisterTokenLeo } from "../../artifacts/js/js2leo/vlink_token_service_council_v2";

const mode = ExecutionMode.SnarkExecute;
export const deployWusdt = async (token_name, symbol, decimals, max_supply) => {

  const tokenService = new Vlink_token_service_v2Contract({ mode, priorityFee: 10_000 });
  const tokenServiceCouncil = new Vlink_token_service_council_v2Contract({ mode, priorityFee: 10_000 })
  const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });

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
  const proposeWusdtTx = await council.propose(proposalId, registerTokenProposalHash)
  await proposeWusdtTx.wait()


  const voters = padWithZeroAddress(await getVotersWithYesVotes(registerTokenProposalHash), SUPPORTED_THRESHOLD);
  // Register wusdc
  const registerWusdTTx = await tokenServiceCouncil.ts_register_token(proposalId, token_name, symbol, decimals, max_supply, voters)
  await registerWusdTTx.wait()

}