import { Vlink_token_bridge_v2Contract } from "../../artifacts/js/vlink_token_bridge_v2";
import { Vlink_token_service_v2Contract } from "../../artifacts/js/vlink_token_service_v2";
import { Vlink_council_v2Contract } from "../../artifacts/js/vlink_council_v2";
import { Vlink_bridge_council_v2Contract } from "../../artifacts/js/vlink_bridge_council_v2";
import { Vlink_token_service_council_v2Contract } from "../../artifacts/js/vlink_token_service_council_v2";
import { Token_registryContract } from "../../artifacts/js/token_registry";
import { Vlink_holding_v2Contract } from "../../artifacts/js/vlink_holding_v2";
import { ExecutionMode } from "@doko-js/core";

const mode = ExecutionMode.SnarkExecute;

export const deployMainPrograms = async (initialAttestors: string[], initialCouncilMembers: string[], initialAttestorThreshold: number, initialCouncilThreshold: number) => {

  const bridge = new Vlink_token_bridge_v2Contract({ mode, priorityFee: 10_000 });
  const tokenService = new Vlink_token_service_v2Contract({ mode, priorityFee: 10_000 });
  const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });
  const bridgeCouncil = new Vlink_bridge_council_v2Contract({ mode, priorityFee: 10_000 });
  const tokenServiceCouncil = new Vlink_token_service_council_v2Contract({ mode, priorityFee: 10_000 });
  const mtsp = new Token_registryContract({ mode, priorityFee: 10_000 });
  const holding = new Vlink_holding_v2Contract({ mode, priorityFee: 10_000 });

  //Deploy mtsp for local devnet only
  // const mtspDeployTx = await mtsp.deploy();
  // await mtsp.wait(mtspDeployTx);

  // Deploy holding
  const wusdcHoldingDeployTx = await holding.deploy(); // 5_039_000
  await wusdcHoldingDeployTx.wait();

  // Deploy token bridge
  // // bridge.connect("aleo1s9jt6t6esqg4caw0lzhr393f80jd5mw2w4mn0hudze60fvnrlq9s9ryctf");
  const bridgeDeployTx = await bridge.deploy(); // 19_840_000
  await bridgeDeployTx.wait();

  // // Deploy token service
  const tokenServiceDeployTx = await tokenService.deploy(); // 14_051_000
  await tokenServiceDeployTx.wait();

  // Deploy council
  const councilDeployTx = await council.deploy(); // 29_917_000
  await councilDeployTx.wait()

  const bridgeCouncilDeployTx = await bridgeCouncil.deploy();
  await bridgeCouncilDeployTx.wait();

  const serviceCouncilDeployTx = await tokenServiceCouncil.deploy();
  await serviceCouncilDeployTx.wait();

  //Initialize council
  const initializeCouncilTx = await council.initialize(initialCouncilMembers, initialCouncilThreshold);
  await initializeCouncilTx.wait();

  //Initialize bridge
  const initializeBridgeTx = await bridge.initialize_tb(initialAttestors, initialAttestorThreshold, bridgeCouncil.address());
  await initializeBridgeTx.wait()

  // Initialize token service
  const initializeTokenServiceTx = await tokenService.initialize_ts(tokenServiceCouncil.address());
  await initializeTokenServiceTx.wait();

  // TODO : Discuss possibility of adding release fund in tokenService council since that will make all token service related thing to be put in tokenService council
  // Initialize holding contract
  const initializeHoldingTx = await holding.initialize_holding(tokenService.address());
  await initializeHoldingTx.wait();

};
