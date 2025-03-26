import { Address, PrivateKey } from "@aleohq/sdk";

// import { Council_v0003Contract } from "../artifacts/js/council_v0003";
// import { Token_bridge_v0003Contract } from "../artifacts/js/token_bridge_v0003";
// import { Token_service_v0003Contract } from "../artifacts/js/token_service_v0003";
// import { Wusdc_token_v0003Contract } from "../artifacts/js/wusdc_token_v0003";
// import { Wusdc_holding_v0003Contract } from "../artifacts/js/wusdc_holding_v0003";
// import { Wusdc_connector_v0003_0Contract } from "../artifacts/js/wusdc_connector_v0003_0";
// import { Wusdc_connector_v0003_1Contract } from "../artifacts/js/wusdc_connector_v0003_1";

import {
  ALEO_ZERO_ADDRESS,
  BRIDGE_PAUSABILITY_INDEX,
  BRIDGE_PAUSED_VALUE,
  BRIDGE_THRESHOLD_INDEX,
  BRIDGE_UNPAUSED_VALUE,
  COUNCIL_THRESHOLD_INDEX,
  COUNCIL_TOTAL_PROPOSALS_INDEX,
  OWNER_INDEX,
  TOKEN_PAUSED_VALUE,
  TOKEN_UNPAUSED_VALUE,
  aleoChainId,
  ethChainId,
  ethTsContractAddr,
  usdcContractAddr,
} from "../../utils/constants";
import { aleoArr2Evm, evm2AleoArr, generateRandomEthAddr } from "../../utils/ethAddress";
import { signPacket } from "../../utils/sign";
import { hashStruct } from "../../utils/hash";
// import { getConnectorUpdateLeo, getHoldingReleaseLeo } from "../artifacts/js/js2leo/council_v0003";
import { InPacket, PacketId } from "../../artifacts/js/types/vlink_token_bridge_v2";
// import { ConnectorUpdate, HoldingRelease, leoProposalVoteSchema } from "../artifacts/js/types/council_v0003";
import { createRandomPacket } from "../../utils/packet";
import { getBytes } from "ethers";
import { ExecutionMode } from "@doko-js/core";
import { Vlink_token_bridge_v2Contract } from "../../artifacts/js/vlink_token_bridge_v2";
import { Vlink_token_service_v2Contract } from "../../artifacts/js/vlink_token_service_v2";
import { Vlink_council_v2Contract } from "../../artifacts/js/vlink_council_v2";

const mode = ExecutionMode.SnarkExecute;


const bridge = new Vlink_token_bridge_v2Contract({ mode: mode });
const tokenService = new Vlink_token_service_v2Contract({ mode: mode });
const council = new Vlink_council_v2Contract({ mode: mode });
const wusdcToken = new Wusdc_token_v0003Contract({ mode: mode });
const wusdcHolding = new Wusdc_holding_v0003Contract({ mode: mode });
const wusdcConnector = new Wusdc_connector_v0003_0Contract({ mode: mode });
const newConnector = new Wusdc_connector_v0003_1Contract({ mode: mode });

const TIMEOUT = 200_000; // 200 seconds

const ethUser = generateRandomEthAddr();
const createPacket = (receiver: string, amount: bigint): InPacket => {
  return createRandomPacket(receiver, amount, ethChainId, aleoChainId, ethTsContractAddr, tokenService.address(), wusdcToken.address(), ethUser);
}

describe("Token Connector", () => {

  const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = wusdcConnector.getAccounts();
  const aleoUser5 = new PrivateKey().to_address().to_string();

  const admin = aleoUser1;

  describe("Deployment", () => {
    test("Deploy Bridge", async () => {
      const deployTx = await bridge.deploy();
      await deployTx.wait();
    },
      TIMEOUT
    );

    test("Deploy Token Service", async () => {
      const deployTx = await tokenService.deploy();
      await deployTx.wait();
    },
      TIMEOUT
    );

    test("Deploy Council", async () => {
      const deployTx = await council.deploy();
      await deployTx.wait();
    },
      TIMEOUT
    );

    test("Deploy Token", async () => {
      const deployTx = await wusdcToken.deploy();
      await deployTx.wait()
    },
      TIMEOUT
    );

    test("Deploy Holding", async () => {
      const deployTx = await wusdcHolding.deploy();
      await deployTx.wait();
    },
      TIMEOUT
    );

    test("Deploy Connector", async () => {
      const deployTx = await wusdcConnector.deploy();
      await deployTx.wait();
    },
      TIMEOUT * 2
    );
  });

  describe("Setup", () => {

    test("Initialize Bridge", async () => {
      let threshold = 1;
      const isBridgeInitialized = (await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX, 0)) != 0;

      if (!isBridgeInitialized) {
        bridge.connect(admin)
        const [initializeTx] = await bridge.initialize_tb(
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          threshold,
          admin
        );
        await initializeTx.wait();
      }
      expect(await bridge.owner_TB(OWNER_INDEX)).toBe(admin)
    }, TIMEOUT);

    test("Initialize Token Service", async () => {
      const isTokenServiceInitialized = (await tokenService.owner_TS(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      if (!isTokenServiceInitialized) {
        tokenService.connect(admin)
        const [initializeTx] = await tokenService.initialize_ts(
          admin
        );
        await initializeTx.wait();
      }
      expect(await tokenService.owner_TS(OWNER_INDEX)).toBe(admin)
    }, TIMEOUT);

    test("Token Bridge: Enable Ethereum Chain", async () => {
      const isEthSupported = (await bridge.supported_chains(ethChainId, false));
      if (!isEthSupported) {
        bridge.connect(admin)
        const [addEthChainTx] = await bridge.add_chain_tb(ethChainId);
        await addEthChainTx.wait();
      }
      expect(await bridge.supported_chains(ethChainId)).toBe(true)
    }, TIMEOUT);

    test("Initialize WUSDC", async () => {
      let isTokenInitialized = (await wusdcToken.token_owner(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      if (!isTokenInitialized) {
        wusdcConnector.connect(admin)
        const [initializeTx] = await wusdcConnector.initialize_wusdc();
        await initializeTx.wait();
      }
      expect(await wusdcToken.token_owner(OWNER_INDEX)).toBe(wusdcConnector.address())
      expect(await wusdcHolding.owner_holding(OWNER_INDEX)).toBe(wusdcConnector.address())
    }, TIMEOUT);

    test("Token Service: Add New Token", async () => {
      const isWusdcSupported = (await tokenService.token_connectors(wusdcToken.address(), ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      if (!isWusdcSupported) {
        tokenService.connect(admin)
        const [supportWusdcTx] = await tokenService.add_token_ts(
          wusdcToken.address(),
          wusdcConnector.address(),
          BigInt(100), // minimum transfer
          BigInt(100_000), // maximum transfer
          100_00, // outgoing percentage
          1, // (timeframe)
          BigInt(100_000) // max liquidity for no cap
        );
        await supportWusdcTx.wait();
      }
      expect(await tokenService.token_connectors(wusdcToken.address(), ALEO_ZERO_ADDRESS)).toBe(wusdcConnector.address())
    }, TIMEOUT);

    test("Token Bridge: Enable Service", async () => {
      const isTokenServiceEnabled = await bridge.supported_services(tokenService.address(), false);
      if (!isTokenServiceEnabled) {
        bridge.connect(admin)
        const [supportServiceTx] = await bridge.add_service_tb(
          tokenService.address()
        );
        await supportServiceTx.wait();
      }
      expect(await bridge.supported_services(tokenService.address())).toBe(true)
    }, TIMEOUT);

    test("Token Bridge: Unpause", async () => {
      const isPaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_PAUSED_VALUE;
      if (isPaused) {
        bridge.connect(admin)
        const [unpauseTx] = await bridge.unpause_tb();
        await unpauseTx.wait();
      }
      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
    }, TIMEOUT);

    test("Token Service: Token Unpause", async () => {
      const isPaused = (await tokenService.token_status(wusdcToken.address(), TOKEN_PAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
      if (isPaused) {
        tokenService.connect(admin)
        const [unpauseTx] = await tokenService.unpause_token_ts(wusdcToken.address());
        await unpauseTx.wait();
      }
      expect(await tokenService.token_status(wusdcToken.address())).toBe(TOKEN_UNPAUSED_VALUE)
    },
      TIMEOUT
    );
  });

  describe("Happy Path", () => {

    test("Ensure proper setup", async () => {
      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
      expect(await bridge.supported_chains(ethChainId)).toBe(true);
      expect(await bridge.supported_services(tokenService.address())).toBe(true);
      expect(await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX)).toBe(1);
      expect(await bridge.owner_TB(OWNER_INDEX)).toBe(admin);

      expect(await tokenService.token_connectors(wusdcToken.address())).toBe(wusdcConnector.address());
      expect(await tokenService.owner_TS(OWNER_INDEX)).toBe(admin);
      expect(await tokenService.token_status(wusdcToken.address())).toBe(TOKEN_UNPAUSED_VALUE);

      expect(await wusdcToken.token_owner(OWNER_INDEX)).toBe(wusdcConnector.address());
      expect(await wusdcHolding.owner_holding(OWNER_INDEX)).toBe(wusdcConnector.address());
    });

    test("Receive wUSDC", async () => {
      const amount = BigInt(100_000);
      const packet = createPacket(aleoUser2, amount);
      const initialBalance = await wusdcToken.account(aleoUser2, BigInt(0));
      const initialSupply = await tokenService.total_supply(wusdcToken.address(), BigInt(0));

      const packetId: PacketId = {
        chain_id: packet.source.chain_id,
        sequence: packet.sequence
      }
      expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);

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

      const [tx] = await wusdcConnector.wusdc_receive(
        Array.from(getBytes(ethUser)), // sender
        aleoUser2, // receiver
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signs
      );
      await tx.wait();

      let finalBalance = await wusdcToken.account(aleoUser2);
      expect(finalBalance).toBe(initialBalance + packet.message.amount);

      let finalSupply = await tokenService.total_supply(wusdcToken.address());
      expect(finalSupply).toBe(initialSupply + packet.message.amount);

    },
      TIMEOUT
    );

    test("Transfer wUSDC", async () => {
      const initialBalance = await wusdcToken.account(aleoUser2);
      const outgoingSequence = await bridge.sequences(ethChainId, BigInt(1));
      const initialSupply = await tokenService.total_supply(wusdcToken.address());

      const outgoingAmount = BigInt(1_000);

      wusdcConnector.connect(aleoUser2);
      const [tx] = await wusdcConnector.wusdc_send(
        Array.from(getBytes(ethUser)), // receiver
        outgoingAmount
      );
      await tx.wait();

      const finalBalance = await wusdcToken.account(aleoUser2);
      expect(finalBalance).toBe(initialBalance - outgoingAmount);

      const finalSupply = await tokenService.total_supply(wusdcToken.address());
      expect(finalSupply).toBe(initialSupply - outgoingAmount);

      const packetKey: PacketId = {
        chain_id: ethChainId,
        sequence: outgoingSequence,
      };
      const outPacket = await bridge.out_packets(packetKey);

      expect(aleoArr2Evm(outPacket.message.dest_token_address)).toBe(usdcContractAddr.toLocaleLowerCase());
      expect(outPacket.message.sender_address).toBe(aleoUser2);
      expect(aleoArr2Evm(outPacket.message.receiver_address)).toBe(ethUser.toLowerCase());
      expect(outPacket.message.amount).toBe(outgoingAmount);
      expect(outPacket.source.chain_id).toBe(aleoChainId);
      expect(outPacket.source.addr).toBe(tokenService.address());
      expect(outPacket.destination.chain_id).toBe(ethChainId);
      expect(aleoArr2Evm(outPacket.destination.addr)).toBe(ethTsContractAddr.toLowerCase());
    },
      TIMEOUT
    );

  });

  describe("Screening Failed Path", () => {
    test("Ensure proper setup", async () => {
      expect(await bridge.owner_TB(OWNER_INDEX)).toBe(aleoUser1);
      expect(await tokenService.owner_TS(OWNER_INDEX)).toBe(aleoUser1);
      expect(await wusdcToken.token_owner(OWNER_INDEX)).toBe(wusdcConnector.address());
      expect(await wusdcHolding.owner_holding(OWNER_INDEX)).toBe(wusdcConnector.address());
    });

    test("Initialize Council", async () => {
      let isCouncilInitialized = (await council.settings(COUNCIL_THRESHOLD_INDEX, 0)) != 0;

      if (!isCouncilInitialized) {
        const [initializeTx] = await council.initialize(
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5], 1
        );
        await initializeTx.wait();
      }
    },
      TIMEOUT
    );

    test("Receive wUSDC must collect the amount in holding program", async () => {
      const packet = createPacket(aleoUser1, BigInt(100_000));
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

      const [tx] = await wusdcConnector.wusdc_receive(
        Array.from(getBytes(ethUser)), // sender
        aleoUser1, // receiver
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signs
      );
      await tx.wait();

      const userFinalBalance = await wusdcToken.account(aleoUser1, BigInt(0));
      const holdingProgramFinalBalance = await wusdcToken.account(wusdcHolding.address(), BigInt(0));
      const finalHeldAmount = await wusdcHolding.holdings(aleoUser1, BigInt(0));

      expect(userFinalBalance).toBe(userInitialBalance);
      expect(holdingProgramFinalBalance).toBe(
        holdingProgramInitialBalance + packet.message.amount
      );
      expect(finalHeldAmount).toBe(initialHeldAmount + packet.message.amount);
    },
      TIMEOUT
    );

    test("Release held amount", async () => {

      const userInitialBalance = await wusdcToken.account(aleoUser1, BigInt(0));
      const holdingProgramInitialBalance = await wusdcToken.account(wusdcHolding.address(), BigInt(0));
      const initialHeldAmount = await wusdcHolding.holdings(aleoUser1, BigInt(0));

      let proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1
      const releaseFundProposal: HoldingRelease = {
        id: proposalId,
        token_address: wusdcToken.address(),
        connector: wusdcConnector.address(),
        receiver: aleoUser1,
        amount: initialHeldAmount,
      };
      const releaseFundProposalHash = hashStruct(
        getHoldingReleaseLeo(releaseFundProposal)
      );
      let [tx] = await council.propose(proposalId, releaseFundProposalHash);
      await tx.wait();

      const voters = [aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      wusdcConnector.connect(aleoUser1);
      let [tx2] = await wusdcConnector.wusdc_release(
        proposalId,
        aleoUser1,
        initialHeldAmount,
        voters
      );
      await tx2.wait();

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

  describe("New Connector", () => {
    test("Deploy New connector", async () => {
      const tx = await newConnector.deploy();
      await tx.wait();
    }, TIMEOUT)

    test("Update to new connector", async () => {
      let proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1
      const proposal: ConnectorUpdate = {
        id: proposalId,
        token_address: wusdcToken.address(),
        connector: wusdcConnector.address(),
        new_connector: newConnector.address(),
      };
      const proposalHash = hashStruct(getConnectorUpdateLeo(proposal));
      let [tx] = await council.propose(proposalId, proposalHash);
      await tx.wait();

      const voters = [aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      let [tx2] = await wusdcConnector.update(proposalId, newConnector.address(), voters);
      await tx2.wait();

      expect(await tokenService.token_connectors(wusdcToken.address())).toBe(newConnector.address());
      expect(await wusdcHolding.owner_holding(OWNER_INDEX)).toBe(newConnector.address());
      expect(await wusdcToken.token_owner(OWNER_INDEX)).toBe(newConnector.address());
    }, TIMEOUT * 2)

    describe("Screening Failed Path with new connector", () => {
      beforeEach(async () => {
        expect(await bridge.owner_TB(OWNER_INDEX)).toBe(aleoUser1);
        expect(await tokenService.owner_TS(OWNER_INDEX)).toBe(aleoUser1);
        expect(await wusdcToken.token_owner(OWNER_INDEX)).toBe(newConnector.address());
        expect(await wusdcHolding.owner_holding(OWNER_INDEX)).toBe(newConnector.address());
      }, TIMEOUT);

      test(
        "Receive wUSDC must collect the amount in holding program",
        async () => {
          const packet = createPacket(aleoUser1, BigInt(100_000));
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

          const [tx] = await newConnector.wusdc_receive(
            Array.from(getBytes(ethUser)), // sender
            aleoUser1, // receiver
            packet.message.amount,
            packet.sequence,
            packet.height,
            signers,
            signs
          );
          await tx.wait();

          const userFinalBalance = await wusdcToken.account(aleoUser1, BigInt(0));
          const holdingProgramFinalBalance = await wusdcToken.account(wusdcHolding.address(), BigInt(0));
          const finalHeldAmount = await wusdcHolding.holdings(aleoUser1, BigInt(0));

          expect(userFinalBalance).toBe(userInitialBalance);
          expect(holdingProgramFinalBalance).toBe(
            holdingProgramInitialBalance + packet.message.amount
          );
          expect(finalHeldAmount).toBe(initialHeldAmount + packet.message.amount);
        },
        TIMEOUT
      );

      test(
        "Release held amount",
        async () => {

          const userInitialBalance = await wusdcToken.account(aleoUser1, BigInt(0));
          const holdingProgramInitialBalance = await wusdcToken.account(wusdcHolding.address(), BigInt(0));
          const initialHeldAmount = await wusdcHolding.holdings(aleoUser1, BigInt(0));

          let proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1
          const releaseFundProposal: HoldingRelease = {
            id: proposalId,
            token_address: wusdcToken.address(),
            connector: newConnector.address(),
            receiver: aleoUser1,
            amount: initialHeldAmount,
          };
          const releaseFundProposalHash = hashStruct(
            getHoldingReleaseLeo(releaseFundProposal)
          );
          let [tx] = await council.propose(proposalId, releaseFundProposalHash);
          await tx.wait();

          const voters = [aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
          wusdcConnector.connect(aleoUser1);
          let [tx2] = await newConnector.wusdc_release(
            proposalId,
            aleoUser1,
            initialHeldAmount,
            voters,
          );
          await tx2.wait();

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

  })

});