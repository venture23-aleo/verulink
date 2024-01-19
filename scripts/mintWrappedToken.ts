import { InPacketFull, TbAddAttestor } from "../artifacts/js/types";
import { evm2AleoArr, hashStruct } from "../utils/utils";

import * as js2leo from "../artifacts/js/js2leo";

import {
  aleoChainId,
  aleoTsProgramAddr,
  ethChainId,
  ethUser,
  wusdcTokenAddr,
} from "./data/testnet.data";
import { Token_bridge_v0001Contract } from "../artifacts/js/token_bridge_v0001";
import { ethTsContractAddr } from "./data/testnet.data";
import { Wusdc_token_v0001Contract } from "../artifacts/js/wusdc_token_v0001";
import { Wusdc_connector_v0001Contract } from "../artifacts/js/wusdc_connector_v0001";

const mintWrappedToken = async () => {
  const bridge = new Token_bridge_v0001Contract({
    mode: "execute",
    priorityFee: 10_000,
  });
  const wusdcToken = new Wusdc_token_v0001Contract({ mode: "execute", priorityFee: 10_000 });
  const wusdcConnecter = new Wusdc_connector_v0001Contract({ mode: "execute" , priorityFee: 10_000});

  const aleoUser =
    "aleo1zyt7ldc0t3ung0h5sg4k65wjtnmsa6hatagjccxr7s84h93tpuxqf9zse9";

  const incomingSequence = BigInt(Math.round(Math.random() * Number.MAX_SAFE_INTEGER));
  const incomingAmount = BigInt(10000);
  const incomingHeight = 10;
  let initialBalance = BigInt(0);

  // Create a packet
  const packet: InPacketFull = {
    version: 0,
    sequence: incomingSequence,
    source: {
      chain_id: ethChainId,
      addr: evm2AleoArr(ethTsContractAddr),
    },
    destination: {
      chain_id: aleoChainId,
      addr: aleoTsProgramAddr,
    },
    message: {
      token: wusdcTokenAddr,
      sender: evm2AleoArr(ethUser),
      receiver: aleoUser,
      amount: incomingAmount,
    },
    height: incomingHeight,
  };

  // Attest to a packet
  const attestTx = await bridge.attest(packet, true);

  // @ts-ignore
  await attestTx.wait();

  try {
    initialBalance = await wusdcToken.account(aleoUser);
  } catch (e) {
    initialBalance = BigInt(0);
  }
  const tx = await wusdcConnecter.wusdc_receive(
    evm2AleoArr(ethUser), // sender
    aleoUser, // receiver
    aleoUser, // actual receiver
    incomingAmount,
    incomingSequence,
    incomingHeight
  );

  // @ts-ignore
  await tx.wait();

  let finalBalance = await wusdcToken.account(aleoUser);
  console.log(`Balance of ${aleoUser}: ${initialBalance} -> ${finalBalance}`);

};

mintWrappedToken();
