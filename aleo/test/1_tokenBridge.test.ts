import { Token_bridge_v0002Contract } from "../artifacts/js/token_bridge_v0002";
import { InPacket, InPacketWithScreening, PacketId, PacketIdWithAttestor } from "../artifacts/js/types/token_bridge_v0002";
import { Token_service_v0002Contract } from "../artifacts/js/token_service_v0002";
import { Wusdc_token_v0002Contract } from "../artifacts/js/wusdc_token_v0002";
import { Council_v0002Contract } from "../artifacts/js/council_v0002";


import {
  ALEO_ZERO_ADDRESS,
  PAUSABILITY_INDEX,
  THRESHOLD_INDEX,
  TIMEOUT,
  TOTAL_ATTESTORS_INDEX,
  aleoChainId,
  aleoUser5,
  aleoUser6,
  aleoUser7,
  ethChainId,
  ethTsContractAddr,
  ethUser,
  newThreshold,
  new_chainId,
  usdcContractAddr,
} from "./mockData";

import {evm2AleoArr } from "../utils/ethAddress";
import { signPacket } from "../utils/sign";
import { hashStruct } from "../utils/hash";

import { sign } from "aleo-signer";

const bridge = new Token_bridge_v0002Contract({mode: "execute"});
const tokenService = new Token_service_v0002Contract({ mode: "execute" });
const wusdcToken = new Wusdc_token_v0002Contract({mode: "execute"});
const council = new Council_v0002Contract({ mode: "execute" });
const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = bridge.getAccounts();



describe("Token Bridge ", () => {
  describe("Initialize", () => {
    const normalThreshold = 2; // Any range between 1 and 5
    const lowThreshold = 0; // Any number <= 0
    const highThreshold = 6; // Any number above 5
    const admin = aleoUser1;
    console.log("admin", admin);

    test("Deploy", async () => {
      const deployTx = await bridge.deploy();
      await deployTx.wait();
    }, TIMEOUT);

    test.failing(
      "Initialize - Threshold too low (must fail)",
      async () => {
        await bridge.initialize_tb(
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          lowThreshold,
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
          highThreshold,
          admin // governance
        );
      },
      TIMEOUT
    );

    test.failing(
      "Initialize - Repeated attestors (must fail)",
      async () => {
        await bridge.initialize_tb(
          [aleoUser1, aleoUser2, aleoUser3, aleoUser3, aleoUser5],
          highThreshold,
          admin // governance
        );
      },
      TIMEOUT
    );

    test("Initialize (First try) - Expected parameters (must pass)", async () => {
      const initializeTx =  await bridge.initialize_tb(
        [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
        normalThreshold,
        admin //governance
      );

      // @ts-ignore
      await initializeTx.wait();
      expect(await bridge.bridge_settings(THRESHOLD_INDEX)).toBe(normalThreshold);
      expect(await bridge.bridge_settings(TOTAL_ATTESTORS_INDEX)).toBe(5);
      expect(await bridge.attestors(aleoUser1)).toBeTruthy();
      expect(await bridge.attestors(aleoUser2)).toBeTruthy();
      expect(await bridge.attestors(aleoUser3)).toBeTruthy();
      expect(await bridge.attestors(aleoUser4)).toBeTruthy();
      expect(await bridge.attestors(aleoUser5)).toBeTruthy();

    }, TIMEOUT);

    test("Initialize (Second try) - Expected parameters (must fail)", async () => {
      const initializeTx =  await bridge.initialize_tb(
        [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
        normalThreshold,
        admin //governance
      );
      // @ts-ignore
      const receipt = await initializeTx.wait();
      expect(receipt.error).toBeTruthy();
    }, TIMEOUT);

  });

  describe("Pausability", () => {

    test("should not unpause by non-owner", async() => {
      bridge.connect(aleoUser3);
      const tx = await bridge.unpause_tb();
      // @ts-ignore
      await tx.wait();
      expect(await bridge.bridge_settings(PAUSABILITY_INDEX)).toBe(0);
    }, TIMEOUT);

    test("owner can unpause", async() => {
      bridge.connect(aleoUser1);
      const tx = await bridge.unpause_tb();
      // @ts-ignore
      await tx.wait();
      expect(await bridge.bridge_settings(PAUSABILITY_INDEX)).toBe(1);
    }, TIMEOUT);

    test("should not pause by non-owner", async() => {
      bridge.connect(aleoUser3);
      const tx = await bridge.pause_tb();
      // @ts-ignore
      await tx.wait();
      expect(await bridge.bridge_settings(PAUSABILITY_INDEX)).toBe(1);
    }, TIMEOUT);

    test("owner can pause", async() => {
      bridge.connect(aleoUser1);
      const tx = await bridge.pause_tb();
      // @ts-ignore
      await tx.wait();
      expect(await bridge.bridge_settings(PAUSABILITY_INDEX)).toBe(0);
    }, TIMEOUT);

    // simply unpausing contract 
    test("owner can unpause", async() => {
      const tx = await bridge.unpause_tb();
      // @ts-ignore
      await tx.wait();
      expect(await bridge.bridge_settings(PAUSABILITY_INDEX)).toBe(1);
    }, TIMEOUT);
  });

  describe("Governance", () => {

    describe("Add Attestor", () => {

      test("Owner can add new attestor", async () => {
        const totalAttestors = await bridge.bridge_settings(TOTAL_ATTESTORS_INDEX);
        const threshold = await bridge.bridge_settings(THRESHOLD_INDEX);
        const newThreshold = 2;

        let isAttestor = true;

        try {
          await bridge.attestors(aleoUser6)
        } catch (e) {
          isAttestor = false
        }
        expect(isAttestor).toBe(false);

        const addAttestorTx = await bridge.add_attestor_tb(aleoUser6, newThreshold);
        // @ts-ignore
        await addAttestorTx.wait()
        isAttestor = await bridge.attestors(aleoUser6);
        expect(isAttestor).toBe(true);

        const newTotalAttestors = await bridge.bridge_settings(TOTAL_ATTESTORS_INDEX);
        expect(newTotalAttestors).toBe(totalAttestors + 1);

        const updatedThreshold = await bridge.bridge_settings(THRESHOLD_INDEX);
        expect(updatedThreshold).toBe(newThreshold);

      }, TIMEOUT)

      test("Other address cannot add attestor", async () => {
        bridge.connect(aleoUser3);
        const addAttestorTx = await bridge.add_attestor_tb(aleoUser7, newThreshold);
        // @ts-ignore
        const receipt = await addAttestorTx.wait();
        expect(receipt.error).toBeTruthy();
      }, TIMEOUT); 

      test("Existing attestor cannot be added again", async () => {
        bridge.connect(aleoUser1);
        const threshold = await bridge.bridge_settings(THRESHOLD_INDEX);
        let isAttestor = true;

        try {
          await bridge.attestors(aleoUser6)
        } catch (e) {
          isAttestor = false
        }
        expect(isAttestor).toBe(true);

        const addAttestorTx = await bridge.add_attestor_tb(aleoUser6, threshold);
        // @ts-ignore
        const txReceipt = await addAttestorTx.wait()
        expect(txReceipt.error).toBeTruthy();

      }, TIMEOUT)

      // test("New threshold must be greater than or equal to existing threshold", async () => {
      //   const threshold = await bridge.bridge_settings(THRESHOLD_INDEX);
      //   const addAttestorTx = await bridge.add_attestor_tb(aleoUser7, threshold - 1);
      //   // @ts-ignore
      //   const txReceipt = await addAttestorTx.wait()
      //   expect(txReceipt.error).toBeTruthy();
      // }, TIMEOUT)

      // test("New threshold must be less than or equal to total attestors", async () => {
      //   const totalAttestors = await bridge.bridge_settings(TOTAL_ATTESTORS_INDEX);
      //   let isAttestor = true;
      //   try {
      //     await bridge.attestors(aleoUser7)
      //   } catch (e) {
      //     isAttestor = false
      //   }

      //   expect(isAttestor).toBe(false);
      //   const addAttestorTx = await bridge.add_attestor_tb(aleoUser7, totalAttestors + 2);
      //   // @ts-ignore
      //   const txReceipt = await addAttestorTx.wait()
      //   expect(txReceipt.error).toBeTruthy();

      // }, TIMEOUT)

    })

    describe("Remove Attestor", () => {
      test("Owner can remove attestor", async () => {
        const totalAttestors = await bridge.bridge_settings(TOTAL_ATTESTORS_INDEX);
        const newThreshold = 1

        let isAttestor = await bridge.attestors(aleoUser6);
        expect(isAttestor).toBe(true);

        const removeAttestorTx = await bridge.remove_attestor_tb(aleoUser6, newThreshold);
        // @ts-ignore
        await removeAttestorTx.wait()


        isAttestor = true
        try {
          isAttestor = await bridge.attestors(aleoUser6);
        } catch (e) {
          isAttestor = false
        }
        expect(isAttestor).toBe(false);

        const newTotalAttestors = await bridge.bridge_settings(TOTAL_ATTESTORS_INDEX);
        expect(newTotalAttestors).toBe(totalAttestors - 1);
      }, TIMEOUT)

      test("Remove non existing attestor", async () => {
        const removeAttestorTxn = await bridge.remove_attestor_tb(aleoUser6, 5)
        // @ts-ignore
        const receipt = await removeAttestorTxn.wait();
        expect(receipt.error).toBe(true);
      }, TIMEOUT)

      test("should not remove attestor if new threshold is less than current threshold", async() => {
        const threshold = await bridge.bridge_settings(THRESHOLD_INDEX);
        const updateThreshold = await bridge.update_threshold_tb(newThreshold);
        // @ts-ignore
        await updateThreshold.wait();
        const removeAttestorTxn = await bridge.remove_attestor_tb(aleoUser3, threshold-1);
        // @ts-ignore
        const receipt = await removeAttestorTxn.wait();
        expect(receipt.error).toBe(true);
      }, TIMEOUT);

      // test("should not remove attestor if new threshold is greater than total attestor", async () => {
      //   const totalAttestors = await bridge.bridge_settings(TOTAL_ATTESTORS_INDEX);
      //   const removeAttestorTxn = await bridge.remove_attestor_tb(aleoUser3, totalAttestors+2);
      //   // @ts-ignore
      //   const receipt = await removeAttestorTxn.wait();
      //   expect(receipt.error).toBe(true);
      // }, TIMEOUT)

      test("should not remove attestor by non-admin", async ()=> {
        bridge.connect(aleoUser3);
        const removeAttestorTxn = await bridge.remove_attestor_tb(aleoUser3, 5)
        // @ts-ignore
        const receipt = await removeAttestorTxn.wait();
        expect(receipt.error).toBeTruthy();
      }, TIMEOUT);
      test.todo("There must be at least two attestors to remove a attestor")
    })

    describe("Update threshold", () => {
      test("Owner can update threshold", async () => {
        bridge.connect(aleoUser1);
        const newThreshold = 3

        const addAttestorTx = await bridge.update_threshold_tb(newThreshold);
        // @ts-ignore
        await addAttestorTx.wait()

        const updatedThreshold = await bridge.bridge_settings(THRESHOLD_INDEX);
        expect(updatedThreshold).toBe(newThreshold);
      }, TIMEOUT);

      test("should not update threshold by non-admin", async() => {
        bridge.connect(aleoUser3);
        const updateThresholdTx = await bridge.update_threshold_tb(newThreshold);
        // @ts-ignore
        const receipt = await updateThresholdTx.wait();
        expect(receipt.error).toBe(true);
      }, TIMEOUT);

      test.failing("should not update threshold if new threshold is less than 1", async() => {
        bridge.connect(aleoUser1);
        const updateThresholdTx = await bridge.update_threshold_tb(0);
        // @ts-ignore
        const receipt = await updateThresholdTx.wait();
        expect(receipt.error).toBe(true);
      }, TIMEOUT);

      test("should not update threshold if new threshold is greater than total attestor", async() => {
        const totalAttestors = await bridge.bridge_settings(TOTAL_ATTESTORS_INDEX);
        const updateThresholdTx = await bridge.update_threshold_tb(totalAttestors+2);
        // @ts-ignore
        const receipt = await updateThresholdTx.wait();
        expect(receipt.error).toBe(true);
      }, TIMEOUT);
    });

    describe("Enable Chain", () => {
      test("Owner can enable chain", async () => {

        let isEthEnabled = false
        try {
          isEthEnabled = await bridge.supported_chains(ethChainId);
        } catch (e) {
          isEthEnabled = false
        }
        const enableChainTx = await bridge.add_chain_tb(ethChainId);
        // @ts-ignore
        await enableChainTx.wait()

        isEthEnabled = await bridge.supported_chains(ethChainId);
        expect(isEthEnabled).toBe(true)
      }, TIMEOUT)

      test("should not add chain by non-admin", async() => {
        bridge.connect(aleoUser3);
        const enableChainTx = await bridge.add_chain_tb(ethChainId);
        // @ts-ignore
        const receipt = await enableChainTx.wait();
        expect(receipt.error).toBe(true);
      }, TIMEOUT);
    })

    describe("remove Chain", () => {
    test("should not disable chain by non_admin", async() => {
        bridge.connect(aleoUser3);
        const disableChainTx = await bridge.remove_chain_tb(ethChainId);
        // @ts-ignore
        const receipt = await disableChainTx.wait();
        expect(receipt.error).toBeTruthy();
    }, TIMEOUT);

      test("Owner can remove chain", async () => {
        bridge.connect(aleoUser1);
        let isEthEnabled = false
        try {
          isEthEnabled = await bridge.supported_chains(ethChainId);
        } catch (e) {
          isEthEnabled = false
        }
        expect(isEthEnabled).toBe(true);
        const enableChainTx = await bridge.remove_chain_tb(ethChainId);
        // @ts-ignore
        await enableChainTx.wait()

        try {
          isEthEnabled = await bridge.supported_chains(ethChainId);
        } catch (e) {
          isEthEnabled = false
        }
        expect(isEthEnabled).toBe(false)
      }, TIMEOUT)

    test("should consist a chain to disable that", async() => {
      const disableChainTx = await bridge.remove_chain_tb(ethChainId);
      // @ts-ignore
      const receipt = await disableChainTx.wait();
      expect(receipt.error).toBeTruthy();      
    }, TIMEOUT);

    })

    describe("Add Service", () => {
      test("Owner can add service", async () => {

        let isTsEnabled = false
        try {
          isTsEnabled = await bridge.supported_services(tokenService.address());
        } catch (e) {
          isTsEnabled = false
        }
        const enableServiceTx = await bridge.add_service_tb(tokenService.address());
        // @ts-ignore
        await enableServiceTx.wait()

        isTsEnabled = await bridge.supported_services(tokenService.address());
        expect(isTsEnabled).toBe(true)

      }, TIMEOUT)

    test("should not enable service by non-admin", async() => {
        bridge.connect(aleoUser3);
        const enableServiceTx = await bridge.add_service_tb(tokenService.address());
        // @ts-ignore
        const receipt = await enableServiceTx.wait();
        expect(receipt.error).toBeTruthy();      
    }, TIMEOUT);
    });

    describe("Disable Service", () => {
      test("should not disable service by non_admin", async() => {
          bridge.connect(aleoUser3);
          const disableChainTx = await bridge.remove_service_tb(tokenService.address());
          // @ts-ignore
          const receipt = await disableChainTx.wait();
          expect(receipt.error).toBeTruthy();
      }, TIMEOUT);

      test("Owner can disable service", async () => {
        bridge.connect(aleoUser1);
        const enableChainTx = await bridge.remove_service_tb(tokenService.address());
        // @ts-ignore
        await enableChainTx.wait()
        const isTsEnabled = await bridge.supported_services(tokenService.address(), false);
        expect(isTsEnabled).toBe(false)
      }, TIMEOUT);

      test("should not remove unavailabe service", async () => {
        const removeChainTx = await bridge.remove_service_tb(tokenService.address());
        // @ts-ignore
        const receipt = await removeChainTx.wait()
        expect(receipt.error).toBe(true);
      }, TIMEOUT);
    })

  })

  // describe("Receive", () => {
  //   const incomingSequence = BigInt(
  //     Math.round(Math.random() * Number.MAX_SAFE_INTEGER)
  //   );
  //   const packet: InPacket = {
  //     version: 0,
  //     source: {
  //       chain_id: ethChainId,
  //       addr: evm2AleoArr(ethTsContractAddr),
  //     },
  //     destination: {
  //       chain_id: aleoChainId,
  //       addr: tokenService.address(),
  //     },
  //     message: {
  //       token: wusdcToken.address(),
  //       sender: evm2AleoArr(ethUser),
  //       receiver: aleoUser1,
  //       amount : BigInt(10000)
  //     },
  //     height: 10,
  //   };

  //   const unsupportedPacket: InPacket = {
  //     version: 0,
  //     source: {
  //       chain_id: new_chainId,
  //       addr: evm2AleoArr(ethTsContractAddr),
  //     },
  //     destination: {
  //       chain_id: aleoChainId,
  //       addr: tokenService.address(),
  //     },
  //     message: {
  //       token: wusdcToken.address(),
  //       sender: evm2AleoArr(ethUser),
  //       receiver: aleoUser1,
  //       amount : BigInt(10000)
  //     },
  //     height: 10,
  //   };

  //   const signature = signPacket(packet, true, bridge.config.privateKey);    
  //   const signatures = [
  //     signature,
  //     signature,
  //     signature,
  //     signature,
  //     signature
  //   ]

  //   const signers = [
  //     aleoUser1,
  //     ALEO_ZERO_ADDRESS,
  //     ALEO_ZERO_ADDRESS,
  //     ALEO_ZERO_ADDRESS,
  //     ALEO_ZERO_ADDRESS,
  //   ]

  //   const packetHash = hashStruct(js2leo.getInPacketLeo(packet));
  //   const packetWithScreening: InPacketWithScreening = {
  //     packet_hash: packetHash,
  //     screening_passed: true
  //   };
  //   const packetWithScreeningHash = hashStruct(js2leo.getInPacketWithScreeningLeo(packetWithScreening));

  //   const packetIdWithAttestor: PacketIdWithAttestor = {
  //     chain_id: packet.source.chain_id,
  //     sequence: packet.sequence,
  //     attestor: aleoUser1
  //   }
  //   const packetKeyWithAttestorHash = hashStruct(js2leo.getPacketIdWithAttestorLeo(packetIdWithAttestor))

  //   const unsupportedSigner = [
  //     aleoUser7,
  //     ALEO_ZERO_ADDRESS,
  //     ALEO_ZERO_ADDRESS,
  //     ALEO_ZERO_ADDRESS,
  //     ALEO_ZERO_ADDRESS,
  //   ]

  //   const packetId : PacketId = {
  //     chain_id: ethChainId,
  //     sequence: incomingSequence
  //   }


  //   test("Call receive", async() => {
  //     //update threshold
  //     const updateThresholdTx = await bridge.update_threshold_tb(1);
  //     // @ts-ignore
  //     await updateThresholdTx.wait();

  //     //enable chain
  //     const enableChainTx = await bridge.add_chain_tb(ethChainId);
  //     // @ts-ignore
  //     await enableChainTx.wait()

  //     //enable service
  //     const enableServiceTx = await bridge.add_service_tb(tokenService.address());
  //     // @ts-ignore
  //     await enableServiceTx.wait();

  //     let hasAttestorSigned = true
  //     try {
  //       hasAttestorSigned = await bridge.in_packet_attestors(packetKeyWithAttestorHash);
  //     } catch (e) {
  //       hasAttestorSigned = false
  //     }

  //     let initialVotes = 99;
  //     try {
  //       initialVotes = await bridge.in_packet_attestations(packetWithScreeningHash);
  //     } catch (e) {
  //       initialVotes = 0
  //     }
  //     const tx = await bridge.receive(packet, signers, signatures, true);
  //     // @ts-ignore
  //     const receipt = await tx.wait();
  //     let finalVotes;
  //     try{
  //       finalVotes = await bridge.in_packet_attestations(packetWithScreeningHash); 
  //     }catch(err){
  //       finalVotes = 0;
  //     }

  //     expect(finalVotes).toBe(initialVotes + 1); // TODO: test for cases with multiple validation

  //     hasAttestorSigned = await bridge.in_packet_attestors(packetKeyWithAttestorHash);
  //     expect(hasAttestorSigned).toBe(true);
  //     expect(await bridge.in_packet_attestations(packetWithScreeningHash)).toBe(1);
  //     // expect(await bridge.in_packet_hash(packetId)).toBe(packetWithScreeningHash);
  //     // expect(await bridge.in_packet_consumed(packetId)).toBe(false);
  //   }, TIMEOUT)

  //   test.failing("should not attest packet coming from unsupported chain", async() => {
  //     const tx = await bridge.receive(unsupportedPacket, signers, signatures, true);
  //     // @ts-ignore
  //     const receipt = await tx.wait();
  //     expect(receipt.error).toBeTruthy();
  //   }, TIMEOUT)

  //   test("should not attest packet coming from unvalid attestor", async() => {
  //     const removeAttestorTx = await bridge.remove_attestor_tb(aleoUser2, newThreshold);
  //     // @ts-ignore
  //     await removeAttestorTx.wait();

  //     bridge.connect(aleoUser2);
  //     const tx = await bridge.receive(packet, signers, signatures, true);
  //     // @ts-ignore
  //     const receipt = await tx.wait();
  //     expect(receipt.error).toBeTruthy();
  //   }, TIMEOUT)

  //   test("should not attest the same packet by same attestor", async() => {
  //     const tx = await bridge.receive(packet, signers, signatures, true);
  //     // @ts-ignore
  //     const receipt = await tx.wait();
  //     expect(receipt.error).toBeTruthy();
  //   }, TIMEOUT)


  //   test.failing("Consume can only be called from program", async () => {
  //     await bridge.consume(
  //       ethChainId, // sourceChainId
  //       evm2AleoArr(ethTsContractAddr), // sourceServiceContract
  //       wusdcToken.address(), // token
  //       evm2AleoArr(ethUser), // sender
  //       aleoUser1, // receiver
  //       aleoUser1, // actual_receiver
  //       BigInt(100), // amount
  //       BigInt(1), // sequence
  //       1, // height
  //       signers,
  //       signatures
  //     )
  //   }, TIMEOUT)
  // })


  describe("Publish", () => {

    test.failing("Publish can only be called from program", async () => {
      await bridge.publish(
        ethChainId, // destinationChainId
        evm2AleoArr(ethTsContractAddr), // destinationServiceContract
        evm2AleoArr(usdcContractAddr), // token
        aleoUser1, // sender
        evm2AleoArr(ethUser), // receiver
        BigInt(100) // amount
      );
    },TIMEOUT)

  })

  // describe("Attestor", () => {
  //   test.skip("should not Update with duplicate attestor", async () => {
  //     const highThresholdTxn = await bridge.update_attestor_key(aleoUser3)
  //     // @ts-ignore
  //     const receipt = await highThresholdTxn.wait()
  //     expect(receipt.error).toBe(true);
  //   }, TIMEOUT);

  //   test.skip("Update attestor", async () => {
  //     const updateAttestorTxn = await bridge.update_attestor_key(aleoUser6)
  //     // @ts-ignore
  //     const receipt = await updateAttestorTxn.wait()
  //     console.log(receipt);
  //   }, TIMEOUT);


  // })

  describe("Transfer Ownership", () => {

      test("should not transfer ownership by non-admin", async() => {
        bridge.connect(aleoUser3);
        const transferOwnershipTx = await bridge.transfer_ownership_tb(council.address());
        // @ts-ignore
        const receipt = await transferOwnershipTx.wait();
        expect(receipt.error).toBeTruthy();
      }, TIMEOUT)

      test("Current owner can transfer ownership", async () => {
        bridge.connect(aleoUser1);
        const currentOwner = await bridge.owner_TB(true);
        expect(currentOwner).toBe(aleoUser1);

        const transferOwnershipTx = await bridge.transfer_ownership_tb(council.address());
        // @ts-ignore
        await transferOwnershipTx.wait()

        const newOwner = await bridge.owner_TB(true);
        expect(newOwner).toBe(council.address());

      }, TIMEOUT)

  })



});