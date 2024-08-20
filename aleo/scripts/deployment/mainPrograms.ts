import { Token_bridgeContract } from "../../artifacts/js/token_bridge";
import { Token_serviceContract } from "../../artifacts/js/token_service";
import { CouncilContract } from "../../artifacts/js/council";
import { Bridge_councilContract } from "../../artifacts/js/bridge_council";
import { Token_service_councilContract } from "../../artifacts/js/token_service_council";
import { Multi_token_support_programContract } from "../../artifacts/js/multi_token_support_program";
import { HoldingContract } from "../../artifacts/js/holding";
import { ExecutionMode } from "@doko-js/core";

const mode = ExecutionMode.SnarkExecute;

export const deployMainPrograms = async (initialAttestors: string[], initialCouncilMembers: string[], initialAttestorThreshold: number, initialCouncilThreshold: number) => {

  const bridge = new Token_bridgeContract({ mode, priorityFee: 10_000 });
  const tokenService = new Token_serviceContract({ mode, priorityFee: 10_000 });
  const council = new CouncilContract({ mode, priorityFee: 10_000 });
  const bridgeCouncil = new Bridge_councilContract({ mode, priorityFee: 10_000 });
  const tokenServiceCouncil = new Token_service_councilContract({ mode, priorityFee: 10_000 });
  const mtsp = new Multi_token_support_programContract({ mode, priorityFee: 10_000 });
  const holding = new HoldingContract({ mode, priorityFee: 10_000 });

  //Deploy mtsp for local devnet only
  const mtspDeployTx = await mtsp.deploy();
  await mtsp.wait(mtspDeployTx);

  // Deploy holding
  const wusdcHoldingDeployTx = await holding.deploy(); // 5_039_000
  await holding.wait(wusdcHoldingDeployTx);

  // Deploy token bridge
  // bridge.connect("aleo1s9jt6t6esqg4caw0lzhr393f80jd5mw2w4mn0hudze60fvnrlq9s9ryctf");
  const bridgeDeployTx = await bridge.deploy(); // 19_840_000
  await bridge.wait(bridgeDeployTx);

  // Deploy token service
  const tokenServiceDeployTx = await tokenService.deploy(); // 14_051_000
  await tokenService.wait(tokenServiceDeployTx);

  // Deploy council
  const councilDeployTx = await council.deploy(); // 29_917_000
  await council.wait(councilDeployTx)

  const bridgeCouncilDeployTx = await bridgeCouncil.deploy();
  await bridgeCouncil.wait(bridgeCouncilDeployTx);

  const serviceCouncilDeployTx = await tokenServiceCouncil.deploy();
  await tokenServiceCouncil.wait(serviceCouncilDeployTx);

  //Initialize council
  const [initializeCouncilTx] = await council.initialize(initialCouncilMembers, initialCouncilThreshold);
  await council.wait(initializeCouncilTx);

  //Initialize bridge
  const [initializeBridgeTx] = await bridge.initialize_tb(initialAttestors, initialAttestorThreshold, bridgeCouncil.address());
  await bridge.wait(initializeBridgeTx)

  // Initialize token service
  const [initializeTokenServiceTx] = await tokenService.initialize_ts(tokenServiceCouncil.address());
  await tokenService.wait(initializeTokenServiceTx);
  
  // TODO : Discuss possibility of adding release fund in tokenService council since that will make all token service related thing to be put in tokenService council
  // Initialize holding contract
  const [initializeHoldingTx] = await holding.initialize_holding(tokenService.address());
  await tokenServiceCouncil.wait(initializeHoldingTx);

};