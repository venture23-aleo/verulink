import { Vlink_token_bridge_v7Contract } from "../artifacts/js/vlink_token_bridge_v7";
import { Vlink_token_service_v7Contract } from "../artifacts/js/vlink_token_service_v7";
import { BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE, max_supply, ethChainId, baseChainId, baseEthContractAddr, baseUsdcContractAddr, baseUsdtContractAddr, ethUsdcContractAddr, ethUsdtContractAddr, ethEthContractAddr, SUPPLY_MANAGER_ROLE, baseTsContractAddr, arbitrumChainId, arbitrumTsContractAddr, arbitrumUsdcContractAddr, arbitrumUsdtContractAddr, arbitrumEthContractAddr, ethHoleskyChainId, ethHoleskyTsContractAddr, ethHoleskyUsdcContractAddr, ethHoleskyUsdtContractAddr, ethHoleskyEthContractAddr, wusdcPlatformFeePublic, wusdcFeeRelayerPublic, wusdcPlatformFeePrivate, wusdcFeeRelayerPrivate, wusdtPlatformFeePublic, wusdtFeeRelayerPublic, wusdtPlatformFeePrivate, wusdtFeeRelayerPrivate, wethPlatformFeePublic, wethFeeRelayerPublic, wethPlatformFeePrivate, wethFeeRelayerPrivate, aleoSeq, ethSeq } from "../utils/testdata.data";
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
import { Vlink_bridge_council_v07Contract } from "../artifacts/js/vlink_bridge_council_v07";
import { ExecutionMode, leo2js } from "@doko-js/core";
import { hash } from "aleo-hasher";
import { execRole, proposeRole } from "./council/tokenService/proposeRole";
import { deployWusdt } from "./deployment/wusdt";
import { deployWeth } from "./deployment/weth";
import { } from "../utils/testdata.data";
import { execAddChainToToken, proposeAddChainToToken } from "./council/tokenService/addChainToToken";
import { ethTsContractAddr } from "../utils/constants";
import { execTranferAdmin, proposeTransferAdmin } from "./token_admin_transfer";
import { execRemoveRole, proposeRemoveRole } from "./council/tokenService/removeRole";
import { Vlink_token_service_council_v07Contract } from "../artifacts/js/vlink_token_service_council_v07";
import { Vlink_token_service_v1Contract } from "../artifacts/js/vlink_token_service_v1";

const bridge = new Vlink_token_bridge_v7Contract({ mode: ExecutionMode.SnarkExecute });
const tokenService = new Vlink_token_service_v7Contract({ mode: ExecutionMode.SnarkExecute });
const bridgeCouncil = new Vlink_bridge_council_v07Contract({ mode: ExecutionMode.SnarkExecute });
const serviceCouncil = new Vlink_token_service_council_v07Contract({ mode: ExecutionMode.SnarkExecute });
const old_tokenService = new Vlink_token_service_v1Contract({ mode: ExecutionMode.SnarkExecute });

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
    councilThreshold,
    aleoSeq,
    ethSeq
  );

  // give old token ownership to newly deployed 
  const changeOwnerUSDC_proposalID = await proposeTransferAdmin(serviceCouncil.address(), wusdc_id, serviceCouncil.address());
  await execTranferAdmin(changeOwnerUSDC_proposalID, serviceCouncil.address(), wusdc_id, serviceCouncil.address())

  // give old token ownership to newly deployed 
  const changeOwnerUSDT_proposalID = await proposeTransferAdmin(serviceCouncil.address(), wusdt_id, serviceCouncil.address());
  await execTranferAdmin(changeOwnerUSDT_proposalID, serviceCouncil.address(), wusdt_id, serviceCouncil.address())

  // give old token ownership to newly deployed 
  const changeOwnerETH_proposalID = await proposeTransferAdmin(serviceCouncil.address(), weth_id, serviceCouncil.address());
  await execTranferAdmin(changeOwnerETH_proposalID, serviceCouncil.address(), weth_id, serviceCouncil.address())

  // removing roles from old tokenService  
  const revokeRoleUSDC_proposalID = await proposeRemoveRole(wusdc_id, old_tokenService.address());
  await execRemoveRole(revokeRoleUSDC_proposalID, wusdc_id, old_tokenService.address());

  const revokeRoleUSDT_proposalID = await proposeRemoveRole(wusdt_id, old_tokenService.address());
  await execRemoveRole(revokeRoleUSDT_proposalID, wusdt_id, old_tokenService.address());

  const revokeRoleWETH_proposalID = await proposeRemoveRole(weth_id, old_tokenService.address());
  await execRemoveRole(revokeRoleWETH_proposalID, weth_id, old_tokenService.address());


  // Bridge: Add ethereum chain
  const addChainProposalId = await proposeAddChain(ethChainId);
  await execAddChain(addChainProposalId, ethChainId);

  // Bridge: Add base chain
  const addChainProposalId2 = await proposeAddChain(baseChainId);
  await execAddChain(addChainProposalId2, baseChainId);

  // Bridge: Add arbitrum chain
  const addChainProposalId3 = await proposeAddChain(arbitrumChainId);
  await execAddChain(addChainProposalId3, arbitrumChainId);

  // Bridge: Add holesky chain
  const addChainProposalId4 = await proposeAddChain(ethHoleskyChainId);
  await execAddChain(addChainProposalId4, ethHoleskyChainId);

  // Token Bridge: Add Service
  const enableTokenServiceProposalId = await proposeAddService(tokenService.address());
  await execAddService(enableTokenServiceProposalId, tokenService.address());

  // no need to deploy this tokens are already present in token_registry
  // await deployWusdc(wusdcName, wusdcSymbol, wusdcDecimals, max_supply);
  // await deployWusdt(wusdtName, wusdtSymbol, wusdtDecimals, max_supply);
  // await deployWeth(wethName, wethSymbol, wethDecimals, max_supply);

  await wusdcSetupAndInit();

  await wusdtSetupandInit();

  await wethSetupandInit();

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


  // Token service: Add chain to existing token Arbitrum
  const addChainToWUSDCTokenProposalId = await proposeAddChainToToken(
    wusdc_id,
    arbitrumChainId,
    arbitrumTsContractAddr,
    arbitrumUsdcContractAddr,
    wusdcPlatformFeePublic,
    wusdcPlatformFeePrivate,
    wusdcFeeRelayerPublic,
    wusdcFeeRelayerPrivate
  );
  await execAddChainToToken(
    addChainToWUSDCTokenProposalId,
    wusdc_id,
    arbitrumChainId,
    arbitrumTsContractAddr,
    arbitrumUsdcContractAddr,
    wusdcPlatformFeePublic,
    wusdcPlatformFeePrivate,
    wusdcFeeRelayerPublic,
    wusdcFeeRelayerPrivate
  );

  // // Token service: Add token Holesky
  // const addChainToWUSDCTokenProposalHoleskyId = await proposeAddToken(
  //   wusdc_id,
  //   wusdcMinTransfer,
  //   wusdcMaxTransfer,
  //   wusdcOutgoingPercentage,
  //   wusdcTimeframe,
  //   wusdcMaxNoCap,
  //   ethHoleskyUsdcContractAddr,
  //   ethHoleskyChainId,
  //   ethHoleskyTsContractAddr,
  //   wusdcPlatformFeePublic,
  //   wusdcFeeRelayerPublic,
  //   wusdcPlatformFeePrivate,
  //   wusdcFeeRelayerPrivate
  // );
  // await execAddToken(
  //   wusdc_id,
  //   addChainToWUSDCTokenProposalHoleskyId,
  //   wusdcMinTransfer,
  //   wusdcMaxTransfer,
  //   wusdcOutgoingPercentage,
  //   wusdcTimeframe,
  //   wusdcMaxNoCap,
  //   ethHoleskyUsdcContractAddr,
  //   ethHoleskyChainId,
  //   ethHoleskyTsContractAddr,
  //   wusdcPlatformFeePublic,
  //   wusdcFeeRelayerPublic,
  //   wusdcPlatformFeePrivate,
  //   wusdcFeeRelayerPrivate
  // );


  // Token service: Add chain to existing token Base
  const addChainToWUSDCTokenProposalBaseId = await proposeAddChainToToken(
    wusdc_id,
    baseChainId,
    baseTsContractAddr,
    baseUsdcContractAddr,
    wusdcPlatformFeePublic,
    wusdcPlatformFeePrivate,
    wusdcFeeRelayerPublic,
    wusdcFeeRelayerPrivate
  );
  await execAddChainToToken(
    addChainToWUSDCTokenProposalBaseId,
    wusdc_id,
    baseChainId,
    baseTsContractAddr,
    baseUsdcContractAddr,
    wusdcPlatformFeePublic,
    wusdcPlatformFeePrivate,
    wusdcFeeRelayerPublic,
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

  // Token Service: Add wusdt ETH
  const addWUSDTokenProposaETHlId = await proposeAddToken(
    wusdt_id,
    wusdtMinTransfer,
    wusdtMaxTransfer,
    wusdtOutgoingPercentage,
    wusdtTimeframe,
    wusdtMaxNoCap,
    ethUsdtContractAddr,
    ethChainId,
    ethTsContractAddr,
    wusdtPlatformFeePublic,
    wusdtFeeRelayerPublic,
    wusdtPlatformFeePrivate,
    wusdtFeeRelayerPrivate
  );
  await execAddToken(
    wusdt_id,
    addWUSDTokenProposaETHlId,
    wusdtMinTransfer,
    wusdtMaxTransfer,
    wusdtOutgoingPercentage,
    wusdtTimeframe,
    wusdtMaxNoCap,
    ethUsdtContractAddr,
    ethChainId,
    ethTsContractAddr,
    wusdtPlatformFeePublic,
    wusdtFeeRelayerPublic,
    wusdtPlatformFeePrivate,
    wusdtFeeRelayerPrivate
  );

  // Token service: Add chain to existing token Arbitrum
  const addChainToWUSDTTokenProposalArbitrumId = await proposeAddChainToToken(
    wusdt_id,
    arbitrumChainId,
    arbitrumTsContractAddr,
    arbitrumUsdtContractAddr,
    wusdtPlatformFeePublic,
    wusdtPlatformFeePrivate,
    wusdtFeeRelayerPublic,
    wusdtFeeRelayerPrivate
  );
  await execAddChainToToken(
    addChainToWUSDTTokenProposalArbitrumId,
    wusdt_id,
    arbitrumChainId,
    arbitrumTsContractAddr,
    arbitrumUsdtContractAddr,
    wusdtPlatformFeePublic,
    wusdtPlatformFeePrivate,
    wusdtFeeRelayerPublic,
    wusdtFeeRelayerPrivate
  );

  // // Token service: Add chain to existing token Holesky
  // const addChainToWUSDtTokenProposalHoleskyId = await proposeAddToken(
  //   wusdt_id,
  //   wusdtMinTransfer,
  //   wusdtMaxTransfer,
  //   wusdtOutgoingPercentage,
  //   wusdtTimeframe,
  //   wusdtMaxNoCap,
  //   ethHoleskyUsdtContractAddr,
  //   ethHoleskyChainId,
  //   ethHoleskyTsContractAddr,
  //   wusdcPlatformFeePublic,
  //   wusdcFeeRelayerPublic,
  //   wusdcPlatformFeePrivate,
  //   wusdcFeeRelayerPrivate
  // );
  // await execAddToken(
  //   wusdt_id,
  //   addChainToWUSDtTokenProposalHoleskyId,
  //   wusdtMinTransfer,
  //   wusdtMaxTransfer,
  //   wusdtOutgoingPercentage,
  //   wusdtTimeframe,
  //   wusdtMaxNoCap,
  //   ethHoleskyUsdtContractAddr,
  //   ethHoleskyChainId,
  //   ethHoleskyTsContractAddr,
  //   wusdcPlatformFeePublic,
  //   wusdcFeeRelayerPublic,
  //   wusdcPlatformFeePrivate,
  //   wusdcFeeRelayerPrivate
  // );


  // Token service: Add chain to existing token Base
  const addChainToWUSDTTokenProposalBaseId = await proposeAddChainToToken(
    wusdt_id,
    baseChainId,
    baseTsContractAddr,
    baseUsdtContractAddr,
    wusdtPlatformFeePublic,
    wusdtPlatformFeePrivate,
    wusdtFeeRelayerPublic,
    wusdtFeeRelayerPrivate
  );
  await execAddChainToToken(
    addChainToWUSDTTokenProposalBaseId,
    wusdt_id,
    baseChainId,
    baseTsContractAddr,
    baseUsdtContractAddr,
    wusdtPlatformFeePublic,
    wusdtPlatformFeePrivate,
    wusdtFeeRelayerPublic,
    wusdtFeeRelayerPrivate
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
  // await deployWeth(wethName, wethSymbol, wethDecimals, max_supply);

  // Token Service: Add weth ETH
  const addWETHokenProposalethId = await proposeAddToken(
    weth_id,
    wethMinTransfer,
    wethMaxTransfer,
    wethOutgoingPercentage,
    wethTimeframe,
    wethMaxNoCap,
    ethEthContractAddr,
    ethChainId,
    ethTsContractAddr,
    wethPlatformFeePublic,
    wethFeeRelayerPublic,
    wethPlatformFeePrivate,
    wethFeeRelayerPrivate
  );
  await execAddToken(
    weth_id,
    addWETHokenProposalethId,
    wethMinTransfer,
    wethMaxTransfer,
    wethOutgoingPercentage,
    wethTimeframe,
    wethMaxNoCap,
    ethEthContractAddr,
    ethChainId,
    ethTsContractAddr,
    wethPlatformFeePublic,
    wethFeeRelayerPublic,
    wethPlatformFeePrivate,
    wethFeeRelayerPrivate
  );

  // Token service: Add chain to existing token Arbitrum
  const addChainToWETHTokenProposalArbitrumId = await proposeAddChainToToken(
    weth_id,
    arbitrumChainId,
    arbitrumTsContractAddr,
    arbitrumEthContractAddr,
    wethPlatformFeePublic,
    wethPlatformFeePrivate,
    wethFeeRelayerPublic,
    wethFeeRelayerPrivate
  );

  await execAddChainToToken(
    addChainToWETHTokenProposalArbitrumId,
    weth_id,
    arbitrumChainId,
    arbitrumTsContractAddr,
    arbitrumEthContractAddr,
    wethPlatformFeePublic,
    wethPlatformFeePrivate,
    wethFeeRelayerPublic,
    wethFeeRelayerPrivate
  );

  // Token service: Add chain to existing token Holesky
  const addChainToWETHTokenProposalHoleskyId = await proposeAddChainToToken(
    weth_id,
    ethHoleskyChainId,
    ethHoleskyTsContractAddr,
    ethHoleskyEthContractAddr,
    wethPlatformFeePublic,
    wethPlatformFeePrivate,
    wethFeeRelayerPublic,
    wethFeeRelayerPrivate
  );

  await execAddChainToToken(
    addChainToWETHTokenProposalHoleskyId,
    weth_id,
    ethHoleskyChainId,
    ethHoleskyTsContractAddr,
    ethHoleskyEthContractAddr,
    wethPlatformFeePublic,
    wethPlatformFeePrivate,
    wethFeeRelayerPublic,
    wethFeeRelayerPrivate
  );

  //   const addChainToWETHTokenProposalHoleskyId = await proposeAddToken(
  //   weth_id,
  //   wethMinTransfer,
  //   wethMaxTransfer,
  //   wethOutgoingPercentage,
  //   wethTimeframe,
  //   wethMaxNoCap,
  //   ethHoleskyEthContractAddr,
  //   ethHoleskyChainId,
  //   ethHoleskyTsContractAddr,
  //   wusdcPlatformFeePublic,
  //   wusdcFeeRelayerPublic,
  //   wusdcPlatformFeePrivate,
  //   wusdcFeeRelayerPrivate
  // );
  // await execAddToken(
  //   weth_id,
  //   addChainToWETHTokenProposalHoleskyId,
  //   wethMinTransfer,
  //   wethMaxTransfer,
  //   wethOutgoingPercentage,
  //   wethTimeframe,
  //   wethMaxNoCap,
  //   ethHoleskyEthContractAddr,
  //   ethHoleskyChainId,
  //   ethHoleskyTsContractAddr,
  //   wusdcPlatformFeePublic,
  //   wusdcFeeRelayerPublic,
  //   wusdcPlatformFeePrivate,
  //   wusdcFeeRelayerPrivate
  // );

  // Token service: Add chain to existing token Base
  const addChainToWETHTokenProposalBaseId = await proposeAddChainToToken(
    weth_id,
    baseChainId,
    baseTsContractAddr,
    baseEthContractAddr,
    wethPlatformFeePublic,
    wethPlatformFeePrivate,
    wethFeeRelayerPublic,
    wethFeeRelayerPrivate
  );

  await execAddChainToToken(
    addChainToWETHTokenProposalBaseId,
    weth_id,
    baseChainId,
    baseTsContractAddr,
    baseEthContractAddr,
    wethPlatformFeePublic,
    wethPlatformFeePrivate,
    wethFeeRelayerPublic,
    wethFeeRelayerPrivate
  );

  // Token service: Give role to the aleo token service.
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
