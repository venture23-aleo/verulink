import { Council_v0002Contract } from "../artifacts/js/council_v0002";
import { Token_bridge_v0002Contract } from "../artifacts/js/token_bridge_v0002";
import { Token_service_v0002Contract } from "../artifacts/js/token_service_v0002";
import { Wusdc_token_v0002Contract } from "../artifacts/js/wusdc_token_v0002";
import { Wusdc_holding_v0002Contract } from "../artifacts/js/wusdc_holding_v0002";
import { Wusdc_connector_v0002Contract } from "../artifacts/js/wusdc_connector_v0002";
import { Wusdc_connector_v0003Contract } from "../artifacts/js/wusdc_connector_v0003";

import {
  aleoChainId,
  ethChainId,
  ethTsContractAddr,
  ethUser,
  usdcContractAddr,
} from "./mockData";
import { Address, PrivateKey } from "@aleohq/sdk";
import { ALEO_ZERO_ADDRESS, BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE, BRIDGE_THRESHOLD_INDEX, BRIDGE_UNPAUSED_VALUE, BRIDGE_VERSION, COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_PROPOSALS_INDEX, OWNER_INDEX } from "../utils/constants";
import { aleoArr2Evm, evm2AleoArr } from "../utils/ethAddress";
import { signPacket } from "../utils/sign";
import { hashStruct } from "../utils/hash";
import { getConnectorUpdateLeo, getHoldingReleaseLeo } from "../artifacts/js/js2leo/council_v0002";
import { InPacket, PacketId } from "../artifacts/js/types/token_bridge_v0002";
import { ConnectorUpdate, HoldingRelease, leoProposalVoteSchema } from "../artifacts/js/types/council_v0002";
import { createRandomPacket } from "../utils/packet";
import { js2leo } from "@aleojs/core";

const bridge = new Token_bridge_v0002Contract({ mode: "execute" });
const tokenService = new Token_service_v0002Contract({ mode: "execute" });
const council = new Council_v0002Contract({ mode: "execute" });
const wusdcToken = new Wusdc_token_v0002Contract({ mode: "execute" });
const wusdcHolding = new Wusdc_holding_v0002Contract({ mode: "execute" });
const wusdcConnector = new Wusdc_connector_v0002Contract({ mode: "execute" });
const newConnector = new Wusdc_connector_v0003Contract({ mode: "execute" });

const TIMEOUT = 100_000; // 100 seconds

const createPacket = (receiver: string, amount: bigint): InPacket => {
  return createRandomPacket(receiver, amount, ethChainId, aleoChainId, ethTsContractAddr, tokenService.address(), wusdcToken.address(), ethUser);
}

describe("Token Connector", () => {

  const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = wusdcConnector.getAccounts();
  const aleoUser5 = new PrivateKey().to_address().to_string();

  const admin = aleoUser1;

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
        const isBridgeInitialized = (await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX, 0)) != 0;

        if (!isBridgeInitialized) {
          const initializeTx = await bridge.initialize_tb(
            [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
            threshold,
            admin
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

        const isTokenServiceInitialized = (await tokenService.owner_TS(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
        if (!isTokenServiceInitialized) {
          const initializeTx = await tokenService.initialize_ts(
            admin
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
        let isTokenInitialized = (await wusdcToken.token_owner(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
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
        if (isPaused) {
          const unpauseTx = await bridge.unpause_tb();
          // @ts-ignore
          await unpauseTx.wait();
        }
      },
      TIMEOUT
    );
  });

  describe("Happy Path", () => {

    test("Ensure proper setup", async () => {
      expect(await bridge.owner_TB(OWNER_INDEX)).toBe(admin);
      expect(await tokenService.owner_TS(OWNER_INDEX)).toBe(admin);
      expect(await wusdcToken.token_owner(OWNER_INDEX)).toBe(wusdcConnector.address());
      expect(await wusdcHolding.owner_holding(OWNER_INDEX)).toBe(wusdcConnector.address());
      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
      expect(await bridge.supported_chains(ethChainId)).toBe(true);
      expect(await bridge.supported_services(tokenService.address())).toBe(true);
      expect(await tokenService.token_connectors(wusdcToken.address())).toBe(wusdcConnector.address());
    });

    test(
      "Receive wUSDC",
      async () => {
        const amount = BigInt(100_000);
        const packet = createPacket(aleoUser1, amount);
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
          packet.message.amount,
          packet.sequence,
          packet.height,
          signers,
          signs
        );

        // @ts-ignore
        await tx.wait();

        let finalBalance = await wusdcToken.account(aleoUser1);
        expect(finalBalance).toBe(initialBalance + packet.message.amount);

        let finalSupply = await tokenService.total_supply(wusdcToken.address());
        expect(finalSupply).toBe(initialSupply + packet.message.amount);

      },
      TIMEOUT
    );

    test(
      "Transfer wUSDC",
      async () => {
        const initialBalance = await wusdcToken.account(aleoUser1);
        const outgoingSequence = await bridge.sequences(ethChainId, BigInt(1));
        const initialSupply = await tokenService.total_supply(wusdcToken.address());

        const outgoingAmount = BigInt(1_000);
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

        expect(aleoArr2Evm(outPacket.message.dest_token_address)).toBe(usdcContractAddr);
        expect(outPacket.message.sender_address).toBe(aleoUser1);
        expect(aleoArr2Evm(outPacket.message.receiver_address)).toBe(
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
    test("Ensure proper setup", async () => {
      expect(await bridge.owner_TB(OWNER_INDEX)).toBe(aleoUser1);
      expect(await tokenService.owner_TS(OWNER_INDEX)).toBe(aleoUser1);
      expect(await wusdcToken.token_owner(OWNER_INDEX)).toBe(wusdcConnector.address());
      expect(await wusdcHolding.owner_holding(OWNER_INDEX)).toBe(wusdcConnector.address());
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

        const tx = await wusdcConnector.wusdc_receive(
          evm2AleoArr(ethUser), // sender
          aleoUser1, // receiver
          packet.message.amount,
          packet.sequence,
          packet.height,
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
          getHoldingReleaseLeo(releaseFundProposal)
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
    test.failing("Pass an invalid signature - must fail", async () => {
        const amount = BigInt(100_000);
        const packet = createPacket(aleoUser1, amount);
        const signature = signPacket(packet, true, bridge.config.privateKey);

        const signers = [
          Address.from_private_key(
            PrivateKey.from_string(bridge.config.privateKey)
          ).to_string(),
          aleoUser2,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
        ];

        const signs = [signature, signature, signature, signature, signature];

        const tx = await wusdcConnector.wusdc_receive(
          evm2AleoArr(ethUser), // sender
          aleoUser1, // receiver
          packet.message.amount,
          packet.sequence,
          packet.height,
          signers,
          signs
        );
    }, TIMEOUT);

    test.failing("Pass valid signature from valid attestor twice - must fail", async () => {
        const amount = BigInt(100_000);
        const packet = createPacket(aleoUser1, amount);

        const signature1 = signPacket(packet, true, bridge.config.privateKey);

        const signers = [
          aleoUser1,
          aleoUser1,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
        ];

        const signs = [signature1, signature1, signature1, signature1, signature1];

        const tx = await wusdcConnector.wusdc_receive(
          evm2AleoArr(ethUser), // sender
          aleoUser1, // receiver
          packet.message.amount,
          packet.sequence,
          packet.height,
          signers,
          signs
        );
        // @ts-ignore
        const txReceipt = await tx.wait();
        expect(txReceipt.error).toBeTruthy();
    }, TIMEOUT);

    test.failing("Pass all ZERO_ALEO_ADDRESS - (threshold not met) must fail", async () => {
        // Note: This fails because the YAY and NO votes both are 0. i.e. YAY votes = NAY votes
        const amount = BigInt(100_000);
        const packet = createPacket(aleoUser1, amount);

        const signature1 = signPacket(packet, true, bridge.config.privateKey);

        const signers = [
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
        ];

        const signs = [signature1, signature1, signature1, signature1, signature1];

        await wusdcConnector.wusdc_receive(
          evm2AleoArr(ethUser), // sender
          aleoUser1, // receiver
          packet.message.amount,
          packet.sequence,
          packet.height,
          signers,
          signs
        );
    }, TIMEOUT);

    test("Pass a valid signature from invalid attestor - must fail", async () => {
        const wallet = new PrivateKey();
        const amount = BigInt(100_000);
        const packet = createPacket(aleoUser1, amount);
        const signature1 = signPacket(packet, true, bridge.config.privateKey);

        const signature2 = signPacket(packet, true, wallet.to_string());

        const signers = [
          Address.from_private_key(
            PrivateKey.from_string(bridge.config.privateKey)
          ).to_string(),
          wallet.to_address().to_string(),
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
        ];

        const signs = [signature1, signature2, signature1, signature1, signature1];

        const tx = await wusdcConnector.wusdc_receive(
          evm2AleoArr(ethUser), // sender
          aleoUser1, // receiver
          packet.message.amount,
          packet.sequence,
          packet.height,
          signers,
          signs
        );
        // @ts-ignore
        const txReceipt = await tx.wait();
        expect(txReceipt.error).toBeTruthy();
    }, TIMEOUT);

  });

  describe("Token Send", () => {
    test.todo("So many cases to look at");
  });

  describe("Update Connector", () => {
    test("Deploy New connector", async () => {
      const tx = await newConnector.deploy();
      await tx.wait();
  }, TIMEOUT)

    test("Happy Path", async () => {
        let proposalId = parseInt( (await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1
        const proposal: ConnectorUpdate = {
          id: proposalId,
          token_address: wusdcToken.address(),
          connector: wusdcConnector.address(),
          new_connector: newConnector.address(),
        };
        const proposalHash = hashStruct(getConnectorUpdateLeo(proposal));
        let tx = await council.propose(proposalId, proposalHash);

        // @ts-ignore
        await tx.wait();

        tx = await wusdcConnector.update(proposalId, newConnector.address());

        // @ts-ignore
        await tx.wait();

        expect(await tokenService.token_connectors(wusdcToken.address())).toBe(newConnector.address());
        expect(await wusdcHolding.owner_holding(OWNER_INDEX)).toBe(newConnector.address());
        expect(await wusdcToken.token_owner(OWNER_INDEX)).toBe(newConnector.address());
    }, TIMEOUT * 2)

  })

});
