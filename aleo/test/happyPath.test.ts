import { InPacketFull, PacketId, } from "../artifacts/js/types";
import { Token_bridge_v0001Contract } from "../artifacts/js/token_bridge_v0001";
import { Wusdc_token_v0001Contract } from "../artifacts/js/wusdc_token_v0001";
import { Wusdc_connector_v0001Contract } from "../artifacts/js/wusdc_connector_v0001";

import { aleoChainId, aleoUser1, ethChainId, ethUser, wusdcTokenAddr, wusdcConnectorAddr, aleoTsProgramAddr, ethTsContractAddr} from "../utils/testnet.data";

import { evm2AleoArr } from "../utils/utils";

  const bridge = new Token_bridge_v0001Contract({mode: "execute"});
  const wusdcToken = new Wusdc_token_v0001Contract({mode: "execute"});
  const wusdcConnecter = new Wusdc_connector_v0001Contract({mode: "execute"});

describe("Happy Path", () => {

  const incomingSequence = BigInt(2);
  const amount = BigInt(10000);
  const height = 10;

  test("Attest A Packet", async () => {

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
        receiver: aleoUser1,
        amount
      },
      height: 10,
    };
    console.log(packet)

    // Attest to a packet
    const tx = await bridge.attest(packet, true);

    // @ts-ignore
    await tx.wait()

  }, 200_000) 

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
    const outgoingSequence = BigInt(1);
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
    

  }, 200_000)

});
