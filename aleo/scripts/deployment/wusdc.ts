import { ExecutionMode } from "@doko-js/core";
import { Token_service_dev_v1Contract } from "../../artifacts/js/token_service_dev_v1";
import { Council_dev_v1Contract } from "../../artifacts/js/council_dev_v1";
import { getRegisterToken } from "../../artifacts/js/leo2js/token_service_council_dev_v1";
import { hashStruct } from "../../utils/hash";
import { RegisterToken, RegisterTokenLeo } from "../../artifacts/js/types/token_service_council_dev_v1";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../utils/constants";
import { Token_service_council_dev_v1Contract } from "../../artifacts/js/token_service_council_dev_v1";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../utils/voters";
import { getRegisterTokenLeo } from "../../artifacts/js/js2leo/token_service_council_dev_v1";

(BigInt.prototype as any).toJSON = function () {
  return this.toString()+"field";
};

const mode = ExecutionMode.SnarkExecute;
export const deployWusdc = async () => {

  const tokenService = new Token_service_dev_v1Contract({ mode, priorityFee: 10_000 });
  const tokenServiceCouncil = new Token_service_council_dev_v1Contract({ mode, priorityFee: 10_000 })
  const council = new Council_dev_v1Contract({ mode, priorityFee: 10_000 });

  const token_name = BigInt('6148332821651876206')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
  const symbol = BigInt("1431520323") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
  const decimals = 6
  const max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615

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
  const [proposeWusdcTx] = await council.propose(proposalId, registerTokenProposalHash)
  await council.wait(proposeWusdcTx)


  const voters = padWithZeroAddress(await getVotersWithYesVotes(registerTokenProposalHash), SUPPORTED_THRESHOLD);
  // Register wusdc
  const [registerWusdcTx] = await tokenServiceCouncil.ts_register_token(proposalId, token_name, symbol, decimals, max_supply, voters)
  await tokenService.wait(registerWusdcTx)

}