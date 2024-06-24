import { Token_bridge_v0003Contract } from "../../artifacts/js/token_bridge_v0003";
import { Token_service_v0003Contract } from "../../artifacts/js/token_service_v0003";
import { CouncilContract } from "../../artifacts/js/council";
import { Bridge_councilContract } from "../../artifacts/js/bridge_council";
import { Token_service_councilContract } from "../../artifacts/js/token_service_council";
import { ExecutionMode } from "@doko-js/core";

const mode = ExecutionMode.SnarkExecute;

export const deployMainPrograms = async (initialAttestors: string[], initialCouncilMembers: string[], initialAttestorThreshold: number, initialCouncilThreshold: number) => {

  const bridge = new Token_bridge_v0003Contract({mode, priorityFee: 10_000});
  const tokenService = new Token_service_v0003Contract({mode, priorityFee: 10_000});
  const council = new CouncilContract({mode, priorityFee: 10_000});
  const bridgeCouncil = new Bridge_councilContract({mode, priorityFee: 10_000});
  const tokenServiceCouncil = new Token_service_councilContract({mode, priorityFee: 10_000});

  // Deploy token bridge
  // bridge.connect("aleo1s9jt6t6esqg4caw0lzhr393f80jd5mw2w4mn0hudze60fvnrlq9s9ryctf");
  // const bridgeDeployTx = await bridge.deploy(); // 19_840_000
  // await bridge.wait(bridgeDeployTx);

  // Deploy token service
  // const tokenServiceDeployTx = await tokenService.deploy(); // 14_051_000
  // await tokenService.wait(tokenServiceDeployTx);

  // // Deploy council
  const councilDeployTx = await council.deploy(); // 29_917_000
  await council.wait(councilDeployTx)

  // const bridgeCouncilDeployTx = await bridgeCouncil.deploy();
  // await bridgeCouncil.wait(bridgeCouncilDeployTx);

  // const serviceCouncilDeployTx = await tokenServiceCouncil.deploy();
  // await tokenServiceCouncil.wait(serviceCouncilDeployTx);

  // //Initialize council
  // const [initializeCouncilTx] = await council.initialize(initialCouncilMembers, initialCouncilThreshold);
  // await council.wait(initializeCouncilTx);

  // //Initialize bridge
  // const [initializeBridgeTx] = await bridge.initialize_tb(initialAttestors, initialAttestorThreshold, bridgeCouncil.address());
  // await bridge.wait(initializeBridgeTx)

  // // Initialize token service
  // const [initializeTokenServiceTx] = await tokenService.initialize_ts(tokenServiceCouncil.address());
  // await tokenService.wait(initializeTokenServiceTx);
  
};