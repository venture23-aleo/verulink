import { ExecutionMode } from "@doko-js/core";
import { Vlink_token_service_cd_v2Contract } from "../../artifacts/js/vlink_token_service_cd_v2";
import { Vlink_token_service_cd_cuncl_v2Contract } from "../../artifacts/js/vlink_token_service_cd_cuncl_v2";
import { Vlink_holding_cd_v2Contract } from "../../artifacts/js/vlink_holding_cd_v2";
import { Vlink_token_bridge_v2Contract } from "../../artifacts/js/vlink_token_bridge_v2";
import { Vlink_council_v2Contract } from "../../artifacts/js/vlink_council_v2";
import { Vlink_bridge_council_v2Contract } from "../../artifacts/js/vlink_bridge_council_v2";
import { Vlink_token_service_sealance_v1Contract } from "../../artifacts/js/vlink_token_service_sealance_v1";
import { Vlink_council_sealance_v1Contract } from "../../artifacts/js/vlink_council_sealance_v1";
import { Vlink_holding_sealance_v1Contract } from "../../artifacts/js/vlink_holding_sealance_v1";
import { Compliant_token_templateContract } from "../../artifacts/js/compliant_token_template";

const mode = ExecutionMode.SnarkExecute;

const tokenServicePaxos = new Vlink_token_service_sealance_v1Contract({ mode: mode });
const tokenServicePaxosCouncil = new Vlink_council_sealance_v1Contract({ mode: mode });
const holdingPaxos= new Vlink_holding_sealance_v1Contract({ mode: mode });
const tokenPaxos = new Compliant_token_templateContract({ mode: mode });


export const deployPaxosPrograms = async () => {

 // Deploy paxos
  console.log("Deploying sealance contracts paxos");
  const tokenDeployTx = await tokenPaxos.deploy();
  await tokenDeployTx.wait();

  // Deploy holding
  console.log("Deploying holding");
  const wusdcHoldingDeployTx = await holdingPaxos.deploy();
  await wusdcHoldingDeployTx.wait();

  // Deploy token service
  console.log("Deploying token service");
  const tokenServiceDeployTx = await tokenServicePaxos.deploy();
  await tokenServiceDeployTx.wait();

  // Deploy tokenService Council
  console.log("Deploying tokenService Council");
  const serviceCouncilDeployTx = await tokenServicePaxosCouncil.deploy();
  await serviceCouncilDeployTx.wait();
};



deployPaxosPrograms();