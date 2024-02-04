import { Token_service_v0001Contract } from "../artifacts/js/token_service_v0001";
import { TbAddChain, TsAddToken, TbAddService } from "../artifacts/js/types";
import { Wusdc_connector_v0001Contract } from "../artifacts/js/wusdc_connector_v0001";
import { Wusdc_token_v0001Contract } from "../artifacts/js/wusdc_token_v0001";
import { execAddChain, proposeAddChain } from "./council/bridge/addChain";
import { execAddService, proposeAddService } from "./council/bridge/addService";
import { execAddToken, proposeAddToken } from "./council/tokenService/addNewToken";

import { deployMainPrograms } from "./deployment/mainPrograms";
import { deployWusdc } from "./deployment/wusdc";

const wusdcToken = new Wusdc_token_v0001Contract();
const wusdcConnector = new Wusdc_connector_v0001Contract();
const tokenService = new Token_service_v0001Contract();

import {
  aleoUser1,
  aleoUser2,
  aleoUser3,
  aleoUser4,
  aleoUser5,
  councilThreshold,
  ethChainId,
  wusdcMaxNoCap,
  wusdcMaxTransfer,
  wusdcMinTransfer,
  wusdcOutgoingPercentage,
  wusdcTimeframe,
} from "./testnet.data";

const initialAttestors = [
  aleoUser1,
  aleoUser2,
  aleoUser3,
  aleoUser4,
  aleoUser5,
];
const initialCouncilMembers = [
  aleoUser1,
  aleoUser2,
  aleoUser3,
  aleoUser4,
  aleoUser5,
];

const setup = async () => {
  await deployMainPrograms(
    initialAttestors,
    initialCouncilMembers,
    councilThreshold,
    councilThreshold
  );
  await deployWusdc();

  // Bridge: Add ethereum chain
  const addChainProposalId = await proposeAddChain(ethChainId);
  await execAddChain(addChainProposalId, ethChainId);

  // Token Service: Add wusdc
  const addTokenProposalId = await proposeAddToken(
    wusdcToken.address(),
    wusdcConnector.address(),
    wusdcMinTransfer,
    wusdcMaxTransfer,
    wusdcOutgoingPercentage,
    wusdcTimeframe,
    wusdcMaxNoCap
  );
  await execAddToken(
    addTokenProposalId,
    wusdcToken.address(),
    wusdcConnector.address(),
    wusdcMinTransfer,
    wusdcMaxTransfer,
    wusdcOutgoingPercentage,
    wusdcTimeframe,
    wusdcMaxNoCap
  );

  // Token Bridge: Enable Service
  const enableTokenServiceProposalId = await proposeAddService(
    tokenService.address()
  );
  await execAddService(enableTokenServiceProposalId, tokenService.address());

};

setup();
