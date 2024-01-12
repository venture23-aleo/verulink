import { Token_bridgeContract } from "../artifacts/js/token_bridge";
import { Token_serviceContract } from "../artifacts/js/token_service";
import { InPacketFull, TokenAccount, TokenOrigin } from "../artifacts/js/types";
import { Wrapped_tokensContract } from "../artifacts/js/wrapped_tokens";
import { aleoChainId, aleoTsContract, aleoUser, councilProgram, ethChainId, ethTsContract, ethUser, usdcContractAddr, wUSDCProgramAddr } from "./mockData";

import { evm2AleoArr } from "./utils";

const bridge = new Token_bridgeContract({ mode: "execute"});
const tokenService = new Token_serviceContract({ mode: "execute" })
const wrappedToken = new Wrapped_tokensContract({ mode: "execute" });

describe("Happy Path", () => {

  test("Receive A Packet", async () => {

    const sequence = 101;
    const amount = BigInt(10000);
    const height = 10;

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
      height,
    };

    // Attest to a packet
    let tx = await bridge.attest(packet, false);

    // @ts-ignore
    await tx.wait()
  }, 100_000)

  test("Consume A Packet", async () => {
    // Consume the packet
    const origin: TokenOrigin = {
      chain_id: ethChainId,
      token_service_address: evm2AleoArr(ethTsContract),
      token_address: evm2AleoArr(usdcContractAddr)
    };
    const tx = await tokenService.token_receive(origin, wUSDCProgramAddr, evm2AleoArr(ethUser), aleoUser, councilProgram, amount, sequence, height);
    
    // @ts-ignore
    await tx.wait()

    let key: TokenAccount = {
      user: councilProgram,
      token_id: wUSDCProgramAddr
    }
    let balance = await wrappedToken.token_balances(key)
    console.log(balance)

  }, 100_000);

});
