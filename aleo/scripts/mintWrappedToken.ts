import { InPacket, TbAddAttestor } from "../artifacts/js/types";

import * as js2leo from "../artifacts/js/js2leo";

import {
  aleoChainId,
  ethChainId,
  ethUser,
} from "./testnet.data";
import { Token_bridge_v0001Contract } from "../artifacts/js/token_bridge_v0001";
import { ethTsContractAddr } from "./testnet.data";
import { Wusdc_token_v0001Contract } from "../artifacts/js/wusdc_token_v0001";
import { Wusdc_connector_v0001Contract } from "../artifacts/js/wusdc_connector_v0001";
import { Address, PrivateKey } from "@aleohq/sdk";
import { evm2AleoArr } from "../utils/ethAddress";
import { signPacket } from "../utils/sign";
import { ALEO_ZERO_ADDRESS } from "../utils/constants";
import { Token_service_v0001Contract } from "../artifacts/js/token_service_v0001";

const bridge = new Token_bridge_v0001Contract({
  mode: "execute",
  priorityFee: 10_000,
});
const wusdcToken = new Wusdc_token_v0001Contract({
  mode: "execute",
  priorityFee: 10_000,
});
const wusdcConnecter = new Wusdc_connector_v0001Contract({
  mode: "execute",
  priorityFee: 10_000,
});
const tokenService = new Token_service_v0001Contract({
  mode: "execute",
  priorityFee: 10_000,
});

const mintWrappedToken = async (aleoUser: string, amount: bigint) => {
  const incomingSequence = BigInt(
    Math.round(Math.random() * Number.MAX_SAFE_INTEGER)
  );
  const incomingHeight = 10;
  let initialBalance = BigInt(0);

  // Create a packet
  const packet: InPacket = {
    version: 0,
    sequence: incomingSequence,
    source: {
      chain_id: ethChainId,
      addr: evm2AleoArr(ethTsContractAddr),
    },
    destination: {
      chain_id: aleoChainId,
      addr: tokenService.address(),
    },
    message: {
      token: wusdcToken.address(),
      sender: evm2AleoArr(ethUser),
      receiver: aleoUser,
      amount: amount,
    },
    height: incomingHeight,
  };

  const signature = signPacket(
    packet,
    true, // screening passed
    bridge.config.privateKey
  );
  const signatures = [signature, signature, signature, signature, signature];

  const signers = [
    Address.from_private_key(
      PrivateKey.from_string(bridge.config.privateKey)
    ).to_string(),
    ALEO_ZERO_ADDRESS,
    ALEO_ZERO_ADDRESS,
    ALEO_ZERO_ADDRESS,
    ALEO_ZERO_ADDRESS,
  ];

  try {
    initialBalance = await wusdcToken.account(aleoUser);
  } catch (e) {
    initialBalance = BigInt(0);
  }
  const tx = await wusdcConnecter.wusdc_receive(
    evm2AleoArr(ethUser), // sender
    aleoUser, // receiver
    aleoUser, // actual receiver
    amount,
    incomingSequence,
    incomingHeight,
    signers,
    signatures
  );

  // @ts-ignore
  await tx.wait();

  let finalBalance = await wusdcToken.account(aleoUser);
  console.log(`Balance of ${aleoUser}: ${initialBalance} -> ${finalBalance}`);
};

mintWrappedToken(
  "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 
  BigInt(100_000)
);