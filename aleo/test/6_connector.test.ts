import { Council_v0001Contract } from "../artifacts/js/council_v0001";
import { Token_bridge_v0001Contract } from "../artifacts/js/token_bridge_v0001";
import { Token_service_v0001Contract } from "../artifacts/js/token_service_v0001";
import { Wusdc_token_v0001Contract } from "../artifacts/js/wusdc_token_v0001";
import { Wusdc_holding_v0001Contract } from "../artifacts/js/wusdc_holding_v0001";
import { Wusdc_connector_v0001Contract } from "../artifacts/js/wusdc_connector_v0001";

import { InPacketFull, PacketId } from "../artifacts/js/types";

import {
  aleoChainId,
  aleoTsProgramAddr,
  aleoUser1,
  aleoUser2,
  aleoUser3,
  aleoUser4,
  aleoUser5,
  ethChainId,
  ethTsContract,
  ethUser,
  usdcContractAddr,
  wusdcConnectorAddr,
  wusdcTokenAddr,
} from "./mockData";
import { aleoArr2Evm, evm2AleoArr } from "../utils/utils";
import { ethTsContractAddr } from "../utils/testnet.data";

const bridge = new Token_bridge_v0001Contract({ mode: "execute" });
const tokenService = new Token_service_v0001Contract({ mode: "execute" });
const council = new Council_v0001Contract({ mode: "execute" });
const wusdcToken = new Wusdc_token_v0001Contract({ mode: "execute" });
const wusdcHolding = new Wusdc_holding_v0001Contract({ mode: "execute" });
const wusdcConnecter = new Wusdc_connector_v0001Contract({ mode: "execute" });

const TIMEOUT = 100_000 // 100 seconds

describe("Token Connector", () => {

  // describe("Deployment", () => {

  //   test("Deploy Bridge", async () => {
  //     const deployTx = await bridge.deploy();
  //     await deployTx.wait();
  //   }, TIMEOUT);

  //   test("Deploy Token Service", async () => {
  //     const deployTx = await tokenService.deploy();
  //     await deployTx.wait();
  //   }, TIMEOUT);

  //   test("Deploy Council", async () => {
  //     const deployTx = await council.deploy();
  //     await deployTx.wait();
  //   }, TIMEOUT);

  //   test("Deploy Token", async () => {
  //     const deployTx = await wusdcToken.deploy();
  //     await deployTx.wait();
  //   }, TIMEOUT);

  //   test("Deploy Holding", async () => {
  //     const deployTx = await wusdcHolding.deploy();
  //     await deployTx.wait();
  //   }, TIMEOUT);

  //   test("Deploy Connector", async () => {
  //     const deployTx = await wusdcConnecter.deploy();
  //     await deployTx.wait();
  //   }, TIMEOUT);
  // });

  // describe("Setup", () => {

  //   test("Initialize Bridge", async () => {
  //     let threshold = 1;
  //     const owner = aleoUser1;
  //     let isBridgeInitialized = true;
  //     try {
  //       threshold = await bridge.attestor_settings(true);
  //     } catch (err) {
  //       isBridgeInitialized = false;
  //     }

  //     if (!isBridgeInitialized) {
  //       const initializeTx = await bridge.initialize_tb(
  //         threshold,
  //         [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
  //         owner
  //       );
  //       // @ts-ignore
  //       await initializeTx.wait();
  //     }
  //   }, TIMEOUT);

  //   test("Initialize Token Service", async () => {
  //     let isTokenServiceInitialized = true;
  //     try {
  //       const owner = await tokenService.owner_TS(true);
  //     } catch (err) {
  //       isTokenServiceInitialized = false;
  //     }

  //     if (!isTokenServiceInitialized) {
  //       const initializeTx = await tokenService.initialize_ts(
  //         aleoUser1 // owner
  //       );
  //       // @ts-ignore
  //       await initializeTx.wait();
  //     }
  //   }, TIMEOUT);

  //   test("Token Bridge: Enable Ethereum Chain", async () => {
  //     let isEthSupported = true;
  //     try {
  //       isEthSupported = await bridge.supported_chains(ethChainId);
  //     } catch (err) {
  //       isEthSupported = false;
  //     }

  //     if (!isEthSupported) {
  //       const addEthChainTx = await bridge.enable_chain_tb(ethChainId);
  //       // @ts-ignore
  //       await addEthChainTx.wait();
  //     }
  //   }, TIMEOUT);

  //   test("Token Service: Support Ethereum Chain", async () => {
  //     let isEthSupported = true;
  //     try {
  //       const ethTsAddr = await tokenService.token_service_contracts(
  //         ethChainId
  //       );
  //     } catch (err) {
  //       isEthSupported = false;
  //     }

  //     if (!isEthSupported) {
  //       const supportEthChainTx = await tokenService.support_chain_ts(
  //         ethChainId,
  //         evm2AleoArr(ethTsContract)
  //       );
  //       // @ts-ignore
  //       await supportEthChainTx.wait();
  //     }
  //   }, TIMEOUT);

  //   test("Initialize WUSDC", async () => {
  //     let isTokenInitialized = true;
  //     try {
  //       const owner = await wusdcToken.token_owner(true);
  //     } catch (err) {
  //       isTokenInitialized = false;
  //     }

  //     if (!isTokenInitialized) {
  //       const initializeTx = await wusdcConnecter.initialize_wusdc();
  //       // @ts-ignore
  //       await initializeTx.wait();
  //     }
  //   }, TIMEOUT);

  //   test("Token Service: Support New Token", async () => {
  //     let isWusdcSupported = true;
  //     try {
  //       const wusdcConnectorAddrStored = await tokenService.token_connectors(
  //         wusdcTokenAddr
  //       );
  //     } catch (err) {
  //       isWusdcSupported = false;
  //     }

  //     if (!isWusdcSupported) {
  //       const supportWusdcTx = await tokenService.support_token_ts(
  //         wusdcTokenAddr,
  //         wusdcConnectorAddr,
  //         BigInt(100), // minimum transfer
  //         100_00, // outgoing percentage
  //         1 // (timeframe)
  //       );
  //       // @ts-ignore
  //       await supportWusdcTx.wait();
  //     }
  //   }, TIMEOUT);

  //   test("Token Bridge: Enable Service", async () => {
  //     let isServiceEnabled = true;
  //     try {
  //       isServiceEnabled = await bridge.supported_services(aleoTsProgramAddr);
  //     } catch (err) {
  //       isServiceEnabled = false;
  //     }

  //     if (!isServiceEnabled) {
  //       const supportServiceTx = await bridge.enable_service_tb(aleoTsProgramAddr);
  //       // @ts-ignore
  //       await supportServiceTx.wait();
  //     }
  //   }, TIMEOUT);

  // });

  describe("Happy Path", () => {
    const incomingSequence = BigInt(Math.round(Math.random() * Number.MAX_SAFE_INTEGER));
    const incomingAmount = BigInt(10000);
    const incomingHeight = 10;
    let initialBalance = BigInt(0)
    let outgoingSequence = BigInt(1);
    let outgoingAmount = BigInt(101);


    test("Ensure proper setup", async () => {
      expect(await bridge.owner_TB(true)).toBe(aleoUser1);
      expect(await tokenService.owner_TS(true)).toBe(aleoUser1);
      expect(await wusdcToken.token_owner(true)).toBe(wusdcConnectorAddr);
      expect(await wusdcHolding.owner_holding(true)).toBe(wusdcConnectorAddr);
    })

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
          addr: aleoTsProgramAddr,
        },
        message: {
          token: wusdcTokenAddr,
          sender: evm2AleoArr(ethUser),
          receiver: aleoUser1,
          amount: incomingAmount,
        },
        height: incomingHeight,
      };

      // Attest to a packet
      const tx = await bridge.attest(packet, true);

      // @ts-ignore
      await tx.wait();
    }, TIMEOUT);

  // test("Receive a Packet", async () => {
  //   try {
  //     initialBalance = await wusdcToken.account(aleoUser1)
  //   } catch (e) {
  //     initialBalance = BigInt(0)
  //   }
  //   const tx = await wusdcConnecter.wusdc_receive(
  //     evm2AleoArr(ethUser), // sender
  //     aleoUser1, // receiver
  //     aleoUser1, // actual receiver
  //     incomingAmount,
  //     incomingSequence, 
  //     incomingHeight
  //   );

  //   // @ts-ignore
  //   await tx.wait()

  //   let finalBalance = await wusdcToken.account(aleoUser1)
  //   expect(finalBalance).toBe(initialBalance + incomingAmount);

  // }, TIMEOUT)

  test("Send a packet", async () => {
    const initialBalance = await wusdcToken.account(aleoUser1);

    try {
      outgoingSequence = await bridge.sequences(ethChainId)
    } catch (e) {
      outgoingSequence = BigInt(1);
    }

    const tx = await wusdcConnecter.wusdc_send(
      evm2AleoArr(ethUser),
      outgoingAmount
    )
    // @ts-ignore
    await tx.wait()

    const finalBalance = await wusdcToken.account(aleoUser1);
    expect(finalBalance).toBe(initialBalance - outgoingAmount);

    const packetKey: PacketId = {
      chain_id: ethChainId,
      sequence: outgoingSequence
    }
    const outPacket = await bridge.out_packets(packetKey)
    console.log(evm2AleoArr(usdcContractAddr))
    console.log(outPacket.message.token)
    console.log('message')
    expect(outPacket.message.token).toBe(evm2AleoArr(usdcContractAddr));
    // console.log('message token')
    // expect(outPacket.message.sender).toBe(aleoUser1);
    // console.log('message sender')
    // expect(outPacket.message.receiver).toBe(evm2AleoArr(ethUser));
    // console.log('message receiver')
    // expect(outPacket.message.amount).toBe(outgoingAmount);
    // console.log('message amount')

    // expect(outPacket.source.chain_id).toBe(aleoChainId);
    // console.log('source chain')
    // expect(outPacket.source.addr).toBe(aleoTsProgramAddr);
    // console.log('aleoTsProgramAddr')
    // expect(outPacket.destination.chain_id).toBe(ethChainId);
    // console.log('ethChainId')
    // expect(outPacket.destination.addr).toBe(evm2AleoArr(ethTsContractAddr));
    // console.log('ethTsAddr')

  }, TIMEOUT);

  });

  describe("Update governance", () => {
    test.todo("Successful case");
  });
  describe("Token Receive", () => {
    test.todo("So many cases to look at");
  });
  describe("Token Send", () => {
    test.todo("So many cases to look at");
  });
});
