import { Vlink_token_bridge_v2Contract } from "../artifacts/js/vlink_token_bridge_v2";
import { Vlink_token_service_v2Contract } from "../artifacts/js/vlink_token_service_v2";
import { Token_registryContract } from "../artifacts/js/token_registry";

import { aleoArr2Evm, evm2AleoArr, evm2AleoArrWithoutPadding, generateRandomEthAddr } from "../utils/ethAddress";
import {
    ALEO_ZERO_ADDRESS,
    BRIDGE_PAUSABILITY_INDEX,
    BRIDGE_PAUSED_VALUE,
    BRIDGE_UNPAUSED_VALUE,
    OWNER_INDEX,
    TOKEN_PAUSED_VALUE,
    TOKEN_UNPAUSED_VALUE,
    arbitrumChainId,
    arbitrumTsContractAddr,
    baseChainId,
    baseTsContractAddr,
    ethChainId,
    ethTsContractAddr,
    ethTsRandomContractAddress2,
    ethUsdcContractAddr
} from "../utils/testdata.data";
import { PrivateKey } from "@aleohq/sdk";
import { WithdrawalLimit } from "../artifacts/js/types/vlink_token_service_v2";
import { ExecutionMode, js2leo } from "@doko-js/core";
import { ChainToken } from "../artifacts/js/types/vlink_token_service_council_v2";
import { Vlink_holding_v2Contract } from "../artifacts/js/vlink_holding_v2";
import { TokenOwner } from "../artifacts/js/types/token_registry";
import { hashStruct } from "../utils/hash";
const usdcContractAddr = ethUsdcContractAddr;
const mode = ExecutionMode.SnarkExecute;
// npm run test -- --runInBand ./test/2_1tokenService_setup.test.ts

const bridge = new Vlink_token_bridge_v2Contract({ mode: mode });
const tokenService = new Vlink_token_service_v2Contract({ mode: mode });
const mtsp = new Token_registryContract({ mode: mode });
const holding = new Vlink_holding_v2Contract({ mode });


let tokenID;
(BigInt.prototype as any).toJSON = function () {
    return this.toString() + "field";
};

const newTokenID = BigInt(987456123);

const eth2TokenInfo: ChainToken = {
    chain_id: ethChainId,
    token_id: newTokenID
}
const TIMEOUT = 20000_000;
const wrongTokenID = BigInt("32165478985523213549");

const sleepTimer = ms => new Promise(resolve => setTimeout(resolve, ms));




describe("Token Service setup and governace ", () => {
    const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = bridge.getAccounts();
    const token_name = BigInt('614833282165187462067')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
    const token_symbol = BigInt("143715203238") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
    const token_decimals = 6
    const token_max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615
    tokenID = hashStruct(token_name);
    const public_platform_fee = 5000; // equivalent to 5% in basis points
    const private_platform_fee = 10000; // equivalent to 10% in basis points
    const public_relayer_fee = BigInt(10000);
    const private_relayer_fee = BigInt(20000);
    const ALEO_SEQ_NUM = BigInt(1);
    const ETH_SEQ_NUM = BigInt(1);
    console.log(tokenID);

    const admin = aleoUser1;
    describe("Deployment", () => {
        tokenService.connect(admin)

        test("Deploy Bridge", async () => {
            const deployTx = await bridge.deploy();
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
                const tx = await bridge.initialize_tb(
                    [aleoUser1, aleoUser2, ALEO_ZERO_ADDRESS, aleoUser4, ALEO_ZERO_ADDRESS],
                    threshold,
                    admin,
                    ALEO_SEQ_NUM,
                    ETH_SEQ_NUM,
                );
                await tx.wait();
            }
        }, TIMEOUT);

        test("Bridge: Add ethereum Chain", async () => {
            const isEthSupported = (await bridge.supported_chains(ethChainId, false));
            if (!isEthSupported) {
                const addEthChainTx = await bridge.add_chain_tb(ethChainId);
                await addEthChainTx.wait();
            }
            expect(await bridge.supported_chains(ethChainId, false)).toBe(true)
        }, TIMEOUT)

        test("Bridge: Add base Chain", async () => {
            const isBaseSupported = (await bridge.supported_chains(baseChainId, false));
            if (!isBaseSupported) {
                const addBaseChainTx = await bridge.add_chain_tb(baseChainId);
                await addBaseChainTx.wait();
            }
            expect(await bridge.supported_chains(baseChainId, false)).toBe(true)
        }, TIMEOUT)

        test("Bridge: Add Service", async () => {
            const isTokenServiceEnabled = await bridge.supported_services(tokenService.address(), false);
            if (!isTokenServiceEnabled) {
                const supportServiceTx = await bridge.add_service_tb(tokenService.address());
                await supportServiceTx.wait();
            }
            expect(await bridge.supported_services(tokenService.address())).toBe(true);
        }, TIMEOUT)

        test("Bridge: Unpause", async () => {
            const isPaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_PAUSED_VALUE;
            if (isPaused) {
                const unpauseTx = await bridge.unpause_tb();
                await unpauseTx.wait();
            }
            expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE)).toBe(BRIDGE_UNPAUSED_VALUE);
        }, TIMEOUT)

        test("Holding: Initialize", async () => {
            const tx = await holding.initialize_holding(tokenService.address());
            await tx.wait();
        }, TIMEOUT)


        test.failing("Token Service: cannot Initialize by non-initializer address", async () => {
            tokenService.connect(aleoUser3);
            const tx = await tokenService.initialize_ts(admin);
            await tx.wait();
        })

        test("Token Service: Initialize", async () => {
            tokenService.connect(admin);
            const precheck_isTokenServiceInitialized = (await tokenService.owner_TS(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
            console.log("is sevice initialized: ", precheck_isTokenServiceInitialized);
            if (!precheck_isTokenServiceInitialized) {
                const tx = await tokenService.initialize_ts(admin);
                await tx.wait();
                const postcheck_isTokenServiceInitialized = (await tokenService.owner_TS(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
                expect(postcheck_isTokenServiceInitialized).toEqual(true);
            }
        }, TIMEOUT);

        test.failing("Token Service: cannot Initialize twice", async () => {
            const tx = await tokenService.initialize_ts(admin);
            await tx.wait();
        });

        test("Token Service: Register token in Token registry", async () => {
            console.log(tokenID)
            const tx = await mtsp.register_token(tokenID, token_name, token_symbol, token_decimals, token_max_supply, false, tokenService.address());
            await tx.wait();
            await sleepTimer(5000);
        }, TIMEOUT);

        test("Token Service: Set role for MINTER and BURNER", async () => {
            const token_owner: TokenOwner = {
                account: tokenService.address(),
                token_id: tokenID
            }

            const role_owner_hash = hashStruct(token_owner);

            const setSupplyManagerRoleTx = await mtsp.set_role(tokenID, tokenService.address(), 3);
            await setSupplyManagerRoleTx.wait();

            const role = await mtsp.roles(role_owner_hash);
            expect(role).toBe(3);
        }, TIMEOUT);
    })

    describe("Add parent token", () => {
        test("Token Service: Add Token", async () => {
            tokenService.connect(admin)
            const limit: WithdrawalLimit = {
                percentage: 100_00, // 100%
                duration: 1, // per block
                threshold_no_limit: BigInt(100)
            };

            const minimumTransfer = BigInt(100);
            const maximumTransfer = BigInt(100_000);
            let isAdded = await tokenService.added_tokens(tokenID, false);
            const isWusdcNotSupported = (isAdded == false);
            if (isWusdcNotSupported) {
                const tx = await tokenService.add_token_ts(
                    tokenID,
                    minimumTransfer,
                    maximumTransfer,
                    limit.percentage,
                    limit.duration,
                    limit.threshold_no_limit,
                    evm2AleoArrWithoutPadding(usdcContractAddr),
                    evm2AleoArrWithoutPadding(ethTsContractAddr),
                    ethChainId,
                    public_platform_fee,
                    private_platform_fee,
                    public_relayer_fee,
                    private_relayer_fee,
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
            // expect(await tokenService.token_withdrawal_limits(tokenID, dummyLimit)).toStrictEqual(limit);
            expect(await tokenService.min_transfers(tokenID)).toBe(minimumTransfer);
            expect(await tokenService.max_transfers(tokenID)).toBe(maximumTransfer);
            expect(await tokenService.token_status(tokenID)).toBe(TOKEN_PAUSED_VALUE);
            expect(await tokenService.public_platform_fee(ethTokenInfo)).toBe(public_platform_fee);
            expect(await tokenService.private_platform_fee(ethTokenInfo)).toBe(private_platform_fee);
            expect(await tokenService.public_relayer_fee(ethTokenInfo)).toBe(public_relayer_fee);
            expect(await tokenService.private_relayer_fee(ethTokenInfo)).toBe(private_relayer_fee);
            await sleepTimer(5000);
        }, TIMEOUT)
    })

    describe("Add token to other chain", () => {
        test.failing("cannot call by non owner", async () => {
            tokenService.connect(aleoUser3);
            const addChainTx = await tokenService.add_chain_to_existing_token(
                arbitrumChainId,
                tokenID,
                evm2AleoArrWithoutPadding(arbitrumTsContractAddr),
                evm2AleoArrWithoutPadding(usdcContractAddr),
                public_platform_fee,
                private_platform_fee,
                public_relayer_fee,
                private_relayer_fee
            )
            await addChainTx.wait();
        })

        test("add base chain to existing token", async () => {
            await sleepTimer(5000);
            tokenService.connect(admin)
            const addChainTx = await tokenService.add_chain_to_existing_token(
                baseChainId,
                tokenID,
                evm2AleoArrWithoutPadding(baseTsContractAddr),
                evm2AleoArrWithoutPadding(usdcContractAddr),
                public_platform_fee,
                private_platform_fee,
                public_relayer_fee,
                private_relayer_fee
            )
            await addChainTx.wait();

            const tokenInfo: ChainToken = {
                chain_id: baseChainId,
                token_id: tokenID
            }

            expect(aleoArr2Evm(await tokenService.other_chain_token_address(tokenInfo)).toLowerCase()).toBe(usdcContractAddr.toLowerCase());
            expect(aleoArr2Evm(await tokenService.other_chain_token_service(tokenInfo)).toLowerCase()).toBe(baseTsContractAddr.toLowerCase());
            expect(await tokenService.public_platform_fee(tokenInfo)).toBe(public_platform_fee);
            expect(await tokenService.private_platform_fee(tokenInfo)).toBe(private_platform_fee);
            expect(await tokenService.public_relayer_fee(tokenInfo)).toBe(public_relayer_fee);
            expect(await tokenService.private_relayer_fee(tokenInfo)).toBe(private_relayer_fee);
        }, TIMEOUT)

        test("add arbitrum chain to existing token", async () => {
            tokenService.connect(admin)
            const addChainTx = await tokenService.add_chain_to_existing_token(
                arbitrumChainId,
                tokenID,
                evm2AleoArrWithoutPadding(arbitrumTsContractAddr),
                evm2AleoArrWithoutPadding(usdcContractAddr),
                public_platform_fee,
                private_platform_fee,
                public_relayer_fee,
                private_relayer_fee
            )
            await addChainTx.wait();

            const tokenInfo: ChainToken = {
                chain_id: arbitrumChainId,
                token_id: tokenID
            }

            expect(aleoArr2Evm(await tokenService.other_chain_token_address(tokenInfo)).toLowerCase()).toBe(usdcContractAddr.toLowerCase());
            expect(aleoArr2Evm(await tokenService.other_chain_token_service(tokenInfo)).toLowerCase()).toBe(arbitrumTsContractAddr.toLowerCase());
            expect(await tokenService.public_platform_fee(tokenInfo)).toBe(public_platform_fee);
            expect(await tokenService.private_platform_fee(tokenInfo)).toBe(private_platform_fee);
            expect(await tokenService.public_relayer_fee(tokenInfo)).toBe(public_relayer_fee);
            expect(await tokenService.private_relayer_fee(tokenInfo)).toBe(private_relayer_fee);
        }, TIMEOUT)

        test.failing("token should have already been registered previously", async () => {
            const diff_tokenId = hashStruct(BigInt('6148332821651876206'));
            const addChainTx = await tokenService.add_chain_to_existing_token(
                baseChainId,
                diff_tokenId,
                evm2AleoArrWithoutPadding(baseTsContractAddr),
                evm2AleoArrWithoutPadding(usdcContractAddr),
                public_platform_fee,
                private_platform_fee,
                public_relayer_fee,
                private_relayer_fee
            )
            await addChainTx.wait();
        })

        test("Token Service: Unpause Token", async () => {
            const isPaused = (await tokenService.token_status(tokenID, TOKEN_PAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
            if (isPaused) {
                const unpauseTx = await tokenService.unpause_token_ts(tokenID);
                await unpauseTx.wait();
            }
            expect(await tokenService.token_status(tokenID, TOKEN_PAUSED_VALUE)).toBe(TOKEN_UNPAUSED_VALUE);
        }, TIMEOUT)
    })


    describe("Migration test", () => {
        const tokenIDs = [tokenID, BigInt(0), BigInt(0)]
        const totalSupplys = [BigInt(10000), BigInt(0), BigInt(0)]
        const tokenSnapshotSupplyData = [BigInt(1000), BigInt(0), BigInt(0)]
        const tokenWithdrawalData = [BigInt(500), BigInt(0), BigInt(0)]
        const tokenHoldingData = [BigInt(100), BigInt(0), BigInt(0)]
        const tokenSnapshotHeightData = [50, 0, 0]


        test.failing("cannot perform migration by non owner", async () => {
            tokenService.connect(aleoUser3);
            const migrationTxn = await tokenService.migrate_previous_sysData(
                tokenIDs,
                totalSupplys,
                tokenSnapshotSupplyData,
                tokenWithdrawalData,
                tokenHoldingData,
                tokenSnapshotHeightData
            )
            await migrationTxn.wait();
        }, TIMEOUT)

        test("Admin can perform migration", async () => {
            const currentOwner = await tokenService.owner_TS(OWNER_INDEX);
            let isAdded = await tokenService.added_tokens(tokenID, false);
            expect(isAdded).toBe(true)
            let total_supply = await tokenService.total_supply(tokenID, BigInt(0));
            expect(total_supply).toBe(BigInt(0))
            let token_holding = await tokenService.token_holding(tokenID, BigInt(0));
            expect(token_holding).toBe(BigInt(0))
            let token_amount_withdrawn = await tokenService.token_amount_withdrawn(tokenID, BigInt(0));
            expect(token_amount_withdrawn).toBe(BigInt(0))
            let token_snapshot_supply = await tokenService.token_snapshot_supply(tokenID, BigInt(0));
            expect(token_snapshot_supply).toBe(BigInt(0))
            tokenService.connect(currentOwner);
            const migrationTxn = await tokenService.migrate_previous_sysData(
                tokenIDs,
                totalSupplys,
                tokenSnapshotSupplyData,
                tokenWithdrawalData,
                tokenHoldingData,
                tokenSnapshotHeightData
            )
            await migrationTxn.wait();
            expect(await tokenService.total_supply(tokenIDs[0])).toBe(totalSupplys[0])
            expect(await tokenService.token_snapshot_supply(tokenIDs[0])).toBe(tokenSnapshotSupplyData[0])
            expect(await tokenService.token_amount_withdrawn(tokenIDs[0])).toBe(tokenWithdrawalData[0])
            expect(await tokenService.token_holding(tokenIDs[0])).toBe(tokenHoldingData[0])
            expect(await tokenService.token_snapshot_height(tokenIDs[0])).toBe(tokenSnapshotHeightData[0])
        }, TIMEOUT)
    })

    describe("Governance", () => {
        describe("Pausability", () => {
            test.failing("should not pause by non-owner", async () => {
                tokenService.connect(aleoUser3); //changing the contract caller account to non owner
                const tx = await tokenService.pause_token_ts(tokenID);
                expect(await tokenService.token_status(tokenID)).toBe(TOKEN_UNPAUSED_VALUE);
                await tx.wait();
            }, TIMEOUT);

            test.failing("should not pause if token Id is not present", async () => {
                tokenService.connect(admin); //changing the contract caller account to non owner
                const tx = await tokenService.pause_token_ts(wrongTokenID);
                expect(await tokenService.token_status(tokenID)).toBe(TOKEN_UNPAUSED_VALUE);
                await tx.wait();
            }, TIMEOUT);

            test("owner can pause", async () => {
                tokenService.connect(admin);
                expect(await tokenService.token_status(tokenID)).toBe(TOKEN_UNPAUSED_VALUE);
                const tx = await tokenService.pause_token_ts(tokenID);
                await tx.wait();
                expect(await tokenService.token_status(tokenID)).toBe(TOKEN_PAUSED_VALUE);
            }, TIMEOUT);

            test.failing("should not unpause by non-owner", async () => {
                tokenService.connect(aleoUser3);
                const tx = await tokenService.unpause_token_ts(tokenID);
                expect(await tokenService.token_status(tokenID)).toBe(TOKEN_PAUSED_VALUE);
                await tx.wait();
            }, TIMEOUT);

            test.failing("should not unpause if token Id is not present", async () => {
                tokenService.connect(admin); //changing the contract caller account to non owner
                const tx = await tokenService.unpause_token_ts(wrongTokenID);
                await tx.wait();
            }, TIMEOUT);

            test("owner can unpause", async () => {
                expect(await tokenService.token_status(tokenID, TOKEN_UNPAUSED_VALUE)).toBe(TOKEN_PAUSED_VALUE);
                tokenService.connect(admin);
                const tx = await tokenService.unpause_token_ts(tokenID);
                await tx.wait();
                expect(await tokenService.token_status(tokenID, TOKEN_UNPAUSED_VALUE)).toBe(TOKEN_UNPAUSED_VALUE);
            },
                TIMEOUT
            );
        });

        describe("Add/Remove Token", () => {
            describe("Add Token", () => {
                const limit: WithdrawalLimit = {
                    percentage: 100_000, // 100%
                    duration: 1, // per block
                    threshold_no_limit: BigInt(100)
                };
                const dummyLimit: WithdrawalLimit = {
                    percentage: 0, // 10%
                    duration: 0, // per block
                    threshold_no_limit: BigInt(0)
                };
                const minTransfer = BigInt(100);
                const maxTransfer = BigInt(901000000);

                test.failing("Non-owner cannot add new token", async () => {
                    const newToken2Id = BigInt(784596321);
                    tokenService.connect(aleoUser3);
                    const tx = await tokenService.add_token_ts(
                        newToken2Id,
                        minTransfer,
                        maxTransfer,
                        limit.percentage,
                        limit.duration,
                        limit.threshold_no_limit,
                        evm2AleoArrWithoutPadding(usdcContractAddr),
                        evm2AleoArrWithoutPadding(ethTsContractAddr),
                        ethChainId,
                        public_platform_fee,
                        private_platform_fee,
                        public_relayer_fee,
                        private_relayer_fee,
                    );
                    await tx.wait();
                }, TIMEOUT);

                test("Owner can add new token", async () => {
                    tokenService.connect(admin)
                    const tx = await tokenService.add_token_ts(
                        newTokenID,
                        minTransfer,
                        maxTransfer,
                        limit.percentage,
                        limit.duration,
                        limit.threshold_no_limit,
                        evm2AleoArrWithoutPadding(usdcContractAddr),
                        evm2AleoArrWithoutPadding(ethTsContractAddr),
                        ethChainId,
                        public_platform_fee,
                        private_platform_fee,
                        public_relayer_fee,
                        private_relayer_fee,
                    );
                    await tx.wait();

                    const newtokenInfo: ChainToken = {
                        chain_id: ethChainId,
                        token_id: newTokenID
                    }
                    sleepTimer(2000);
                    expect(await tokenService.added_tokens(newTokenID)).toBe(true);
                    expect(await tokenService.other_chain_token_address(eth2TokenInfo)).toStrictEqual(evm2AleoArr(usdcContractAddr));
                    expect(await tokenService.other_chain_token_service(eth2TokenInfo)).toStrictEqual(evm2AleoArr(ethTsContractAddr));
                    expect(await tokenService.token_withdrawal_limits(newTokenID, dummyLimit)).toStrictEqual(limit);
                    expect(await tokenService.min_transfers(newTokenID)).toBe(minTransfer);
                    expect(await tokenService.max_transfers(newTokenID)).toBe(maxTransfer);
                    sleepTimer(10000);
                    // expect(await tokenService.token_status(newTokenID)).toBe(true);
                    expect(await tokenService.public_platform_fee(newtokenInfo)).toBe(public_platform_fee);
                    expect(await tokenService.private_platform_fee(newtokenInfo)).toBe(private_platform_fee);
                    expect(await tokenService.public_relayer_fee(newtokenInfo)).toBe(public_relayer_fee);
                    expect(await tokenService.private_relayer_fee(newtokenInfo)).toBe(private_relayer_fee);
                    sleepTimer(5000);
                }, TIMEOUT);

                test.failing("Existing token cannot be added again", async () => {
                    let isTokenSupported = await tokenService.added_tokens(newTokenID, false);
                    expect(isTokenSupported).toBe(true);

                    tokenService.connect(admin);
                    const tx = await tokenService.add_token_ts(
                        newTokenID,
                        minTransfer,
                        maxTransfer,
                        limit.percentage,
                        limit.duration,
                        limit.threshold_no_limit,
                        evm2AleoArrWithoutPadding(usdcContractAddr),
                        evm2AleoArrWithoutPadding(ethTsContractAddr),
                        ethChainId,
                        public_platform_fee,
                        private_platform_fee,
                        public_relayer_fee,
                        private_relayer_fee,
                    );
                    await tx.wait();
                }, TIMEOUT);
            });

            describe("Remove Token", () => {
                test.failing("Non owner cannot remove token", async () => {
                    sleepTimer(5000);
                    let isTokenSupported = await tokenService.added_tokens(newTokenID, false);
                    expect(isTokenSupported).toBe(true);

                    tokenService.connect(aleoUser3);
                    const tx = await tokenService.remove_token_ts(ethChainId, newTokenID);
                    await tx.wait();
                }, TIMEOUT);

                test("Owner can remove token", async () => {
                    let isTokenSupported = await tokenService.added_tokens(newTokenID, false);
                    expect(isTokenSupported).toBe(true);

                    tokenService.connect(admin);
                    const tx = await tokenService.remove_token_ts(ethChainId, newTokenID);
                    await tx.wait();

                    isTokenSupported = await tokenService.added_tokens(newTokenID, false);
                    expect(isTokenSupported).toBe(false);
                },
                    TIMEOUT
                );

                test.failing("Token must be added to be removed", async () => {
                    let isTokenSupported = await tokenService.added_tokens(newTokenID, false);
                    expect(isTokenSupported).toBe(false);

                    tokenService.connect(admin);
                    const tx = await tokenService.remove_token_ts(ethChainId, newTokenID);
                    await tx.wait();
                },
                    TIMEOUT
                );
            });
        })

        describe("Update minimum transfer", () => {
            const newMinTransfer = BigInt(200);
            test.failing("cannot update minimum transfer if unregistered tokenID is given", async () => {
                tokenService.connect(admin);
                const tx = await tokenService.update_min_transfer_ts(
                    wrongTokenID,
                    newMinTransfer
                );
                await tx.wait();
            }, TIMEOUT);

            test.failing("cannot update if minimum transfer greater than maximum transfer", async () => {
                tokenService.connect(admin);
                const maxTransfer = await tokenService.max_transfers(tokenID);
                const tx = await tokenService.update_min_transfer_ts(
                    tokenID,
                    maxTransfer + BigInt(20)
                );
                await tx.wait()
            }, TIMEOUT);


            test.failing("non-owner cannot update minimum transfer", async () => {
                tokenService.connect(aleoUser4);
                const tx = await tokenService.update_min_transfer_ts(
                    tokenID,
                    newMinTransfer
                );
                await tx.wait();
            }, TIMEOUT);

            test("owner can update minimum transfer", async () => {
                tokenService.connect(admin);
                const tx = await tokenService.update_min_transfer_ts(
                    tokenID,
                    newMinTransfer
                );
                await tx.wait();
                expect(await tokenService.min_transfers(tokenID)).toBe(newMinTransfer);
            }, TIMEOUT);

        })

        describe("Update maximum transfer", () => {
            const newMaxTransfer = BigInt(200_000);
            test.failing("non-owner cannot update maximum transfer", async () => {
                tokenService.connect(aleoUser4);
                const tx = await tokenService.update_max_transfer_ts(
                    tokenID,
                    newMaxTransfer
                );
                await tx.wait()
            }, TIMEOUT);

            test.failing("cannot update maximum transfer if unregistered tokenID is given", async () => {
                tokenService.connect(admin);
                const tx = await tokenService.update_max_transfer_ts(
                    wrongTokenID,
                    newMaxTransfer
                );
                await tx.wait();
            }, TIMEOUT);

            test.failing("cannot update if maximum transfer lesser than minimum transfer", async () => {
                tokenService.connect(admin);
                const minTransfer = await tokenService.min_transfers(tokenID);
                const tx = await tokenService.update_max_transfer_ts(
                    tokenID,
                    minTransfer - BigInt(20)
                );
                await tx.wait();
            }, TIMEOUT);

            test("owner can update maximum transfer", async () => {
                tokenService.connect(admin);
                const tx = await tokenService.update_max_transfer_ts(
                    tokenID,
                    newMaxTransfer
                );
                await tx.wait();
                expect(await tokenService.max_transfers(tokenID)).toBe(newMaxTransfer);
            }, TIMEOUT);
        })

        describe("Update withdrawal limit", () => {
            const newLimit: WithdrawalLimit = {
                percentage: 90_000, // 90%
                duration: 2, // per block
                threshold_no_limit: BigInt(200)
            };


            test.failing("token should exist to update withdrawal limit", async () => {
                const diff_tokenId = hashStruct(BigInt('61483328216518762067'));
                tokenService.connect(admin);
                const tx = await tokenService.update_withdrawal_limit(
                    diff_tokenId,
                    newLimit.percentage,
                    newLimit.duration,
                    newLimit.threshold_no_limit
                );
                await tx.wait()
            }, TIMEOUT);

            test("should update withdrawal by admin", async () => {
                tokenService.connect(admin);
                const tx = await tokenService.update_withdrawal_limit(
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
                const tx = await tokenService.update_withdrawal_limit(
                    tokenID,
                    110_00,
                    newLimit.duration,
                    newLimit.threshold_no_limit
                );
                await expect(tx.wait()).rejects.toThrow()
            }, TIMEOUT);

            test.failing("should not update withdrawal by non-admin", async () => {
                tokenService.connect(aleoUser3);
                const tx = await tokenService.update_withdrawal_limit(
                    tokenID,
                    newLimit.percentage,
                    newLimit.duration,
                    newLimit.threshold_no_limit
                );
                await tx.wait()
            }, TIMEOUT);

        })

        describe("Update other chain token address", () => {
            const unregisteredTokenID = BigInt("9841023567956645465");
            const baseTokenInfo: ChainToken = {
                chain_id: baseChainId,
                token_id: tokenID
            }

            test.failing("should not update token address by non-owner", async () => {
                tokenService.connect(aleoUser3);
                const tx = await tokenService.update_other_chain_tokenaddress(
                    ethChainId,
                    tokenID,
                    evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
                );
                await tx.wait();
            }, TIMEOUT);

            test.failing("should not update token address if token id is not registered", async () => {
                tokenService.connect(admin);
                const tx = await tokenService.update_other_chain_tokenaddress(
                    ethChainId,
                    unregisteredTokenID,
                    evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
                );
                await tx.wait();
            }, TIMEOUT)

            test("should update token service contract address by admin", async () => {
                tokenService.connect(admin);
                console.log(await tokenService.other_chain_token_address(baseTokenInfo));
                const tx = await tokenService.update_other_chain_tokenaddress(
                    baseChainId,
                    tokenID,
                    evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
                );
                await tx.wait();
                expect(await tokenService.other_chain_token_address(baseTokenInfo)).toStrictEqual(evm2AleoArr(ethTsRandomContractAddress2))
            }, TIMEOUT)
        });

        describe("Remove other chain token address", () => {
            const unregisteredTokenID = BigInt("9841023567956645465");
            const arbitrumTokenInfo: ChainToken = {
                chain_id: arbitrumChainId,
                token_id: tokenID
            }

            test.failing("should not update token address by non-owner", async () => {
                tokenService.connect(aleoUser3);
                const tx = await tokenService.remove_other_chain_addresses(
                    ethChainId,
                    tokenID
                );
                await tx.wait();
            }, TIMEOUT);

            test.failing("should not remove token address if token id is not registered", async () => {
                tokenService.connect(admin);
                const tx = await tokenService.remove_other_chain_addresses(
                    ethChainId,
                    unregisteredTokenID
                );
                await tx.wait();
            }, TIMEOUT)

            test("should remove token address by admin", async () => {
                const address = await tokenService.other_chain_token_address(arbitrumTokenInfo);
                expect(address).toBeDefined();
                tokenService.connect(admin);
                const tx = await tokenService.remove_other_chain_addresses(
                    arbitrumChainId,
                    tokenID
                );
                await tx.wait();
            }, TIMEOUT)
        });

        describe("Update other chain token service", () => {
            const unregisteredTokenID = BigInt("9841023567956645465");

            const baseTokenInfo: ChainToken = {
                chain_id: baseChainId,
                token_id: tokenID
            }

            test.failing("should not update token service by non-owner", async () => {
                tokenService.connect(aleoUser3);
                const tx = await tokenService.update_other_chain_tokenservice(
                    baseChainId,
                    tokenID,
                    evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
                );
                await tx.wait()
            }, TIMEOUT)

            test.failing("should not update token address if token id is not registered", async () => {
                tokenService.connect(admin);
                const tx = await tokenService.update_other_chain_tokenservice(
                    baseChainId,
                    unregisteredTokenID,
                    evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
                );
                await tx.wait()
            }, TIMEOUT)

            test("should update other chain token service by admin", async () => {
                const currentOwner = await tokenService.owner_TS(OWNER_INDEX);
                //token should exist in respective chain
                const prev_token_services = await tokenService.other_chain_token_service(baseTokenInfo);
                expect(prev_token_services).toBeDefined()
                tokenService.connect(currentOwner);
                expect(await tokenService.added_tokens(tokenID, false)).toBe(true);
                const tx = await tokenService.update_other_chain_tokenservice(
                    baseChainId,
                    tokenID,
                    evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
                );
                await tx.wait();
                expect(await tokenService.other_chain_token_service(baseTokenInfo)).toStrictEqual(evm2AleoArr(ethTsRandomContractAddress2))
            }, TIMEOUT)
        });

        describe("Transfer Ownership", () => {
            test.failing("should not transfer ownership by non-admin", async () => {
                const currentOwner = await tokenService.owner_TS(OWNER_INDEX);
                expect(currentOwner).toBe(admin);
                tokenService.connect(aleoUser2);
                const transferOwnershipTx = await tokenService.transfer_ownership_ts(aleoUser3);
                await transferOwnershipTx.wait();
            },
                TIMEOUT
            );

            test("Current owner can transfer ownership", async () => {
                const currentOwner = await tokenService.owner_TS(OWNER_INDEX);
                tokenService.connect(currentOwner);
                const transferOwnershipTx = await tokenService.transfer_ownership_ts(aleoUser3);
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
    const public_platform_fee = 5;
    const private_platform_fee = 10;
    const public_relayer_fee = BigInt(10000);
    const private_relayer_fee = BigInt(20000);

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
                ethChainId,
                public_platform_fee,
                private_platform_fee,
                public_relayer_fee,
                private_relayer_fee,
            );
        });


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
                ethChainId,
                public_platform_fee,
                private_platform_fee,
                public_relayer_fee,
                private_relayer_fee,
            );
        })

        test.failing('Updating withdrawal limit with percentage greater than 100 should fail', async () => {
            await tokenService.update_withdrawal_limit(
                tokenID,
                101_000,
                1,
                BigInt(100)
            )
        })
    })

    test.failing("Adding the token with platform fee greater than 100 should fail", async () => {
        await tokenService.add_token_ts(
            newTokenID,
            BigInt(100),
            BigInt(100_000),
            0,
            0,
            BigInt(0),
            evm2AleoArr(usdcContractAddr),
            evm2AleoArr(ethTsContractAddr),
            ethChainId,
            100000, // public platform fee greater than 100
            100000, // private platform fee greater than 100
            public_relayer_fee,
            private_relayer_fee,
        );
    });
});