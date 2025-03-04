import { Vlink_token_bridge_v2Contract } from "../artifacts/js/vlink_token_bridge_v2";
import { InPacket } from "../artifacts/js/types/vlink_token_bridge_v2";
import { Vlink_token_service_v2Contract } from "../artifacts/js/vlink_token_service_v2";
import { Token_registryContract } from "../artifacts/js/token_registry";

import { aleoArr2Evm, evm2AleoArr, evm2AleoArrWithoutPadding, generateRandomEthAddr, prunePadding } from "../utils/ethAddress";
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
  ethTsRandomContractAddress,
  ethTsRandomContractAddress2,
  usdcContractAddr,
} from "../utils/constants";
import { PrivateKey } from "@aleohq/sdk";
import { createRandomPacket } from "../utils/packet";
import { WithdrawalLimit } from "../artifacts/js/types/vlink_token_service_v2";
import { ExecutionMode } from "@doko-js/core";
import { ChainToken } from "../artifacts/js/types/vlink_token_service_council_v2";
import { Vlink_holding_v1Contract } from "../artifacts/js/vlink_holding_v1";
import { TokenMetadata } from "../artifacts/js/types/vlink_holding_v1";
import { Balance, TokenOwner } from "../artifacts/js/types/token_registry";
import { hashStruct } from "../utils/hash";
import { Vlink_token_service_council_v2Contract } from "../artifacts/js/vlink_token_service_council_v2";


const mode = ExecutionMode.SnarkExecute;


const bridge = new Vlink_token_bridge_v2Contract({ mode: mode });
const tokenService = new Vlink_token_service_v2Contract({ mode: mode });
const mtsp = new Token_registryContract({ mode: mode });
const holding = new Vlink_holding_v1Contract({ mode });
const tokenServiceCouncil = new Vlink_token_service_council_v2Contract({ mode: mode });

let tokenID = BigInt("7190692537453907461105790569797103513515746302149567971663963167242253971983");

(BigInt.prototype as any).toJSON = function () {
  return this.toString() + "field";
};

const newTokenID = BigInt(987456123);

const eth2TokenInfo: ChainToken = {
  chain_id: ethChainId,
  token_id: newTokenID
}


const TIMEOUT = 20000_000;
const wrongTokenID = BigInt(32165478985523213549);

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
    tokenID,
    ethUser
  );
};

describe("Token Service ", () => {
  const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = bridge.getAccounts();
  const aleoUser5 = new PrivateKey().to_address().to_string();
  const token_name = BigInt('6148332821651876206')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
  const token_symbol = BigInt("1431520323") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
  const token_decimals = 6
  const token_max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615

  const admin = aleoUser1;
  const connector = aleoUser4;

  describe("Deployment", () => {
    tokenService.connect(admin)

    test("Deploy Bridge", async () => {
      const deployTx = await bridge.deploy();
      await deployTx.wait();
    }, TIMEOUT);

    test("Deploy MTSP program", async () => {
      const deployTx = await mtsp.deploy();
      await deployTx.wait();
    }, TIMEOUT);

    test("Deploy Holding program", async () => {
      const deployTx = await holding.deploy();
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

    test("Holding: Initialize", async () => {
      const [tx] = await holding.initialize_holding(tokenService.address());
      await tx.wait();
    }, TIMEOUT)

    test("Token Service: Initialize", async () => {
      const threshold = 1;
      const isTokenServiceInitialized = (await tokenService.owner_TS(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      console.log("is sevice initialized: ", isTokenServiceInitialized);
      if (!isTokenServiceInitialized) {
        const [tx] = await tokenService.initialize_ts(admin);
        await tx.wait();
      }
    }, TIMEOUT);

    test.failing("Token Service: cannot Initialize twice", async () => {
      const [tx] = await tokenService.initialize_ts(admin);
      await tx.wait();
    });

    test("Token Service: Register token", async () => {
      const signers = [admin, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      const [token_id, registerTokenTransaction] = await tokenServiceCouncil.ts_register_token(1, token_name, token_symbol, token_decimals, token_max_supply, signers);
      tokenID = token_id;
      console.log(tokenID);
      registerTokenTransaction.wait();
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
      let isAdded = await tokenService.added_tokens(tokenID, false);
      const isWusdcNotSupported = (isAdded == false);
      if (isWusdcNotSupported) {
        const [tx] = await tokenService.add_token_ts(
          tokenID,
          minimumTransfer,
          maximumTransfer,
          limit.percentage,
          limit.duration,
          limit.threshold_no_limit,
          evm2AleoArrWithoutPadding(usdcContractAddr),
          evm2AleoArrWithoutPadding(ethTsContractAddr),
          ethChainId
        );
        await tx.wait();
      }
      const ethTokenInfo: ChainToken = {
        chain_id: ethChainId,
        token_id: tokenID
      }
      expect(await tokenService.added_tokens(tokenID, false)).toBe(true);
      expect(aleoArr2Evm(await tokenService.other_chain_token_address(ethTokenInfo)).toLowerCase()).toBe(usdcContractAddr.toLowerCase());
      expect(aleoArr2Evm(await tokenService.other_chain_token_service(ethTokenInfo)).toLowerCase()).toBe(ethTsContractAddr.toLowerCase());
      expect(await tokenService.token_withdrawal_limits(tokenID, dummyLimit)).toStrictEqual(limit);
      expect(await tokenService.min_transfers(tokenID)).toBe(minimumTransfer);
      expect(await tokenService.max_transfers(tokenID)).toBe(maximumTransfer);
      expect(await tokenService.token_status(tokenID)).toBe(TOKEN_PAUSED_VALUE);
    }, TIMEOUT)

    test("Token Service: Unpause Token", async () => {
      const isPaused = (await tokenService.token_status(tokenID, TOKEN_PAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
      if (isPaused) {
        const [unpauseTx] = await tokenService.unpause_token_ts(tokenID);
        await unpauseTx.wait();
      }
      expect(await tokenService.token_status(tokenID, TOKEN_PAUSED_VALUE)).toBe(TOKEN_UNPAUSED_VALUE);
    }, TIMEOUT)

  })

  describe("Token Receive", () => {

    test("Happy receive token", async () => {
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

      const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));

      const [screeningPassed, tx] = await tokenService.token_receive_public(
        prunePadding(packet.message.sender_address),
        packet.message.dest_token_id,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures,
        packet.source.chain_id,
        prunePadding(packet.source.addr),
      );
      await tx.wait();

      const finalTokenSupply = await tokenService.total_supply(tokenID);
      expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
      expect(screeningPassed).toBe(true);
    },
      TIMEOUT
    );

    test.failing("Wrong token service cannot receive the token, transaction is expected to fail", async () => {
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
      const [screeningPassed, tx] = await tokenService.token_receive_public(
        prunePadding(packet.message.sender_address),
        packet.message.dest_token_id,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures,
        packet.source.chain_id,
        evm2AleoArrWithoutPadding(ethTsRandomContractAddress),
      );
      const result = await tx.wait();
      expect(result.execution).toBeUndefined();

    },
      TIMEOUT
    );

  });


  describe("Token Send", () => {
    tokenID = BigInt("7190692537453907461105790569797103513515746302149567971663963167242253971983");
    console.log(tokenID);
    const destChainId = ethChainId;
    const destTsAddr = ethTsContractAddr.toLowerCase();
    const destTsAddr2 = ethTsRandomContractAddress.toLowerCase();

    const destToken = usdcContractAddr.toLowerCase();
    const sender = aleoUser5
    const receiver = ethUser.toLowerCase()
    const amount = BigInt(101);

    let minAmount: bigint;
    let maxAmount: bigint;

    test("Get minimum and maximum amount", async () => {
      minAmount = await tokenService.min_transfers(tokenID, BigInt(0));
      maxAmount = await tokenService.max_transfers(tokenID, BigInt(0));
    }, TIMEOUT)

    test("happy token send",
      async () => {
        console.log(minAmount, maxAmount);
        const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
        expect(await tokenService.min_transfers(tokenID)).toBeLessThanOrEqual(amount)
        expect(await tokenService.max_transfers(tokenID)).toBeGreaterThanOrEqual(amount)
        expect(await tokenService.total_supply(tokenID)).toBeGreaterThanOrEqual(amount)
        tokenService.connect(admin);
        mtsp.connect(admin);

        // const [hash, balancetx] = await mtsp.balance_key(tokenID, admin);
        const owner: TokenOwner = {
          account: admin,
          token_id: tokenID
        }
        const hash = hashStruct(owner);
        let default_balance: Balance = {
          token_id: BigInt(0),
          account: "",
          balance: BigInt(0),
          authorized_until: 0
        }
        console.log(hash);
        console.log(evm2AleoArrWithoutPadding(destTsAddr), evm2AleoArrWithoutPadding(destToken));
        const balance: Balance = await mtsp.authorized_balances(hash, default_balance);
        console.log(balance);
        if (balance.balance > amount) {
          const [tx] = await tokenService.token_send(
            tokenID,
            evm2AleoArrWithoutPadding(receiver),
            amount,
            destChainId,
            evm2AleoArrWithoutPadding(destTsAddr),
            evm2AleoArrWithoutPadding(destToken),
          );
          await tx.wait();
        }


        const finalTokenSupply = await tokenService.total_supply(tokenID);
        expect(finalTokenSupply).toBe(initialTokenSupply - amount);
      },
      TIMEOUT
    );

    // test(
    //   "Wrong connector for the token cannot send token",
    //   async () => {
    //     tokenService.connect(admin);
    //     const [tx] = await tokenService.token_send(
    //       tokenID,
    //       evm2AleoArrWithoutPadding(receiver),
    //       amount,
    //       destChainId,
    //       evm2AleoArrWithoutPadding(destTsAddr2),
    //       evm2AleoArrWithoutPadding(destToken),
    //     );
    //     const result = await tx.wait();
    //     expect(result.execution).toBeUndefined(); 
    //   },
    //   TIMEOUT
    // );

    // test(
    //   "Transferred amount must be greater than or equal to min amount",
    //   async () => {
    //     const amount = BigInt(99);
    //     expect(amount).toBeLessThan(minAmount);
    //     tokenService.connect(connector);
    //     const [tx] = await tokenService.token_send(
    //       tokenID,
    //       evm2AleoArrWithoutPadding(receiver),
    //       amount,
    //       destChainId,
    //       evm2AleoArrWithoutPadding(destTsAddr),
    //       evm2AleoArrWithoutPadding(destToken),
    //     );
    //     const result = await tx.wait();
    //     expect(result.execution).toBeUndefined(); 
    //   },
    //   TIMEOUT
    // );

    // test(
    //   "Transferred amount must be less than or equal to max amount",
    //   async () => {
    //     const amount = BigInt(100_000);
    //     expect(amount).toBeLessThan(minAmount);
    //     tokenService.connect(connector);
    //     const [tx] = await tokenService.token_send(
    //       tokenID,
    //       evm2AleoArrWithoutPadding(receiver),
    //       amount,
    //       destChainId,
    //       evm2AleoArrWithoutPadding(destTsAddr),
    //       evm2AleoArrWithoutPadding(destToken),
    //     );
    //     const result = await tx.wait();
    //     expect(result.execution).toBeUndefined(); 
    //   },
    //   TIMEOUT
    // );

    test.todo("When token paused (fails)")

  });

  describe("Governance", () => {

    describe("Pausability", () => {
      test("should not pause by non-owner", async () => {
        tokenService.connect(aleoUser3); //changing the contract caller account to non owner
        const [tx] = await tokenService.pause_token_ts(tokenID);
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT);

      test("should not pause if token Id is not present", async () => {
        tokenService.connect(admin); //changing the contract caller account to non owner
        const [tx] = await tokenService.pause_token_ts(wrongTokenID);
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT);

      test("owner can pause", async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.pause_token_ts(tokenID);
        await tx.wait();
        expect(await tokenService.token_status(tokenID)).toBe(TOKEN_PAUSED_VALUE);
      }, TIMEOUT);

      test("should not unpause by non-owner", async () => {
        tokenService.connect(aleoUser3);
        const [tx] = await tokenService.unpause_token_ts(tokenID);
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT);

      test("should not unpause if token Id is not present", async () => {
        tokenService.connect(admin); //changing the contract caller account to non owner
        const [tx] = await tokenService.unpause_token_ts(wrongTokenID);
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT);

      test("owner can unpause", async () => {
        expect(await tokenService.token_status(tokenID, TOKEN_UNPAUSED_VALUE)).toBe(TOKEN_PAUSED_VALUE);
        tokenService.connect(admin);
        const [tx] = await tokenService.unpause_token_ts(tokenID);
        await tx.wait();
        expect(await tokenService.token_status(tokenID, TOKEN_UNPAUSED_VALUE)).toBe(TOKEN_UNPAUSED_VALUE);
      },
        TIMEOUT
      );
    });

    describe("Add/Remove Token", () => {

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
          tokenService.connect(admin)
          const [tx] = await tokenService.add_token_ts(
            newTokenID,
            minTransfer,
            maxTransfer,
            limit.percentage,
            limit.duration,
            limit.threshold_no_limit,
            evm2AleoArrWithoutPadding(usdcContractAddr),
            evm2AleoArrWithoutPadding(ethTsContractAddr),
            ethChainId
          );
          await tx.wait();
          expect(await tokenService.added_tokens(newTokenID)).toBe(true);
          expect(await tokenService.other_chain_token_address(eth2TokenInfo)).toStrictEqual(evm2AleoArr(usdcContractAddr));
          expect(await tokenService.other_chain_token_service(eth2TokenInfo)).toStrictEqual(evm2AleoArr(ethTsContractAddr));
          expect(await tokenService.token_withdrawal_limits(newTokenID, dummyLimit)).toStrictEqual(limit);
          expect(await tokenService.min_transfers(newTokenID)).toBe(minTransfer);
          expect(await tokenService.max_transfers(newTokenID)).toBe(maxTransfer);
          expect(await tokenService.token_status(newTokenID)).toBe(false);
        }, TIMEOUT);

        test("Non-owner cannot add new token", async () => {
          const newToken2Id = BigInt(784596321);
          tokenService.connect(aleoUser3);
          const [tx] = await tokenService.add_token_ts(
            newToken2Id,
            minTransfer,
            maxTransfer,
            limit.percentage,
            limit.duration,
            limit.threshold_no_limit,
            evm2AleoArrWithoutPadding(usdcContractAddr),
            evm2AleoArrWithoutPadding(ethTsContractAddr),
            ethChainId
          );
          const result = await tx.wait();
          expect(result.execution).toBeUndefined();

        }, TIMEOUT);

        test("Existing token cannot be added again", async () => {
          let isTokenSupported = await tokenService.added_tokens(newTokenID, false);
          expect(isTokenSupported).toBe(true);

          tokenService.connect(admin);
          const [tx] = await tokenService.add_token_ts(
            newTokenID,
            minTransfer,
            maxTransfer,
            limit.percentage,
            limit.duration,
            limit.threshold_no_limit,
            evm2AleoArrWithoutPadding(usdcContractAddr),
            evm2AleoArrWithoutPadding(ethTsContractAddr),
            ethChainId
          );
          const result = await tx.wait();
          expect(result.execution).toBeUndefined();
        }, TIMEOUT);
      });

      describe("Remove Token", () => {
        test("Non owner cannot remove token", async () => {
          let isTokenSupported = await tokenService.added_tokens(newTokenID, false);
          expect(isTokenSupported).toBe(true);

          tokenService.connect(aleoUser3);
          const [tx] = await tokenService.remove_token_ts(newTokenID);
          const result = await tx.wait();
          expect(result.execution).toBeUndefined();
        }, TIMEOUT);

        test("Owner can remove token", async () => {
          let isTokenSupported = await tokenService.added_tokens(newTokenID, false);
          expect(isTokenSupported).toBe(true);

          tokenService.connect(admin);
          const [tx] = await tokenService.remove_token_ts(newTokenID);
          await tx.wait();

          isTokenSupported = await tokenService.added_tokens(newTokenID, false);
          expect(isTokenSupported).toBe(false);
        },
          TIMEOUT
        );

        test("Token must be added to be removed", async () => {
          let isTokenSupported = await tokenService.added_tokens(newTokenID, false);
          expect(isTokenSupported).toBe(false);

          tokenService.connect(admin);
          const [tx] = await tokenService.remove_token_ts(newTokenID);
          const result = await tx.wait();
          expect(result.execution).toBeUndefined();
        },
          TIMEOUT
        );
      });
    })

    describe("Update minimum transfer", () => {

      const newMinTransfer = BigInt(200);
      test("cannot update minimum transfer if unregistered tokenID is given", async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.update_min_transfer_ts(
          wrongTokenID,
          newMinTransfer
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT);

      test("cannot update if minimum transfer greater than maximum transfer", async () => {
        tokenService.connect(admin);
        const maxTransfer = await tokenService.max_transfers(tokenID);
        const [tx] = await tokenService.update_min_transfer_ts(
          tokenID,
          maxTransfer + BigInt(20)
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT);


      test("non-owner cannot update minimum transfer", async () => {
        tokenService.connect(aleoUser4);
        const [tx] = await tokenService.update_min_transfer_ts(
          tokenID,
          newMinTransfer
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT);

      test("owner can update minimum transfer", async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.update_min_transfer_ts(
          tokenID,
          newMinTransfer
        );
        await tx.wait();
        expect(await tokenService.min_transfers(tokenID)).toBe(newMinTransfer);
      }, TIMEOUT);

    })

    describe("Update maximum transfer", () => {
      const newMaxTransfer = BigInt(200_000);

      test("non-owner cannot update maximum transfer", async () => {
        tokenService.connect(aleoUser4);
        const [tx] = await tokenService.update_max_transfer_ts(
          tokenID,
          newMaxTransfer
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT);

      test("cannot update maximum transfer if unregistered tokenID is given", async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.update_max_transfer_ts(
          wrongTokenID,
          newMaxTransfer
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT);

      test("cannot update if maximum transfer lesser than minimum transfer", async () => {
        tokenService.connect(admin);
        const minTransfer = await tokenService.min_transfers(tokenID);
        const [tx] = await tokenService.update_max_transfer_ts(
          tokenID,
          minTransfer - BigInt(20)
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT);

      test("owner can update maximum transfer", async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.update_max_transfer_ts(
          tokenID,
          newMaxTransfer
        );
        await tx.wait();
        expect(await tokenService.max_transfers(tokenID)).toBe(newMaxTransfer);
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
          tokenID,
          newLimit.percentage,
          newLimit.duration,
          newLimit.threshold_no_limit
        );
        await tx.wait();
        expect(
          await tokenService.token_withdrawal_limits(tokenID)
        ).toStrictEqual(newLimit);
      }, TIMEOUT);

      test.failing("should not update if percentage is greater than 100 percent", async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.update_withdrawal_limit(
          tokenID,
          110_00,
          newLimit.duration,
          newLimit.threshold_no_limit
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT);

      test("should not update withdrawal by non-admin", async () => {
        tokenService.connect(aleoUser3);
        const [tx] = await tokenService.update_withdrawal_limit(
          tokenID,
          newLimit.percentage,
          newLimit.duration,
          newLimit.threshold_no_limit
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT);

    })

    describe("Update other chain token address", () => {

      const unregisteredTokenID = BigInt("9841023567956645465");

      const ethTokenInfo: ChainToken = {
        chain_id: ethChainId,
        token_id: tokenID
      }

      test("should not update token address by non-owner", async () => {
        tokenService.connect(aleoUser3);
        const [tx] = await tokenService.update_other_chain_tokenaddress(
          ethChainId,
          tokenID,
          evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT);

      test("should not update token address if token id is not registered", async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.update_other_chain_tokenaddress(
          ethChainId,
          unregisteredTokenID,
          evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT)

      test("should update token address by admin", async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.update_other_chain_tokenaddress(
          ethChainId,
          tokenID,
          evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
        );
        await tx.wait();
        expect(tokenService.other_chain_token_address(ethTokenInfo)).toStrictEqual(evm2AleoArr(ethTsRandomContractAddress2))
      }, TIMEOUT)
    });


    describe("Update other chain token service", () => {
      const unregisteredTokenID = BigInt("9841023567956645465");

      const ethTokenInfo: ChainToken = {
        chain_id: ethChainId,
        token_id: tokenID
      }

      test("should not update token service by non-owner", async () => {
        tokenService.connect(aleoUser3);
        const [tx] = await tokenService.update_other_chain_tokenservice(
          ethChainId,
          tokenID,
          evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT)

      test("should not update token address if token id is not registered", async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.update_other_chain_tokenservice(
          ethChainId,
          unregisteredTokenID,
          evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined();
      }, TIMEOUT)

      test("should update token address by admin", async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.update_other_chain_tokenaddress(
          ethChainId,
          tokenID,
          evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
        );
        await tx.wait();
        expect(tokenService.other_chain_token_service(ethTokenInfo)).toStrictEqual(evm2AleoArr(ethTsRandomContractAddress2))
      }, TIMEOUT)
    });

    describe("Transfer Ownership", () => {

      test("should not transfer ownership by non-admin", async () => {
        tokenService.connect(aleoUser3);
        const [transferOwnershipTx] = await tokenService.transfer_ownership_ts(aleoUser3);
        const result = await transferOwnershipTx.wait();
        expect(result.execution).toBeUndefined();
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
        newTokenID,
        BigInt(100_000),
        BigInt(100),
        100_00,
        1,
        BigInt(100),
        evm2AleoArr(usdcContractAddr),
        evm2AleoArr(ethTsContractAddr),
        ethChainId
      );

      test.failing('Percentage greater than 100 should fail', async () => {
        await tokenService.add_token_ts(
          newTokenID,
          BigInt(100),
          BigInt(100_000),
          101_00,
          1,
          BigInt(100),
          evm2AleoArr(usdcContractAddr),
          evm2AleoArr(ethTsContractAddr),
          ethChainId
        );
      })

      test.failing('Updating withdrawal limit with percentage greater than 100 should fail', async () => {
        await tokenService.update_withdrawal_limit(
          tokenID,
          101_00,
          1,
          BigInt(100)
        )
      })
    })

  });

});


