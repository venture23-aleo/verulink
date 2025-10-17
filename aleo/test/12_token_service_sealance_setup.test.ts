import { Vlink_token_bridge_v2Contract } from "../artifacts/js/vlink_token_bridge_v2";

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
import { WithdrawalLimit } from "../artifacts/js/types/vlink_token_service_v2";
import { ExecutionMode, js2leo } from "@doko-js/core";
import { ChainToken } from "../artifacts/js/types/vlink_token_service_council_v2";
import { hashStruct } from "../utils/hash";
import { Vlink_token_service_sealance_v1Contract } from "../artifacts/js/vlink_token_service_sealance_v1";
import { Vlink_holding_sealance_v1Contract } from "../artifacts/js/vlink_holding_sealance_v1";
import { Compliant_token_templateContract } from "../artifacts/js/compliant_token_template";
import { Sealance_freezelist_registryContract } from "../artifacts/js/sealance_freezelist_registry";
import { Merkle_treeContract } from "../artifacts/js/merkle_tree";
const usdcContractAddr = ethUsdcContractAddr;
const mode = ExecutionMode.SnarkExecute;
// npm run test -- --runInBand ./test/12_token_service_sealance_setup.test.ts

const bridge = new Vlink_token_bridge_v2Contract({ mode: mode });
const tokenService = new Vlink_token_service_sealance_v1Contract({ mode: mode });
const holding = new Vlink_holding_sealance_v1Contract({ mode });

const complianceToken = new Compliant_token_templateContract({ mode: mode });
const FreezingList = new Sealance_freezelist_registryContract({ mode: mode });
const merketContract = new Merkle_treeContract({ mode: mode });



const tokenID = BigInt("11111111111");
(BigInt.prototype as any).toJSON = function () {
    return this.toString() + "field";
};

const newTokenID = BigInt(987456123);

const eth2TokenInfo: ChainToken = {
    chain_id: ethChainId,
    token_id: tokenID
}
const TIMEOUT = 20000_000;

const sleepTimer = ms => new Promise(resolve => setTimeout(resolve, ms));

const tokenManagerRole = 3; // role value for minter and burner in token Sealance complianceToken contract

const blockWindow = 300;



describe("Token Service setup and governace ", () => {
    const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = bridge.getAccounts();
    const token_name = BigInt('614833282165187462067')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
    const token_symbol = BigInt("143715203238") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
    const token_decimals = 6
    const token_max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615
    const public_platform_fee = 5000; // equivalent to 5% in basis points
    const public_relayer_fee = BigInt(10000);
    console.log(tokenID);

    const admin = aleoUser1;
    describe("Deployment", () => {
        tokenService.connect(admin);

       test("Deploy Merkle Tree", async () => {
            const deployTx = await merketContract.deploy();
            await deployTx.wait();
        }, TIMEOUT);

        test("Deploy Sealance Freezing List", async () => {
            const deployTx = await FreezingList.deploy();
            await deployTx.wait();
        }, TIMEOUT);

        test("Deploy Sealance", async () => {
            const deployTx = await complianceToken.deploy();
            await deployTx.wait();
        }, TIMEOUT);

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

        test("Freezing: Initialize", async () => {
                const tx = await FreezingList.initialize(
                    admin,
                    blockWindow
            );
            await tx.wait();
        }, TIMEOUT);

        test("Sealance: Initialize", async () => {
                const tx = await complianceToken.initialize(
                token_name,
                token_symbol,
                token_decimals,
                token_max_supply,
                admin
            );
            await tx.wait();
        }, TIMEOUT);

        test("Bridge: Initialize", async () => {
            const threshold = 1;
            const isBridgeInitialized = (await bridge.owner_TB(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
            if (!isBridgeInitialized) {
                const tx = await bridge.initialize_tb(
                    [aleoUser1, aleoUser2, ALEO_ZERO_ADDRESS, aleoUser4, ALEO_ZERO_ADDRESS],
                    threshold,
                    admin
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

        test("Token Service: Set role for MINTER and BURNER", async () => {
            const setSupplyManagerRoleTx = await complianceToken.update_role(tokenService.address(), tokenManagerRole);
            await setSupplyManagerRoleTx.wait();

            const role = await complianceToken.address_to_role(tokenService.address());
            expect(role).toBe(tokenManagerRole);
        }, TIMEOUT);
    })

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
                        minTransfer,
                        maxTransfer,
                        limit.percentage,
                        limit.duration,
                        limit.threshold_no_limit,
                        evm2AleoArrWithoutPadding(usdcContractAddr),
                        evm2AleoArrWithoutPadding(ethTsContractAddr),
                        ethChainId,
                        public_platform_fee,
                        public_relayer_fee,
                    );
                    await tx.wait();
                }, TIMEOUT);

                test("Owner can add new token", async () => {
                    tokenService.connect(admin)
                    const tx = await tokenService.add_token_ts(
                        minTransfer,
                        maxTransfer,
                        limit.percentage,
                        limit.duration,
                        limit.threshold_no_limit,
                        evm2AleoArrWithoutPadding(usdcContractAddr),
                        evm2AleoArrWithoutPadding(ethTsContractAddr),
                        ethChainId,
                        public_platform_fee,
                        public_relayer_fee,
                    );
                    await tx.wait();

                    const newtokenInfo: ChainToken = {
                        chain_id: ethChainId,
                        token_id: tokenID
                    }
                    sleepTimer(2000);
                    expect(await tokenService.added_tokens(tokenID)).toBe(true);
                    expect(await tokenService.other_chain_token_address(eth2TokenInfo)).toStrictEqual(evm2AleoArr(usdcContractAddr));
                    expect(await tokenService.other_chain_token_service(eth2TokenInfo)).toStrictEqual(evm2AleoArr(ethTsContractAddr));
                    expect(await tokenService.token_withdrawal_limits(tokenID, dummyLimit)).toStrictEqual(limit);
                    expect(await tokenService.min_transfers(tokenID)).toBe(minTransfer);
                    expect(await tokenService.max_transfers(tokenID)).toBe(maxTransfer);
                    sleepTimer(10000);
                    // expect(await tokenService.token_status(newTokenID)).toBe(true);
                    expect(await tokenService.public_platform_fee(newtokenInfo)).toBe(public_platform_fee);
                    expect(await tokenService.public_relayer_fee(newtokenInfo)).toBe(public_relayer_fee);
                    sleepTimer(5000);
                }, TIMEOUT);

                test.failing("Existing token cannot be added again", async () => {
                    let isTokenSupported = await tokenService.added_tokens(newTokenID, false);
                    expect(isTokenSupported).toBe(true);

                    tokenService.connect(admin);
                    const tx = await tokenService.add_token_ts(
                        minTransfer,
                        maxTransfer,
                        limit.percentage,
                        limit.duration,
                        limit.threshold_no_limit,
                        evm2AleoArrWithoutPadding(usdcContractAddr),
                        evm2AleoArrWithoutPadding(ethTsContractAddr),
                        ethChainId,
                        public_platform_fee,
                        public_relayer_fee,
                    );
                    await tx.wait();
                }, TIMEOUT);
            });

            describe("Remove Token", () => {
                test.failing("Non owner cannot remove token", async () => {
                    sleepTimer(5000);
                    let isTokenSupported = await tokenService.added_tokens(tokenID, false);
                    expect(isTokenSupported).toBe(true);

                    tokenService.connect(aleoUser3);
                    const tx = await tokenService.remove_token_ts(ethChainId);
                    await tx.wait();
                }, TIMEOUT);

                test("Owner can remove token", async () => {
                    let isTokenSupported = await tokenService.added_tokens(tokenID, false);
                    expect(isTokenSupported).toBe(true);

                    tokenService.connect(admin);
                    const tx = await tokenService.remove_token_ts(ethChainId);
                    await tx.wait();

                    isTokenSupported = await tokenService.added_tokens(tokenID, false);
                    expect(isTokenSupported).toBe(false);
                },
                    TIMEOUT
                );

            });
        })


    describe("Add token to other chain", () => {
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


        test("Owner can add new token", async () => {
                    tokenService.connect(admin)
                    const tx = await tokenService.add_token_ts(
                        minTransfer,
                        maxTransfer,
                        limit.percentage,
                        limit.duration,
                        limit.threshold_no_limit,
                        evm2AleoArrWithoutPadding(usdcContractAddr),
                        evm2AleoArrWithoutPadding(ethTsContractAddr),
                        ethChainId,
                        public_platform_fee,
                        public_relayer_fee,
                    );
                    await tx.wait();
                    sleepTimer(2000);
                    expect(await tokenService.added_tokens(tokenID)).toBe(true);
                    expect(await tokenService.other_chain_token_address(eth2TokenInfo)).toStrictEqual(evm2AleoArr(usdcContractAddr));
                    expect(await tokenService.other_chain_token_service(eth2TokenInfo)).toStrictEqual(evm2AleoArr(ethTsContractAddr));
                    expect(await tokenService.token_withdrawal_limits(tokenID, dummyLimit)).toStrictEqual(limit);
                    expect(await tokenService.min_transfers(tokenID)).toBe(minTransfer);
                    expect(await tokenService.max_transfers(tokenID)).toBe(maxTransfer);
                    sleepTimer(10000);
                    // expect(await tokenService.token_status(newTokenID)).toBe(true);
                    expect(await tokenService.public_platform_fee(eth2TokenInfo)).toBe(public_platform_fee);
                    expect(await tokenService.public_relayer_fee(eth2TokenInfo)).toBe(public_relayer_fee);
                    sleepTimer(5000);
        }, TIMEOUT);

        test.failing("cannot call by non owner", async () => {
            tokenService.connect(aleoUser3);
            const addChainTx = await tokenService.add_chain_to_existing_token(
                arbitrumChainId,
                evm2AleoArrWithoutPadding(arbitrumTsContractAddr),
                evm2AleoArrWithoutPadding(usdcContractAddr),
                public_platform_fee,
                public_relayer_fee,
            )
            await addChainTx.wait();
        })

        test("add base chain to existing token", async () => {
            await sleepTimer(5000);
            tokenService.connect(admin)
            const addChainTx = await tokenService.add_chain_to_existing_token(
                baseChainId,
                evm2AleoArrWithoutPadding(baseTsContractAddr),
                evm2AleoArrWithoutPadding(usdcContractAddr),
                public_platform_fee,
                public_relayer_fee
            )
            await addChainTx.wait();

            const tokenInfo: ChainToken = {
                chain_id: baseChainId,
                token_id: tokenID
            }

            expect(aleoArr2Evm(await tokenService.other_chain_token_address(tokenInfo)).toLowerCase()).toBe(usdcContractAddr.toLowerCase());
            expect(aleoArr2Evm(await tokenService.other_chain_token_service(tokenInfo)).toLowerCase()).toBe(baseTsContractAddr.toLowerCase());
            expect(await tokenService.public_platform_fee(tokenInfo)).toBe(public_platform_fee);
            expect(await tokenService.public_relayer_fee(tokenInfo)).toBe(public_relayer_fee);
        }, TIMEOUT)

        test("add arbitrum chain to existing token", async () => {
            tokenService.connect(admin)
            const addChainTx = await tokenService.add_chain_to_existing_token(
                arbitrumChainId,
                evm2AleoArrWithoutPadding(arbitrumTsContractAddr),
                evm2AleoArrWithoutPadding(usdcContractAddr),
                public_platform_fee,
                public_relayer_fee,
            )
            await addChainTx.wait();

            const tokenInfo: ChainToken = {
                chain_id: arbitrumChainId,
                token_id: tokenID
            }

            expect(aleoArr2Evm(await tokenService.other_chain_token_address(tokenInfo)).toLowerCase()).toBe(usdcContractAddr.toLowerCase());
            expect(aleoArr2Evm(await tokenService.other_chain_token_service(tokenInfo)).toLowerCase()).toBe(arbitrumTsContractAddr.toLowerCase());
            expect(await tokenService.public_platform_fee(tokenInfo)).toBe(public_platform_fee);
            expect(await tokenService.public_relayer_fee(tokenInfo)).toBe(public_relayer_fee);
        }, TIMEOUT)

        test.failing("token should have already been registered previously", async () => {
            const addChainTx = await tokenService.add_chain_to_existing_token(
                baseChainId,
                evm2AleoArrWithoutPadding(baseTsContractAddr),
                evm2AleoArrWithoutPadding(usdcContractAddr),
                public_platform_fee,
                public_relayer_fee,
            )
            await addChainTx.wait();
        })

        test("Token Service: Unpause Token", async () => {
            const isPaused = (await tokenService.token_status(tokenID, TOKEN_PAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
            if (isPaused) {
                const unpauseTx = await tokenService.unpause_token_ts();
                await unpauseTx.wait();
            }
            expect(await tokenService.token_status(tokenID, TOKEN_PAUSED_VALUE)).toBe(TOKEN_UNPAUSED_VALUE);
        }, TIMEOUT)
    })



    describe("Governance", () => {
        describe("Pausability", () => {
            test.failing("should not pause by non-owner", async () => {
                tokenService.connect(aleoUser3); //changing the contract caller account to non owner
                const tx = await tokenService.pause_token_ts();
                expect(await tokenService.token_status(tokenID)).toBe(TOKEN_UNPAUSED_VALUE);
                await tx.wait();
            }, TIMEOUT);

            test("owner can pause", async () => {
                tokenService.connect(admin);
                expect(await tokenService.token_status(tokenID)).toBe(TOKEN_UNPAUSED_VALUE);
                const tx = await tokenService.pause_token_ts();
                await tx.wait();
                expect(await tokenService.token_status(tokenID)).toBe(TOKEN_PAUSED_VALUE);
            }, TIMEOUT);

            test.failing("should not unpause by non-owner", async () => {
                tokenService.connect(aleoUser3);
                const tx = await tokenService.unpause_token_ts();
                expect(await tokenService.token_status(tokenID)).toBe(TOKEN_PAUSED_VALUE);
                await tx.wait();
            }, TIMEOUT);

            test("owner can unpause", async () => {
                expect(await tokenService.token_status(tokenID, TOKEN_UNPAUSED_VALUE)).toBe(TOKEN_PAUSED_VALUE);
                tokenService.connect(admin);
                const tx = await tokenService.unpause_token_ts();
                await tx.wait();
                expect(await tokenService.token_status(tokenID, TOKEN_UNPAUSED_VALUE)).toBe(TOKEN_UNPAUSED_VALUE);
            },
                TIMEOUT
            );
        });

        describe("Update minimum transfer", () => {
            const newMinTransfer = BigInt(200);


            test.failing("cannot update if minimum transfer greater than maximum transfer", async () => {
                tokenService.connect(admin);
                const maxTransfer = await tokenService.max_transfers(tokenID);
                const tx = await tokenService.update_min_transfer_ts(
                    maxTransfer + BigInt(20)
                );
                await tx.wait()
            }, TIMEOUT);


            test.failing("non-owner cannot update minimum transfer", async () => {
                tokenService.connect(aleoUser4);
                const tx = await tokenService.update_min_transfer_ts(
                    newMinTransfer
                );
                await tx.wait();
            }, TIMEOUT);

            test("owner can update minimum transfer", async () => {
                tokenService.connect(admin);
                const tx = await tokenService.update_min_transfer_ts(
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
                    newMaxTransfer
                );
                await tx.wait()
            }, TIMEOUT);

            test.failing("cannot update if maximum transfer lesser than minimum transfer", async () => {
                tokenService.connect(admin);
                const minTransfer = await tokenService.min_transfers(tokenID);
                const tx = await tokenService.update_max_transfer_ts(
                    minTransfer - BigInt(20)
                );
                await tx.wait();
            }, TIMEOUT);

            test("owner can update maximum transfer", async () => {
                tokenService.connect(admin);
                const tx = await tokenService.update_max_transfer_ts(
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

            test("should update withdrawal by admin", async () => {
                tokenService.connect(admin);
                const tx = await tokenService.update_withdrawal_limit(
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
                    110_00,
                    newLimit.duration,
                    newLimit.threshold_no_limit
                );
                await expect(tx.wait()).rejects.toThrow()
            }, TIMEOUT);

            test.failing("should not update withdrawal by non-admin", async () => {
                tokenService.connect(aleoUser3);
                const tx = await tokenService.update_withdrawal_limit(
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
                    evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
                );
                await tx.wait();
            }, TIMEOUT);


            test("should update token service contract address by admin", async () => {
                tokenService.connect(admin);
                console.log(await tokenService.other_chain_token_address(baseTokenInfo));
                const tx = await tokenService.update_other_chain_tokenaddress(
                    baseChainId,
                    evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
                );
                await tx.wait();
                expect(await tokenService.other_chain_token_address(baseTokenInfo)).toStrictEqual(evm2AleoArr(ethTsRandomContractAddress2))
            }, TIMEOUT)
        });

        describe("Remove other chain token address", () => {
            const arbitrumTokenInfo: ChainToken = {
                chain_id: arbitrumChainId,
                token_id: tokenID
            }

            test.failing("should not update token address by non-owner", async () => {
                tokenService.connect(aleoUser3);
                const tx = await tokenService.remove_other_chain_addresses(
                    ethChainId,
                );
                await tx.wait();
            }, TIMEOUT);

            test("should remove token address by admin", async () => {
                const address = await tokenService.other_chain_token_address(arbitrumTokenInfo);
                expect(address).toBeDefined();
                tokenService.connect(admin);
                const tx = await tokenService.remove_other_chain_addresses(
                    arbitrumChainId,
                );
                await tx.wait();
            }, TIMEOUT)
        });

        describe("Update other chain token service", () => {

            const baseTokenInfo: ChainToken = {
                chain_id: baseChainId,
                token_id: tokenID
            }

            test.failing("should not update token service by non-owner", async () => {
                tokenService.connect(aleoUser3);
                const tx = await tokenService.update_other_chain_tokenservice(
                    baseChainId,
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
                BigInt(100_000),
                BigInt(100),
                100_00,
                1,
                BigInt(100),
                evm2AleoArr(usdcContractAddr),
                evm2AleoArr(ethTsContractAddr),
                ethChainId,
                public_platform_fee,
                public_relayer_fee,
            );
        });


        test.failing('Percentage greater than 100 should fail', async () => {
            await tokenService.add_token_ts(
                BigInt(100),
                BigInt(100_000),
                101_00,
                1,
                BigInt(100),
                evm2AleoArr(usdcContractAddr),
                evm2AleoArr(ethTsContractAddr),
                ethChainId,
                public_platform_fee,
                public_relayer_fee,
            );
        })

        test.failing('Updating withdrawal limit with percentage greater than 100 should fail', async () => {
            await tokenService.update_withdrawal_limit(
                101_000,
                1,
                BigInt(100)
            )
        })
    })

    test.failing("Adding the token with platform fee greater than 100 should fail", async () => {
        await tokenService.add_token_ts(
            BigInt(100),
            BigInt(100_000),
            0,
            0,
            BigInt(0),
            evm2AleoArr(usdcContractAddr),
            evm2AleoArr(ethTsContractAddr),
            ethChainId,
            100000, // public platform fee greater than 100
            public_relayer_fee,
        );
    });
});