import { Vlink_token_bridge_v2Contract } from "../artifacts/js/vlink_token_bridge_v2";
import { Vlink_token_service_v2Contract } from "../artifacts/js/vlink_token_service_v2";
import { BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE, max_supply, ethChainId, ethContractAddr, usdcContractAddr, usdtContractAddr, SUPPLY_MANAGER_ROLE } from "../utils/testdata.data";
import { execAddChain, proposeAddChain } from "./council/bridge/addChain";
import { execAddService, proposeAddService } from "./council/bridge/addService";
import { execUnpause, proposeUnpauseBridge } from "./council/bridge/unpause";
import { execAddToken, proposeAddToken } from "./council/tokenService/addNewToken";

import { deployMainPrograms } from "./deployment/mainPrograms";
import { deployWusdc } from "./deployment/wusdc";

import {
  council1, council2, council3, council4, council5,
  attestor1, attestor2, attestor3, attestor4, attestor5,
  councilThreshold,
  wusdcMaxNoCap,
  wusdcMaxTransfer,
  wusdcMinTransfer,
  wusdcOutgoingPercentage,
  wusdcTimeframe,
  wusdcName,
  wusdcSymbol,
  wusdcDecimals,
} from "../utils/testdata.data";
import {
  wusdtMaxNoCap,
  wusdtMaxTransfer,
  wusdtMinTransfer,
  wusdtOutgoingPercentage,
  wusdtTimeframe,
  wusdtName,
  wusdtSymbol,
  wusdtDecimals
} from "../utils/testdata.data";
import {
  wethMaxNoCap,
  wethMaxTransfer,
  wethMinTransfer,
  wethOutgoingPercentage,
  wethTimeframe,
  wethName,
  wethSymbol,
  wethDecimals
} from "../utils/testdata.data";
import { execUnpauseToken, proposeUnpauseToken } from "./council/tokenService/unpause";
import { Vlink_bridge_council_v2Contract } from "../artifacts/js/vlink_bridge_council_v2";
import { ExecutionMode, leo2js } from "@doko-js/core";
import { hash } from "aleo-hasher";
import { execRole, proposeRole } from "./council/tokenService/proposeRole";
import { deployWusdt } from "./deployment/wusdt";
import { deployWeth } from "./deployment/weth";
import { wethFeeRelayer, wethPlatformFee, wusdcFeeRelayer, wusdcPlatformFee, wusdtFeeRelayer, wusdtPlatformFee } from "../utils/testdata.data";
import { baseChainId } from "../utils/constants";
import { execAddChainToToken, proposeAddChainToToken } from "./council/tokenService/addChainToToken";

const bridge = new Vlink_token_bridge_v2Contract();
const tokenService = new Vlink_token_service_v2Contract();
const bridgeCouncil = new Vlink_bridge_council_v2Contract({ mode: ExecutionMode.SnarkExecute });
const serviceCouncil = new Vlink_token_service_v2Contract({ mode: ExecutionMode.SnarkExecute });

const initialAttestors = [
  attestor1,
  attestor2,
  attestor3,
  attestor4,
  attestor5
];
const initialCouncilMembers = [
  council1,
  council2,
  council3,
  council4,
  council5,
];

const wusdc_id = leo2js.field(hash('bhp256', wusdcName.toString() + "u128", "field"));
const wusdt_id = leo2js.field(hash('bhp256', wusdtName.toString() + "u128", 'field'));
const weth_id = leo2js.field(hash('bhp256', wethName.toString() + "u128", 'field'));

const setup = async () => {
  await deployMainPrograms(
    initialAttestors,
    initialCouncilMembers,
    councilThreshold,
    councilThreshold
  );
  // Bridge: Add ethereum chain
  const addChainProposalId = await proposeAddChain(ethChainId);
  await execAddChain(addChainProposalId, ethChainId);

  // Bridge: Add base chain
  const addChainProposalId2 = await proposeAddChain(baseChainId);
  await execAddChain(addChainProposalId2, baseChainId);

  // Token Bridge: Enable Service
  const enableTokenServiceProposalId = await proposeAddService(tokenService.address());
  await execAddService(enableTokenServiceProposalId, tokenService.address());

  await wusdcSetupAndInit();

  await wusdtSetupandInit();

  await wethSetupandInit();

  // Token Bridge: Unpause
  const unpauseBridgeProposalId = await proposeUnpauseBridge();
  await execUnpause(unpauseBridgeProposalId);

};

async function wusdcSetupAndInit() {
  // Registers token in the mtsp through token_service.register_token
  await deployWusdc(wusdcName, wusdcSymbol, wusdcDecimals, max_supply);

  // Token Service: Add wusdc
  const addWUSDCTokenProposalId = await proposeAddToken(
    wusdc_id,
    wusdcMinTransfer,
    wusdcMaxTransfer,
    wusdcOutgoingPercentage,
    wusdcTimeframe,
    wusdcMaxNoCap,
    usdcContractAddr,
    wusdcPlatformFee,
    wusdcFeeRelayer
  );
  await execAddToken(
    wusdc_id,
    addWUSDCTokenProposalId,
    wusdcMinTransfer,
    wusdcMaxTransfer,
    wusdcOutgoingPercentage,
    wusdcTimeframe,
    wusdcMaxNoCap,
    usdcContractAddr,
    wusdcPlatformFee,
    wusdcFeeRelayer
  );

  // Token service: Add chain to existing token
  const addChainToWUSDCTokenProposalId = await proposeAddChainToToken(
    wusdc_id,
    ethChainId,
    tokenService.address(),
    usdcContractAddr,
    wusdcPlatformFee,
    wusdcFeeRelayer
  );
  await execAddChainToToken(
    addChainToWUSDCTokenProposalId,
    wusdc_id,
    ethChainId,
    tokenService.address(),
    usdcContractAddr,
    wusdcPlatformFee,
    wusdcFeeRelayer
  );

  // Token service: Give role to the token service.
  const WUSDCroleProposalId = await proposeRole(wusdc_id, SUPPLY_MANAGER_ROLE);
  await execRole(WUSDCroleProposalId, wusdc_id, SUPPLY_MANAGER_ROLE);

  // Wusdc Token: Unpause
  const WUSDCunpauseTokenProposalId = await proposeUnpauseToken(wusdc_id);
  await execUnpauseToken(WUSDCunpauseTokenProposalId, wusdc_id);

}

async function wusdtSetupandInit() {
  // Deploy Wusdt
  await deployWusdt(wusdtName, wusdtSymbol, wusdtDecimals, max_supply);

  // Token Service: Add wusdt
  const addWUSDTokenProposalId = await proposeAddToken(
    wusdt_id,
    wusdtMinTransfer,
    wusdtMaxTransfer,
    wusdtOutgoingPercentage,
    wusdtTimeframe,
    wusdtMaxNoCap,
    usdtContractAddr,
    wusdtPlatformFee,
    wusdtFeeRelayer
  );
  await execAddToken(
    wusdt_id,
    addWUSDTokenProposalId,
    wusdtMinTransfer,
    wusdtMaxTransfer,
    wusdtOutgoingPercentage,
    wusdtTimeframe,
    wusdtMaxNoCap,
    usdtContractAddr,
    wusdtPlatformFee,
    wusdtFeeRelayer
  );

  // Token service: Add chain to existing token
  const addChainToWUSDTTokenProposalId = await proposeAddChainToToken(
    wusdt_id,
    baseChainId,
    tokenService.address(),
    usdtContractAddr,
    wusdtPlatformFee,
    wusdtFeeRelayer
  );
  await execAddChainToToken(
    addChainToWUSDTTokenProposalId,
    wusdt_id,
    baseChainId,
    tokenService.address(),
    usdtContractAddr,
    wusdtPlatformFee,
    wusdtFeeRelayer
  );

  // Token service: Give role to the token service.
  const WUSDTroleProposalId = await proposeRole(wusdt_id, SUPPLY_MANAGER_ROLE);
  await execRole(WUSDTroleProposalId, wusdt_id, SUPPLY_MANAGER_ROLE);

  // Wusdt Token: Unpause
  const WUSDTunpauseTokenProposalId = await proposeUnpauseToken(wusdt_id);
  await execUnpauseToken(WUSDTunpauseTokenProposalId, wusdt_id);
}

async function wethSetupandInit() {
  // Deploy Weth
  await deployWeth(wethName, wethSymbol, wethDecimals, max_supply);

  // Token Service: Add weth
  const addWETHokenProposalId = await proposeAddToken(
    weth_id,
    wethMinTransfer,
    wethMaxTransfer,
    wethOutgoingPercentage,
    wethTimeframe,
    wethMaxNoCap,
    ethContractAddr,
    wethPlatformFee,
    wethFeeRelayer
  );
  await execAddToken(
    weth_id,
    addWETHokenProposalId,
    wethMinTransfer,
    wethMaxTransfer,
    wethOutgoingPercentage,
    wethTimeframe,
    wethMaxNoCap,
    ethContractAddr,
    wethPlatformFee,
    wethFeeRelayer
  );

  // Token service: Add chain to existing token
  const addChainToWETHTokenProposalId = await proposeAddChainToToken(
    weth_id,
    baseChainId,
    tokenService.address(),
    ethContractAddr,
    wethPlatformFee,
    wethFeeRelayer
  );

  await execAddChainToToken(
    addChainToWETHTokenProposalId,
    weth_id,
    baseChainId,
    tokenService.address(),
    ethContractAddr,
    wethPlatformFee,
    wethFeeRelayer
  );

  // Token service: Give role to the token service.
  const WETHroleProposalId = await proposeRole(weth_id, SUPPLY_MANAGER_ROLE);
  await execRole(WETHroleProposalId, weth_id, SUPPLY_MANAGER_ROLE);

  // Weth Token: Unpause
  const WETHunpauseTokenProposalId = await proposeUnpauseToken(weth_id);
  await execUnpauseToken(WETHunpauseTokenProposalId, weth_id);
}

export const validateSetup = async () => {
  const ownerTB = await bridge.owner_TB(true);
  if (ownerTB != bridgeCouncil.address()) {
    throw Error(`ownerTB is not council`);
  }

  const ownerTS = await tokenService.owner_TS(true);
  if (ownerTS != serviceCouncil.address()) {
    throw Error(`ownerTS is not council`);
  }

  const bridgeStatus = await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX);
  if (bridgeStatus != BRIDGE_UNPAUSED_VALUE) {
    throw Error(`Bridge is paused`);
  }
}

setup();
