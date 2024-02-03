
import { Wusdc_token_v0001Contract } from "../../artifacts/js/wusdc_token_v0001";
import { Wusdc_holding_v0001Contract } from "../../artifacts/js/wusdc_holding_v0001";
import { Wusdc_connector_v0001Contract } from "../../artifacts/js/wusdc_connector_v0001";

const deployWusdc = async () => {
  const wusdcToken = new Wusdc_token_v0001Contract({mode: "execute"});
  const wusdcHolding = new Wusdc_holding_v0001Contract({mode: "execute"});
  const wusdcConnecter = new Wusdc_connector_v0001Contract({mode: "execute"});

  let tx

  // Deploy token
  tx = await wusdcToken.deploy(); // 11_912_000
  await tx.wait();

  // Deploy holding
  tx = await wusdcHolding.deploy(); // 5_039_000
  await tx.wait();

  // Deploy connector
  tx = await wusdcConnecter.deploy(); // 7_653_000
  await tx.wait();

  await wusdcConnecter.initialize_wusdc(); // 239_906

}

deployWusdc();