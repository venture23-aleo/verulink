import { ExecutionMode } from "@doko-js/core";
import { Vlink_token_service_cd_v2Contract } from "../../artifacts/js/vlink_token_service_cd_v2";
import { Vlink_token_service_cd_cuncl_v2Contract } from "../../artifacts/js/vlink_token_service_cd_cuncl_v2";
import { Vlink_holding_cd_v2Contract } from "../../artifacts/js/vlink_holding_cd_v2";

const mode = ExecutionMode.SnarkExecute;

export const deployMainPrograms = async () => {

const tokenServiceWAleo = new Vlink_token_service_cd_v2Contract({ mode: mode });
const tokenServiceWAleoCouncil = new Vlink_token_service_cd_cuncl_v2Contract({ mode: mode });
const holdingWAleo = new Vlink_holding_cd_v2Contract({ mode: mode });


  // Deploy holding
  const wusdcHoldingDeployTx = await holdingWAleo.deploy(); 
  await wusdcHoldingDeployTx.wait();

  // // Deploy token service
  const tokenServiceDeployTx = await tokenServiceWAleo.deploy(); 
  await tokenServiceDeployTx.wait();

  const serviceCouncilDeployTx = await tokenServiceWAleoCouncil.deploy();
  await serviceCouncilDeployTx.wait();

  // Initialize token service
  const initializeTokenServiceTx = await tokenServiceWAleo.initialize_ts(tokenServiceWAleoCouncil.address());
  await initializeTokenServiceTx.wait();

  // Initialize holding contract
  const initializeHoldingTx = await holdingWAleo.initialize_holding(tokenServiceWAleo.address());
  await initializeHoldingTx.wait();

};
