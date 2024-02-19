import { Token_bridge_v0003Contract } from "../../artifacts/js/token_bridge_v0003";
import { Token_service_v0003Contract } from "../../artifacts/js/token_service_v0003";
import { Council_v0003Contract } from "../../artifacts/js/council_v0003";

export const deployMainPrograms = async (initialAttestors: string[], initialCouncilMembers: string[], initialAttestorThreshold: number, initialCouncilThreshold: number) => {

  const bridge = new Token_bridge_v0003Contract({mode: "execute", priorityFee: 10_000});
  const tokenService = new Token_service_v0003Contract({mode: "execute", priorityFee: 10_000});
  const council = new Council_v0003Contract({mode: "execute", priorityFee: 10_000});

  // Deploy token bridge
  const bridgeDeployTx = await bridge.deploy(); // 19_840_000
  await bridge.wait(bridgeDeployTx);

  // Deploy token service
  const tokenServiceDeployTx = await tokenService.deploy(); // 14_051_000
  await tokenService.wait(tokenServiceDeployTx);

  // Deploy council
  const councilDeployTx = await council.deploy(); // 29_917_000
  await council.wait(councilDeployTx)

  // Initialize council
  const [initializeCouncilTx] = await council.initialize(initialCouncilMembers, initialCouncilThreshold);
  await council.wait(initializeCouncilTx);

  const [initializeBridgeTx] = await bridge.initialize_tb(initialAttestors, initialAttestorThreshold, council.address());
  await bridge.wait(initializeBridgeTx)

  // Initialize token service
  const [initializeTokenServiceTx] = await tokenService.initialize_ts(council.address());
  await tokenService.wait(initializeTokenServiceTx);
  
};