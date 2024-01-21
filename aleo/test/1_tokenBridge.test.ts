import { Token_bridge_v0001Contract } from "../artifacts/js/token_bridge_v0001";
import { InPacket } from "../artifacts/js/types";
import {
  ALEO_ZERO_ADDRESS,
  THRESHOLD_INDEX,
  TOTAL_ATTESTORS_INDEX,
  aleoChainId,
  aleoTsProgramAddr,
  aleoUser1,
  aleoUser2,
  aleoUser3,
  aleoUser4,
  aleoUser5,
  aleoUser6,
  aleoUser7,
  councilProgramAddr,
  ethChainId,
  ethTsContractAddr,
  ethUser,
  incomingSequence,
  normalThreshold,
  usdcContractAddr,
  wusdcTokenAddr,
} from "./mockData";

import { evm2AleoArr, hashStruct, signPacket } from "../utils/utils";
import * as js2leo from "../artifacts/js/js2leo";
import * as js2leoCommon from '../artifacts/js/js2leo/common';
import { sign } from "aleo-signer";

const bridge = new Token_bridge_v0001Contract({mode: "execute"});

const testTimeout = 1000_000;

describe("Token Bridge ", () => {

  describe("Initialize", () => {
    const normalThreshold = 2; // Any range between 1 and 5
    const lowThreshold = 0; // Any number <= 0
    const highThreshold = 6; // Any number above 5
    const admin = aleoUser1;

    test("Deploy", async () => {
      const deployTx = await bridge.deploy();
      await deployTx.wait();
    }, testTimeout);

    test.failing(
      "Initialize - Threshold too low (must fail)",
      async () => {
        await bridge.initialize_tb(
          lowThreshold,
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          admin // governance
        );
      },
      testTimeout
    );

    test.failing(
      "Initialize - Threshold too high (must fail)",
      async () => {
        await bridge.initialize_tb(
          highThreshold,
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          admin // governance
        );
      },
      testTimeout
    );

    test.failing(
      "Initialize - Repeated attestors (must fail)",
      async () => {
        await bridge.initialize_tb(
          highThreshold,
          [aleoUser1, aleoUser2, aleoUser3, aleoUser3, aleoUser5],
          admin // governance
        );
      },
      testTimeout
    );

    test("Initialize (First try) - Expected parameters (must pass)", async () => {
      const initializeTx =  await bridge.initialize_tb(
        normalThreshold,
        [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
        admin //governance
      );

      // @ts-ignore
      const receipt = await initializeTx.wait();
      console.log(receipt)
    }, testTimeout);

    test("Initialize (Second try) - Expected parameters (must fail)", async () => {
      const initializeTx =  await bridge.initialize_tb(
        normalThreshold,
        [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
        admin //governance
      );

      // @ts-ignore
      const receipt = await initializeTx.wait();
      expect(receipt.error).toBeTruthy();
    }, testTimeout);

  });

  // describe("Governance", () => {

  //   describe("Add Attestor", () => {

  //     test("Owner can add new attestor", async () => {
  //       const totalAttestors = await bridge.attestor_settings(TOTAL_ATTESTORS_INDEX);
  //       const threshold = await bridge.attestor_settings(THRESHOLD_INDEX)
  //       const newThreshold = 2;

  //       let isAttestor = true;

  //       try {
  //         await bridge.attestors(aleoUser6)
  //       } catch (e) {
  //         isAttestor = false
  //       }
  //       expect(isAttestor).toBe(false);

  //       const addAttestorTx = await bridge.add_attestor_tb(aleoUser6, newThreshold);
  //       // @ts-ignore
  //       await addAttestorTx.wait()
  //       isAttestor = await bridge.attestors(aleoUser6);
  //       expect(isAttestor).toBe(true);

  //       const newTotalAttestors = await bridge.attestor_settings(TOTAL_ATTESTORS_INDEX);
  //       expect(newTotalAttestors).toBe(totalAttestors + 1);

  //       const updatedThreshold = await bridge.attestor_settings(THRESHOLD_INDEX);
  //       expect(updatedThreshold).toBe(newThreshold);

  //     }, testTimeout)

  //     test.skip("Other address cannot add attestor", async () => {
  //       // TODO: add following syntax
  //       // bridge.connect(aleoUser2).add_attestor_tb()
  //     })

  //     test.skip("Existing attestor cannot be added again", async () => {
  //       const THRESHOLD_INDEX = true;
  //       const threshold = await bridge.attestor_settings(THRESHOLD_INDEX);
  //       let isAttestor = true;

  //       try {
  //         await bridge.attestors(aleoUser6)
  //       } catch (e) {
  //         isAttestor = false
  //       }
  //       expect(isAttestor).toBe(true);

  //       const addAttestorTx = await bridge.add_attestor_tb(aleoUser6, threshold);
  //       // @ts-ignore
  //       const txReceipt = await addAttestorTx.wait()
  //       expect(txReceipt.error).toBeTruthy();

  //     }, testTimeout)

  //     test.skip("New threshold must be greater than or equal to existing threshold", async () => {
  //       const THRESHOLD_INDEX = true;
  //       const threshold = await bridge.attestor_settings(THRESHOLD_INDEX);
  //       let isAttestor = true;

  //       try {
  //         await bridge.attestors(aleoUser7)
  //       } catch (e) {
  //         isAttestor = false
  //       }
  //       expect(isAttestor).toBe(false);

  //       const addAttestorTx = await bridge.add_attestor_tb(aleoUser7, threshold - 1);
  //       // @ts-ignore
  //       const txReceipt = await addAttestorTx.wait()
  //       expect(txReceipt.error).toBeTruthy();
  //     }, testTimeout)

  //     test.skip("New threshold must be less than or equal to total attestors", async () => {
  //       const TOTAL_ATTESTORS_INDEX = false;
  //       const totalAttestors = await bridge.attestor_settings(TOTAL_ATTESTORS_INDEX);
  //       let isAttestor = true;
  //       try {
  //         await bridge.attestors(aleoUser7)
  //       } catch (e) {
  //         isAttestor = false
  //       }

  //       expect(isAttestor).toBe(false);
  //       const addAttestorTx = await bridge.add_attestor_tb(aleoUser7, totalAttestors + 2);
  //       // @ts-ignore
  //       const txReceipt = await addAttestorTx.wait()
  //       expect(txReceipt.error).toBeTruthy();

  //     }, testTimeout)

  //   })

  //   describe("Remove Attestor", () => {
  //     test("Owner can remove attestor", async () => {
  //       const totalAttestors = await bridge.attestor_settings(TOTAL_ATTESTORS_INDEX);
  //       const newThreshold = 1

  //       let isAttestor = await bridge.attestors(aleoUser6);
  //       expect(isAttestor).toBe(true);

  //       const removeAttestorTx = await bridge.remove_attestor_tb(aleoUser6, newThreshold);
  //       // @ts-ignore
  //       await removeAttestorTx.wait()


  //       isAttestor = true
  //       try {
  //         isAttestor = await bridge.attestors(aleoUser6);
  //       } catch (e) {
  //         isAttestor = false
  //       }
  //       expect(isAttestor).toBe(false);

  //       const newTotalAttestors = await bridge.attestor_settings(TOTAL_ATTESTORS_INDEX);
  //       expect(newTotalAttestors).toBe(totalAttestors - 1);
  //     }, testTimeout)

  //     test.todo("Other address cannot remove attestor")
  //     test.todo("Only existing attestor can be removed")
  //     test.todo("There must be at least two attestors to remove a attestor")
  //     test.todo("New threshold must be greater than or equal to existing threshold")
  //     test.todo("New threshold must be less than or equal to total attestors")
  //   })

  //   describe("Update threshold", () => {
  //     test("Owner can update threshold", async () => {
  //       const newThreshold = 3

  //       const addAttestorTx = await bridge.update_threshold_tb(newThreshold);
  //       // @ts-ignore
  //       await addAttestorTx.wait()

  //       const updatedThreshold = await bridge.attestor_settings(THRESHOLD_INDEX);
  //       expect(updatedThreshold).toBe(newThreshold);
  //     }, testTimeout)

  //     test.todo("Other address cannot update threshold")
  //     test.todo("New threshold must be greater than or equal to 1")
  //     test.todo("New threshold must be less than or equal to total attestors")
  //   })

  //   describe("Enable Chain", () => {
  //     test("Owner can enable chain", async () => {

  //       let isEthEnabled = false
  //       try {
  //         isEthEnabled = await bridge.supported_chains(ethChainId);
  //       } catch (e) {
  //         isEthEnabled = false
  //       }
  //       const enableChainTx = await bridge.enable_chain_tb(ethChainId);
  //       // @ts-ignore
  //       await enableChainTx.wait()

  //       isEthEnabled = await bridge.supported_chains(ethChainId);
  //       expect(isEthEnabled).toBe(true)
  //     }, testTimeout)

  //     test.todo("Other address cannot enable chain")
  //   })

  //   describe("Disable Chain", () => {
  //     test.todo("Chain must be added earlier to be disabled")
  //     test.todo("Other address cannot disable chain")

  //     test("Owner can disable chain", async () => {

  //       let isEthEnabled = false
  //       try {
  //         isEthEnabled = await bridge.supported_chains(ethChainId);
  //       } catch (e) {
  //         isEthEnabled = false
  //       }
  //       expect(isEthEnabled).toBe(true);
  //       const enableChainTx = await bridge.disable_chain_tb(ethChainId);
  //       // @ts-ignore
  //       await enableChainTx.wait()

  //       try {
  //         isEthEnabled = await bridge.supported_chains(ethChainId);
  //       } catch (e) {
  //         isEthEnabled = false
  //       }
  //       expect(isEthEnabled).toBe(false)
  //     }, testTimeout)

  //     test.todo("Owner can disable chain")
  //   })

  //   describe("Enable Service", () => {
  //     test("Owner can enable service", async () => {

  //       let isTsEnabled = false
  //       try {
  //         isTsEnabled = await bridge.supported_services(aleoTsProgramAddr);
  //       } catch (e) {
  //         isTsEnabled = false
  //       }
  //       const enableServiceTx = await bridge.enable_service_tb(aleoTsProgramAddr);
  //       // @ts-ignore
  //       await enableServiceTx.wait()

  //       isTsEnabled = await bridge.supported_services(aleoTsProgramAddr);
  //       expect(isTsEnabled).toBe(true)

  //     }, testTimeout)

  //     test.todo("Other address cannot enable service")
  //   })

  //   describe("Disable Service", () => {
  //     test.todo("Service must be added earlier to be disabled")
  //     test.todo("Other address cannot disable service")
  //     test("Owner can disable service", async () => {

  //       let isTsEnabled = false
  //       try {
  //         isTsEnabled = await bridge.supported_services(aleoTsProgramAddr);
  //       } catch (e) {
  //         isTsEnabled = false
  //       }
  //       expect(isTsEnabled).toBe(true);
  //       const enableChainTx = await bridge.disable_service_tb(aleoTsProgramAddr);
  //       // @ts-ignore
  //       await enableChainTx.wait()

  //       try {
  //         isTsEnabled = await bridge.supported_services(aleoTsProgramAddr);
  //       } catch (e) {
  //         isTsEnabled = false
  //       }
  //       expect(isTsEnabled).toBe(false)
  //     }, testTimeout)

  //   })

  // })

  describe("Receive", () => {
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
        amount : BigInt(10000)
      },
      height: 10,
    };

    const signature = signPacket(packet, bridge.config.privateKey);
    console.log(signature)
    
    const signatures = [
      signature,
      signature,
      signature,
      signature,
      signature
    ]

    const signers = [
      aleoUser1,
      ALEO_ZERO_ADDRESS,
      ALEO_ZERO_ADDRESS,
      ALEO_ZERO_ADDRESS,
      ALEO_ZERO_ADDRESS,
    ]

    test("Cal receive", async() => {
      const tx = await bridge.receive(packet, signers, signatures, true);
      // @ts-ignore
      const receipt = await tx.wait()
      expect(receipt.mode).toBe('execute');
    })

    test.todo("Attestation can only be done on packets coming from support chain")
    test.todo("Attestation can only be done by valid attestors ")
    test.todo("Attestation can only be done once per attestor")
    test.todo("Attestation should increase the attestation count by 1")
    test.todo("If attestation crosses the threshold, packet should be queryable by packetId")

    test.failing("Consume can only be called from program", async () => {
      await bridge.consume(
        ethChainId, // sourceChainId
        evm2AleoArr(ethTsContractAddr), // sourceServiceContract
        wusdcTokenAddr, // token
        evm2AleoArr(ethUser), // sender
        aleoUser1, // receiver
        aleoUser1, // actual_receiver
        BigInt(100), // amount
        BigInt(1), // sequence
        1, // height
        signers,
        signatures
      )
    }, testTimeout)
  })


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
    },testTimeout)

  })

  // describe("Attestor", () => {
  //   test.failing("Update with duplicate attestor", async () => {
  //     const highThresholdTxn = await bridge.update_attestor(aleoUser2)
  //     // @ts-ignore
  //     const receipt = await highThresholdTxn.wait()
  //     console.log(receipt);
  //     expect(receipt?.error).toBe(false);
  //   }, testTimeout);

  //   test("Update attestor", async () => {
  //     const updateAttestorTxn = await bridge.update_attestor(aleoUser6)
  //     // @ts-ignore
  //     const receipt = await updateAttestorTxn.wait()
  //     console.log(receipt);
  //   }, testTimeout);

  //   test.failing("Add new attestor (Decrease threshold) - Should fail", async () => {
  //     const addNewAttestorTxn = await bridge.add_attestor_tb(aleoUser7, 1)
  //     // @ts-ignore
  //     const receipt = await addNewAttestorTxn.wait()
  //     console.log(receipt)
  //     expect(!receipt?.error).toBe(false);
  //   }, testTimeout)

  //   test("Add new attestor (Increase threshold)", async () => {
  //     const addNewAttestorTxn = await bridge.add_attestor_tb(aleoUser7, 6)
  //     // @ts-ignore
  //     const receipt = await addNewAttestorTxn.wait()
  //     console.log(receipt)
  //     expect(!receipt?.error).toBe(true);
  //   }, testTimeout)

  //   test("Remove attestor", async () => {
  //     const removeAttestorTxn = await bridge.remove_attestor_tb(aleoUser6, 5)
  //     // @ts-ignore
  //     const receipt = await removeAttestorTxn.wait()
  //     console.log(receipt)
  //   }, testTimeout)

  //   test("Remove non existing attestor", async () => {
  //     const removeAttestorTxn = await bridge.remove_attestor_tb(aleoUser6, 5)
  //     // @ts-ignore
  //     const receipt = await removeAttestorTxn.wait();
  //     console.log(receipt)
  //     expect(receipt?.error).toBe(true);
  //   }, testTimeout)
  // })

  // describe("Transfer Ownership", () => {
  //     test("Current owner can transfer ownership", async () => {

  //       const currentOwner = await bridge.owner_TB(true);
  //       expect(currentOwner).toBe(aleoUser1);

  //       const transferOwnershipTx = await bridge.transfer_ownership_tb(councilProgramAddr);
  //       // @ts-ignore
  //       await transferOwnershipTx.wait()

  //       const newOwner = await bridge.owner_TB(true);
  //       expect(newOwner).toBe(councilProgramAddr);

  //     }, testTimeout)

  //   test.todo("Other address cannot transfer ownership")
  // })





});
