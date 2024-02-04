import { Council_v0001Contract } from "../artifacts/js/council_v0001";
import { Token_bridge_v0001Contract } from "../artifacts/js/token_bridge_v0001";
import { Token_service_v0001Contract } from "../artifacts/js/token_service_v0001";
import { Wusdc_token_v0001Contract } from "../artifacts/js/wusdc_token_v0001";
import { Wusdc_holding_v0001Contract } from "../artifacts/js/wusdc_holding_v0001";
import { Wusdc_connector_v0001Contract } from "../artifacts/js/wusdc_connector_v0001";

import * as js2leo from "../artifacts/js/js2leo";
import { HoldingRelease, InPacket, PacketId } from "../artifacts/js/types";

import {
  aleoChainId,
  aleoUser1,
  aleoUser2,
  aleoUser3,
  aleoUser4,
  aleoUser5,
  ethChainId,
  ethTsContractAddr,
  ethUser,
  usdcContractAddr,
} from "./mockData";
import { Address, PrivateKey } from "@aleohq/sdk";
import { ALEO_ZERO_ADDRESS, BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE, BRIDGE_THRESHOLD_INDEX, BRIDGE_UNPAUSED_VALUE, COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_PROPOSALS_INDEX } from "../utils/constants";
import { aleoArr2Evm, evm2AleoArr } from "../utils/ethAddress";
import { signPacket } from "../utils/sign";
import { hashStruct } from "../utils/hash";

const bridge = new Token_bridge_v0001Contract({ mode: "execute" });
const tokenService = new Token_service_v0001Contract({ mode: "execute" });
const council = new Council_v0001Contract({ mode: "execute" });
const wusdcToken = new Wusdc_token_v0001Contract({ mode: "execute" });
const wusdcHolding = new Wusdc_holding_v0001Contract({ mode: "execute" });
const wusdcConnector = new Wusdc_connector_v0001Contract({ mode: "execute" });

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
        const deployTx = await wusdcConnector.deploy();
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
        const isBridgeInitialized = (await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX, 0)) != 0;

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

        const isTokenServiceInitialized = (await tokenService.owner_TS(true, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
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
        const isEthSupported = (await bridge.supported_chains(ethChainId, false));
        if (!isEthSupported) {
          const addEthChainTx = await bridge.add_chain_tb(ethChainId);
          // @ts-ignore
          await addEthChainTx.wait();
        }
      },
      TIMEOUT
    );

    test(
      "Initialize WUSDC",
      async () => {
        let isTokenInitialized = (await wusdcToken.token_owner(true, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
        if (!isTokenInitialized) {
          const initializeTx = await wusdcConnector.initialize_wusdc();
          // @ts-ignore
          await initializeTx.wait();
        }
      },
      TIMEOUT
    );

    test(
      "Token Service: Add New Token",
      async () => {
        const isWusdcSupported = (await tokenService.token_connectors(wusdcToken.address(), ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
        if (!isWusdcSupported) {
          const supportWusdcTx = await tokenService.add_token_ts(
            wusdcToken.address(),
            wusdcConnector.address(),
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
        const isTokenServiceEnabled = await bridge.supported_services(tokenService.address(), false);
        if (!isTokenServiceEnabled) {
          const supportServiceTx = await bridge.add_service_tb(
            tokenService.address()
          );
          // @ts-ignore
          await supportServiceTx.wait();
        }
      },
      TIMEOUT
    );

    test(
      "Token Bridge: Unpause",
      async () => {
        const isPaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_PAUSED_VALUE;
        if (!isPaused) {
          const unpauseTx = await bridge.unpause_tb();
          // @ts-ignore
          await unpauseTx.wait();
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
        addr: tokenService.address(),
      },
      message: {
        token: wusdcToken.address(),
        sender: evm2AleoArr(ethUser),
        receiver: aleoUser1,
        amount: incomingAmount,
      },
      height: incomingHeight,
    };

    test("Ensure proper setup", async () => {
      expect(await bridge.owner_TB(true)).toBe(aleoUser1);
      expect(await tokenService.owner_TS(true)).toBe(aleoUser1);
      expect(await wusdcToken.token_owner(true)).toBe(wusdcConnector.address());
      expect(await wusdcHolding.owner_holding(true)).toBe(wusdcConnector.address());
      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
    });

    test(
      "Receive wUSDC",
      async () => {
        const initialBalance = await wusdcToken.account(aleoUser1, BigInt(0));
        const initialSupply = await tokenService.total_supply(wusdcToken.address(), BigInt(0));
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

        const tx = await wusdcConnector.wusdc_receive(
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

        let finalSupply = await tokenService.total_supply(wusdcToken.address());
        expect(finalSupply).toBe(initialSupply + incomingAmount);

      },
      TIMEOUT
    );

    test(
      "Transfer wUSDC",
      async () => {
        const initialBalance = await wusdcToken.account(aleoUser1);
        const outgoingSequence = await bridge.sequences(ethChainId, BigInt(1));
        const initialSupply = await tokenService.total_supply(wusdcToken.address());

        const tx = await wusdcConnector.wusdc_send(
          evm2AleoArr(ethUser),
          outgoingAmount
        );
        // @ts-ignore
        await tx.wait();

        const finalBalance = await wusdcToken.account(aleoUser1);
        expect(finalBalance).toBe(initialBalance - outgoingAmount);

        const finalSupply = await tokenService.total_supply(wusdcToken.address());
        expect(finalSupply).toBe(initialSupply - outgoingAmount);

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
        expect(outPacket.source.addr).toBe(tokenService.address());
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
        addr: tokenService.address(),
      },
      message: {
        token: wusdcToken.address(),
        sender: evm2AleoArr(ethUser),
        receiver: aleoUser1,
        amount: incomingAmount,
      },
      height: incomingHeight,
    };

    test("Ensure proper setup", async () => {
      expect(await bridge.owner_TB(true)).toBe(aleoUser1);
      expect(await tokenService.owner_TS(true)).toBe(aleoUser1);
      expect(await wusdcToken.token_owner(true)).toBe(wusdcConnector.address());
      expect(await wusdcHolding.owner_holding(true)).toBe(wusdcConnector.address());
    });

    test(
      "Initialize Council",
      async () => {
        let isCouncilInitialized = (await council.settings(COUNCIL_THRESHOLD_INDEX, 0)) != 0;

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
      "Receive wUSDC must collect the amount in holding program",
      async () => {
        const userInitialBalance = await wusdcToken.account(aleoUser1, BigInt(0));
        const holdingProgramInitialBalance = await wusdcToken.account(wusdcHolding.address(), BigInt(0))
        const initialHeldAmount = await wusdcHolding.holdings(aleoUser1, BigInt(0));

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

        const tx = await wusdcConnector.wusdc_receive(
          evm2AleoArr(ethUser), // sender
          aleoUser1, // receiver
          wusdcHolding.address(), // actual receiver
          incomingAmount,
          incomingSequence,
          incomingHeight,
          signers,
          signs
        );

        // @ts-ignore
        await tx.wait();

        const userFinalBalance = await wusdcToken.account(aleoUser1, BigInt(0));
        const holdingProgramFinalBalance = await wusdcToken.account( wusdcHolding.address(), BigInt(0));
        const finalHeldAmount = await wusdcHolding.holdings(aleoUser1, BigInt(0));

        expect(userFinalBalance).toBe(userInitialBalance);
        expect(holdingProgramFinalBalance).toBe(
          holdingProgramInitialBalance + incomingAmount
        );
        expect(finalHeldAmount).toBe(initialHeldAmount + incomingAmount);
      },
      TIMEOUT
    );

    test(
      "Release held amount",
      async () => {

        const userInitialBalance = await wusdcToken.account(aleoUser1, BigInt(0));
        const holdingProgramInitialBalance = await wusdcToken.account( wusdcHolding.address(), BigInt(0));
        const initialHeldAmount = await wusdcHolding.holdings(aleoUser1, BigInt(0));

        let proposalId = parseInt( (await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1
        const releaseFundProposal: HoldingRelease = {
          id: proposalId,
          token_address: wusdcToken.address(),
          connector: wusdcConnector.address(),
          receiver: aleoUser1,
          amount: initialHeldAmount,
        };
        const releaseFundProposalHash = hashStruct(
          js2leo.getHoldingReleaseLeo(releaseFundProposal)
        );
        let tx = await council.propose(proposalId, releaseFundProposalHash);

        // @ts-ignore
        await tx.wait();

        tx = await wusdcConnector.wusdc_release(
          proposalId,
          aleoUser1,
          initialHeldAmount
        );

        // @ts-ignore
        await tx.wait();

        const userFinalBalance = await wusdcToken.account(aleoUser1, BigInt(0));
        const holdingProgramFinalBalance = await wusdcToken.account(
          wusdcHolding.address(), BigInt(0)
        );
        const finalHeldAmount = await wusdcHolding.holdings(aleoUser1, BigInt(0));

        expect(userFinalBalance).toBe(userInitialBalance + initialHeldAmount);
        expect(holdingProgramFinalBalance).toBe(
          holdingProgramInitialBalance - initialHeldAmount
        );
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
