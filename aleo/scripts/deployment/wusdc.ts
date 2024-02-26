
import { Wusdc_token_v0003Contract } from "../../artifacts/js/wusdc_token_v0003";
import { Wusdc_holding_v0003Contract } from "../../artifacts/js/wusdc_holding_v0003";
import { Wusdc_connector_v0003_0Contract } from "../../artifacts/js/wusdc_connector_v0003_0";

export const deployWusdc = async () => {
  const wusdcToken = new Wusdc_token_v0003Contract({mode: "execute"});
  const wusdcHolding = new Wusdc_holding_v0003Contract({mode: "execute"});
  const wusdcConnecter = new Wusdc_connector_v0003_0Contract({mode: "execute"});

  // Deploy token
  const wusdcTokenDeployTx = await wusdcToken.deploy(); // 11_912_000
  await wusdcToken.wait(wusdcTokenDeployTx);

  // Deploy holding
  const wusdcHoldingDeployTx = await wusdcHolding.deploy(); // 5_039_000
  await wusdcHolding.wait(wusdcHoldingDeployTx);

  // Deploy connector
  const wusdcConnectorDeployTx = await wusdcConnecter.deploy(); // 7_653_000
  await wusdcConnecter.wait(wusdcConnectorDeployTx);

  // Initialize wusdc
  const [initializeWusdcTx] = await wusdcConnecter.initialize_wusdc(); // 239_906
  await wusdcConnecter.wait(initializeWusdcTx);

}