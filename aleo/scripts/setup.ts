import { Council_v0001Contract } from "../artifacts/js/council_v0001";
import { Token_bridge_v0001Contract } from "../artifacts/js/token_bridge_v0001";
import { Token_service_v0001Contract } from "../artifacts/js/token_service_v0001";
import { TbAddChain, TsAddToken, TbAddService } from "../artifacts/js/types";
import { Wusdc_connector_v0001Contract } from "../artifacts/js/wusdc_connector_v0001";
import { Wusdc_token_v0001Contract } from "../artifacts/js/wusdc_token_v0001";
import { BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE } from "../utils/constants";
import { execAddChain, proposeAddChain } from "./council/bridge/addChain";
import { execAddService, proposeAddService } from "./council/bridge/addService";
import { execUnpause, proposeUnpause } from "./council/bridge/unpause";
import { execAddToken, proposeAddToken } from "./council/tokenService/addNewToken";

import { deployMainPrograms } from "./deployment/mainPrograms";
import { deployWusdc } from "./deployment/wusdc";

const bridge = new Token_bridge_v0001Contract();
const wusdcToken = new Wusdc_token_v0001Contract();
const wusdcConnector = new Wusdc_connector_v0001Contract();
const tokenService = new Token_service_v0001Contract();
const council = new Council_v0001Contract();

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

  // Token Bridge: Unpause
  const unpauseBridgeProposalId = await proposeUnpause();
  await execUnpause(unpauseBridgeProposalId);

};

export const validateSetup = async () => {
    const ownerTB = await bridge.owner_TB(true);
    if (ownerTB != council.address()) {
      throw Error(`ownerTB is not council`);
    }

    const ownerTS = await tokenService.owner_TS(true);
    if (ownerTS != council.address()) {
      throw Error(`ownerTS is not council`);
    }

    const ownerToken = await wusdcToken.token_owner(true);
    if (ownerToken != wusdcConnector.address()) {
      throw Error(`ownerToken is not connector`);
    }

    const bridgeStatus = await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX);
    if (bridgeStatus != BRIDGE_UNPAUSED_VALUE) {
      throw Error(`Bridge is paused`);
    }
}

// setup();
