import { Token_bridge_v0001Contract } from "../../artifacts/js/token_bridge_v0001";
import { Token_service_v0001Contract } from "../../artifacts/js/token_service_v0001";
import { Council_v0001Contract } from "../../artifacts/js/council_v0001";

const deployMainPrograms = async () => {

  const bridge = new Token_bridge_v0001Contract({mode: "execute", priorityFee: 10_000});
  const tokenService = new Token_service_v0001Contract({mode: "execute", priorityFee: 10_000});
  const council = new Council_v0001Contract({mode: "execute", priorityFee: 10_000});

  let tx

  // Deploy token bridge
  tx = await bridge.deploy(); // 19_840_000
  await tx.wait()

  // Deploy token service
  tx = await tokenService.deploy(); // 14_051_000
  await tx.wait();

  // Deploy council
  tx = await council.deploy(); // 29_917_000
  await tx.wait();

  // TODO: Initialize bridge

  // TODO: Initialize token service

  // TODO: Initialize council
  
};

deployMainPrograms();