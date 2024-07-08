import { ExecutionMode } from "@doko-js/core";
import { Token_service_v0003Contract } from "../../artifacts/js/token_service_v0003";
import { CouncilContract } from "../../artifacts/js/council";
import { getRegisterToken } from "../../artifacts/js/leo2js/token_service_council";
import { hashStruct } from "../../utils/hash";
import { RegisterToken, RegisterTokenLeo } from "../../artifacts/js/types/token_service_council";
import { COUNCIL_TOTAL_PROPOSALS_INDEX, SUPPORTED_THRESHOLD } from "../../utils/constants";
import { Token_service_councilContract } from "../../artifacts/js/token_service_council";
import { getVotersWithYesVotes, padWithZeroAddress } from "../../utils/voters";
import { Holding_v0003Contract } from "../../artifacts/js/holding_v0003";

const mode = ExecutionMode.SnarkExecute;
export const deployWusdc = async () => {
  // const wusdcToken = new Wusdc_token_v0003Contract({mode});
  const wusdcHolding = new Holding_v0003Contract({mode});
  // const wusdcConnecter = new Wusdc_connector_v0003_0Contract({mode});

  // // Deploy token
  // const wusdcTokenDeployTx = await wusdcToken.deploy(); // 11_912_000
  // await wusdcToken.wait(wusdcTokenDeployTx);

  // // Deploy holding
  const wusdcHoldingDeployTx = await wusdcHolding.deploy(); // 5_039_000
  await wusdcHolding.wait(wusdcHoldingDeployTx);

  // // Deploy connector
  // const wusdcConnectorDeployTx = await wusdcConnecter.deploy(); // 7_653_000
  // await wusdcConnecter.wait(wusdcConnectorDeployTx);

  // // Initialize wusdc
  // const [initializeWusdcTx] = await wusdcConnecter.initialize_wusdc(); // 239_906
  // await wusdcConnecter.wait(initializeWusdcTx);

  const tokenService = new Token_service_v0003Contract({ mode, priorityFee: 10_000 });
  const tokenServiceCouncil = new Token_service_councilContract({ mode, priorityFee: 10_000 })
  const council = new CouncilContract({ mode, priorityFee: 10_000 });

  const token_name = BigInt('6148332821651876206')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
  const symbol = BigInt("1431520323") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
  const decimals = 6
  const max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615

  // Propose wusdc registration
  const proposalId = (parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1);
  const register_token: RegisterTokenLeo = {
    id: proposalId.toString(),
    token_name: token_name.toString(),
    symbol: symbol.toString(),
    decimals: decimals.toString(),
    max_supply: max_supply.toString()
  };
  const registerTokenProposalHash = hashStruct(getRegisterToken(register_token));
  const [proposeWusdcTx] = await council.propose(proposalId, registerTokenProposalHash)
  await council.wait(proposeWusdcTx)


  const voters = padWithZeroAddress(await getVotersWithYesVotes(registerTokenProposalHash), SUPPORTED_THRESHOLD);
  // Register wusdc
  const [registerWusdcTx] = await tokenServiceCouncil.register_token(proposalId, token_name, symbol, decimals, max_supply, voters)
  await tokenService.wait(registerWusdcTx)

}