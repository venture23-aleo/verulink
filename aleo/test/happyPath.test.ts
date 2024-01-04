// @ts-nocheck
import { BridgeContract } from "../artifacts/js/bridge";
import { Token_serviceContract } from "../artifacts/js/token_service";
import { InPacketFull, TokenAccount, TokenOrigin } from "../artifacts/js/types";
import { Wrapped_tokenContract } from "../artifacts/js/wrapped_token";

import { evm2AleoArr } from "./utils";

const bridge = new BridgeContract({ networkName: "testnet3", privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH", mode: "execute"});
const tokenService = new Token_serviceContract({ networkName: "testnet3", privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH", mode: "execute" })
const wrappedToken = new Wrapped_tokenContract({ networkName: "testnet3", privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH", mode: "execute" });

describe("Happy Path", () => {
  // USDC Contract Address on Ethereum
  const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

  // User Address on Ethereum
  const ethUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  // Token Service Contract Address on Ethereum
  const ethTsContract = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

  // Token Service Contract on Aleo
  const aleoTsContract =
    "aleo1r55t75nceunfds6chwmmhhw3zx5c6wvf62jed0ldyygqctckaurqr8fnd3";

  // Wrapped USDC Contract 
  const wUSDC =
    "aleo1zzy2c66uf46wvtxd0uck965mzj2cn7fn7dl9tgftw7tedl9f3cgsqhsgdz";

  // User address on Aleo
  const aleoUser =
    "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";

  const aleoChainId = 101;
  const ethChainId = 1;

  // test("Deploy", async() => {
  //   await bridge.deploy()
  // }, 30_000)

  test("Receive A Packet", async () => {

    const sequence = 3;
    const amount = BigInt(10000);
    const height = 10;

    // Create a packet
    const packet: InPacketFull = {
      version: 0,
      sequence,
      source: {
        chain_id: 1,
        addr: evm2AleoArr(ethTsContract),
      },
      destination: {
        chain_id: 1,
        addr: aleoTsContract,
      },
      message: {
        token: wUSDC,
        sender: evm2AleoArr(ethUser),
        receiver: aleoUser,
        amount
      },
      height: 10,
    };

    // Attest to a packet
    let tx = await bridge.attest(packet);
    await tx.wait()

    // Consume the packet
    const origin: TokenOrigin = {
      chain_id: ethChainId,
      token_service_address: evm2AleoArr(ethTsContract),
      token_address: evm2AleoArr(USDC)
    };
    tx = await tokenService.token_receive(origin, wUSDC, evm2AleoArr(ethUser), aleoUser, amount, sequence, height);
    await tx.wait()

    let key: TokenAccount = {
      user: aleoUser,
      token_id: wUSDC
    }
    let balance = await wrappedToken.token_balances(key)
    console.log(balance)

    // Send the packet to ethereum
    tx = await tokenService.token_send(
      wUSDC,
      evm2AleoArr(ethUser),
      BigInt(101),
      {
        chain_id: ethChainId,
        token_service_address: evm2AleoArr(ethTsContract),
        token_address: evm2AleoArr(USDC)
      }
    )
    await tx.wait()

    balance = await wrappedToken.token_balances(key)
    console.log(balance)

  }, 200_000);

});
