import { Council_v0003Contract } from "../artifacts/js/council_v0003";
import { Token_bridge_v0003Contract } from "../artifacts/js/token_bridge_v0003";
import { Token_service_v0003Contract } from "../artifacts/js/token_service_v0003";
import { Wusdc_connector_v0003_0Contract } from "../artifacts/js/wusdc_connector_v0003_0";
import { Wusdc_token_v0003Contract } from "../artifacts/js/wusdc_token_v0003";
import { BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE, ethChainId } from "../utils/constants";
import { execAddChain, proposeAddChain } from "./council/bridge/addChain";
import { execAddService, proposeAddService } from "./council/bridge/addService";
import { execUnpause, proposeUnpauseBridge } from "./council/bridge/unpause";
import { execAddToken, proposeAddToken } from "./council/tokenService/addNewToken";

import { deployMainPrograms } from "./deployment/mainPrograms";
import { deployWusdc } from "./deployment/wusdc";

const bridge = new Token_bridge_v0003Contract();
const wusdcToken = new Wusdc_token_v0003Contract();
const wusdcConnector = new Wusdc_connector_v0003_0Contract();
const tokenService = new Token_service_v0003Contract();
const bridgeCouncil = new Bridge_councilContract({mode:ExecutionMode.SnarkExecute});
const serviceCouncil = new Token_service_v0003Contract({mode:ExecutionMode.SnarkExecute});

import {
  aleoUser1,
  aleoUser2,
  aleoUser3,
  aleoUser4,
  aleoUser5,
  councilThreshold,
  wusdcMaxNoCap,
  wusdcMaxTransfer,
  wusdcMinTransfer,
  wusdcOutgoingPercentage,
  wusdcTimeframe,
} from "../utils/testnet.data";
import { execUnpauseToken, proposeUnpauseToken } from "./council/tokenService/unpause";
import { Bridge_councilContract } from "../artifacts/js/bridge_council";
import { ExecutionMode } from "@doko-js/core";

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
  // await deployWusdc();

  // // Bridge: Add ethereum chain
  // const addChainProposalId = await proposeAddChain(ethChainId);
  // await execAddChain(addChainProposalId, ethChainId);

  // // Token Service: Add wusdc
  // const addTokenProposalId = await proposeAddToken(
  //   wusdcToken.address(),
  //   wusdcConnector.address(),
  //   wusdcMinTransfer,
  //   wusdcMaxTransfer,
  //   wusdcOutgoingPercentage,
  //   wusdcTimeframe,
  //   wusdcMaxNoCap
  // );
  // await execAddToken(
  //   addTokenProposalId,
  //   wusdcToken.address(),
  //   wusdcConnector.address(),
  //   wusdcMinTransfer,
  //   wusdcMaxTransfer,
  //   wusdcOutgoingPercentage,
  //   wusdcTimeframe,
  //   wusdcMaxNoCap
  // );

  // // Token Bridge: Enable Service
  // const enableTokenServiceProposalId = await proposeAddService( tokenService.address());
  // await execAddService(enableTokenServiceProposalId, tokenService.address());

  // // Token Bridge: Unpause
  // const unpauseBridgeProposalId = await proposeUnpauseBridge();
  // await execUnpause(unpauseBridgeProposalId);

  // // Wusdc Token: Unpause
  // const unpauseTokenProposalId = await proposeUnpauseToken(wusdcToken.address());
  // await execUnpauseToken(unpauseTokenProposalId, wusdcToken.address());

};

export const validateSetup = async () => {
    const ownerTB = await bridge.owner_TB(true);
    if (ownerTB != bridgeCouncil.address()) {
      throw Error(`ownerTB is not council`);
    }

    const ownerTS = await tokenService.owner_TS(true);
    if (ownerTS != serviceCouncil.address()) {
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

setup();
