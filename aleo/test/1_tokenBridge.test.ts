import { Vlink_token_service_v3Contract } from "../artifacts/js/vlink_token_service_v3";
import { Vlink_council_v3Contract } from "../artifacts/js/vlink_council_v3";
import { Vlink_token_bridge_v3Contract } from "../artifacts/js/vlink_token_bridge_v3";
import { InPacket, PacketId } from "../artifacts/js/types/vlink_token_bridge_v3";
import { aleoArr2Evm, evm2AleoArr, generateRandomEthAddr } from "../utils/ethAddress";
import { signPacket } from "../utils/sign";
import {
  ALEO_ZERO_ADDRESS,
  BRIDGE_PAUSABILITY_INDEX,
  BRIDGE_PAUSED_VALUE,
  BRIDGE_THRESHOLD_INDEX,
  BRIDGE_TOTAL_ATTESTORS_INDEX,
  BRIDGE_UNPAUSED_VALUE,
  OWNER_INDEX,
  aleoChainId,
  ethChainId,
  ethTsContractAddr,
  usdcContractAddr,
  ethTsRandomContractAddress,
  PUBLIC_VERSION,
  baseChainId,
  arbitrumChainId,
  usdtContractAddr,
  VERSION_PUBLIC_NORELAYER_NOPREDICATE
} from "../utils/constants";

import { PrivateKey } from "@aleohq/sdk";
import { createRandomPacket } from "../utils/bridge_packet";
import { ExecutionMode } from "@doko-js/core";


const mode = ExecutionMode.SnarkExecute;


const bridge = new Vlink_token_bridge_v3Contract({ mode: mode });
const tokenService = new Vlink_token_service_v3Contract({ mode: mode });
const council = new Vlink_council_v3Contract({ mode: mode });

const tokenID = BigInt(123456789);


const TIMEOUT = 20000_000;

const ethUser = generateRandomEthAddr();
const createPacket = (
  receiver: string,
  amount: bigint,
  aleoTsAddr: string,
  evmTsAddress: string,
  chainId: bigint,
  version = PUBLIC_VERSION,
): InPacket => {
  return createRandomPacket(
    receiver,
    amount,
    chainId,
    aleoChainId,
    evmTsAddress,
    aleoTsAddr,
    tokenID,
    ethUser,
    version
  );
};

describe("Token Bridge ", () => {
  const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = bridge.getAccounts();
  const aleoUser5 = new PrivateKey().to_address().to_string();

  const admin = aleoUser1;
  const aleoTsAddr = aleoUser4;

  describe.skip("Setup", () => {
    bridge.connect(admin);

    test.skip("Deploy", async () => {
      if (mode === ExecutionMode.SnarkExecute) {
        if (bridge.config.mode && bridge.config.mode == ExecutionMode.SnarkExecute) {
          const deployBridgeTx = await bridge.deploy();
          await deployBridgeTx.wait();
        }
      }
    }, TIMEOUT);

    test.skip("Initialize", async () => {
      const threshold = 1;
      const isBridgeInitialized = (await bridge.owner_TB(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      if (!isBridgeInitialized) {
        let tx = await bridge.initialize_tb(
          [aleoUser1, aleoUser2, ALEO_ZERO_ADDRESS, aleoUser3, ALEO_ZERO_ADDRESS],
          threshold,
          admin
        );
        await tx.wait();
      }

      expect(await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX)).toBe(threshold);
      expect(await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX)).toBe(3);
      expect(await bridge.attestors(aleoUser1)).toBeTruthy();
      expect(await bridge.attestors(aleoUser2)).toBeTruthy();
      expect(await bridge.attestors(aleoUser3)).toBeTruthy();
      expect(await bridge.attestors(ALEO_ZERO_ADDRESS)).toBeTruthy();
      // expect(await bridge.attestors(aleoUser4, false)).toBeFalsy();
    }, TIMEOUT);

    test("Initialize (Second try) - Expected parameters (must fail)",
      async () => {
        const isBridgeInitialized =
          (await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX, 0)) != 0;
        expect(isBridgeInitialized).toBe(true);

        const tx = await bridge.initialize_tb(
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          1,
          admin //governance
        );
        await expect(tx.wait()).rejects.toThrow("Cannot read properties of undefined (reading 'transitions')");
      },
      TIMEOUT
    );
  })

  describe("Governance", () => {
    describe.skip("Pausability", () => {
      test("should not unpause by non-owner", async () => {
        bridge.connect(aleoUser3);
        const tx = await bridge.unpause_tb();
        await expect(tx.wait()).rejects.toThrow();
      }, TIMEOUT);

      test("owner can unpause", async () => {
        expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)).toBe(BRIDGE_PAUSED_VALUE);
        bridge.connect(aleoUser1);
        const tx = await bridge.unpause_tb();
        await tx.wait();
        expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
      },
        TIMEOUT
      );

      test("should not pause by non-owner", async () => {
        bridge.connect(aleoUser3); //changing the contract caller account to non owner
        const tx = await bridge.pause_tb();
        await expect(tx.wait()).rejects.toThrow();
      }, TIMEOUT);

      test("owner can pause", async () => {
        bridge.connect(admin);
        const tx = await bridge.pause_tb();
        await tx.wait();
        expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_PAUSED_VALUE);
      }, TIMEOUT);

      test.skip("unpause for rest of testing", async () => {
        expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)).toBe(BRIDGE_PAUSED_VALUE);
        bridge.connect(aleoUser1);
        const tx = await bridge.unpause_tb();
        await tx.wait();
      },
        TIMEOUT
      );
    });

    describe.skip("Add/Remove Attestors", () => {
      const newAttestor = new PrivateKey().to_address().to_string();

      describe("Add Attestor", () => {
        const newThreshold = 2;

        test("Non-owner cannot add attestor", async () => {
          const newAttestor = new PrivateKey().to_address().to_string();
          let isAttestor = await bridge.attestors(newAttestor, false);
          expect(isAttestor).toBe(false);

          bridge.connect(aleoUser3);
          const tx = await bridge.add_attestor_tb(newAttestor, newThreshold);
          await expect(tx.wait()).rejects.toThrow()
        }, TIMEOUT);

        test("Threshold should not cross greater than total attestor", async () => {
          const totalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);
          bridge.connect(admin);
          const tx = await bridge.add_attestor_tb(newAttestor, totalAttestors + 2);
          await expect(tx.wait()).rejects.toThrow()
        },
          TIMEOUT
        );

        test("Owner can add new attestor", async () => {
          const totalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);
          expect(await bridge.attestors(newAttestor, false)).toBe(false);

          bridge.connect(admin)
          const tx = await bridge.add_attestor_tb(newAttestor, newThreshold);
          await tx.wait();
          expect(await bridge.attestors(newAttestor, false)).toBe(true);
          const newTotalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);
          expect(newTotalAttestors).toBe(totalAttestors + 1);
          const updatedThreshold = await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX);
          expect(updatedThreshold).toBe(newThreshold);
        }, TIMEOUT);

        test("Existing attestor cannot be added again", async () => {
          let isAttestor = await bridge.attestors(newAttestor, false);
          expect(isAttestor).toBe(true);

          bridge.connect(admin);
          const tx = await bridge.add_attestor_tb(newAttestor, newThreshold);
          await expect(tx.wait()).rejects.toThrow()
        },
          TIMEOUT
        );

      });

      describe("Remove Attestor", () => {
        const newThreshold = 1;

        test("Non owner cannot remove attestor", async () => {
          let isAttestor = await bridge.attestors(newAttestor, false);
          expect(isAttestor).toBe(true);
          bridge.connect(aleoUser3);
          const tx = await bridge.remove_attestor_tb(newAttestor, newThreshold);
          await expect(tx.wait()).rejects.toThrow();
        },
          TIMEOUT
        );

        test("Attestor must be added to be removed", async () => {
          let isAttestor = await bridge.attestors(aleoUser5, false);
          expect(isAttestor).toBe(false);
          const tx = await bridge.remove_attestor_tb(aleoUser5, newThreshold);
          await expect(tx.wait()).rejects.toThrow();
        },
          TIMEOUT
        );

        //test.failing
        test.failing("zero address cannot be removed", async () => {
          const ZERO_ADDRESS = "aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc";
          const totalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);
          bridge.connect(admin)
          const tx = await bridge.remove_attestor_tb(ZERO_ADDRESS, newThreshold);
          await tx.wait();
        }, TIMEOUT);

        test("Threshold should not cross greater than total attestor", async () => {
          const totalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);

          let isAttestor = await bridge.attestors(newAttestor, false);
          expect(isAttestor).toBe(true);

          bridge.connect(admin);
          const tx = await bridge.remove_attestor_tb(newAttestor, totalAttestors + 1);
          await expect(tx.wait()).rejects.toThrow();
        },
          TIMEOUT
        );

        test("Owner can remove attestor", async () => {
          const totalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);
          let isAttestor = await bridge.attestors(newAttestor, false);
          expect(isAttestor).toBe(true);

          bridge.connect(admin)
          const tx = await bridge.remove_attestor_tb(newAttestor, newThreshold);
          await tx.wait();

          isAttestor = await bridge.attestors(newAttestor, false);
          expect(isAttestor).toBe(false);
          const newTotalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);
          expect(newTotalAttestors).toBe(totalAttestors - 1);
        },
          TIMEOUT
        );

      });
    })

    describe.skip("Update threshold", () => {
      const newThreshold = 3;
      let failThreshold = 0;

      test("Non-owner cannot update threshold", async () => {
        bridge.connect(aleoUser3);
        const tx = await bridge.update_threshold_tb(newThreshold);
        await expect(tx.wait()).rejects.toThrow()
      },
        TIMEOUT
      );

      test("new threshold should be less than or equal to total attestor", async () => {
        const totalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);
        bridge.connect(aleoUser3);
        const tx = await bridge.update_threshold_tb(totalAttestors + 1);
        await expect(tx.wait()).rejects.toThrow()
      },
        TIMEOUT
      );

      test("Owner can update threshold", async () => {
        bridge.connect(admin);
        const tx = await bridge.update_threshold_tb(newThreshold);
        await tx.wait();
        const updatedThreshold = await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX);
        expect(updatedThreshold).toBe(newThreshold);
      },
        TIMEOUT
      );

      test("Change threshold back to one", async () => {
        bridge.connect(admin);
        const tx = await bridge.update_threshold_tb(1);
        await tx.wait();
        const updatedThreshold = await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX);
        expect(updatedThreshold).toBe(1);
      },
        TIMEOUT
      );
    });

    describe.skip("Add/Remove Chain", () => {
      const chainId = BigInt(1)

      describe("Add Chain", () => {
        test("should not add chain by non-admin", async () => {
          const newChainId = BigInt(2)
          expect(await bridge.supported_chains(newChainId, false)).toBe(false);
          bridge.connect(aleoUser3);
          const tx = await bridge.add_chain_tb(newChainId);
          await expect(tx.wait()).rejects.toThrow()
        },
          TIMEOUT
        );

        describe("Owner can add mutiple chain", () => {
          //for etherem
          test("Owner can add eth chain", async () => {
            expect(await bridge.owner_TB(OWNER_INDEX, ALEO_ZERO_ADDRESS)).toBe(admin)
            expect(await bridge.supported_chains(chainId, false)).toBe(false);
            bridge.connect(admin)
            const tx = await bridge.add_chain_tb(chainId);
            await tx.wait();
            expect(await bridge.supported_chains(chainId, false)).toBe(true);
          },
            TIMEOUT
          );

          test("Owner can add base chain", async () => {
            expect(await bridge.owner_TB(OWNER_INDEX, ALEO_ZERO_ADDRESS)).toBe(admin)
            expect(await bridge.supported_chains(baseChainId, false)).toBe(false);
            bridge.connect(admin)
            const tx = await bridge.add_chain_tb(baseChainId);
            await tx.wait();
            expect(await bridge.supported_chains(baseChainId, false)).toBe(true);
          },
            TIMEOUT
          );

          test("Owner can add arbitrum chain", async () => {
            expect(await bridge.owner_TB(OWNER_INDEX, ALEO_ZERO_ADDRESS)).toBe(admin)
            expect(await bridge.supported_chains(arbitrumChainId, false)).toBe(false);
            bridge.connect(admin)
            const tx = await bridge.add_chain_tb(arbitrumChainId);
            await tx.wait();
            expect(await bridge.supported_chains(arbitrumChainId, false)).toBe(true);
          },
            TIMEOUT
          );
        })
      })

      describe("Remove Chain", () => {
        test("should not remove chain by non_admin", async () => {
          bridge.connect(aleoUser3);
          const tx = await bridge.remove_chain_tb(chainId);
          await expect(tx.wait()).rejects.toThrow();
        },
          TIMEOUT
        );

        test("should have a chain to remove it", async () => {
          const falseChainID = BigInt(10);
          let isChainEnabled = await bridge.supported_chains(falseChainID, false);
          expect(isChainEnabled).toBe(false);

          bridge.connect(admin)
          const tx = await bridge.remove_chain_tb(falseChainID);
          await expect(tx.wait()).rejects.toThrow();
        },
          TIMEOUT
        );

        test("Owner can remove eth chain", async () => {
          let isChainEnabled = await bridge.supported_chains(chainId, false);
          expect(isChainEnabled).toBe(true);

          bridge.connect(admin);
          const tx = await bridge.remove_chain_tb(chainId);
          await tx.wait();
          isChainEnabled = await bridge.supported_chains(chainId, false);
          expect(isChainEnabled).toBe(false);
        },
          TIMEOUT
        );

        test("Owner can remove base chain", async () => {
          let isChainEnabled = await bridge.supported_chains(baseChainId, false);
          expect(isChainEnabled).toBe(true);

          bridge.connect(admin);
          const tx = await bridge.remove_chain_tb(baseChainId);
          await tx.wait();
          isChainEnabled = await bridge.supported_chains(baseChainId, false);
          expect(isChainEnabled).toBe(false);
        },
          TIMEOUT
        );

        test("Owner can remove arbitrum chain", async () => {
          let isChainEnabled = await bridge.supported_chains(arbitrumChainId, false);
          expect(isChainEnabled).toBe(true);

          bridge.connect(admin);
          const tx = await bridge.remove_chain_tb(arbitrumChainId);
          await tx.wait();
          isChainEnabled = await bridge.supported_chains(arbitrumChainId, false);
          expect(isChainEnabled).toBe(false);
        },
          TIMEOUT
        );
      })

    });

    describe.skip("Add/Remove Service", () => {
      const newTsAddr = new PrivateKey().to_address().to_string();

      describe("Add Service", () => {

        test("Non-owner cannot add service", async () => {
          const newTsAddr = new PrivateKey().to_address().to_string();
          let isTsEnabled = await bridge.supported_services(newTsAddr, false);
          expect(isTsEnabled).toBe(false);

          bridge.connect(aleoUser3);
          const tx = await bridge.add_service_tb(newTsAddr);
          await expect(tx.wait()).rejects.toThrow()
        },
          TIMEOUT
        );

        test("Owner can add service",
          async () => {
            let isTsEnabled = await bridge.supported_services(newTsAddr, false);
            expect(isTsEnabled).toBe(false);

            bridge.connect(admin)
            const tx = await bridge.add_service_tb(newTsAddr);
            await tx.wait();

            isTsEnabled = await bridge.supported_services(newTsAddr, false);
            expect(isTsEnabled).toBe(true);
          },
          TIMEOUT
        );
      })

      describe("Remove Service", () => {
        test("Non-owner cannot remove service", async () => {
          let isTsEnabled = await bridge.supported_services(newTsAddr, false);
          expect(isTsEnabled).toBe(true);

          bridge.connect(aleoUser3);
          const tx = await bridge.remove_service_tb(newTsAddr);
          await expect(tx.wait()).rejects.toThrow()
        },
          TIMEOUT
        );

        test("Service must be added to be removed", async () => {
          let isTsEnabled = await bridge.supported_services(aleoUser5, false);
          expect(isTsEnabled).toBe(false);

          bridge.connect(admin);
          const tx = await bridge.remove_service_tb(aleoUser5);
          await expect(tx.wait()).rejects.toThrow()
        },
          TIMEOUT
        );

        test("Owner can remove service", async () => {
          let isTsEnabled = await bridge.supported_services(newTsAddr, false);
          expect(isTsEnabled).toBe(true);

          bridge.connect(admin);
          const tx = await bridge.remove_service_tb(newTsAddr);
          await tx.wait();

          isTsEnabled = await bridge.supported_services(tokenService.address(), false);
          expect(isTsEnabled).toBe(false);
        },
          TIMEOUT
        );
      })
    });
  });

  describe.skip("Publish", () => {

    const destChainId = ethChainId;
    const destTsAddr = ethTsContractAddr.toLowerCase();
    const destToken = usdtContractAddr.toLowerCase();
    const sender = aleoUser5
    const receiver = ethUser.toLowerCase()
    const amount = BigInt(100);

    test("Bridge should not be paused", async () => {
      //paused for testing 
      bridge.connect(admin);
      const pausetx = await bridge.pause_tb();
      await pausetx.wait();

      const initialSequence = await bridge.sequences(destChainId, BigInt(1));
      const packet_id: PacketId = {
        chain_id: destChainId,
        sequence: initialSequence,
      };

      bridge.connect(aleoTsAddr);
      let tx = await bridge.publish(
        VERSION_PUBLIC_NORELAYER_NOPREDICATE,
        destChainId,
        evm2AleoArr(destTsAddr),
        evm2AleoArr(destToken),
        sender,
        evm2AleoArr(receiver),
        amount
      );
      await expect(tx.wait()).rejects.toThrow()
    }, TIMEOUT);

    test("From non-supported service, transaction should be failed and undefined",
      async () => {
        //unpaused for testing 
        bridge.connect(admin);
        const unpausedtx = await bridge.unpause_tb();
        await unpausedtx.wait();

        const initialSequence = await bridge.sequences(destChainId, BigInt(1));
        const packet_id: PacketId = {
          chain_id: destChainId,
          sequence: initialSequence,
        };

        // supported services not added yet, mapping should throw null
        const isSupportedService = await bridge.supported_services(admin, false);
        console.log(isSupportedService);
        if (!isSupportedService) {
          bridge.connect(admin);
          const tx = await bridge.publish(
            VERSION_PUBLIC_NORELAYER_NOPREDICATE,
            destChainId,
            evm2AleoArr(ethTsRandomContractAddress.toLowerCase()), // destTsAddr
            evm2AleoArr(destToken),
            sender,
            evm2AleoArr(receiver),
            amount
          );
          await expect(tx.wait()).rejects.toThrow()
        }
      },
      TIMEOUT
    );

    test("To non-supported chain, transaction should be failed and undefined",
      async () => {
        const destChainId = BigInt(1);
        // supported chain not added yet, mapping should throw null
        expect(await bridge.supported_chains(destChainId, false)).toBe(false);
        bridge.connect(aleoTsAddr);
        const tx = await bridge.publish(
          VERSION_PUBLIC_NORELAYER_NOPREDICATE,
          destChainId,
          evm2AleoArr(destTsAddr),
          evm2AleoArr(destToken),
          sender,
          evm2AleoArr(receiver),
          amount
        );
        await expect(tx.wait()).rejects.toThrow()
      },
      TIMEOUT
    );

    test("Publish on Eth",
      async () => {
        // adding chain 
        bridge.connect(admin)
        const addChainTx = await bridge.add_chain_tb(ethChainId);
        await addChainTx.wait();

        // adding service 
        bridge.connect(admin)
        const enableServiceTx = await bridge.add_service_tb(aleoTsAddr);
        await enableServiceTx.wait();

        //if paused, unpause the bridge
        let unpause_status = bridge.bridge_settings(3, 0);
        if (!unpause_status) {
          await bridge.unpause_tb();
        }

        const initialSequence = await bridge.sequences(ethChainId, BigInt(1));
        const packet_id: PacketId = {
          chain_id: ethChainId,
          sequence: initialSequence,
        };

        bridge.connect(aleoTsAddr);
        let tx = await bridge.publish(
          VERSION_PUBLIC_NORELAYER_NOPREDICATE,
          ethChainId,
          evm2AleoArr(destTsAddr),
          evm2AleoArr(destToken),
          sender,
          evm2AleoArr(receiver),
          amount
        );
        await tx.wait();

        const finalSequence = await bridge.sequences(ethChainId, BigInt(1));
        expect(finalSequence).toBe(initialSequence + BigInt(1));

        const outPacket = await bridge.out_packets(packet_id);

        expect(aleoArr2Evm(outPacket.message.dest_token_address)).toBe(destToken);
        expect(outPacket.message.sender_address).toBe(sender);
        expect(aleoArr2Evm(outPacket.message.receiver_address)).toBe(receiver);
        expect(outPacket.message.amount).toBe(amount);
        expect(outPacket.source.chain_id).toBe(aleoChainId);
        expect(outPacket.source.addr).toBe(aleoTsAddr);
        expect(outPacket.destination.chain_id).toBe(ethChainId);
        expect(aleoArr2Evm(outPacket.destination.addr)).toBe(destTsAddr);
      },
      TIMEOUT
    );

    test("Publish on Base",
      async () => {
        // adding chain 
        bridge.connect(admin)
        const addChainTx = await bridge.add_chain_tb(baseChainId);
        await addChainTx.wait();

        // adding service 
        bridge.connect(admin)
        const enableServiceTx = await bridge.add_service_tb(aleoTsAddr);
        await enableServiceTx.wait();

        //if paused, unpause the bridge
        let unpause_status = bridge.bridge_settings(3, 0);
        if (!unpause_status) {
          await bridge.unpause_tb();
        }

        const initialSequence = await bridge.sequences(baseChainId, BigInt(1));
        const packet_id: PacketId = {
          chain_id: baseChainId,
          sequence: initialSequence,
        };

        bridge.connect(aleoTsAddr);
        let tx = await bridge.publish(
          VERSION_PUBLIC_NORELAYER_NOPREDICATE,
          baseChainId,
          evm2AleoArr(destTsAddr),
          evm2AleoArr(destToken),
          sender,
          evm2AleoArr(receiver),
          amount
        );
        await tx.wait();

        const finalSequence = await bridge.sequences(baseChainId, BigInt(1));
        expect(finalSequence).toBe(initialSequence + BigInt(1));

        const outPacket = await bridge.out_packets(packet_id);

        expect(aleoArr2Evm(outPacket.message.dest_token_address)).toBe(destToken);
        expect(outPacket.message.sender_address).toBe(sender);
        expect(aleoArr2Evm(outPacket.message.receiver_address)).toBe(receiver);
        expect(outPacket.message.amount).toBe(amount);
        expect(outPacket.source.chain_id).toBe(aleoChainId);
        expect(outPacket.source.addr).toBe(aleoTsAddr);
        expect(outPacket.destination.chain_id).toBe(baseChainId);
        expect(aleoArr2Evm(outPacket.destination.addr)).toBe(destTsAddr);
      },
      TIMEOUT
    );

    test("Publish on Arbitrum",
      async () => {
        // adding chain 
        bridge.connect(admin)
        const addChainTx = await bridge.add_chain_tb(arbitrumChainId);
        await addChainTx.wait();

        // adding service 
        bridge.connect(admin)
        const enableServiceTx = await bridge.add_service_tb(aleoTsAddr);
        await enableServiceTx.wait();

        //if paused, unpause the bridge
        let unpause_status = bridge.bridge_settings(3, 0);
        if (!unpause_status) {
          await bridge.unpause_tb();
        }

        const initialSequence = await bridge.sequences(arbitrumChainId, BigInt(1));
        const packet_id: PacketId = {
          chain_id: arbitrumChainId,
          sequence: initialSequence,
        };

        bridge.connect(aleoTsAddr);
        let tx = await bridge.publish(
          VERSION_PUBLIC_NORELAYER_NOPREDICATE,
          arbitrumChainId,
          evm2AleoArr(destTsAddr),
          evm2AleoArr(destToken),
          sender,
          evm2AleoArr(receiver),
          amount
        );
        await tx.wait();

        const finalSequence = await bridge.sequences(arbitrumChainId, BigInt(1));
        expect(finalSequence).toBe(initialSequence + BigInt(1));

        const outPacket = await bridge.out_packets(packet_id);

        expect(aleoArr2Evm(outPacket.message.dest_token_address)).toBe(destToken);
        expect(outPacket.message.sender_address).toBe(sender);
        expect(aleoArr2Evm(outPacket.message.receiver_address)).toBe(receiver);
        expect(outPacket.message.amount).toBe(amount);
        expect(outPacket.source.chain_id).toBe(aleoChainId);
        expect(outPacket.source.addr).toBe(aleoTsAddr);
        expect(outPacket.destination.chain_id).toBe(arbitrumChainId);
        expect(aleoArr2Evm(outPacket.destination.addr)).toBe(destTsAddr);
      },
      TIMEOUT
    );
  });

  describe("Consume", () => {
    const packet = createPacket(aleoUser1, BigInt(100_000), aleoTsAddr, ethTsContractAddr, ethChainId);
    test.skip("cant be called consume if program is paused", async () => {

      //paused for testing 
      bridge.connect(admin);
      const pausedtx = await bridge.pause_tb();
      await pausedtx.wait();

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
      const tx = await bridge.consume(
        packet.version,
        packet.source.chain_id,
        packet.source.addr,
        packet.message.dest_token_id,
        packet.message.sender_address,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures
      );
      await expect(tx.wait()).rejects.toThrow()
    },
      TIMEOUT
    );
    //check
    test.skip("From non-supported service, transaction should be failed and undefined", async () => {
      //paused for testing 
      bridge.connect(admin);
      const unpausedtx = await bridge.unpause_tb();
      await unpausedtx.wait();

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
      console.log(signatures, signers);
      expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);

      const tx = await bridge.consume(
        packet.version,
        packet.source.chain_id,
        packet.source.addr,
        packet.message.dest_token_id,
        packet.message.sender_address,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures
      );
      await expect(tx.wait()).rejects.toThrow()
    },
      TIMEOUT
    );

    test.skip("From non-supported chain, transaction should be failed and undefined", async () => {

      //paused for testing
      let differentChainPacket = createPacket(aleoUser1, BigInt(10000), aleoTsAddr, ethTsContractAddr, BigInt(12345));
      bridge.connect(admin);
      const unpausedtx = await bridge.unpause_tb();
      await unpausedtx.wait();

      let packetId: PacketId = {
        chain_id: differentChainPacket.source.chain_id,
        sequence: differentChainPacket.sequence
      }
      bridge.connect(admin);
      const signature = signPacket(differentChainPacket, true, bridge.config.privateKey);
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
      const unsupported_chain = BigInt(10);
      const tx = await bridge.consume(
        differentChainPacket.version,
        differentChainPacket.source.chain_id,
        differentChainPacket.source.addr,
        differentChainPacket.message.dest_token_id,
        differentChainPacket.message.sender_address,
        differentChainPacket.message.receiver_address,
        differentChainPacket.message.amount,
        differentChainPacket.sequence,
        differentChainPacket.height,
        signers,
        signatures
      );
      await expect(tx.wait()).rejects.toThrow()
    },
      TIMEOUT
    );

    test.skip("Invalid attestor must fail", async () => {
      const packet = createPacket(aleoUser1, BigInt(100_000), aleoTsAddr, ethTsContractAddr, ethChainId);
      const wallet = new PrivateKey();
      const walletAddress = wallet.to_address().to_string();
      const signature1 = signPacket(packet, true, wallet.to_string());

      expect(await bridge.attestors(walletAddress, false)).toBe(false);

      let packetId: PacketId = {
        chain_id: packet.source.chain_id,
        sequence: packet.sequence
      }
      const signatures = [
        signature1,
        signature1,
        signature1,
        signature1,
        signature1,
      ];
      const signers = [
        walletAddress,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
      ];

      expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);
      bridge.connect(aleoTsAddr);
      const tx = await bridge.consume(
        packet.version,
        packet.source.chain_id,
        packet.source.addr,
        packet.message.dest_token_id,
        packet.message.sender_address,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures
      );
      await expect(tx.wait()).rejects.toThrow()
    },
      TIMEOUT
    );

    test.skip("Screening passed for eth", async () => {
      const packet = createPacket(aleoUser1, BigInt(100_000), aleoTsAddr, ethTsContractAddr, ethChainId);

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
      const tx = await bridge.consume(
        packet.version,
        packet.source.chain_id,
        packet.source.addr,
        packet.message.dest_token_id,
        packet.message.sender_address,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures
      );

      const [screening_passed] = await tx.wait();
      expect(screening_passed).toEqual(true);
      expect(await bridge.in_packet_consumed(packetId, false)).toBe(true);
    },
      TIMEOUT
    );

    test.skip("Screening passed for base", async () => {
      const packet = createPacket(aleoUser1, BigInt(100_000), aleoTsAddr, ethTsContractAddr, baseChainId);

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
      const tx = await bridge.consume(
        packet.version,
        packet.source.chain_id,
        packet.source.addr,
        packet.message.dest_token_id,
        packet.message.sender_address,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures
      );
      const [screening_passed] = await tx.wait();
      expect(screening_passed).toEqual(true);
      expect(await bridge.in_packet_consumed(packetId, false)).toBe(true);
    },
      TIMEOUT
    );

    test.skip("Screening passed for arbitrum", async () => {
      const packet = createPacket(aleoUser1, BigInt(100_000), aleoTsAddr, ethTsContractAddr, arbitrumChainId);

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
      const tx = await bridge.consume(
        packet.version,
        packet.source.chain_id,
        packet.source.addr,
        packet.message.dest_token_id,
        packet.message.sender_address,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures
      );

      const [screening_passed] = await tx.wait();
      expect(screening_passed).toEqual(true);
      expect(await bridge.in_packet_consumed(packetId, false)).toBe(true);
    },
      TIMEOUT
    );

    test.skip("if consumed the same packet again, transaction should be failed and undefined", async () => {
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
      const tx = await bridge.consume(
        packet.version,
        packet.source.chain_id,
        packet.source.addr,
        packet.message.dest_token_id,
        packet.message.sender_address,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures
      );
      await expect(tx.wait()).rejects.toThrow()
    },
      TIMEOUT
    );

    test.skip("Screening failed", async () => {
      const packet = createPacket(aleoUser1, BigInt(100_000), aleoTsAddr, ethTsContractAddr, ethChainId);
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
      const tx = await bridge.consume(
        packet.version,
        packet.source.chain_id,
        packet.source.addr,
        packet.message.dest_token_id,
        packet.message.sender_address,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures
      );
      const [screeningPassed] = await tx.wait();

      expect(screeningPassed).toBe(false);
      expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);
    },
      TIMEOUT
    );
  });

  describe.skip("Transfer Ownership", () => {

    test("should not transfer ownership by non-admin", async () => {
      bridge.connect(aleoUser3);
      const tx = await bridge.transfer_ownership_tb(council.address());
      await expect(tx.wait()).rejects.toThrow()
    },
      TIMEOUT
    );

    test("Current owner can transfer ownership", async () => {
      bridge.connect(aleoUser1);
      const currentOwner = await bridge.owner_TB(true);
      expect(currentOwner).toBe(aleoUser1);

      const transferOwnershipTx = await bridge.transfer_ownership_tb(council.address());
      await transferOwnershipTx.wait();

      const newOwner = await bridge.owner_TB(true);
      expect(newOwner).toBe(council.address());
    },
      TIMEOUT
    );
  });
});


describe.skip("Transition Failing Test cases", () => {

  const mode = ExecutionMode.LeoRun;

  const bridge = new Vlink_token_bridge_v3Contract({ mode: mode });
  const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = bridge.getAccounts();
  const aleoUser5 = new PrivateKey().to_address().to_string();
  const admin = aleoUser1
  describe('Token Bridge : Initialization', () => {
    test.failing(
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

    test.failing(
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
  })

  describe('Attestor Add/Remove, update threshold', () => {
    test.failing('threshold not less than 1 in while adding attestor', async () => {
      await bridge.add_attestor_tb(aleoUser5, 0);

    })

    test.failing('When removing attestor Zero address passed should fail', async () => {
      await bridge.remove_attestor_tb(ALEO_ZERO_ADDRESS, 1);
    })

    test.failing("new threshold should be greater on equal to 1", async () => {
      const failThreshold = 0;
      await bridge.update_threshold_tb(failThreshold);
    });
  })

});
