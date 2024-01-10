import { Token_serviceContract } from "../artifacts/js/token_service";
import { InPacketFull, TokenOrigin, wrapped_tokenLeo } from "../artifacts/js/types";

import { evm2AleoArr, string2AleoArr } from "./utils";
import { aleoChainId, aleoTsContract, aleoUser, ethChainId, ethTsContract, ethUser, usdcContractAddr, wUSDCProgramAddr } from "./mockData";

const tokenService = new Token_serviceContract({ networkName: "testnet3", privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH" })

describe("Token Service", () => {

  test("Transfer Token From Aleo To Ethereum", async () => {

    const tokenOrigin: TokenOrigin = {
      chain_id: ethChainId,
      token_service_address: evm2AleoArr(ethTsContract),
      token_address: evm2AleoArr(usdcContractAddr)
    }

    await tokenService.token_send(
      wUSDCProgramAddr,
      evm2AleoArr(ethUser),
      BigInt(100),
      tokenOrigin
    )
  });

  test("Receive Token From Ethereum To Aleo", async () => {

    let source: TokenOrigin = {
      chain_id: ethChainId,
      token_service_address: evm2AleoArr(ethTsContract),
      token_address: evm2AleoArr(usdcContractAddr)
    }

    await tokenService.token_receive(
      source,
      wUSDCProgramAddr,
      evm2AleoArr(ethUser),
      aleoUser,
      aleoUser,
      BigInt(100),
      1,
      1
    )
  });


  

});
