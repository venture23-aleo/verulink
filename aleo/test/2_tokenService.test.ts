import { Token_bridge_v0003Contract } from "../artifacts/js/token_bridge_v0003";
import { InPacket } from "../artifacts/js/types/token_bridge_v0003";
import { Token_service_v0003Contract } from "../artifacts/js/token_service_v0003";
import { Wusdc_token_v0003Contract } from "../artifacts/js/wusdc_token_v0003";
import { Council_v0003Contract } from "../artifacts/js/council_v0003";
import { Wusdc_connector_v0003_0Contract } from "../artifacts/js/wusdc_connector_v0003_0";

import { evm2AleoArr, generateRandomEthAddr } from "../utils/ethAddress";
import { signPacket } from "../utils/sign";

import {
  ALEO_ZERO_ADDRESS,
  BRIDGE_PAUSABILITY_INDEX,
  BRIDGE_PAUSED_VALUE,
  BRIDGE_UNPAUSED_VALUE,
  OWNER_INDEX,
  TOKEN_PAUSED_VALUE,
  TOKEN_UNPAUSED_VALUE,
  aleoChainId,
  ethChainId,
  ethTsContractAddr,
  usdcContractAddr,
} from "../utils/constants";
import { PrivateKey } from "@aleohq/sdk";
import { createRandomPacket } from "../utils/packet";
import { WithdrawalLimit } from "../artifacts/js/types/token_service_v0003";
import { ExecutionMode} from "@doko-js/core";


const mode = ExecutionMode.SnarkExecute;


const bridge = new Token_bridge_v0003Contract({ mode: mode });
const tokenService = new Token_service_v0003Contract({ mode: mode  });
const wusdcToken = new Wusdc_token_v0003Contract({ mode: mode });
const council = new Council_v0003Contract({mode: mode});
const wusdcConnector = new Wusdc_connector_v0003_0Contract({mode: mode});

const TIMEOUT = 20000_000;

const ethUser = generateRandomEthAddr();
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

describe("Token Service ", () => {
  const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = bridge.getAccounts();
  const aleoUser5 = new PrivateKey().to_address().to_string();

  const admin = aleoUser1;
  const connector = aleoUser4;

  describe("Deployment", () => {
    tokenService.connect(admin)

    test("Deploy Bridge", async () => {
      const deployTx = await bridge.deploy();
      await deployTx.wait();
    }, TIMEOUT);

    test("Deploy Token Service", async () => {
      const deployTx = await tokenService.deploy();
      await deployTx.wait();
    }, TIMEOUT);

  })

  describe("Initialization", () => {
    test("Bridge: Initialize", async () => {
      const threshold = 1;
      const isBridgeInitialized = (await bridge.owner_TB(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      if (!isBridgeInitialized) {
        const [tx] = await bridge.initialize_tb(
          [aleoUser1, aleoUser2, ALEO_ZERO_ADDRESS, aleoUser4, ALEO_ZERO_ADDRESS],
          threshold,
          admin
        );
        await tx.wait();
      }
    }, TIMEOUT);

    test("Bridge: Add Chain", async () => {
      const isEthSupported = (await bridge.supported_chains(ethChainId, false));
      if (!isEthSupported) {
        const [addEthChainTx] = await bridge.add_chain_tb(ethChainId);
        await addEthChainTx.wait();
      }
      expect(await bridge.supported_chains(ethChainId, false)).toBe(true)
    }, TIMEOUT)

    test("Bridge: Add Service", async () => {
      const isTokenServiceEnabled = await bridge.supported_services(tokenService.address(), false);
      if (!isTokenServiceEnabled) {
        const [supportServiceTx] = await bridge.add_service_tb(tokenService.address());
        await supportServiceTx.wait();
      }
      expect(await bridge.supported_services(tokenService.address())).toBe(true);
    }, TIMEOUT)

    test("Bridge: Unpause", async () => {
      const isPaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_PAUSED_VALUE;
      if (isPaused) {
        const [unpauseTx] = await bridge.unpause_tb();
        await unpauseTx.wait();
      }
      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE)).toBe(BRIDGE_UNPAUSED_VALUE);
    }, TIMEOUT)

    test("Token Service: Initialize", async () => {
      const threshold = 1;
      const isTokenServiceInitialized = (await tokenService.owner_TS(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      if (!isTokenServiceInitialized) {
        const [tx] = await tokenService.initialize_ts(admin);
        await tx.wait();
      }
    }, TIMEOUT);


    test("Token Service: Add Token", async () => {
      const limit: WithdrawalLimit = {
        percentage: 100_00, // 100%
        duration: 1, // per block
        threshold_no_limit: BigInt(100)
      };
      const dummyLimit: WithdrawalLimit = {
        percentage: 0, // 10%
        duration: 0, // per block
        threshold_no_limit: BigInt(0)
      };
      const minimumTransfer = BigInt(100);
      const maximumTransfer = BigInt(100_000);
      const isWusdcSupported = (await tokenService.token_connectors(wusdcToken.address(), ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      if (!isWusdcSupported) {
        const [tx] = await tokenService.add_token_ts(
          wusdcToken.address(),
          connector,
          minimumTransfer,
          maximumTransfer,
          limit.percentage,
          limit.duration,
          limit.threshold_no_limit
        );
        await tx.wait();
      }
      expect(await tokenService.token_withdrawal_limits(wusdcToken.address(), dummyLimit)).toStrictEqual(limit);
      expect(await tokenService.min_transfers(wusdcToken.address())).toBe(minimumTransfer);
      expect(await tokenService.max_transfers(wusdcToken.address())).toBe(maximumTransfer);
      expect(await tokenService.token_connectors(wusdcToken.address())).toBe(connector);
    }, TIMEOUT)

    test("Token Service: Unpause Token", async () => {
      const isPaused = (await tokenService.token_status(wusdcToken.address(), TOKEN_PAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
      if (isPaused) {
        const [unpauseTx] = await tokenService.unpause_token_ts(wusdcToken.address());
        await unpauseTx.wait();
      }
      expect(await tokenService.token_status(wusdcToken.address(), TOKEN_PAUSED_VALUE)).toBe(TOKEN_UNPAUSED_VALUE);
    }, TIMEOUT)

  })

  describe("Token Receive", () => {

    test("Right connector for the given token can receive the token", async () => {
      const packet = createPacket(aleoUser1, BigInt(100_000_000), tokenService.address());
      tokenService.connect(admin);
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

      const initialTokenSupply = await tokenService.total_supply(wusdcToken.address(), BigInt(0));

      tokenService.connect(connector)
      const [screeningPassed, tx] = await tokenService.token_receive(
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
      await tx.wait();

      const finalTokenSupply = await tokenService.total_supply(wusdcToken.address());
      expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
      expect(screeningPassed).toBe(true);
    },
      TIMEOUT
    );

    test.failing("Wrong connector cannot receive the token", async () => {
      const packet = createPacket(aleoUser1, BigInt(100_000_000), tokenService.address());
      tokenService.connect(admin);
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

      tokenService.connect(admin)
      const [screeningPassed, tx] = await tokenService.token_receive(
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
      await tx.wait();

    },
      TIMEOUT
    );

  });


  describe("Token Send", () => {

    const destChainId = ethChainId;
    const destTsAddr = ethTsContractAddr.toLowerCase();
    const destToken = usdcContractAddr.toLocaleLowerCase();
    const sender = aleoUser5
    const receiver = ethUser.toLowerCase()
    const amount = BigInt(101);

    let minAmount: bigint;
    let maxAmount: bigint;

    test("Get minimum and maximum amount", async () => {
      minAmount = await tokenService.min_transfers(wusdcToken.address(), BigInt(0));
      maxAmount = await tokenService.min_transfers(wusdcToken.address(), BigInt(0));
    }, TIMEOUT)

    test(
      "Right connector for the token can send token",
      async () => {
        const initialTokenSupply = await tokenService.total_supply(wusdcToken.address(), BigInt(0));
        expect(await tokenService.token_connectors(wusdcToken.address())).toBe(connector);
        expect(await tokenService.min_transfers(wusdcToken.address())).toBeLessThanOrEqual(amount)
        expect(await tokenService.max_transfers(wusdcToken.address())).toBeGreaterThanOrEqual(amount)
        expect(await tokenService.total_supply(wusdcToken.address())).toBeGreaterThanOrEqual(amount)
        tokenService.connect(connector);
        const [tx] = await tokenService.token_send(
          wusdcToken.address(),
          sender,
          evm2AleoArr(receiver),
          amount,
          destChainId,
          evm2AleoArr(destTsAddr),
          evm2AleoArr(destToken),
        );
        await tx.wait();

        const finalTokenSupply = await tokenService.total_supply(wusdcToken.address());
        expect(finalTokenSupply).toBe(initialTokenSupply - amount);
      },
      TIMEOUT
    );

    test.failing(
      "Wrong connector for the token cannot send token",
      async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.token_send(
          wusdcToken.address(),
          sender,
          evm2AleoArr(receiver),
          amount,
          destChainId,
          evm2AleoArr(destTsAddr),
          evm2AleoArr(destToken),
        );
        await tx.wait();
      },
      TIMEOUT
    );

    test.failing(
      "Transferred amount must be greater than or equal to min amount",
      async () => {
        const amount = BigInt(99);
        expect(amount).toBeLessThan(minAmount);
        tokenService.connect(connector);
        const [tx] = await tokenService.token_send(
          wusdcToken.address(),
          sender,
          evm2AleoArr(receiver),
          amount,
          destChainId,
          evm2AleoArr(destTsAddr),
          evm2AleoArr(destToken),
        );
        await tx.wait();
      },
      TIMEOUT
    );

    test.failing(
      "Transferred amount must be less than or equal to max amount",
      async () => {
        const amount = BigInt(100_000);
        expect(amount).toBeLessThan(minAmount);
        tokenService.connect(connector);
        const [tx] = await tokenService.token_send(
          wusdcToken.address(),
          sender,
          evm2AleoArr(receiver),
          amount,
          destChainId,
          evm2AleoArr(destTsAddr),
          evm2AleoArr(destToken),
        );
        await tx.wait();
      },
      TIMEOUT
    );

    test.todo("When token paused (fails)")

  });

  describe("Governance", () => {

    describe("Pausability", () => {
      test.failing("should not pause by non-owner", async () => {
        tokenService.connect(aleoUser3); //changing the contract caller account to non owner
        const [tx] = await tokenService.pause_token_ts(wusdcToken.address());
        await tx.wait();
      }, TIMEOUT);

      test("owner can pause", async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.pause_token_ts(wusdcToken.address());
        await tx.wait();
        expect(await tokenService.token_status(wusdcToken.address())).toBe(TOKEN_PAUSED_VALUE);
      }, TIMEOUT);

      test.failing("should not unpause by non-owner", async () => {
        tokenService.connect(aleoUser3);
        const [tx] = await tokenService.unpause_token_ts(wusdcToken.address());
        await tx.wait();
      }, TIMEOUT);

      test("owner can unpause", async () => {
        expect(await tokenService.token_status(wusdcToken.address(), TOKEN_UNPAUSED_VALUE)).toBe(TOKEN_PAUSED_VALUE);
        tokenService.connect(admin);
        const [tx] = await tokenService.unpause_token_ts(wusdcToken.address());
        await tx.wait();
        expect(await tokenService.token_status(wusdcToken.address(), TOKEN_UNPAUSED_VALUE)).toBe(TOKEN_UNPAUSED_VALUE);
      },
        TIMEOUT
      );
    });

    describe("Add/Remove Token", () => {
      const newTokenAddr = new PrivateKey().to_address().to_string();
      const newTokenConnectorAddr = new PrivateKey().to_address().to_string();

      describe("Add Token", () => {
        const limit: WithdrawalLimit = {
          percentage: 100_00, // 100%
          duration: 1, // per block
          threshold_no_limit: BigInt(100)
        };
        const dummyLimit: WithdrawalLimit = {
          percentage: 0, // 10%
          duration: 0, // per block
          threshold_no_limit: BigInt(0)
        };
        const minTransfer = BigInt(100);
        const maxTransfer = BigInt(100_000);

        test("Owner can add new token", async () => {
          const isTokenSupported = (await tokenService.token_connectors(newTokenAddr, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
          expect(isTokenSupported).toBe(false);
          tokenService.connect(admin)
          const [tx] = await tokenService.add_token_ts(
            newTokenAddr,
            newTokenConnectorAddr,
            minTransfer,
            maxTransfer,
            limit.percentage,
            limit.duration,
            limit.threshold_no_limit
          );
          await tx.wait();
          expect(await tokenService.token_withdrawal_limits(newTokenAddr)).toStrictEqual(limit);
          expect(await tokenService.min_transfers(newTokenAddr)).toBe(minTransfer);
          expect(await tokenService.max_transfers(newTokenAddr)).toBe(maxTransfer);
          expect(await tokenService.token_connectors(newTokenAddr)).toBe(newTokenConnectorAddr);
        }, TIMEOUT);

        test.failing("Non-owner cannot add new token", async () => {
          const newTokenAddr = new PrivateKey().to_address().to_string();
          const newTokenConnectorAddr = new PrivateKey().to_address().to_string();
          let isTokenSupported = await tokenService.token_connectors(newTokenAddr, ALEO_ZERO_ADDRESS) != ALEO_ZERO_ADDRESS;
          expect(isTokenSupported).toBe(false);

          tokenService.connect(aleoUser3);
          const [tx] = await tokenService.add_token_ts(
            newTokenAddr,
            newTokenConnectorAddr,
            minTransfer,
            maxTransfer,
            limit.percentage,
            limit.duration,
            limit.threshold_no_limit
          );
          await tx.wait();

        }, TIMEOUT);

        test.failing("Existing token cannot be added again", async () => {
          let isTokenSupported = await tokenService.token_connectors(newTokenAddr, ALEO_ZERO_ADDRESS) != ALEO_ZERO_ADDRESS;
          expect(isTokenSupported).toBe(true);

          tokenService.connect(admin);
          const [tx] = await tokenService.add_token_ts(
            newTokenAddr,
            newTokenConnectorAddr,
            minTransfer,
            maxTransfer,
            limit.percentage,
            limit.duration,
            limit.threshold_no_limit
          );
          await tx.wait();

        }, TIMEOUT);
      });

      describe("Remove Token", () => {
        test.failing("Non owner cannot remove token", async () => {
          let isTokenSupported = await tokenService.token_connectors(newTokenAddr, ALEO_ZERO_ADDRESS) != ALEO_ZERO_ADDRESS;
          expect(isTokenSupported).toBe(true);

          tokenService.connect(aleoUser3);
          const [tx] = await tokenService.remove_token_ts(newTokenAddr);
          await tx.wait();
        }, TIMEOUT);

        test("Owner can remove token", async () => {
          let isTokenSupported = await tokenService.token_connectors(newTokenAddr, ALEO_ZERO_ADDRESS) != ALEO_ZERO_ADDRESS;
          expect(isTokenSupported).toBe(true);

          tokenService.connect(admin);
          const [tx] = await tokenService.remove_token_ts(newTokenAddr);
          await tx.wait();

          isTokenSupported = await tokenService.token_connectors(newTokenAddr, ALEO_ZERO_ADDRESS) != ALEO_ZERO_ADDRESS;
          expect(isTokenSupported).toBe(false);
        },
          TIMEOUT
        );

        test.failing("Token must be added to be removed", async () => {
          let isTokenSupported = await tokenService.token_connectors(newTokenAddr, ALEO_ZERO_ADDRESS) != ALEO_ZERO_ADDRESS;
          expect(isTokenSupported).toBe(true);

          tokenService.connect(admin);
          const [tx] = await tokenService.remove_token_ts(newTokenAddr);
          await tx.wait();
        },
          TIMEOUT
        );
      });
    })

    describe("Update connector", () => {

      test.failing("Non-connector cannot update connector", async () => {
        expect(await tokenService.token_connectors(wusdcToken.address())).toBe(connector);

        tokenService.connect(admin);
        const [tx] = await tokenService.update_connector_ts(wusdcToken.address(), wusdcConnector.address());
        await tx.wait();
      }, TIMEOUT);


      test("Existing token connector can update connector", async () => {
        expect(await tokenService.token_connectors(wusdcToken.address())).toBe(connector);

        tokenService.connect(connector);
        const [tx] = await tokenService.update_connector_ts(wusdcToken.address(), wusdcConnector.address());
        await tx.wait();

        expect(await tokenService.token_connectors(wusdcToken.address())).toBe(wusdcConnector.address());
      }, TIMEOUT);

    });

    describe("Update minimum transfer", () => {

      const newMinTransfer = BigInt(200)
      test("owner can update minimum transfer", async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.update_min_transfer_ts(
          wusdcToken.address(),
          newMinTransfer
        );
        await tx.wait();
        expect(await tokenService.min_transfers(wusdcToken.address())).toBe(newMinTransfer);
      }, TIMEOUT);

      test.failing("non-owner cannot update minimum transfer", async () => {
        tokenService.connect(aleoUser4);
        const [tx] = await tokenService.update_min_transfer_ts(
          wusdcToken.address(),
          newMinTransfer
        );
        await tx.wait();
      }, TIMEOUT);

    })

    describe("Update maximum transfer", () => {
      const newMaxTransfer = BigInt(200_000)
      test("owner can update maximum transfer", async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.update_max_transfer_ts(
          wusdcToken.address(),
          newMaxTransfer
        );
        await tx.wait();
        expect(await tokenService.max_transfers(wusdcToken.address())).toBe(newMaxTransfer);
      }, TIMEOUT);

      test.failing("non-owner cannot update maximum transfer", async () => {
        tokenService.connect(aleoUser4);
        const [tx] = await tokenService.update_max_transfer_ts(
          wusdcToken.address(),
          newMaxTransfer
        );
        await tx.wait();
      }, TIMEOUT);
    })

    describe("Update withdrawal limit", () => {
      const newLimit: WithdrawalLimit = {
        percentage: 90_00, // 90%
        duration: 2, // per block
        threshold_no_limit: BigInt(200)
      };

      test("should update withdrawal by admin", async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.update_withdrawal_limit(
          wusdcToken.address(),
          newLimit.percentage,
          newLimit.duration,
          newLimit.threshold_no_limit
        );
        await tx.wait();
        expect(
          await tokenService.token_withdrawal_limits(wusdcToken.address())
        ).toStrictEqual(newLimit);
      }, TIMEOUT);

      test.failing("should not update withdrawal by non-admin", async () => {
        tokenService.connect(aleoUser3);
        const [tx] = await tokenService.update_withdrawal_limit(
          wusdcToken.address(),
          newLimit.percentage,
          newLimit.duration,
          newLimit.threshold_no_limit
        );
        await tx.wait();
      }, TIMEOUT);

    })

    describe("Transfer Ownership", () => {

      test.failing("should not transfer ownership by non-admin", async () => {
        tokenService.connect(aleoUser3);
        const [transferOwnershipTx] = await tokenService.transfer_ownership_ts(aleoUser3);
        await transferOwnershipTx.wait();
      },
        TIMEOUT
      );

      test("Current owner can transfer ownership", async () => {
        const currentOwner = await tokenService.owner_TS(OWNER_INDEX);
        expect(currentOwner).toBe(admin);

        tokenService.connect(admin);
        const [transferOwnershipTx] = await tokenService.transfer_ownership_ts(aleoUser3);
        await transferOwnershipTx.wait();

        const newOwner = await tokenService.owner_TS(OWNER_INDEX);
        expect(newOwner).toBe(aleoUser3);
      },
        TIMEOUT
      );
    });


  })

});

describe('Transition Failing Test cases', () => {
  const [aleoUser4] = tokenService.getAccounts();
  describe('Token Add/Remove', () => {
    test.failing('min transfer greater than max transfer should fail', async () => {
      await tokenService.add_token_ts(
        wusdcToken.address(),
        aleoUser4,
        BigInt(100_000),
        BigInt(100),
        100_00,
        1,
        BigInt(100)
      )

    })

    test.failing('Percentage greater than 100 should fail', async () => {
      await tokenService.add_token_ts(
        wusdcToken.address(),
        aleoUser4,
        BigInt(100),
        BigInt(100_000),
        101_00,
        1,
        BigInt(100)
      )
    })

    test.failing('Updating withdrawal limit with percentage greater than 100 should fail', async () => {
      await tokenService.update_withdrawal_limit(
        wusdcToken.address(),
        101_00,
        1,
        BigInt(100)
      )
    })
  })

})


