import { Vlink_token_bridge_v4Contract } from "../artifacts/js/vlink_token_bridge_v4";
import { Vlink_token_service_v4Contract } from "../artifacts/js/vlink_token_service_v4";
import { BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE, max_supply, ethChainId, baseChainId, baseEthContractAddr, baseUsdcContractAddr, baseUsdtContractAddr, ethUsdcContractAddr, ethUsdtContractAddr, ethEthContractAddr, SUPPLY_MANAGER_ROLE, baseTsContractAddr, arbitrumChainId, arbitrumTsContractAddr, arbitrumUsdcContractAddr, arbitrumUsdtContractAddr, arbitrumEthContractAddr, ethHoleskyChainId, ethHoleskyTsContractAddr, ethHoleskyUsdcContractAddr, ethHoleskyUsdtContractAddr, ethHoleskyEthContractAddr, wusdcPlatformFeePublic, wusdcFeeRelayerPublic, wusdcPlatformFeePrivate, wusdcFeeRelayerPrivate, wusdtPlatformFeePublic, wusdtFeeRelayerPublic, wusdtPlatformFeePrivate, wusdtFeeRelayerPrivate, wethPlatformFeePublic, wethFeeRelayerPublic, wethPlatformFeePrivate, wethFeeRelayerPrivate } from "../utils/testdata.data";
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
import { Vlink_bridge_council_v4Contract } from "../artifacts/js/vlink_bridge_council_v4";
import { ExecutionMode, leo2js } from "@doko-js/core";
import { hash } from "aleo-hasher";
import { execRole, proposeRole } from "./council/tokenService/proposeRole";
import { deployWusdt } from "./deployment/wusdt";
import { deployWeth } from "./deployment/weth";
import { } from "../utils/testdata.data";
import { execAddChainToToken, proposeAddChainToToken } from "./council/tokenService/addChainToToken";
import { ethTsContractAddr } from "../utils/constants";

const bridge = new Vlink_token_bridge_v4Contract({ mode: ExecutionMode.SnarkExecute });
const tokenService = new Vlink_token_service_v4Contract({ mode: ExecutionMode.SnarkExecute });
const bridgeCouncil = new Vlink_bridge_council_v4Contract({ mode: ExecutionMode.SnarkExecute });
const serviceCouncil = new Vlink_token_service_v4Contract({ mode: ExecutionMode.SnarkExecute });

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
  // await deployMainPrograms(
  //   initialAttestors,
  //   initialCouncilMembers,
  //   councilThreshold,
  //   councilThreshold
  // );
  // Bridge: Add ethereum chain
  // const addChainProposalId = await proposeAddChain(ethChainId);
  // await execAddChain(addChainProposalId, ethChainId);

  // // Bridge: Add base chain
  // const addChainProposalId2 = await proposeAddChain(baseChainId);
  // await execAddChain(addChainProposalId2, baseChainId);

  // // Bridge: Add arbitrum chain
  // const addChainProposalId3 = await proposeAddChain(arbitrumChainId);
  // await execAddChain(addChainProposalId3, arbitrumChainId);

  // // Bridge: Add holesky chain
  // const addChainProposalId4 = await proposeAddChain(ethHoleskyChainId);
  // await execAddChain(addChainProposalId4, ethHoleskyChainId);

  // Token Bridge: Add Service
  const enableTokenServiceProposalId = await proposeAddService(tokenService.address());
  await execAddService(enableTokenServiceProposalId, tokenService.address());

  // await wusdcSetupAndInit();
  await deployWusdc(wusdcName, wusdcSymbol, wusdcDecimals, max_supply);
  await deployWusdt(wusdtName, wusdtSymbol, wusdtDecimals, max_supply);
  await deployWeth(wethName, wethSymbol, wethDecimals, max_supply);

  // await wusdtSetupandInit();

  // await wethSetupandInit();

  // Token Bridge: Unpause
  const unpauseBridgeProposalId = await proposeUnpauseBridge();
  await execUnpause(unpauseBridgeProposalId);

};

async function wusdcSetupAndInit() {
  // Registers token in the mtsp through token_service.register_token
  // await deployWusdc(wusdcName, wusdcSymbol, wusdcDecimals, max_supply);

  // Token Service: Add wusdc ETH
  const addWUSDCTokenProposalId = await proposeAddToken(
    wusdc_id,
    wusdcMinTransfer,
    wusdcMaxTransfer,
    wusdcOutgoingPercentage,
    wusdcTimeframe,
    wusdcMaxNoCap,
    ethUsdcContractAddr,
    ethChainId,
    ethTsContractAddr,
    wusdcPlatformFeePublic,
    wusdcFeeRelayerPublic,
    wusdcPlatformFeePrivate,
    wusdcFeeRelayerPrivate
  );
  await execAddToken(
    wusdc_id,
    addWUSDCTokenProposalId,
    wusdcMinTransfer,
    wusdcMaxTransfer,
    wusdcOutgoingPercentage,
    wusdcTimeframe,
    wusdcMaxNoCap,
    ethUsdcContractAddr,
    ethChainId,
    ethTsContractAddr,
    wusdcPlatformFeePublic,
    wusdcFeeRelayerPublic,
    wusdcPlatformFeePrivate,
    wusdcFeeRelayerPrivate
  );



  // // Token service: Add chain to existing token Arbitrum
  const addChainToWUSDCTokenProposalId = await proposeAddChainToToken(
    wusdc_id,
    arbitrumChainId,
    arbitrumTsContractAddr,
    arbitrumUsdcContractAddr,
    wusdcPlatformFeePublic,
    wusdcFeeRelayerPublic,
    wusdcPlatformFeePrivate,
    wusdcFeeRelayerPrivate
  );
  await execAddChainToToken(
    addChainToWUSDCTokenProposalId,
    wusdc_id,
    arbitrumChainId,
    arbitrumTsContractAddr,
    arbitrumUsdcContractAddr,
    wusdcPlatformFeePublic,
    wusdcFeeRelayerPublic,
    wusdcPlatformFeePrivate,
    wusdcFeeRelayerPrivate
  );

  // Token service: Add chain to existing token Holesky
  const addChainToWUSDCTokenProposalHoleskyId = await proposeAddChainToToken(
    wusdc_id,
    ethHoleskyChainId,
    ethHoleskyTsContractAddr,
    ethHoleskyUsdcContractAddr,
    wusdcPlatformFeePublic,
    wusdcFeeRelayerPublic,
    wusdcPlatformFeePrivate,
    wusdcFeeRelayerPrivate
  );
  await execAddChainToToken(
    addChainToWUSDCTokenProposalHoleskyId,
    wusdc_id,
    ethHoleskyChainId,
    ethHoleskyTsContractAddr,
    ethHoleskyUsdcContractAddr,
    wusdcPlatformFeePublic,
    wusdcFeeRelayerPublic,
    wusdcPlatformFeePrivate,
    wusdcFeeRelayerPrivate
  );

  // Token service: Add chain to existing token Base
  const addChainToWUSDCTokenProposalBaseId = await proposeAddChainToToken(
    wusdc_id,
    baseChainId,
    baseTsContractAddr,
    baseUsdcContractAddr,
    wusdcPlatformFeePublic,
    wusdcFeeRelayerPublic,
    wusdcPlatformFeePrivate,
    wusdcFeeRelayerPrivate
  );
  await execAddChainToToken(
    addChainToWUSDCTokenProposalBaseId,
    wusdc_id,
    baseChainId,
    baseTsContractAddr,
    baseUsdcContractAddr,
    wusdcPlatformFeePublic,
    wusdcFeeRelayerPublic,
    wusdcPlatformFeePrivate,
    wusdcFeeRelayerPrivate
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
  // await deployWusdt(wusdtName, wusdtSymbol, wusdtDecimals, max_supply);

  // // Token Service: Add wusdt ETH
  // const addWUSDTokenProposalId = await proposeAddToken(
  //   wusdt_id,
  //   wusdtMinTransfer,
  //   wusdtMaxTransfer,
  //   wusdtOutgoingPercentage,
  //   wusdtTimeframe,
  //   wusdtMaxNoCap,
  //   ethUsdtContractAddr,
  //   wusdtPlatformFee,
  //   wusdtFeeRelayer,
  //   ethChainId,
  //   ethTsContractAddr
  // );
  // await execAddToken(
  //   wusdt_id,
  //   addWUSDTokenProposalId,
  //   wusdtMinTransfer,
  //   wusdtMaxTransfer,
  //   wusdtOutgoingPercentage,
  //   wusdtTimeframe,
  //   wusdtMaxNoCap,
  //   ethUsdtContractAddr,
  //   wusdtPlatformFee,
  //   wusdtFeeRelayer,
  //   ethChainId,
  //   ethTsContractAddr
  // );

  // // Token service: Add chain to existing token Arbitrum
  // const addChainToWUSDTTokenProposalId = await proposeAddChainToToken(
  //   wusdt_id,
  //   arbitrumChainId,
  //   arbitrumTsContractAddr,
  //   arbitrumUsdtContractAddr,
  //   wusdtPlatformFee,
  //   wusdtFeeRelayer
  // );
  // await execAddChainToToken(
  //   addChainToWUSDTTokenProposalId,
  //   wusdt_id,
  //   arbitrumChainId,
  //   arbitrumTsContractAddr,
  //   arbitrumUsdtContractAddr,
  //   wusdtPlatformFee,
  //   wusdtFeeRelayer
  // );

  // Token service: Add chain to existing token Holesky
  const addChainToWUSDTTokenProposalId = await proposeAddChainToToken(
    wusdt_id,
    ethHoleskyChainId,
    ethHoleskyTsContractAddr,
    ethHoleskyUsdtContractAddr,
    wusdtPlatformFeePublic,
    wusdtFeeRelayerPublic,
    wusdtPlatformFeePrivate,
    wusdtFeeRelayerPrivate
  );
  await execAddChainToToken(
    addChainToWUSDTTokenProposalId,
    wusdt_id,
    ethHoleskyChainId,
    ethHoleskyTsContractAddr,
    ethHoleskyUsdtContractAddr,
    wusdtPlatformFeePublic,
    wusdtFeeRelayerPublic,
    wusdtPlatformFeePrivate,
    wusdtFeeRelayerPrivate
  );

  // // Token service: Add chain to existing token Base
  // const addChainToWUSDTTokenProposalId = await proposeAddChainToToken(
  //   wusdt_id,
  //   baseChainId,
  //   baseTsContractAddr,
  //   baseUsdtContractAddr,
  //   wusdtPlatformFee,
  //   wusdtFeeRelayer
  // );
  // await execAddChainToToken(
  //   addChainToWUSDTTokenProposalId,
  //   wusdt_id,
  //   baseChainId,
  //   baseTsContractAddr,
  //   baseUsdtContractAddr,
  //   wusdtPlatformFee,
  //   wusdtFeeRelayer
  // );

  // // Token service: Give role to the token service.
  // const WUSDTroleProposalId = await proposeRole(wusdt_id, SUPPLY_MANAGER_ROLE);
  // await execRole(WUSDTroleProposalId, wusdt_id, SUPPLY_MANAGER_ROLE);

  // // Wusdt Token: Unpause
  // const WUSDTunpauseTokenProposalId = await proposeUnpauseToken(wusdt_id);
  // await execUnpauseToken(WUSDTunpauseTokenProposalId, wusdt_id);
}

async function wethSetupandInit() {
  // Deploy Weth
  // await deployWeth(wethName, wethSymbol, wethDecimals, max_supply);

  // // Token Service: Add weth ETH
  // const addWETHokenProposalId = await proposeAddToken(
  //   weth_id,
  //   wethMinTransfer,
  //   wethMaxTransfer,
  //   wethOutgoingPercentage,
  //   wethTimeframe,
  //   wethMaxNoCap,
  //   ethEthContractAddr,
  //   wethPlatformFee,
  //   wethFeeRelayer,
  //   ethChainId,
  //   ethTsContractAddr
  // );
  // await execAddToken(
  //   weth_id,
  //   addWETHokenProposalId,
  //   wethMinTransfer,
  //   wethMaxTransfer,
  //   wethOutgoingPercentage,
  //   wethTimeframe,
  //   wethMaxNoCap,
  //   ethEthContractAddr,
  //   wethPlatformFee,
  //   wethFeeRelayer,
  //   ethChainId,
  //   ethTsContractAddr
  // );

  // // Token service: Add chain to existing token Arbitrum
  // const addChainToWETHTokenProposalId = await proposeAddChainToToken(
  //   weth_id,
  //   arbitrumChainId,
  //   arbitrumTsContractAddr,
  //   arbitrumEthContractAddr,
  //   wethPlatformFee,
  //   wethFeeRelayer
  // );

  // await execAddChainToToken(
  //   addChainToWETHTokenProposalId,
  //   weth_id,
  //   arbitrumChainId,
  //   arbitrumTsContractAddr,
  //   arbitrumEthContractAddr,
  //   wethPlatformFee,
  //   wethFeeRelayer
  // );

  // Token service: Add chain to existing token Holesky
  const addChainToWETHTokenProposalId = await proposeAddChainToToken(
    weth_id,
    ethHoleskyChainId,
    ethHoleskyTsContractAddr,
    ethHoleskyEthContractAddr,
    wethPlatformFeePublic,
    wethFeeRelayerPublic,
    wethPlatformFeePrivate,
    wethFeeRelayerPrivate
  );

  await execAddChainToToken(
    addChainToWETHTokenProposalId,
    weth_id,
    ethHoleskyChainId,
    ethHoleskyTsContractAddr,
    ethHoleskyEthContractAddr,
    wethPlatformFeePublic,
    wethFeeRelayerPublic,
    wethPlatformFeePrivate,
    wethFeeRelayerPrivate
  );

  // // Token service: Add chain to existing token Base
  // const addChainToWETHTokenProposalId = await proposeAddChainToToken(
  //   weth_id,
  //   baseChainId,
  //   baseTsContractAddr,
  //   baseEthContractAddr,
  //   wethPlatformFee,
  //   wethFeeRelayer
  // );

  // await execAddChainToToken(
  //   addChainToWETHTokenProposalId,
  //   weth_id,
  //   baseChainId,
  //   baseTsContractAddr,
  //   baseEthContractAddr,
  //   wethPlatformFee,
  //   wethFeeRelayer
  // );

  // // Token service: Give role to the aleo token service.
  // const WETHroleProposalId = await proposeRole(weth_id, SUPPLY_MANAGER_ROLE);
  // await execRole(WETHroleProposalId, weth_id, SUPPLY_MANAGER_ROLE);

  // // Weth Token: Unpause
  // const WETHunpauseTokenProposalId = await proposeUnpauseToken(weth_id);
  // await execUnpauseToken(WETHunpauseTokenProposalId, weth_id);
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
