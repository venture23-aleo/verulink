import { Token_bridge_v0003Contract } from "../artifacts/js/token_bridge_v0003";
import { InPacket } from "../artifacts/js/types/token_bridge_v0003";
import { Token_service_v0003Contract } from "../artifacts/js/token_service_v0003";
import { Multi_token_support_program_v1Contract } from "../artifacts/js/multi_token_support_program_v1";

import { aleoArr2Evm, evm2AleoArr, evm2AleoArrWithoutPadding, generateRandomEthAddr } from "../utils/ethAddress";
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
  ethTsContractAddr2,
  usdcContractAddr,
} from "../utils/constants";
import { PrivateKey } from "@aleohq/sdk";
import { createRandomPacket } from "../utils/packet";
import { WithdrawalLimit } from "../artifacts/js/types/token_service_v0003";
import { ExecutionMode} from "@doko-js/core";
import { ChainToken } from "../artifacts/js/types/token_service_council";
import { Holding_v0003Contract } from "../artifacts/js/holding_v0003";


const mode = ExecutionMode.SnarkExecute;


const bridge = new Token_bridge_v0003Contract({ mode: mode });
const tokenService = new Token_service_v0003Contract({ mode: mode  });
const mtsp = new Multi_token_support_program_v1Contract({ mode: mode });
const holding = new Holding_v0003Contract({mode});

let tokenID=BigInt(7190692537453907461105790569797103513515746302149567971663963167242253971983);


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
  const symbol = BigInt("1431520323") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
  const decimals = 6
  const max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615

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

    test("Token Service: Initialize", async () => {
      const threshold = 1;
      const isTokenServiceInitialized = (await tokenService.owner_TS(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      if (!isTokenServiceInitialized) {
        const [tx] = await tokenService.initialize_ts(admin);
        await tx.wait();
      }
    }, TIMEOUT);

    test.failing("Token Service: cannot Initialize twice", async () => {
      const [tx] = await tokenService.initialize_ts(admin);
      await tx.wait();
    });
  });

  describe("Governance", () => {

    describe("Register Token", () => {
      test("should not register by non-owner", async() => {
        tokenService.connect(aleoUser4);
        const [token_id, registerTokenTransaction] = await tokenService.register_token(token_name, symbol, decimals, max_supply);
        const result = await registerTokenTransaction.wait();
        expect(result.execution).toBeUndefined();  
      }, TIMEOUT);
      test("should be register by onwer", async() => {
        tokenService.connect(admin);
        const [token_id, registerTokenTransaction] = await tokenService.register_token(token_name, symbol, decimals, max_supply);
        await registerTokenTransaction.wait();
        expect(tokenID).toEqual(token_id);
      }, TIMEOUT);

      test.todo("update_token_metadata");
      test.todo("update_other_chain_ts");
      test.todo("update_other_chain_ta");
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
            evm2AleoArr(usdcContractAddr),
            evm2AleoArr(ethTsContractAddr),
            ethChainId
          );
          const result = await tx.wait();
          expect(result.execution).toBeUndefined(); 

        }, TIMEOUT);

        test("Owner can add new token", async () => {
          tokenService.connect(admin)
          const [tx] = await tokenService.add_token_ts(
            newTokenID,
            minTransfer,
            maxTransfer,
            limit.percentage,
            limit.duration,
            limit.threshold_no_limit,
            evm2AleoArr(usdcContractAddr),
            evm2AleoArr(ethTsContractAddr),
            ethChainId
          );
          await tx.wait();
          expect(await tokenService.added_tokens(newTokenID)).toBe(true);
          expect(await tokenService.other_chain_token_address(eth2TokenInfo)).toBe(evm2AleoArr(usdcContractAddr));
          expect(await tokenService.other_chain_token_service(eth2TokenInfo)).toBe(evm2AleoArr(usdcContractAddr));
          expect(await tokenService.token_withdrawal_limits(newTokenID, dummyLimit)).toStrictEqual(limit);
          expect(await tokenService.min_transfers(newTokenID)).toBe(minTransfer);
          expect(await tokenService.max_transfers(newTokenID)).toBe(maxTransfer);
          expect(await tokenService.token_status(newTokenID)).toBe(false);
        }, TIMEOUT);

        test("Existing token cannot be added again", async () => {
          let isTokenSupported = await tokenService.added_tokens(newTokenID, true) != false;
          expect(isTokenSupported).toBe(true);

          tokenService.connect(admin);
          const [tx] = await tokenService.add_token_ts(
            newTokenID,
            minTransfer,
            maxTransfer,
            limit.percentage,
            limit.duration,
            limit.threshold_no_limit,
            evm2AleoArr(usdcContractAddr),
            evm2AleoArr(ethTsContractAddr),
            ethChainId
          );
          const result = await tx.wait();
          expect(result.execution).toBeUndefined(); 
        }, TIMEOUT);
      });

      describe("Remove Token", () => {
        test("Non owner cannot remove token", async () => {
          let isTokenSupported = await tokenService.added_tokens(newTokenID, true) != false;
          expect(isTokenSupported).toBe(true);

          tokenService.connect(aleoUser3);
          const [tx] = await tokenService.remove_token_ts(newTokenID);
          const result = await tx.wait();
          expect(result.execution).toBeUndefined(); 
        }, TIMEOUT);

        test("Owner can remove token", async () => {
          let isTokenSupported = await tokenService.added_tokens(newTokenID, true) != false;
          expect(isTokenSupported).toBe(true);

          tokenService.connect(admin);
          const [tx] = await tokenService.remove_token_ts(newTokenID);
          await tx.wait();

          isTokenSupported = await tokenService.added_tokens(newTokenID, true) == false;
          expect(isTokenSupported).toBe(false);
        },
          TIMEOUT
        );

        test("Token must be added to be removed", async () => {
          let isTokenSupported = await tokenService.added_tokens(newTokenID, true) == false;
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

    describe("added another token for testing", () => {
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

    describe("Update minimum transfer", () => {
      const newMinTransfer = BigInt(200)

      test("non-owner cannot update minimum transfer", async () => {
        tokenService.connect(aleoUser4);
        const [tx] = await tokenService.update_min_transfer_ts(
          tokenID,
          newMinTransfer
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined(); 
      }, TIMEOUT);

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
        const [tx] = await tokenService.update_min_transfer_ts(
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
    })

  });


  describe("Token Send", () => {

    const destChainId = ethChainId;
    const destTsAddr = ethTsContractAddr.toLowerCase();
    const destTsAddr2 = ethTsContractAddr2.toLowerCase();

    const destToken = usdcContractAddr.toLocaleLowerCase();
    const sender = aleoUser5
    const receiver = ethUser.toLowerCase()
    const amount = BigInt(101);

    let minAmount: bigint;
    let maxAmount: bigint;

    test("Get minimum and maximum amount", async () => {
      minAmount = await tokenService.min_transfers(tokenID, BigInt(0));
      maxAmount = await tokenService.min_transfers(tokenID, BigInt(0));
    }, TIMEOUT)


    test("cannot send token if wrong destination token service is given",
      async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.token_send(
          tokenID,
          evm2AleoArrWithoutPadding(receiver),
          amount,
          destChainId,
          evm2AleoArrWithoutPadding(destTsAddr2),
          evm2AleoArrWithoutPadding(destToken),
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined(); 
      },
      TIMEOUT
    );

    test("cannot send token if wrong destination token address is given",
      async () => {
        tokenService.connect(admin);
        const [tx] = await tokenService.token_send(
          tokenID,
          evm2AleoArrWithoutPadding(receiver),
          amount,
          destChainId,
          evm2AleoArrWithoutPadding(destTsAddr),
          evm2AleoArrWithoutPadding(destTsAddr),
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined(); 
      },
      TIMEOUT
    );

    test("Transferred amount must be greater than or equal to min amount",
      async () => {
        const amount = BigInt(99);
        expect(amount).toBeLessThan(minAmount);
        tokenService.connect(connector);
        const [tx] = await tokenService.token_send(
          tokenID,
          evm2AleoArrWithoutPadding(receiver),
          amount,
          destChainId,
          evm2AleoArrWithoutPadding(destTsAddr),
          evm2AleoArrWithoutPadding(destToken),
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined(); 
      },
      TIMEOUT
    );

    test("Transferred amount must be less than or equal to max amount",
      async () => {
        const amount = BigInt(100_000);
        expect(amount).toBeLessThan(minAmount);
        tokenService.connect(connector);
        const [tx] = await tokenService.token_send(
          tokenID,
          evm2AleoArrWithoutPadding(receiver),
          amount,
          destChainId,
          evm2AleoArrWithoutPadding(destTsAddr),
          evm2AleoArrWithoutPadding(destToken),
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined(); 
      },
      TIMEOUT
    );

    test("cannot send if token is paused",
      async () => {
        const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
        expect(await tokenService.min_transfers(tokenID)).toBeLessThanOrEqual(amount)
        expect(await tokenService.max_transfers(tokenID)).toBeGreaterThanOrEqual(amount)
        expect(await tokenService.total_supply(tokenID)).toBeGreaterThanOrEqual(amount)

        tokenService.connect(admin);
        const [pauseTx] = await tokenService.pause_token_ts(tokenID);
        await pauseTx.wait();

        tokenService.connect(connector);
        const [tx] = await tokenService.token_send(
          tokenID,
          evm2AleoArrWithoutPadding(receiver),
          amount,
          destChainId,
          evm2AleoArrWithoutPadding(destTsAddr),
          evm2AleoArrWithoutPadding(destToken),
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined(); 
      },
      TIMEOUT
    );

    test("happy token send",
      async () => {
        // unpausing the token
        tokenService.connect(admin);
        const [pauseTx] = await tokenService.pause_token_ts(tokenID);
        await pauseTx.wait();

        const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
        expect(await tokenService.min_transfers(tokenID)).toBeLessThanOrEqual(amount)
        expect(await tokenService.max_transfers(tokenID)).toBeGreaterThanOrEqual(amount)
        expect(await tokenService.total_supply(tokenID)).toBeGreaterThanOrEqual(amount)
        tokenService.connect(connector);
        const [tx] = await tokenService.token_send(
          tokenID,
          evm2AleoArrWithoutPadding(receiver),
          amount,
          destChainId,
          evm2AleoArrWithoutPadding(destTsAddr),
          evm2AleoArrWithoutPadding(destToken),
        );
        await tx.wait();

        const finalTokenSupply = await tokenService.total_supply(tokenID);
        expect(finalTokenSupply).toBe(initialTokenSupply - amount);
      },
      TIMEOUT
    );
  });
  
  describe("Token Receive", () => {

    test("Wrong token service cannot receive the token, transaction is expected to fail", async () => {
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
        packet.message.sender_address,
        packet.message.dest_token_id,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures,
        packet.source.chain_id,
        evm2AleoArrWithoutPadding(ethTsContractAddr2),
      );
      const result = await tx.wait();
      expect(result.execution).toBeUndefined(); 

    },
      TIMEOUT
    );

    test("cannot receiver if token is paused", async () => {
        tokenService.connect(admin);
        const [pauseTx] = await tokenService.pause_token_ts(tokenID);
        await pauseTx.wait();

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
  
        const [screeningPassed, tx] = await tokenService.token_receive(
          packet.message.sender_address,
          packet.message.dest_token_id,
          packet.message.receiver_address,
          packet.message.amount,
          packet.sequence,
          packet.height,
          signers,
          signatures,
          packet.source.chain_id,
          packet.source.addr,
        );
        const result = await tx.wait();
        expect(result.execution).toBeUndefined(); 
    }, TIMEOUT)

    test("Happy receive token", async () => {

      // unpausing the token
      tokenService.connect(admin);
      const [unpauseTx] = await tokenService.unpause_token_ts(tokenID);
      await unpauseTx.wait();

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

      const [screeningPassed, tx] = await tokenService.token_receive(
        packet.message.sender_address,
        packet.message.dest_token_id,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures,
        packet.source.chain_id,
        packet.source.addr,
      );
      await tx.wait();

      const finalTokenSupply = await tokenService.total_supply(tokenID);
      expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
      expect(screeningPassed).toBe(true);
    },
      TIMEOUT
    );

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
