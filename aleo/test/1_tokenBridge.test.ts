import { Token_bridgeContract } from "../artifacts/js/token_bridge";
import { InPacketFull } from "../artifacts/js/types";
import {
  aleoChainId,
  aleoTsContract,
  aleoUser1,
  aleoUser2,
  aleoUser3,
  aleoUser4,
  aleoUser5,
  aleoUser6,
  aleoUser7,
  ethChainId,
  ethTsContract,
  ethUser,
  incomingSequence,
  usdcContractAddr,
  wusdcTokenAddr,
} from "./mockData";

import { evm2AleoArr } from "./utils";
const bridge = new Token_bridgeContract({mode: "execute"});

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

    test(// TODO: this must fail - only throws error but the actual task passes
    "Initialize (Second try) - Expected parameters (must fail)", async () => {
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

  describe("Attestor", () => {
    test.failing("Update with duplicate attestor", async () => {
      const highThresholdTxn = await bridge.update_attestor(aleoUser2)
      // @ts-ignore
      const receipt = await highThresholdTxn.wait()
      console.log(receipt);
      expect(receipt?.error).toBe(false);
    }, testTimeout);

    test("Update attestor", async () => {
      const updateAttestorTxn = await bridge.update_attestor(aleoUser6)
      // @ts-ignore
      const receipt = await updateAttestorTxn.wait()
      console.log(receipt);
    }, testTimeout);

    test.failing("Add new attestor (Decrease threshold) - Should fail", async () => {
      const addNewAttestorTxn = await bridge.add_attestor_tb(aleoUser7, 1)
      // @ts-ignore
      const receipt = await addNewAttestorTxn.wait()
      console.log(receipt)
      expect(!receipt?.error).toBe(false);
    }, testTimeout)

    test("Add new attestor (Increase threshold)", async () => {
      const addNewAttestorTxn = await bridge.add_attestor_tb(aleoUser7, 6)
      // @ts-ignore
      const receipt = await addNewAttestorTxn.wait()
      console.log(receipt)
      expect(!receipt?.error).toBe(true);
    }, testTimeout)

    test("Remove attestor", async () => {
      const removeAttestorTxn = await bridge.remove_attestor_tb(aleoUser6, 5)
      // @ts-ignore
      const receipt = await removeAttestorTxn.wait()
      console.log(receipt)
    }, testTimeout)

    test("Remove non existing attestor", async () => {
      const removeAttestorTxn = await bridge.remove_attestor_tb(aleoUser6, 5)
      // @ts-ignore
      const receipt = await removeAttestorTxn.wait();
      console.log(receipt)
      expect(receipt?.error).toBe(true);
    }, testTimeout)
  })

  describe("Attest", () => {
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
        amount : BigInt(10000)
      },
      height: 10,
    };

    test("Attestation can only be done on chain the packet is addressed to", async() => {
      const tx = await bridge.attest(packet, true);

      // @ts-ignore
      const receipt = await tx.wait()
      expect(receipt.mode).toBe('execute');
    })
    test.todo("Attestation can only be done on packets coming from support chain")
    test.todo("Attestation can only be done by valid attestors ")
    test.todo("Attestation can only be done once per attestor")
    test.todo("Attestation should increase the attestation count by 1")
    test.todo("If attestation crosses the threshold, packet should be queryable by packetId")

  })

  describe("Consume", () => {
    test.failing("Consume can only be called from program", async () => {
      await bridge.consume(
        ethChainId, // sourceChainId
        evm2AleoArr(ethTsContract), // sourceServiceContract
        wusdcTokenAddr, // token
        evm2AleoArr(ethUser), // sender
        aleoUser1, // receiver
        aleoUser1, // actual_receiver
        BigInt(100), // amount
        1, // sequence
        1 // height
      )

    }, testTimeout)

  })

  describe("Publish", () => {

    test.failing("Publish can only be called from program", async () => {
      await bridge.publish(
        ethChainId, // destinationChainId
        evm2AleoArr(ethTsContract), // destinationServiceContract
        evm2AleoArr(usdcContractAddr), // token
        aleoUser1, // sender
        evm2AleoArr(ethUser), // receiver
        BigInt(100) // amount
      );
    },testTimeout)

  })

  describe("Governance", () => {
    test.todo("Change ownership")
    test.todo("Add attestor")
    test.todo("Remove attestor")
    test.todo("Update threshold")
    test.todo("Enable Chain")
    test.todo("Disable Chain")
    test.todo("Enable Service")
    test.todo("Disable Service")
  })

});
