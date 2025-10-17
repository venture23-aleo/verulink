import { ExecutionMode } from "@doko-js/core";
import { Vlink_token_service_cd_v2Contract } from "../../artifacts/js/vlink_token_service_cd_v2";
import { Vlink_token_service_cd_cuncl_v2Contract } from "../../artifacts/js/vlink_token_service_cd_cuncl_v2";
import { Vlink_holding_cd_v2Contract } from "../../artifacts/js/vlink_holding_cd_v2";
import { Vlink_token_bridge_v2Contract } from "../../artifacts/js/vlink_token_bridge_v2";
import { Vlink_council_v2Contract } from "../../artifacts/js/vlink_council_v2";
import { Vlink_bridge_council_v2Contract } from "../../artifacts/js/vlink_bridge_council_v2";
import { attestor1, attestor2, attestor3, attestor4, attestor5, attestorThreshold, council1, council2, council3, council4, council5, councilThreshold } from "../../utils/mainnet.data";
import { Vlink_token_service_sealance_v1Contract } from "../../artifacts/js/vlink_token_service_sealance_v1";
import { Vlink_council_sealance_v1Contract } from "../../artifacts/js/vlink_council_sealance_v1";
import { Vlink_holding_sealance_v1Contract } from "../../artifacts/js/vlink_holding_sealance_v1";
import { Compliant_token_templateContract } from "../../artifacts/js/compliant_token_template";


const mode = ExecutionMode.SnarkExecute;

const tokenServicePaxos = new Vlink_token_service_sealance_v1Contract({ mode: mode });
const tokenServicePaxosCouncil = new Vlink_council_sealance_v1Contract({ mode: mode });
const holdingPaxos= new Vlink_holding_sealance_v1Contract({ mode: mode });
const tokenPaxos = new Compliant_token_templateContract({ mode: mode });


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

