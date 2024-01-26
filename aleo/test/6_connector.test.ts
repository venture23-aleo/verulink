import { Council_v0001Contract } from "../artifacts/js/council_v0001";
import { Token_bridge_v0001Contract } from "../artifacts/js/token_bridge_v0001";
import { Token_service_v0001Contract } from "../artifacts/js/token_service_v0001";
import { Wusdc_token_v0001Contract } from "../artifacts/js/wusdc_token_v0001";
import { Wusdc_holding_v0001Contract } from "../artifacts/js/wusdc_holding_v0001";
import { Wusdc_connector_v0001Contract } from "../artifacts/js/wusdc_connector_v0001";

import * as js2leo from "../artifacts/js/js2leo";
import { HoldingRelease, InPacket, PacketId } from "../artifacts/js/types";

import {
  ALEO_ZERO_ADDRESS,
  THRESHOLD_INDEX,
  TOTAL_PROPOSALS_INDEX,
  aleoChainId,
  aleoTsProgramAddr,
  aleoUser1,
  aleoUser2,
  aleoUser3,
  aleoUser4,
  aleoUser5,
  ethChainId,
  ethTsContractAddr,
  ethUser,
  usdcContractAddr,
  wusdcConnectorAddr,
  wusdcHoldingAddr,
  wusdcTokenAddr,
} from "./mockData";
import {
  aleoArr2Evm,
  evm2AleoArr,
  hashStruct,
  signPacket,
} from "../utils/utils";
import { Address, PrivateKey } from "@aleohq/sdk";

const bridge = new Token_bridge_v0001Contract({ mode: "execute" });
const tokenService = new Token_service_v0001Contract({ mode: "execute" });
const council = new Council_v0001Contract({ mode: "execute" });
const wusdcToken = new Wusdc_token_v0001Contract({ mode: "execute" });
const wusdcHolding = new Wusdc_holding_v0001Contract({ mode: "execute" });
const wusdcConnecter = new Wusdc_connector_v0001Contract({ mode: "execute" });

const TIMEOUT = 100_000; // 100 seconds

describe("Token Connector", () => {
  describe("Deployment", () => {
    test(
      "Deploy Bridge",
      async () => {
        const deployTx = await bridge.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );

    test(
      "Deploy Token Service",
      async () => {
        const deployTx = await tokenService.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );

    test(
      "Deploy Council",
      async () => {
        const deployTx = await council.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );

    test(
      "Deploy Token",
      async () => {
        const deployTx = await wusdcToken.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );

    test(
      "Deploy Holding",
      async () => {
        const deployTx = await wusdcHolding.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );

    test(
      "Deploy Connector",
      async () => {
        const deployTx = await wusdcConnecter.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );
  });

  describe("Setup", () => {
    test(
      "Initialize Bridge",
      async () => {
        let threshold = 1;
        const owner = aleoUser1;
        let isBridgeInitialized = true;
        try {
          threshold = await bridge.attestor_settings(true);
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
      },
      TIMEOUT
    );

    test(
      "Initialize Token Service",
      async () => {
        let isTokenServiceInitialized = true;
        try {
          const owner = await tokenService.owner_TS(true);
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
      },
      TIMEOUT
    );

    test(
      "Token Bridge: Enable Ethereum Chain",
      async () => {
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
      },
      TIMEOUT
    );

    test(
      "Initialize WUSDC",
      async () => {
        let isTokenInitialized = true;
        try {
          const owner = await wusdcToken.token_owner(true);
        } catch (err) {
          isTokenInitialized = false;
        }

        if (!isTokenInitialized) {
          const initializeTx = await wusdcConnecter.initialize_wusdc();
          // @ts-ignore
          await initializeTx.wait();
        }
      },
      TIMEOUT
    );

    test(
      "Initialize Council",
      async () => {
        let isCouncilInitialized = true;
        try {
          const threshold = await council.settings(THRESHOLD_INDEX)
        } catch (err) {
          isCouncilInitialized = false;
        }

        if (!isCouncilInitialized) {
          const initializeTx = await council.initialize(
            [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5], 1
          );
          // @ts-ignore
          await initializeTx.wait();
        }
      },
      TIMEOUT
    );


    test(
      "Token Service: Support New Token",
      async () => {
        let isWusdcSupported = true;
        try {
          const wusdcConnectorAddrStored = await tokenService.token_connectors(
            wusdcTokenAddr
          );
        } catch (err) {
          isWusdcSupported = false;
        }

        if (!isWusdcSupported) {
          const supportWusdcTx = await tokenService.add_token_ts(
            wusdcTokenAddr,
            wusdcConnectorAddr,
            BigInt(100), // minimum transfer
            BigInt(10000000000), // maximum transfer
            100_00, // outgoing percentage
            1, // (timeframe)
            BigInt(10000000000) // max liquidity for no cap
          );
          // @ts-ignore
          await supportWusdcTx.wait();
        }
      },
      TIMEOUT
    );

    test(
      "Token Bridge: Enable Service",
      async () => {
        let isServiceEnabled = true;
        try {
          isServiceEnabled = await bridge.supported_services(aleoTsProgramAddr);
        } catch (err) {
          isServiceEnabled = false;
        }

        if (!isServiceEnabled) {
          const supportServiceTx = await bridge.enable_service_tb(
            aleoTsProgramAddr
          );
          // @ts-ignore
          await supportServiceTx.wait();
        }
      },
      TIMEOUT
    );
  });

  describe("Happy Path", () => {
    const incomingSequence = BigInt(
      Math.round(Math.random() * Number.MAX_SAFE_INTEGER)
    );
    const incomingAmount = BigInt(10000);
    const incomingHeight = 10;
    let initialBalance = BigInt(0);
    let outgoingSequence = BigInt(1);
    let outgoingAmount = BigInt(101);

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

    test("Ensure proper setup", async () => {
      expect(await bridge.owner_TB(true)).toBe(aleoUser1);
      expect(await tokenService.owner_TS(true)).toBe(aleoUser1);
      expect(await wusdcToken.token_owner(true)).toBe(wusdcConnectorAddr);
      expect(await wusdcHolding.owner_holding(true)).toBe(wusdcConnectorAddr);
    });

    test(
      "Receive wUSDC",
      async () => {
        try {
          initialBalance = await wusdcToken.account(aleoUser1);
        } catch (e) {
          initialBalance = BigInt(0);
        }

        const signature = signPacket(packet, true, bridge.config.privateKey);

        const signers = [
          Address.from_private_key(
            PrivateKey.from_string(bridge.config.privateKey)
          ).to_string(),
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
        ];

        const signs = [signature, signature, signature, signature, signature];

        const tx = await wusdcConnecter.wusdc_receive(
          evm2AleoArr(ethUser), // sender
          aleoUser1, // receiver
          aleoUser1, // actual receiver
          incomingAmount,
          incomingSequence,
          incomingHeight,
          signers,
          signs
        );

        // @ts-ignore
        await tx.wait();

        let finalBalance = await wusdcToken.account(aleoUser1);
        expect(finalBalance).toBe(initialBalance + incomingAmount);
      },
      TIMEOUT
    );

    test(
      "Transfer wUSDC",
      async () => {
        const initialBalance = await wusdcToken.account(aleoUser1);

        try {
          outgoingSequence = await bridge.sequences(ethChainId);
        } catch (e) {
          outgoingSequence = BigInt(1);
        }

        const tx = await wusdcConnecter.wusdc_send(
          evm2AleoArr(ethUser),
          outgoingAmount
        );
        // @ts-ignore
        await tx.wait();

        const finalBalance = await wusdcToken.account(aleoUser1);
        expect(finalBalance).toBe(initialBalance - outgoingAmount);

        const packetKey: PacketId = {
          chain_id: ethChainId,
          sequence: outgoingSequence,
        };
        const outPacket = await bridge.out_packets(packetKey);

        expect(aleoArr2Evm(outPacket.message.token)).toBe(usdcContractAddr);
        expect(outPacket.message.sender).toBe(aleoUser1);
        expect(aleoArr2Evm(outPacket.message.receiver)).toBe(
          ethUser.toLocaleLowerCase()
        );
        expect(outPacket.message.amount).toBe(outgoingAmount);
        expect(outPacket.source.chain_id).toBe(aleoChainId);
        expect(outPacket.source.addr).toBe(aleoTsProgramAddr);
        expect(outPacket.destination.chain_id).toBe(ethChainId);
        expect(aleoArr2Evm(outPacket.destination.addr)).toBe(ethTsContractAddr);
      },
      TIMEOUT
    );

  });

  describe("Screening Failed Path", () => {
    const incomingSequence = BigInt(
      Math.round(Math.random() * Number.MAX_SAFE_INTEGER)
    );
    const incomingAmount = BigInt(10000);
    const incomingHeight = 10;
    let userInitialBalance = BigInt(0);
    let holdingProgramInitialBalance = BigInt(0);
    let initialHeldAmount = BigInt(0);

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

    test("Ensure proper setup", async () => {
      expect(await bridge.owner_TB(true)).toBe(aleoUser1);
      expect(await tokenService.owner_TS(true)).toBe(aleoUser1);
      expect(await wusdcToken.token_owner(true)).toBe(wusdcConnectorAddr);
      expect(await wusdcHolding.owner_holding(true)).toBe(wusdcConnectorAddr);
    });

    test(
      "Receive wUSDC must collect the amount in holding program",
      async () => {
        try {
          userInitialBalance = await wusdcToken.account(aleoUser1);
        } catch (e) {
          userInitialBalance = BigInt(0);
        }

        try {
          holdingProgramInitialBalance = await wusdcToken.account(
            wusdcHoldingAddr
          );
        } catch (e) {
          holdingProgramInitialBalance = BigInt(0);
        }

        try {
          initialHeldAmount = await wusdcHolding.holdings(aleoUser1);
        } catch (e) {
          initialHeldAmount = BigInt(0);
        }

        const signature = signPacket(packet, false, bridge.config.privateKey);

        const signers = [
          Address.from_private_key(
            PrivateKey.from_string(bridge.config.privateKey)
          ).to_string(),
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
        ];

        const signs = [signature, signature, signature, signature, signature];

        const tx = await wusdcConnecter.wusdc_receive(
          evm2AleoArr(ethUser), // sender
          aleoUser1, // receiver
          wusdcHoldingAddr, // actual receiver
          incomingAmount,
          incomingSequence,
          incomingHeight,
          signers,
          signs
        );

        // @ts-ignore
        await tx.wait();

        let userFinalBalance = BigInt(0);
        let holdingProgramFinalBalance = BigInt(0);
        let finalHeldAmount = BigInt(0);

        try {
          userFinalBalance = await wusdcToken.account(aleoUser1);
        } catch (e) {
          userFinalBalance = BigInt(0);
        }

        try {
          holdingProgramFinalBalance = await wusdcToken.account(
            wusdcHoldingAddr
          );
        } catch (e) {
          holdingProgramFinalBalance = BigInt(0);
        }

        try {
          finalHeldAmount = await wusdcHolding.holdings(aleoUser1);
        } catch (e) {
          finalHeldAmount = BigInt(0);
        }

        console.log(`User: ${userInitialBalance} -> ${userFinalBalance}`)
        expect(userFinalBalance).toBe(userInitialBalance);
        console.log(`Holding: ${holdingProgramInitialBalance} -> ${holdingProgramFinalBalance}`)
        expect(holdingProgramFinalBalance).toBe(
          holdingProgramInitialBalance + incomingAmount
        );
        console.log(`Held Amount: ${initialHeldAmount} -> ${finalHeldAmount}`)
        expect(finalHeldAmount).toBe(initialHeldAmount + incomingAmount);
      },
      TIMEOUT
    );

    test(
      "Release held amount",
      async () => {
        try {
          userInitialBalance = await wusdcToken.account(aleoUser1);
        } catch (e) {
          userInitialBalance = BigInt(0);
        }

        try {
          holdingProgramInitialBalance = await wusdcToken.account(
            wusdcHoldingAddr
          );
        } catch (e) {
          holdingProgramInitialBalance = BigInt(0);
        }

        try {
          initialHeldAmount = await wusdcHolding.holdings(aleoUser1);
        } catch (e) {
          initialHeldAmount = BigInt(0);
        }

        let proposalId = parseInt( (await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1
        const releaseFundProposal: HoldingRelease = {
          id: proposalId,
          token_id: wusdcTokenAddr,
          connector: wusdcConnectorAddr,
          receiver: aleoUser1,
          amount: initialHeldAmount,
        };
        const releaseFundProposalHash = hashStruct(
          js2leo.getHoldingReleaseLeo(releaseFundProposal)
        );
        let tx = await council.propose(proposalId, releaseFundProposalHash);

        // @ts-ignore
        await tx.wait();

        tx = await wusdcConnecter.wusdc_release(
          proposalId,
          aleoUser1,
          initialHeldAmount
        );

        // @ts-ignore
        await tx.wait();

        let userFinalBalance = BigInt(0);
        let holdingProgramFinalBalance = BigInt(0);
        let finalHeldAmount = BigInt(0);

        try {
          userFinalBalance = await wusdcToken.account(aleoUser1);
        } catch (e) {
          userFinalBalance = BigInt(0);
        }

        try {
          holdingProgramFinalBalance = await wusdcToken.account(
            wusdcHoldingAddr
          );
        } catch (e) {
          holdingProgramFinalBalance = BigInt(0);
        }

        try {
          finalHeldAmount = await wusdcHolding.holdings(aleoUser1);
        } catch (e) {
          finalHeldAmount = BigInt(0);
        }

        console.log(`User: ${userInitialBalance} -> ${userFinalBalance}`)
        expect(userFinalBalance).toBe(userInitialBalance + initialHeldAmount);
        console.log(`Holding: ${holdingProgramInitialBalance} -> ${holdingProgramFinalBalance}`)
        expect(holdingProgramFinalBalance).toBe(
          holdingProgramInitialBalance - initialHeldAmount
        );
        console.log(`Held Amount: ${initialHeldAmount} -> ${finalHeldAmount}`)
        expect(finalHeldAmount).toBe(BigInt(0));
      },
      TIMEOUT * 2
    );
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
