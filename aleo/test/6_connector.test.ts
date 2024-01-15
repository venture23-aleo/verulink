import { CouncilContract } from "../artifacts/js/council";
import { Token_bridgeContract } from "../artifacts/js/token_bridge";
import { Token_serviceContract } from "../artifacts/js/token_service";
import { InPacketFull, PacketId } from "../artifacts/js/types";
import { Wusdc_connectorContract } from "../artifacts/js/wusdc_connector";
import { Wusdc_holdingContract } from "../artifacts/js/wusdc_holding";
import { Wusdc_tokenContract } from "../artifacts/js/wusdc_token";
import {
    aleoChainId,
  aleoTsContract,
  aleoUser1,
  aleoUser2,
  aleoUser3,
  aleoUser4,
  aleoUser5,
  ethChainId,
  ethTsContract,
  ethUser,
  wusdcConnectorAddr,
  wusdcTokenAddr,
} from "./mockData";
import { evm2AleoArr } from "./utils";

const bridge = new Token_bridgeContract({ mode: "execute" });
const tokenService = new Token_serviceContract({ mode: "execute" });
const council = new CouncilContract({ mode: "execute" });
const wusdcToken = new Wusdc_tokenContract({ mode: "execute" });
const wusdcHolding = new Wusdc_holdingContract({ mode: "execute" });
const wusdcConnecter = new Wusdc_connectorContract({ mode: "execute" });

const TIMEOUT = 100_000 // 100 seconds

describe("Token Connector", () => {

  describe("Deployment", () => {

    test("Deploy Bridge", async () => {
      const deployTx = await bridge.deploy();
      await deployTx.wait();
    }, TIMEOUT);

    test("Deploy Token Service", async () => {
      const deployTx = await tokenService.deploy();
      await deployTx.wait();
    }, TIMEOUT);

    test("Deploy Council", async () => {
      const deployTx = await council.deploy();
      await deployTx.wait();
    }, TIMEOUT);

    test("Deploy Token", async () => {
      const deployTx = await wusdcToken.deploy();
      await deployTx.wait();
    }, TIMEOUT);

    test("Deploy Holding", async () => {
      const deployTx = await wusdcHolding.deploy();
      await deployTx.wait();
    }, TIMEOUT);

    test("Deploy Connector", async () => {
      const deployTx = await wusdcConnecter.deploy();
      await deployTx.wait();
    }, TIMEOUT);
  });

  describe("Setup", () => {

    test("Initialize Bridge", async () => {
      const threshold = 1;
      const owner = aleoUser1;
      let isBridgeInitialized = true;
      try {
        const threshold = bridge.attestor_settings(true);
      } catch (err) {
        isBridgeInitialized = false;
      }

      if (!isBridgeInitialized) {
        const initializeTx = await bridge.initialize_tb(
          threshold,
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          owner
        );
        // @ts-ignore
        await initializeTx.wait();
      }
    }, TIMEOUT);

    test("Initialize Token Service", async () => {
      let isTokenServiceInitialized = true;
      try {
        const owner = tokenService.owner_TS(true);
      } catch (err) {
        isTokenServiceInitialized = false;
      }

      if (!isTokenServiceInitialized) {
        const initializeTx = await tokenService.initialize_ts(
          aleoUser1 // owner
        );
        // @ts-ignore
        await initializeTx.wait();
      }
    }, TIMEOUT);

    test("Token Bridge: Enable Ethereum Chain", async () => {
      let isEthSupported = true;
      try {
        isEthSupported = await bridge.supported_chains(ethChainId);
      } catch (err) {
        isEthSupported = false;
      }

      if (!isEthSupported) {
        const addEthChainTx = await bridge.enable_chain_tb(ethChainId);
        // @ts-ignore
        await addEthChainTx.wait();
      }
    }, TIMEOUT);

    test("Token Service: Support Ethereum Chain", async () => {
      let isEthSupported = true;
      try {
        const ethTsAddr = await tokenService.token_service_contracts(
          ethChainId
        );
      } catch (err) {
        isEthSupported = false;
      }

      if (!isEthSupported) {
        const supportEthChainTx = await tokenService.support_chain_ts(
          ethChainId,
          evm2AleoArr(ethTsContract)
        );
        // @ts-ignore
        await supportEthChainTx.wait();
      }
    }, TIMEOUT);

    test("Token Service: Support Ethereum Chain", async () => {
      let isEthSupported = true;
      try {
        const ethTsAddr = await tokenService.token_service_contracts(
          ethChainId
        );
      } catch (err) {
        isEthSupported = false;
      }

      if (!isEthSupported) {
        const supportEthChainTx = await tokenService.support_chain_ts(
          ethChainId,
          evm2AleoArr(ethTsContract)
        );
        // @ts-ignore
        await supportEthChainTx.wait();
      }
    }, TIMEOUT);

    test("Initialize WUSDC", async () => {
      let isTokenInitialized = true;
      try {
        const owner = wusdcToken.owner_wusdc(true);
      } catch (err) {
        isTokenInitialized = false;
      }

      if (isTokenInitialized) {
        const initializeTx = await wusdcConnecter.initialize_wusdc();
        // @ts-ignore
        await initializeTx.wait();
      }
    }, TIMEOUT);

    test("Token Service: Support New Token", async () => {
      let isWusdcSupported = true;
      try {
        const wusdcConnectorAddrStored = await tokenService.token_connectors(
          wusdcTokenAddr
        );
      } catch (err) {
        isWusdcSupported = false;
      }

      if (!isWusdcSupported) {
        const supportWusdcTx = await tokenService.support_token_ts(
          wusdcTokenAddr,
          wusdcConnectorAddr,
          BigInt(100), // minimum transfer
          100_00, // outgoing percentage
          1 // (timeframe)
        );
        // @ts-ignore
        await supportWusdcTx.wait();
      }
    }, TIMEOUT);

    test("Token Bridge: Enable Service", async () => {
      let isServiceEnabled = true;
      try {
        isServiceEnabled = await bridge.supported_services(aleoTsContract);
      } catch (err) {
        isServiceEnabled = false;
      }

      if (!isServiceEnabled) {
        const supportServiceTx = await bridge.enable_service_tb(aleoTsContract);
        // @ts-ignore
        await supportServiceTx.wait();
      }
    }, TIMEOUT);

  });

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
          amount,
        },
        height,
      };

      // Attest to a packet
      const tx = await bridge.attest(packet, true);

      // @ts-ignore
      await tx.wait();
    }, TIMEOUT);

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

  }, TIMEOUT)

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
