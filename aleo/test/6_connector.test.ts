import { Address, PrivateKey } from "@aleohq/sdk";

import { Council_v0003Contract } from "../artifacts/js/council_v0003";
import { Token_bridge_v0003Contract } from "../artifacts/js/token_bridge_v0003";
import { Token_service_v0003Contract } from "../artifacts/js/token_service_v0003";
import { Wusdc_token_v0003Contract } from "../artifacts/js/wusdc_token_v0003";
import { Wusdc_holding_v0003Contract } from "../artifacts/js/wusdc_holding_v0003";
import { Wusdc_connector_v0003_0Contract } from "../artifacts/js/wusdc_connector_v0003_0";
import { Wusdc_connector_v0003_1Contract } from "../artifacts/js/wusdc_connector_v0003_1";

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
 } from "../utils/constants";
import { aleoArr2Evm, evm2AleoArr, generateRandomEthAddr } from "../utils/ethAddress";
import { signPacket } from "../utils/sign";
import { hashStruct } from "../utils/hash";
import { getConnectorUpdateLeo, getHoldingReleaseLeo } from "../artifacts/js/js2leo/council_v0003";
import { InPacket, PacketId } from "../artifacts/js/types/token_bridge_v0003";
import { ConnectorUpdate, HoldingRelease, leoProposalVoteSchema } from "../artifacts/js/types/council_v0003";
import { createRandomPacket } from "../utils/packet";
import { getBytes } from "ethers";

const bridge = new Token_bridge_v0003Contract({ mode: "execute" });
const tokenService = new Token_service_v0003Contract({ mode: "execute" });
const council = new Council_v0003Contract({ mode: "execute" });
const wusdcToken = new Wusdc_token_v0003Contract({ mode: "execute" });
const wusdcHolding = new Wusdc_holding_v0003Contract({ mode: "execute" });
const wusdcConnector = new Wusdc_connector_v0003_0Contract({ mode: "execute" });
const newConnector = new Wusdc_connector_v0003_1Contract({ mode: "execute" });

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
        await bridge.wait(deployTx);
      },
      TIMEOUT
    );

    test("Deploy Token Service", async () => {
        const deployTx = await tokenService.deploy();
        await tokenService.wait(deployTx);
      },
      TIMEOUT
    );

    test("Deploy Council", async () => {
        const deployTx = await council.deploy();
        await council.wait(deployTx);
      },
      TIMEOUT
    );

    test("Deploy Token", async () => {
        const deployTx = await wusdcToken.deploy();
        await wusdcToken.wait(deployTx)
      },
      TIMEOUT
    );

    test("Deploy Holding", async () => {
        const deployTx = await wusdcHolding.deploy();
        await wusdcHolding.wait(deployTx);
      },
      TIMEOUT
    );

    test("Deploy Connector", async () => {
        const deployTx = await wusdcConnector.deploy();
        await wusdcConnector.wait(deployTx);
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
          await bridge.wait(initializeTx);
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
          await tokenService.wait(initializeTx);
        }
        expect(await tokenService.owner_TS(OWNER_INDEX)).toBe(admin)
      }, TIMEOUT);

    test("Token Bridge: Enable Ethereum Chain", async () => {
        const isEthSupported = (await bridge.supported_chains(ethChainId, false));
        if (!isEthSupported) {
          bridge.connect(admin)
          const [addEthChainTx] = await bridge.add_chain_tb(ethChainId);
          await bridge.wait(addEthChainTx);
        }
        expect(await bridge.supported_chains(ethChainId)).toBe(true)
      }, TIMEOUT);

    test("Initialize WUSDC", async () => {
        let isTokenInitialized = (await wusdcToken.token_owner(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
        if (!isTokenInitialized) {
          wusdcConnector.connect(admin)
          const [initializeTx] = await wusdcConnector.initialize_wusdc();
          await wusdcConnector.wait(initializeTx);
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
          await tokenService.wait(supportWusdcTx);
        }
        expect(await tokenService.token_connectors(wusdcToken.address(), ALEO_ZERO_ADDRESS)).toBe(wusdcConnector.address())
      }, TIMEOUT);

    test( "Token Bridge: Enable Service", async () => {
        const isTokenServiceEnabled = await bridge.supported_services(tokenService.address(), false);
        if (!isTokenServiceEnabled) {
          bridge.connect(admin)
          const [supportServiceTx] = await bridge.add_service_tb(
            tokenService.address()
          );
          await bridge.wait(supportServiceTx);
        }
        expect(await bridge.supported_services(tokenService.address())).toBe(true)
      }, TIMEOUT);

    test( "Token Bridge: Unpause", async () => {
        const isPaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_PAUSED_VALUE;
        if (isPaused) {
          bridge.connect(admin)
          const [unpauseTx] = await bridge.unpause_tb();
          await bridge.wait(unpauseTx);
        }
        expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
      }, TIMEOUT);

    test( "Token Service: Token Unpause", async () => {
        const isPaused = (await tokenService.token_status(wusdcToken.address(), TOKEN_PAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
        if (isPaused) {
          tokenService.connect(admin)
          const [unpauseTx] = await tokenService.unpause_token_ts(wusdcToken.address());
          await bridge.wait(unpauseTx);
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

    test( "Receive wUSDC", async () => {
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
        await wusdcConnector.wait(tx);

        let finalBalance = await wusdcToken.account(aleoUser2);
        expect(finalBalance).toBe(initialBalance + packet.message.amount);

        let finalSupply = await tokenService.total_supply(wusdcToken.address());
        expect(finalSupply).toBe(initialSupply + packet.message.amount);

      },
      TIMEOUT
    );

    test( "Transfer wUSDC", async () => {
        const initialBalance = await wusdcToken.account(aleoUser2);
        const outgoingSequence = await bridge.sequences(ethChainId, BigInt(1));
        const initialSupply = await tokenService.total_supply(wusdcToken.address());

        const outgoingAmount = BigInt(1_000);

        wusdcConnector.connect(aleoUser2);
        const [tx] = await wusdcConnector.wusdc_send(
          Array.from(getBytes(ethUser)), // receiver
          outgoingAmount
        );
        await wusdcConnector.wait(tx);

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
        expect(aleoArr2Evm(outPacket.message.receiver_address)).toBe( ethUser.toLowerCase());
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

    test( "Initialize Council", async () => {
        let isCouncilInitialized = (await council.settings(COUNCIL_THRESHOLD_INDEX, 0)) != 0;

        if (!isCouncilInitialized) {
          const [initializeTx] = await council.initialize(
            [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5], 1
          );
          await council.wait(initializeTx);
        }
      },
      TIMEOUT
    );

    test( "Receive wUSDC must collect the amount in holding program", async () => {
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
        await wusdcConnector.wait(tx);

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

    test( "Release held amount", async () => {

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
        let [tx] = await council.propose(proposalId, releaseFundProposalHash);
        await council.wait(tx);

        const voters = [ aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS ];
        wusdcConnector.connect(aleoUser1);
        [tx] = await wusdcConnector.wusdc_release(
          proposalId,
          aleoUser1,
          initialHeldAmount,
          voters
        );
        await wusdcConnector.wait(tx);

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
      await newConnector.wait(tx);
  }, TIMEOUT)

    test("Update to new connector", async () => {
        let proposalId = parseInt( (await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1
        const proposal: ConnectorUpdate = {
          id: proposalId,
          token_address: wusdcToken.address(),
          connector: wusdcConnector.address(),
          new_connector: newConnector.address(),
        };
        const proposalHash = hashStruct(getConnectorUpdateLeo(proposal));
        let [tx] = await council.propose(proposalId, proposalHash);
        await council.wait(tx);

        const voters = [ aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS ];
        [tx] = await wusdcConnector.update(proposalId, newConnector.address(), voters);
        await wusdcConnector.wait(tx);

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
          await newConnector.wait(tx);

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
            connector: newConnector.address(),
            receiver: aleoUser1,
            amount: initialHeldAmount,
          };
          const releaseFundProposalHash = hashStruct(
            getHoldingReleaseLeo(releaseFundProposal)
          );
          let [tx] = await council.propose(proposalId, releaseFundProposalHash);
          await council.wait(tx);

          const voters = [ aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS ];
          wusdcConnector.connect(aleoUser1);
          [tx] = await newConnector.wusdc_release(
            proposalId,
            aleoUser1,
            initialHeldAmount,
            voters,
          );
          await newConnector.wait(tx);

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