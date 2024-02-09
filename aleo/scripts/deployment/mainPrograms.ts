import { Token_bridge_v0002Contract } from "../../artifacts/js/token_bridge_v0002";
import { Token_service_v0002Contract } from "../../artifacts/js/token_service_v0002";
import { Council_v0002Contract } from "../../artifacts/js/council_v0002";

export const deployMainPrograms = async (initialAttestors: string[], initialCouncilMembers: string[], initialAttestorThreshold: number, initialCouncilThreshold: number) => {

  const bridge = new Token_bridge_v0002Contract({mode: "execute", priorityFee: 10_000});
  const tokenService = new Token_service_v0002Contract({mode: "execute", priorityFee: 10_000});
  const council = new Council_v0002Contract({mode: "execute", priorityFee: 10_000});

  // Deploy token bridge
  const bridgeDeployTx = await bridge.deploy(); // 19_840_000
  await bridgeDeployTx.wait()

  // Deploy token service
  const tokenServiceDeployTx = await tokenService.deploy(); // 14_051_000
  await tokenServiceDeployTx.wait();

  // Deploy council
  const councilDeployTx = await council.deploy(); // 29_917_000
  await councilDeployTx.wait();

  // Initialize council
  const initializeCouncilTx = await council.initialize(initialCouncilMembers, initialCouncilThreshold);
  // @ts-ignore
  await initializeCouncilTx.wait()
  

  const initializeBridgeTx = await bridge.initialize_tb(initialAttestors, initialAttestorThreshold, council.address());
  // @ts-ignore
  await initializeBridgeTx.wait()

  // Initialize token service
  const initializeTokenServiceTx = await tokenService.initialize_ts(council.address());
  // @ts-ignore
  await initializeTokenServiceTx.wait();
  
};