import { Token_bridge_v0002Contract } from "../artifacts/js/token_bridge_v0002";
import { InPacket, PacketId } from "../artifacts/js/types/token_bridge_v0002";
import { Token_service_v0002Contract } from "../artifacts/js/token_service_v0002";
import { Wusdc_token_v0002Contract } from "../artifacts/js/wusdc_token_v0002";
import { Council_v0002Contract } from "../artifacts/js/council_v0002";

import {
  aleoChainId,
  ethChainId,
  ethTsContractAddr,
  ethUser,
  usdcContractAddr,
} from "./mockData";

import { aleoArr2Evm, evm2AleoArr } from "../utils/ethAddress";
import { signPacket } from "../utils/sign";

import {
  ALEO_ZERO_ADDRESS,
  BRIDGE_PAUSABILITY_INDEX,
  BRIDGE_PAUSED_VALUE,
  BRIDGE_THRESHOLD_INDEX,
  BRIDGE_TOTAL_ATTESTORS_INDEX,
  BRIDGE_UNPAUSED_VALUE,
  OWNER_INDEX,
} from "../utils/constants";
import { PrivateKey } from "@aleohq/sdk";
import { createRandomPacket } from "../utils/packet";

const bridge = new Token_bridge_v0002Contract({ mode: "execute" });
const tokenService = new Token_service_v0002Contract({ mode: "execute" });
const wusdcToken = new Wusdc_token_v0002Contract({ mode: "execute" });
const council = new Council_v0002Contract({ mode: "execute" });

const TIMEOUT = 20000_000;

const createPacket = (
  receiver: string,
  amount: bigint,
  aleoTsAddr: string
): InPacket => {
  return createRandomPacket(
    receiver,
    amount,
    ethChainId,
    aleoChainId,
    ethTsContractAddr,
    aleoTsAddr,
    wusdcToken.address(),
    ethUser
  );
};

describe("Token Bridge ", () => {
  const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = bridge.getAccounts();
  const aleoUser5 = new PrivateKey().to_address().to_string();

  const admin = aleoUser1;
  const aleoTsAddr = aleoUser4;

  describe.skip("Setup", () => {
    bridge.connect(admin)

    test( "Deploy", async () => {
        const deployTx = await bridge.deploy();
        await bridge.wait(deployTx);
      }, TIMEOUT);

    test( "Initialize", async () => {
        const threshold = 1;
        const isBridgeInitialized = (await bridge.owner_TB(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
        if (!isBridgeInitialized) {
          const [tx] = await bridge.initialize_tb(
            [aleoUser1, aleoUser2, ALEO_ZERO_ADDRESS, aleoUser3, ALEO_ZERO_ADDRESS],
            threshold,
            admin
          );
          await bridge.wait(tx);
        }
        expect(await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX)).toBe( threshold);
        expect(await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX)).toBe(3);
        expect(await bridge.attestors(aleoUser1)).toBeTruthy();
        expect(await bridge.attestors(aleoUser2)).toBeTruthy();
        expect(await bridge.attestors(aleoUser3)).toBeTruthy();
        expect(await bridge.attestors(ALEO_ZERO_ADDRESS)).toBeTruthy();
        expect(await bridge.attestors(aleoUser4, false)).toBe(false);
      }, TIMEOUT);

    test("Add Chain", async () => {
        const isEthSupported = (await bridge.supported_chains(ethChainId, false));
        if (!isEthSupported) {
          const [addEthChainTx] = await bridge.add_chain_tb(ethChainId);
          await bridge.wait(addEthChainTx);
        }
        expect(await bridge.supported_chains(ethChainId, false)).toBe(true)
    }, TIMEOUT)

    test("Add Service", async () => {
        const isTokenServiceEnabled = await bridge.supported_services(aleoTsAddr, false);
        if (!isTokenServiceEnabled) {
          const [supportServiceTx] = await bridge.add_service_tb(aleoTsAddr);
          await bridge.wait(supportServiceTx);
        }
        expect(await bridge.supported_services(aleoTsAddr)).toBe(true);
    }, TIMEOUT)

    test("Unpause", async () => {
        const isPaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_PAUSED_VALUE;
        if (isPaused) {
          const [unpauseTx] = await bridge.unpause_tb();
          await bridge.wait(unpauseTx);
        }
        expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE)).toBe(BRIDGE_UNPAUSED_VALUE);
    }, TIMEOUT)
  })

  describe("Publish", () => {

    const destChainId = ethChainId;
    const destTsAddr = ethTsContractAddr.toLowerCase();
    const destToken = usdcContractAddr.toLocaleLowerCase();
    const sender = aleoUser5
    const receiver = ethUser.toLowerCase()
    const amount = BigInt(100);

    test(
      "Happy path",
      async () => {
        const initialSequence = await bridge.sequences(destChainId, BigInt(1));
        const packet_id: PacketId = {
          chain_id: destChainId,
          sequence: initialSequence,
        };

        bridge.connect(aleoTsAddr);
        const [tx] = await bridge.publish(
          destChainId,
          evm2AleoArr(destTsAddr),
          evm2AleoArr(destToken),
          sender,
          evm2AleoArr(receiver),
          amount
        );
        await bridge.wait(tx);

        const finalSequence = await bridge.sequences(destChainId);
        expect(finalSequence).toBe(initialSequence + BigInt(1));

        const outPacket = await bridge.out_packets(packet_id);

        expect(aleoArr2Evm(outPacket.message.dest_token_address)).toBe(destToken);
        expect(outPacket.message.sender_address).toBe(sender);
        expect(aleoArr2Evm(outPacket.message.receiver_address)).toBe(receiver);
        expect(outPacket.message.amount).toBe(amount);
        expect(outPacket.source.chain_id).toBe(aleoChainId);
        expect(outPacket.source.addr).toBe(aleoTsAddr);
        expect(outPacket.destination.chain_id).toBe(destChainId);
        expect(aleoArr2Evm(outPacket.destination.addr)).toBe(destTsAddr);
      },
      TIMEOUT
    );

    test.failing(
      "From non-supported service (fails)",
      async () => {
        expect(await bridge.supported_services(admin, false)).toBe(false);
        bridge.connect(admin);
        const [tx] = await bridge.publish(
          destChainId,
          evm2AleoArr(destTsAddr),
          evm2AleoArr(destToken),
          sender,
          evm2AleoArr(receiver),
          amount
        );
        await bridge.wait(tx);
      },
      TIMEOUT
    );

    test.failing(
      "To non-supported chain (fails)",
      async () => {
        const destChainId = BigInt(1);
        expect(await bridge.supported_chains(destChainId, false)).toBe(false);
        bridge.connect(aleoTsAddr);
        const [tx] = await bridge.publish(
          destChainId,
          evm2AleoArr(destTsAddr),
          evm2AleoArr(destToken),
          sender,
          evm2AleoArr(receiver),
          amount
        );
        await bridge.wait(tx);
      },
      TIMEOUT
    );

    test.todo("When paused (fails)")

  });

  describe("Consume", () => {

    const packet = createPacket(aleoUser1, BigInt(100_000), aleoTsAddr);

    test( "Screening passed", async () => {
        let packetId: PacketId = {
          chain_id: packet.source.chain_id,
          sequence: packet.sequence
        }
        bridge.connect(admin);
        const signature = signPacket(packet, true, bridge.config.privateKey);
        const signatures = [
          signature,
          signature,
          signature,
          signature,
          signature,
        ];
        const signers = [
          admin,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
        ];

        expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);
        bridge.connect(aleoTsAddr)
        const [screeningPassed, tx] = await bridge.consume(
          packet.source.chain_id,
          packet.source.addr,
          packet.message.dest_token_address,
          packet.message.sender_address,
          packet.message.receiver_address,
          packet.message.amount,
          packet.sequence,
          packet.height,
          signers,
          signatures
        );
        await bridge.wait(tx);

        expect(screeningPassed).toBe(true);
        expect(await bridge.in_packet_consumed(packetId, false)).toBe(true);
      },
      TIMEOUT
    );

    test.failing("Consume the same packet again - fails", async () => {
        let packetId: PacketId = {
          chain_id: packet.source.chain_id,
          sequence: packet.sequence
        }
        bridge.connect(admin)
        const signature = signPacket(packet, true, bridge.config.privateKey);
        const signatures = [
          signature,
          signature,
          signature,
          signature,
          signature,
        ];
        const signers = [
          admin,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
        ];

        expect(await bridge.in_packet_consumed(packetId, false)).toBe(true);
        bridge.connect(aleoTsAddr);
        const [screeningPassed, tx] = await bridge.consume(
          packet.source.chain_id,
          packet.source.addr,
          packet.message.dest_token_address,
          packet.message.sender_address,
          packet.message.receiver_address,
          packet.message.amount,
          packet.sequence,
          packet.height,
          signers,
          signatures
        );
        await bridge.wait(tx);
      },
      TIMEOUT
    );

    test( "Screening failed", async () => {
        const packet = createPacket(aleoUser1, BigInt(100_000), aleoTsAddr);
        let packetId: PacketId = {
          chain_id: packet.source.chain_id,
          sequence: packet.sequence
        }
        bridge.connect(admin)
        const signature = signPacket(packet, false, bridge.config.privateKey);
        const signatures = [
          signature,
          signature,
          signature,
          signature,
          signature,
        ];
        const signers = [
          admin,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
        ];

        expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);
        bridge.connect(aleoTsAddr);
        const [screeningPassed, tx] = await bridge.consume(
          packet.source.chain_id,
          packet.source.addr,
          packet.message.dest_token_address,
          packet.message.sender_address,
          packet.message.receiver_address,
          packet.message.amount,
          packet.sequence,
          packet.height,
          signers,
          signatures
        );
        await bridge.wait(tx);

        expect(screeningPassed).toBe(false);
        expect(await bridge.in_packet_consumed(packetId, false)).toBe(true);
      },
      TIMEOUT
    );

    test.failing( "Invalid attestor must fail", async () => {
        const packet = createPacket(aleoUser1, BigInt(100_000), aleoTsAddr);
        const wallet = new PrivateKey();
        const walletAddress = wallet.to_address().to_string();
        const signature1 = signPacket(packet, true, bridge.config.privateKey);
        const signature2 = signPacket(packet, true, wallet.to_string());

        expect(await bridge.attestors(walletAddress, false)).toBe(false);

        let packetId: PacketId = {
          chain_id: packet.source.chain_id,
          sequence: packet.sequence
        }
        const signatures = [
          signature1,
          signature2,
          signature1,
          signature2,
          signature1,
        ];
        const signers = [
          aleoUser1,
          walletAddress,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
          ALEO_ZERO_ADDRESS,
        ];

        expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);
        bridge.connect(aleoTsAddr);
        const [screeningPassed, tx] = await bridge.consume(
          packet.source.chain_id,
          packet.source.addr,
          packet.message.dest_token_address,
          packet.message.sender_address,
          packet.message.receiver_address,
          packet.message.amount,
          packet.sequence,
          packet.height,
          signers,
          signatures
        );
        expect(screeningPassed).toBe(true);
        await bridge.wait(tx);
      },
      TIMEOUT
    );

  });

  describe.skip("Pausability", () => {
    test.skip.failing(
      "should not unpause by non-owner",
      async () => {
        bridge.connect(aleoUser3);
        const [tx] = await bridge.unpause_tb();
        await bridge.wait(tx);
      },
      TIMEOUT
    );

    test(
      "owner can unpause",
      async () => {
        bridge.connect(aleoUser1);
        const [tx] = await bridge.unpause_tb();
        expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)).toBe(
          BRIDGE_PAUSED_VALUE
        );
        await bridge.wait(tx);
        expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(
          BRIDGE_UNPAUSED_VALUE
        );
      },
      TIMEOUT
    );

    test.skip.failing(
      "should not pause by non-owner",
      async () => {
        bridge.connect(aleoUser3); //changing the contract caller account to non owner
        const [tx] = await bridge.pause_tb();
        await bridge.wait(tx);
      },
      TIMEOUT
    );

    test(
      "owner can pause",
      async () => {
        bridge.connect(aleoUser1);
        const [tx] = await bridge.pause_tb();
        await bridge.wait(tx);
        expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(
          BRIDGE_PAUSED_VALUE
        );
      },
      TIMEOUT
    );

    // simply unpausing contract for further tests
    test(
      "owner can unpause",
      async () => {
        const [tx] = await bridge.unpause_tb();
        await bridge.wait(tx);
        expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(
          BRIDGE_UNPAUSED_VALUE
        );
      },
      TIMEOUT
    );
  });

  describe.skip("Governance", () => {
    const aleoUser6 = new PrivateKey().to_address().to_string();
    const aleoUser7 = new PrivateKey().to_address().to_string();

    describe("Add Attestor", () => {
      const newThreshold = 2;
      test(
        "Owner can add new attestor",
        async () => {
          const totalAttestors = await bridge.bridge_settings(
            BRIDGE_TOTAL_ATTESTORS_INDEX
          );

          let isAttestor = await bridge.attestors(aleoUser6, false);
          expect(isAttestor).toBe(false);

          const [tx] = await bridge.add_attestor_tb(aleoUser6, newThreshold);
          await bridge.wait(tx);
          isAttestor = await bridge.attestors(aleoUser6, false);
          expect(isAttestor).toBe(true);

          const newTotalAttestors = await bridge.bridge_settings(
            BRIDGE_TOTAL_ATTESTORS_INDEX
          );
          expect(newTotalAttestors).toBe(totalAttestors + 1);

          const updatedThreshold = await bridge.bridge_settings(
            BRIDGE_THRESHOLD_INDEX
          );
          expect(updatedThreshold).toBe(newThreshold);
        },
        TIMEOUT
      );

      test.failing(
        "Other address cannot add attestor",
        async () => {
          let isAttestor = await bridge.attestors(aleoUser7, false);
          expect(isAttestor).toBe(false);

          bridge.connect(aleoUser3);
          const [tx] = await bridge.add_attestor_tb(aleoUser7, newThreshold);
          await bridge.wait(tx);
        },
        TIMEOUT
      );

      test.failing(
        "Existing attestor cannot be added again",
        async () => {
          const threshold = await bridge.bridge_settings(
            BRIDGE_THRESHOLD_INDEX
          );
          let isAttestor = await bridge.attestors(aleoUser6, false);
          expect(isAttestor).toBe(true);
          bridge.connect(aleoUser1);
          const [tx] = await bridge.add_attestor_tb(aleoUser6, threshold);
          await bridge.wait(tx);
        },
        TIMEOUT
      );
    });

    describe("Remove Attestor", () => {
      const newThreshold = 1;
      test(
        "Owner can remove attestor",
        async () => {
          const totalAttestors = await bridge.bridge_settings(
            BRIDGE_TOTAL_ATTESTORS_INDEX
          );
          let isAttestor = await bridge.attestors(aleoUser6, false);
          expect(isAttestor).toBe(true);

          const [tx] = await bridge.remove_attestor_tb(aleoUser6, newThreshold);

          await bridge.wait(tx);
          isAttestor = await bridge.attestors(aleoUser6, false);
          expect(isAttestor).toBe(false);

          const newTotalAttestors = await bridge.bridge_settings(
            BRIDGE_TOTAL_ATTESTORS_INDEX
          );
          expect(newTotalAttestors).toBe(totalAttestors - 1);
        },
        TIMEOUT
      );

      test.failing(
        "Remove non existing attestor",
        async () => {
          const [tx] = await bridge.remove_attestor_tb(aleoUser6, 5);

          await bridge.wait(tx);
        },
        TIMEOUT
      );

      test.failing(
        "should not remove attestor if new threshold is less than current threshold",
        async () => {
          const threshold = await bridge.bridge_settings(
            BRIDGE_THRESHOLD_INDEX
          );
          const [tx1] = await bridge.update_threshold_tb(newThreshold);

          await bridge.wait(tx1);
          const [tx] = await bridge.remove_attestor_tb(
            aleoUser3,
            threshold - 1
          ); // TODO: is this test checking correct behaviour?

          await bridge.wait(tx);
        },
        TIMEOUT
      );

      test.failing(
        "should not remove attestor by non-owner",
        async () => {
          bridge.connect(aleoUser3);
          const [tx] = await bridge.remove_attestor_tb(aleoUser3, 5);
          await bridge.wait(tx);
        },
        TIMEOUT
      );

      test.todo("There must be at least two attestors to remove a attestor");
    });

    describe("Update threshold", () => {
      const newThreshold = 1;
      test(
        "Owner can update threshold",
        async () => {
          bridge.connect(aleoUser1);
          console.log(aleoUser1, await bridge.owner_TB(true));
          const [tx] = await bridge.update_threshold_tb(newThreshold);
          await bridge.wait(tx);

          const updatedThreshold = await bridge.bridge_settings(
            BRIDGE_THRESHOLD_INDEX
          );
          expect(updatedThreshold).toBe(newThreshold);
        },
        TIMEOUT
      );

      test.failing(
        "should not update threshold by non-admin",
        async () => {
          bridge.connect(aleoUser3);
          const [tx] = await bridge.update_threshold_tb(newThreshold);

          await bridge.wait(tx);
        },
        TIMEOUT
      );

      test.failing(
        "should not update threshold if new threshold is less than 1",
        async () => {
          bridge.connect(aleoUser1);
          const [tx] = await bridge.update_threshold_tb(0);

          await bridge.wait(tx);
        },
        TIMEOUT
      );

      test.failing(
        "should not update threshold if new threshold is greater than total attestor",
        async () => {
          const totalAttestors = await bridge.bridge_settings(
            BRIDGE_TOTAL_ATTESTORS_INDEX
          );
          const [tx] = await bridge.update_threshold_tb(totalAttestors + 2);

          await bridge.wait(tx);
        },
        TIMEOUT
      );
    });

    describe("Add Chain", () => {
      test(//donot skip
        "Owner can enable chain",
        async () => {
          expect(await bridge.owner_TB(OWNER_INDEX, ALEO_ZERO_ADDRESS)).toBe(admin)
          expect(await bridge.supported_chains(ethChainId, false)).toBe(false);
          bridge.connect(admin)
          const [tx] = await bridge.add_chain_tb(ethChainId);
          await bridge.wait(tx);
          expect(await bridge.supported_chains(ethChainId, false)).toBe(true);
        },
        TIMEOUT
      );

      test.failing(
        "should not add chain by non-admin",
        async () => {
          bridge.connect(aleoUser3);
          const [enableChainTx] = await bridge.add_chain_tb(ethChainId);
          await bridge.wait(enableChainTx);
        },
        TIMEOUT
      );
    });

    describe("Remove Chain", () => {
      test.failing(
        "should not disable chain by non_admin",
        async () => {
          bridge.connect(aleoUser3);
          const [disableChainTx] = await bridge.remove_chain_tb(ethChainId);

          await bridge.wait(disableChainTx);
        },
        TIMEOUT
      );

      test.skip(
        "Owner can remove chain",
        async () => {
          bridge.connect(aleoUser1);
          let isEthEnabled = await bridge.supported_chains(ethChainId, false);
          expect(isEthEnabled).toBe(true);
          const [enableChainTx] = await bridge.remove_chain_tb(ethChainId);

          await bridge.wait(enableChainTx);

          isEthEnabled = await bridge.supported_chains(ethChainId, false);
          expect(isEthEnabled).toBe(false);
        },
        TIMEOUT
      );

      test.failing(
        "should have a chain to remove it",
        async () => {
          const [disableChainTx] = await bridge.remove_chain_tb(ethChainId);
          await bridge.wait(disableChainTx);
        },
        TIMEOUT
      );
    });

    describe("Add Service", () => {
      test(
        "Owner can add service",
        async () => {
          let isTsEnabled = await bridge.supported_services(aleoTsAddr, false);
          expect(isTsEnabled).toBe(false);
          const [enableServiceTx] = await bridge.add_service_tb(aleoTsAddr);

          await bridge.wait(enableServiceTx);
          isTsEnabled = await bridge.supported_services(aleoTsAddr, false);
          expect(isTsEnabled).toBe(true);
        },
        TIMEOUT
      );

      test.failing(
        "should not enable service by non-admin",
        async () => {
          bridge.connect(aleoUser3);
          const [enableServiceTx] = await bridge.add_service_tb(
            tokenService.address()
          );

          await bridge.wait(enableServiceTx);
        },
        TIMEOUT
      );
    });

    describe("Remove Service", () => {
      test.failing(
        "should not disable service by non_admin",
        async () => {
          bridge.connect(aleoUser3);
          const [disableChainTx] = await bridge.remove_service_tb(
            tokenService.address()
          );

          await bridge.wait(disableChainTx);
        },
        TIMEOUT
      );

      test.skip(
        "Owner can disable service",
        async () => {
          bridge.connect(aleoUser1);
          const [enableChainTx] = await bridge.remove_service_tb(
            tokenService.address()
          );

          await bridge.wait(enableChainTx);
          const isTsEnabled = await bridge.supported_services(
            tokenService.address(),
            false
          ); // TODO: try default value with all mapping above
          expect(isTsEnabled).toBe(false);
        },
        TIMEOUT
      );

      test.failing(
        "should not remove unavailabe service",
        async () => {
          const [removeChainTx] = await bridge.remove_service_tb(
            tokenService.address()
          );

          await bridge.wait(removeChainTx);
        },
        TIMEOUT
      );
    });
  });

  describe.skip("Transfer Ownership", () => {
    test.failing(
      "should not transfer ownership by non-admin",
      async () => {
        bridge.connect(aleoUser3);
        const [transferOwnershipTx] = await bridge.transfer_ownership_tb(
          council.address()
        );

        await bridge.wait(transferOwnershipTx);
      },
      TIMEOUT
    );

    test(
      "Current owner can transfer ownership",
      async () => {
        bridge.connect(aleoUser1);
        const currentOwner = await bridge.owner_TB(true);
        expect(currentOwner).toBe(aleoUser1);

        const [transferOwnershipTx] = await bridge.transfer_ownership_tb(
          council.address()
        );

        await bridge.wait(transferOwnershipTx);

        const newOwner = await bridge.owner_TB(true);
        expect(newOwner).toBe(council.address());
      },
      TIMEOUT
    );
  });

  describe.skip("Initialization", () => {
    test.skip.failing(
      "Initialize - Threshold too low (must fail)",
      async () => {
        await bridge.initialize_tb(
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          0,
          admin // governance
        );
      },
      TIMEOUT
    );

    test.skip.failing(
      "Initialize - Threshold too high (must fail)",
      async () => {
        await bridge.initialize_tb(
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          6,
          admin // governance
        );
      },
      TIMEOUT
    );

    test.skip.failing(
      "Initialize (Second try) - Expected parameters (must fail)",
      async () => {
        const isBridgeInitialized =
          (await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX, 0)) != 0;
        expect(isBridgeInitialized).toBe(true);

        const [tx] = await bridge.initialize_tb(
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          1,
          admin //governance
        );
        await bridge.wait(tx);
      },
      TIMEOUT
    );

  });

});
