import { Token_bridgeContract } from "../artifacts/js/token_bridge";
import { Token_serviceContract } from "../artifacts/js/token_service";
import { InPacketFull, PacketId, TokenAccount, TokenOrigin } from "../artifacts/js/types";
import { Wrapped_tokenContract } from "../artifacts/js/wrapped_token";
import { aleoChainId, aleoTsContract, aleoUser, ethChainId, ethTsContract, ethUser, usdcContractAddr, wUSDCProgramAddr } from "./mockData";

import { evm2AleoArr } from "./utils";

const bridge = new Token_bridgeContract({ networkName: "testnet3", privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH", mode: "execute"});
const tokenService = new Token_serviceContract({ networkName: "testnet3", privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH", mode: "execute" })
const wrappedToken = new Wrapped_tokenContract({ networkName: "testnet3", privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH", mode: "execute" });

describe("Happy Path", () => {

  const sequence = 1;
  const amount = BigInt(10000);
  const height = 10;

  test("Attest A Packet", async () => {

    // Create a packet
    const packet: InPacketFull = {
      version: 0,
      sequence,
      source: {
        chain_id: ethChainId,
        addr: evm2AleoArr(ethTsContract),
      },
      destination: {
        chain_id: aleoChainId,
        addr: aleoTsContract,
      },
      message: {
        token: wUSDCProgramAddr,
        sender: evm2AleoArr(ethUser),
        receiver: aleoUser,
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

    // Consume the packet
    const origin: TokenOrigin = {
      chain_id: ethChainId,
      token_service_address: evm2AleoArr(ethTsContract),
      token_address: evm2AleoArr(usdcContractAddr)
    };
    const tx = await tokenService.token_receive(origin, wUSDCProgramAddr, evm2AleoArr(ethUser), aleoUser, aleoUser, amount, sequence, height);

    // @ts-ignore
    await tx.wait()

    let key: TokenAccount = {
      user: aleoUser,
      token_id: wUSDCProgramAddr
    }
    let balance = await wrappedToken.token_balances(key)
    console.log(balance)
  }, 200_000),


  test("Send a packet", async () => {
    // Send the packet to ethereum
    const tx = await tokenService.token_send(
      wUSDCProgramAddr,
      evm2AleoArr(ethUser),
      BigInt(101),
      {
        chain_id: ethChainId,
        token_service_address: evm2AleoArr(ethTsContract),
        token_address: evm2AleoArr(usdcContractAddr)
      }
    )
    // @ts-ignore
    await tx.wait()

    let key: TokenAccount = {
      user: aleoUser,
      token_id: wUSDCProgramAddr
    }
    const balance = await wrappedToken.token_balances(key)
    console.log(balance)

    const packetKey: PacketId = {
      chain_id: ethChainId,
      sequence
    }
    bridge.out_packets(packetKey)

  }, 200_000);

});
