import { ExecutionMode } from "@doko-js/core";
import { Vlink_token_service_cd_v2Contract } from "../../artifacts/js/vlink_token_service_cd_v2";
import { Vlink_token_service_cd_cuncl_v2Contract } from "../../artifacts/js/vlink_token_service_cd_cuncl_v2";
import { Vlink_holding_cd_v2Contract } from "../../artifacts/js/vlink_holding_cd_v2";
import { Vlink_token_bridge_v2Contract } from "../../artifacts/js/vlink_token_bridge_v2";
import { Vlink_council_v2Contract } from "../../artifacts/js/vlink_council_v2";
import { Vlink_bridge_council_v2Contract } from "../../artifacts/js/vlink_bridge_council_v2";
import { attestor1, attestor2, attestor3, attestor4, attestor5, attestorThreshold, council1, council2, council3, council4, council5, councilThreshold } from "../../utils/mainnet.data";


const mode = ExecutionMode.SnarkExecute;
const tokenServiceWAleo = new Vlink_token_service_cd_v2Contract({ mode: mode });
const tokenServiceWAleoCouncil = new Vlink_token_service_cd_cuncl_v2Contract({ mode: mode });
const holdingWAleo = new Vlink_holding_cd_v2Contract({ mode: mode });
const bridge = new Vlink_token_bridge_v2Contract({ mode, priorityFee: 10_000 });
const council = new Vlink_council_v2Contract({ mode, priorityFee: 10_000 });
const bridgeCouncil = new Vlink_bridge_council_v2Contract({ mode, priorityFee: 10_000 });


const intialize = async (initialCouncilList: string[], initialCouncilThresholdData: number, initialAttestorsList: string[], initialAttestorThresholdData: number) => {

  //Initialize council
  console.log(`Initializing council with council members: ${initialCouncilList}` + ` and threshold: ${initialCouncilThresholdData}`);
  const initializeCouncilTx = await council.initialize(initialCouncilList, initialCouncilThresholdData);
  await initializeCouncilTx.wait();

  //Initialize bridge
  console.log(`Initializing bridge with attestors: ${initialAttestorsList}` + ` and threshold: ${initialAttestorThresholdData}`);
  const initializeBridgeTx = await bridge.initialize_tb(initialAttestorsList, initialAttestorThresholdData, bridgeCouncil.address());
  await initializeBridgeTx.wait();

  // Initialize token service
  console.log(`Initializing token service with token service address: ${tokenServiceWAleoCouncil.address()}`);
  const initializeTokenServiceTx = await tokenServiceWAleo.initialize_ts(tokenServiceWAleoCouncil.address());
  await initializeTokenServiceTx.wait();

  // Initialize holding contract
  console.log(`Initializing holding contract with token service address: ${tokenServiceWAleo.address()}`);
  const initializeHoldingTx = await holdingWAleo.initialize_holding(tokenServiceWAleo.address());
  await initializeHoldingTx.wait();
}



intialize([council1, council2, council3, council4, council5], councilThreshold, [attestor1, attestor2, attestor3, attestor4, attestor5], attestorThreshold)

