import { ExecutionMode } from "@doko-js/core";
import { Vlink_token_service_cd_v7Contract } from "../../artifacts/js/vlink_token_service_cd_v7";
import { Vlink_token_service_cd_cncl_v07Contract } from "../../artifacts/js/vlink_token_service_cd_cncl_v07";
import { Vlink_holding_cd_v7Contract } from "../../artifacts/js/vlink_holding_cd_v7";
import { Vlink_token_bridge_v7Contract } from "../../artifacts/js/vlink_token_bridge_v7";
import { Vlink_council_v07Contract } from "../../artifacts/js/vlink_council_v07";
import { Vlink_bridge_council_v07Contract } from "../../artifacts/js/vlink_bridge_council_v07";

const mode = ExecutionMode.SnarkExecute;

const tokenServiceWAleo = new Vlink_token_service_cd_v7Contract({ mode: mode });
const tokenServiceWAleoCouncil = new Vlink_token_service_cd_cncl_v07Contract({ mode: mode });
const holdingWAleo = new Vlink_holding_cd_v7Contract({ mode: mode });
const bridge = new Vlink_token_bridge_v7Contract({ mode, priorityFee: 10_000 });
const council = new Vlink_council_v07Contract({ mode, priorityFee: 10_000 });
const bridgeCouncil = new Vlink_bridge_council_v07Contract({ mode, priorityFee: 10_000 });

export const deployWaleoPrograms = async () => {

  // Deploy holding
  console.log("Deploying holding");
  const wusdcHoldingDeployTx = await holdingWAleo.deploy();
  await wusdcHoldingDeployTx.wait();

  // Deploy bridge
  console.log("Deploying bridge");
  const bridgeDeployTx = await bridge.deploy();
  await bridgeDeployTx.wait();

  // Deploy token service
  console.log("Deploying token service");
  const tokenServiceDeployTx = await tokenServiceWAleo.deploy();
  await tokenServiceDeployTx.wait();

  // Deploy council
  console.log("Deploying council");
  const councilDeployTx = await council.deploy();
  await councilDeployTx.wait();

  // Deploy BridgeCouncil
  console.log("Deploying BridgeCouncil");
  const bridgeCouncilDeployTx = await bridgeCouncil.deploy();
  await bridgeCouncilDeployTx.wait();

  // Deploy tokenService Council
  console.log("Deploying tokenService Council");
  const serviceCouncilDeployTx = await tokenServiceWAleoCouncil.deploy();
  await serviceCouncilDeployTx.wait();
};

// async function getAddresses() {
//   console.log(tokenServiceWAleo.address())
//   console.log(bridge.address())
// }
// getAddresses()

deployWaleoPrograms();