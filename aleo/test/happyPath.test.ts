import { Token_bridgeContract } from "../artifacts/js/token_bridge";
import { Token_serviceContract } from "../artifacts/js/token_service";
import { InPacketFull, PacketId, } from "../artifacts/js/types";
import { Wrapped_tokensContract } from "../artifacts/js/wrapped_tokens";
import { Wusdc_connectorContract } from "../artifacts/js/wusdc_connector";
import { Wusdc_tokenContract } from "../artifacts/js/wusdc_token";
import { aleoChainId, aleoTsContract, aleoUser1, ethChainId, ethTsContract, ethUser, wusdcTokenAddr, wusdcConnectorAddr} from "./mockData";

import { evm2AleoArr } from "./utils";

const bridge = new Token_bridgeContract({ mode: "execute"});
const tokenService = new Token_serviceContract({ mode: "execute" })
const wusdcToken = new Wusdc_tokenContract({ mode: "execute" });
const wusdcConnecter = new Wusdc_connectorContract({mode: "execute"});

describe("Happy Path", () => {

  const incomingSequence = 2;
  const amount = BigInt(10000);
  const height = 10;

  test("Attest A Packet", async () => {

    // Create a packet
    const packet: InPacketFull = {
      version: 0,
      sequence: incomingSequence,
      source: {
        chain_id: ethChainId,
        addr: evm2AleoArr(ethTsContract),
      },
      destination: {
        chain_id: aleoChainId,
        addr: aleoTsContract,
      },
      message: {
        token: wusdcTokenAddr,
        sender: evm2AleoArr(ethUser),
        receiver: aleoUser1,
        amount
      },
      height: 10,
    };

    // Attest to a packet
    const tx = await bridge.attest(packet, true);

    // @ts-ignore
    await tx.wait()

  }, 200_000),

  test("Receive a Packet", async () => {

    const tx = await wusdcConnecter.wusdc_receive(
      evm2AleoArr(ethUser), // sender
      aleoUser1, // receiver
      aleoUser1, // actual receiver
      amount,
      incomingSequence, 
      height
    );

    // @ts-ignore
    await tx.wait()

    let balance = await wusdcToken.account(aleoUser1)
    console.log(balance)

  }, 200_000),


  test("Send a packet", async () => {
    // Send the packet to ethereum
    const outgoingSequence = 1;
    const tx = await wusdcConnecter.wusdc_send(
      evm2AleoArr(ethUser),
      BigInt(101),
    )
    // @ts-ignore
    await tx.wait()

    const balance = await wusdcToken.account(aleoUser1);
    console.log(balance)

    const packetKey: PacketId = {
      chain_id: ethChainId,
      sequence: outgoingSequence
    }
    const outPacket = await bridge.out_packets(packetKey)
    console.log(outPacket);
    

  }, 200_000);

});
