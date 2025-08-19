import { Vlink_token_bridge_v2Contract } from "../artifacts/js/vlink_token_bridge_v2";
import { aleoArr2Evm, evm2AleoArr, evm2AleoArrWithoutPadding } from "../utils/ethAddress";

import {
    ALEO_ZERO_ADDRESS,
    ethChainId,
    ethTsContractAddr,
    ethUsdcContractAddr,
    TOKEN_PAUSED_VALUE,
    arbitrumChainId,
    arbitrumTsContractAddr,
    baseChainId,
    baseTsContractAddr,
    TOKEN_UNPAUSED_VALUE,
    ethTsRandomContractAddress2,
    OWNER_INDEX,
    ALEO_CREDITS_TOKEN_ID,
    BSC_TESTNET
} from "../utils/testdata.data";
import { ExecutionMode } from "@doko-js/core";
import { ChainToken } from "../artifacts/js/types/vlink_token_service_cd_v2";
import { Vlink_token_service_cd_v2Contract } from "../artifacts/js/vlink_token_service_cd_v2";
import { Vlink_holding_cd_v2Contract } from "../artifacts/js/vlink_holding_cd_v2";

const usdcContractAddr = ethUsdcContractAddr;
const mode = ExecutionMode.SnarkExecute;
const bridge = new Vlink_token_bridge_v2Contract({ mode: mode });
const tokenServiceWAleo = new Vlink_token_service_cd_v2Contract({ mode: mode });
const holdingWAleo = new Vlink_holding_cd_v2Contract({ mode: mode });
//npm run test -- --runInBand ./test/9_1tokenService_waleo_setup.test.ts

let tokenID;
(BigInt.prototype as any).toJSON = function () {
    return this.toString() + "field";
};
const TIMEOUT = 20000_000;


describe("Deployment Token Service For ALeo", () => {
    const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = bridge.getAccounts();
    tokenID = BigInt("3443843282313283355522573239085696902919850365217539366784739393210722344986");
    const platform_fee = 5000;
    const admin = aleoUser1;

    tokenServiceWAleo.connect(admin)

    describe("Deployment", () => {

        test("Deploy Bridge", async () => {
            const deployTx = await bridge.deploy();
            await deployTx.wait();
        }, TIMEOUT);

        test("Deploy HoldingWAleo", async () => {
            const deployTx = await holdingWAleo.deploy();
            await deployTx.wait();
        }, TIMEOUT);

        test("Deploy Token Service WAleo", async () => {
            const deployTx = await tokenServiceWAleo.deploy();
            await deployTx.wait();
        }, TIMEOUT);

    });

    describe("Initialization", () => {

        test("Bridge: Initialize", async () => {
            const threshold = 1;
            const tx = await bridge.initialize_tb(
                [aleoUser1, aleoUser2, ALEO_ZERO_ADDRESS, aleoUser4, ALEO_ZERO_ADDRESS],
                threshold,
                admin,
                BigInt(0),
                BigInt(3000),
            );
            await tx.wait();
        }, TIMEOUT);

        test("Bridge: Unpause", async () => {
                const unpauseTx = await bridge.unpause_tb();
                await unpauseTx.wait();
        }, TIMEOUT)

        test("Bridge: Add BSc Chain", async () => {
                const addEthChainTx = await bridge.add_chain_tb(BSC_TESTNET);
                await addEthChainTx.wait();
        }, TIMEOUT)

        test("Bridge: Add Service", async () => {
            const supportServiceTx = await bridge.add_service_tb(tokenServiceWAleo.address());
            await supportServiceTx.wait();
        }, TIMEOUT)

        test("Holding: Initialize", async () => {
            holdingWAleo.connect(aleoUser1)
            const tx = await holdingWAleo.initialize_holding(tokenServiceWAleo.address());
            await tx.wait();
        }, TIMEOUT)

        test.failing("Token Service WAleo: Initialize from non-initializer address should fail", async () => {
            tokenServiceWAleo.connect(aleoUser3)
            const tx = await tokenServiceWAleo.initialize_ts(admin);
            await tx.wait();
        })

        test("Token Service WAleo: Initialize", async () => {
            tokenServiceWAleo.connect(aleoUser1)
            const tx = await tokenServiceWAleo.initialize_ts(admin);
            await tx.wait();
        }, TIMEOUT);

        test.failing("Token Service WAleo: can not Initialize twice", async () => {
            tokenServiceWAleo.connect(aleoUser1)
            const tx = await tokenServiceWAleo.initialize_ts(admin);
            await tx.wait();
        }, TIMEOUT);
    });


    describe("Add  Token Info", () => {
        const chainTokenInfo: ChainToken = {
            chain_id: ethChainId,
            token_id: ALEO_CREDITS_TOKEN_ID
        }
        test.failing("Add Token Info: Non-owner cannot add token info", async () => {
            tokenServiceWAleo.connect(aleoUser3);
            const minimumTransfer = BigInt(100);
            const maximumTransfer = BigInt(100000_000_000);
            const tx = await tokenServiceWAleo.add_token_info(
                minimumTransfer,
                maximumTransfer,
                evm2AleoArrWithoutPadding(usdcContractAddr),
                evm2AleoArrWithoutPadding(ethTsContractAddr),
                ethChainId,
                platform_fee,
            );
            await tx.wait();
        }, TIMEOUT)

        test.failing("Should fail if minimum transfer is greater than maximum transfer", async () => {
            tokenServiceWAleo.connect(admin);
            const minimumTransfer = BigInt(100000_000_000);
            const maximumTransfer = BigInt(100);
            const tx = await tokenServiceWAleo.add_token_info(
                minimumTransfer,
                maximumTransfer,
                evm2AleoArrWithoutPadding(usdcContractAddr),
                evm2AleoArrWithoutPadding(ethTsContractAddr),
                ethChainId,
                platform_fee
            );
            await tx.wait();
        })

        test("Token Service: Add Token Info", async () => {
            const minimumTransfer = BigInt(100);
            const maximumTransfer = BigInt(100_000);
            tokenServiceWAleo.connect(admin);
            const tx = await tokenServiceWAleo.add_token_info(
                minimumTransfer,
                maximumTransfer,
                evm2AleoArrWithoutPadding(usdcContractAddr),
                evm2AleoArrWithoutPadding(ethTsContractAddr),
                ethChainId,
                platform_fee,
            );
            await tx.wait();
            expect(aleoArr2Evm(await tokenServiceWAleo.other_chain_token_address(chainTokenInfo)).toLowerCase()).toBe(usdcContractAddr.toLowerCase());
            expect(aleoArr2Evm(await tokenServiceWAleo.other_chain_token_service(chainTokenInfo)).toLowerCase()).toBe(ethTsContractAddr.toLowerCase());
            expect(await tokenServiceWAleo.min_transfers(chainTokenInfo)).toBe(minimumTransfer);
            expect(await tokenServiceWAleo.max_transfers(chainTokenInfo)).toBe(maximumTransfer);
            expect(await tokenServiceWAleo.status(chainTokenInfo)).toBe(TOKEN_PAUSED_VALUE);
            expect(await tokenServiceWAleo.platform_fee(chainTokenInfo)).toBe(platform_fee);
        }, TIMEOUT)
    })

    describe("Add token to other chain", () => {
        test.failing("cannot call by non owner", async () => {
            tokenServiceWAleo.connect(aleoUser3);
            const addChainTx = await tokenServiceWAleo.add_chain_to_existing_token(
                arbitrumChainId,
                evm2AleoArrWithoutPadding(arbitrumTsContractAddr),
                evm2AleoArrWithoutPadding(usdcContractAddr),
                platform_fee
            )
            await addChainTx.wait();
        }, TIMEOUT)

        test("add base chain to existing token", async () => {
            tokenServiceWAleo.connect(admin)
            const addChainTx = await tokenServiceWAleo.add_chain_to_existing_token(
                baseChainId,
                evm2AleoArrWithoutPadding(baseTsContractAddr),
                evm2AleoArrWithoutPadding(usdcContractAddr),
                platform_fee
            )
            await addChainTx.wait();

            const tokenChainInfo: ChainToken = {
                chain_id: baseChainId,
                token_id: ALEO_CREDITS_TOKEN_ID
            }

            expect(aleoArr2Evm(await tokenServiceWAleo.other_chain_token_address(tokenChainInfo)).toLowerCase()).toBe(usdcContractAddr.toLowerCase());
            expect(aleoArr2Evm(await tokenServiceWAleo.other_chain_token_service(tokenChainInfo)).toLowerCase()).toBe(baseTsContractAddr.toLowerCase());
            expect(await tokenServiceWAleo.platform_fee(tokenChainInfo)).toBe(platform_fee);
        }, TIMEOUT)

        test("add arbitrum chain to existing token", async () => {
            tokenServiceWAleo.connect(admin)
            const addChainTx = await tokenServiceWAleo.add_chain_to_existing_token(
                arbitrumChainId,
                evm2AleoArrWithoutPadding(arbitrumTsContractAddr),
                evm2AleoArrWithoutPadding(usdcContractAddr),
                platform_fee
            )
            await addChainTx.wait();

            const tokenChainInfo: ChainToken = {
                chain_id: arbitrumChainId,
                token_id: ALEO_CREDITS_TOKEN_ID
            }

            expect(aleoArr2Evm(await tokenServiceWAleo.other_chain_token_address(tokenChainInfo)).toLowerCase()).toBe(usdcContractAddr.toLowerCase());
            expect(aleoArr2Evm(await tokenServiceWAleo.other_chain_token_service(tokenChainInfo)).toLowerCase()).toBe(arbitrumTsContractAddr.toLowerCase());
            expect(await tokenServiceWAleo.platform_fee(tokenChainInfo)).toBe(platform_fee);
        }, TIMEOUT)

        test.failing("Platform fee greater then 100 % should fail", async () => {
            const addChainTx = await tokenServiceWAleo.add_chain_to_existing_token(
                baseChainId,
                evm2AleoArrWithoutPadding(baseTsContractAddr),
                evm2AleoArrWithoutPadding(usdcContractAddr),
                5000000, //platform fee greater than 100 percentage
            )
            await addChainTx.wait();
        })

        test("Token Service: Unpause Token", async () => {
            const unpauseEthTx = await tokenServiceWAleo.unpause_token_ts(ethChainId);
            await unpauseEthTx.wait();

            const unpauseBaseTx = await tokenServiceWAleo.unpause_token_ts(baseChainId);
            await unpauseBaseTx.wait();

            const unpauseArbTx = await tokenServiceWAleo.unpause_token_ts(arbitrumChainId);
            await unpauseArbTx.wait();
        }, TIMEOUT)
    })

    describe("Governance", () => {
        const ethChainTokenInfo: ChainToken = {
            chain_id: ethChainId,
            token_id: ALEO_CREDITS_TOKEN_ID
        }
        describe("Pausability", () => {
            test.failing("should not pause by non-owner", async () => {
                tokenServiceWAleo.connect(aleoUser3); //changing the contract caller account to non owner
                const tx = await tokenServiceWAleo.pause_token_ts(ethChainId);
                expect(await tokenServiceWAleo.status(ethChainTokenInfo)).toBe(TOKEN_UNPAUSED_VALUE);
                await tx.wait();
            }, TIMEOUT);

            test("owner can pause", async () => {
                tokenServiceWAleo.connect(admin);
                expect(await tokenServiceWAleo.status(ethChainTokenInfo)).toBe(TOKEN_UNPAUSED_VALUE);
                const tx = await tokenServiceWAleo.pause_token_ts(ethChainId);
                await tx.wait();
                expect(await tokenServiceWAleo.status(ethChainTokenInfo)).toBe(TOKEN_PAUSED_VALUE);
            }, TIMEOUT);

            test.failing("should not unpause by non-owner", async () => {
                tokenServiceWAleo.connect(aleoUser3);
                const tx = await tokenServiceWAleo.unpause_token_ts(ethChainId);
                expect(await tokenServiceWAleo.status(ethChainTokenInfo)).toBe(TOKEN_PAUSED_VALUE);
                await tx.wait();
            }, TIMEOUT);

            test("owner can unpause", async () => {
                expect(await tokenServiceWAleo.status(ethChainTokenInfo)).toBe(TOKEN_PAUSED_VALUE);
                tokenServiceWAleo.connect(admin);
                const tx = await tokenServiceWAleo.unpause_token_ts(ethChainId);
                await tx.wait();
                expect(await tokenServiceWAleo.status(ethChainTokenInfo)).toBe(TOKEN_UNPAUSED_VALUE);
            },
                TIMEOUT
            );
        });


        describe("Update minimum transfer", () => {
            const newMinTransfer = BigInt(10);
            test.failing("cannot update if minimum transfer greater than maximum transfer", async () => {
                tokenServiceWAleo.connect(admin);
                const maxTransfer = await tokenServiceWAleo.max_transfers(ethChainTokenInfo);
                const tx = await tokenServiceWAleo.update_min_transfer_ts(
                    ethChainId,
                    maxTransfer + BigInt(20)
                );
                await tx.wait();
            }, TIMEOUT);

            test.failing("non-owner cannot update minimum transfer", async () => {
                tokenServiceWAleo.connect(aleoUser4);
                const tx = await tokenServiceWAleo.update_min_transfer_ts(
                    ethChainId,
                    newMinTransfer
                );
                await tx.wait();
            }, TIMEOUT);

            test("owner can update minimum transfer", async () => {
                tokenServiceWAleo.connect(admin);
                const tx = await tokenServiceWAleo.update_min_transfer_ts(
                    ethChainId,
                    newMinTransfer
                );
                await tx.wait();
                expect(await tokenServiceWAleo.min_transfers(ethChainTokenInfo)).toBe(newMinTransfer);
            }, TIMEOUT);

        })

        describe("Update maximum transfer", () => {
            const newMaxTransfer = BigInt(200_000);
            test.failing("non-owner cannot update maximum transfer", async () => {
                tokenServiceWAleo.connect(aleoUser4);
                const tx = await tokenServiceWAleo.update_max_transfer_ts(
                    ethChainId,
                    newMaxTransfer
                );
                await tx.wait();
            }, TIMEOUT);

            test.failing("cannot update if maximum transfer lesser than minimum transfer", async () => {
                tokenServiceWAleo.connect(admin);
                const minTransfer = await tokenServiceWAleo.min_transfers(ethChainTokenInfo);
                const tx = await tokenServiceWAleo.update_max_transfer_ts(
                    ethChainId,
                    minTransfer - BigInt(1)
                );
                await tx.wait();
            }, TIMEOUT);

            test("owner can update maximum transfer", async () => {
                tokenServiceWAleo.connect(admin);
                const tx = await tokenServiceWAleo.update_max_transfer_ts(
                    ethChainId,
                    newMaxTransfer
                );
                await tx.wait();
                expect(await tokenServiceWAleo.max_transfers(ethChainTokenInfo)).toBe(newMaxTransfer);
            }, TIMEOUT);
        })

        describe("Update other chain token address", () => {
            const unknownChainID = BigInt("4430677536441324596");

            test.failing("should not update token address by non-owner", async () => {
                tokenServiceWAleo.connect(aleoUser3);
                const tx = await tokenServiceWAleo.update_other_chain_tokenaddress(
                    ethChainId,
                    evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
                );
                await tx.wait();
            }, TIMEOUT);

            test.failing("should not update token address if chaintokenInfo is not found", async () => {
                tokenServiceWAleo.connect(admin);
                const tx = await tokenServiceWAleo.update_other_chain_tokenaddress(
                    unknownChainID,
                    evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
                );
                await tx.wait();
            }, TIMEOUT)

            test("should update token service contract address by admin", async () => {
                tokenServiceWAleo.connect(admin);
                const tx = await tokenServiceWAleo.update_other_chain_tokenaddress(
                    ethChainId,
                    evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
                );
                await tx.wait();
                expect(await tokenServiceWAleo.other_chain_token_address(ethChainTokenInfo)).toStrictEqual(evm2AleoArr(ethTsRandomContractAddress2))
            }, TIMEOUT)
        });

        describe("Remove other chain token address", () => {
            const unknownChainID = BigInt("4430677536441324596");

            const arbitrumTokenInfo: ChainToken = {
                chain_id: arbitrumChainId,
                token_id: ALEO_CREDITS_TOKEN_ID
            }

            test.failing("should not update token address by non-owner", async () => {
                tokenServiceWAleo.connect(aleoUser3);
                const tx = await tokenServiceWAleo.remove_other_chain_addresses(
                    arbitrumChainId
                );
                await tx.wait();
            }, TIMEOUT);

            test.failing("should not remove token address if chain token info is not already there", async () => {
                tokenServiceWAleo.connect(admin);
                const tx = await tokenServiceWAleo.remove_other_chain_addresses(
                    unknownChainID
                );
                await tx.wait();
            }, TIMEOUT)

            test("should remove token address by admin", async () => {
                const address = await tokenServiceWAleo.other_chain_token_address(arbitrumTokenInfo);
                expect(address).toBeDefined();
                tokenServiceWAleo.connect(admin);
                const tx = await tokenServiceWAleo.remove_other_chain_addresses(
                    arbitrumChainId
                );
                await tx.wait();
            }, TIMEOUT)
        });

        describe("Update other chain token service", () => {
            const unknownChainID = BigInt("4430677536441324596");

            const baseTokenInfo: ChainToken = {
                chain_id: baseChainId,
                token_id: ALEO_CREDITS_TOKEN_ID
            }

            test.failing("should not update token service by non-owner", async () => {
                tokenServiceWAleo.connect(aleoUser3);
                const tx = await tokenServiceWAleo.update_other_chain_tokenservice(
                    baseChainId,
                    evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
                );
                await tx.wait();
            }, TIMEOUT)

            test.failing("should not update token address if chain token is not existing", async () => {
                tokenServiceWAleo.connect(admin);
                const tx = await tokenServiceWAleo.update_other_chain_tokenservice(
                    unknownChainID,
                    evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
                );
                await tx.wait();
            }, TIMEOUT)

            test("should update other chain token service by admin", async () => {
                const currentOwner = await tokenServiceWAleo.owner_TS(OWNER_INDEX);
                //token should exist in respective chain
                const prev_token_services = await tokenServiceWAleo.other_chain_token_service(baseTokenInfo);
                expect(prev_token_services).toBeDefined()
                tokenServiceWAleo.connect(currentOwner);
                const tx = await tokenServiceWAleo.update_other_chain_tokenservice(
                    baseChainId,
                    evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
                );
                await tx.wait();
                expect(await tokenServiceWAleo.other_chain_token_service(baseTokenInfo)).toStrictEqual(evm2AleoArr(ethTsRandomContractAddress2))
            }, TIMEOUT)
        });

        describe("Transfer Ownership", () => {
            test.failing("should not transfer ownership by non-admin", async () => {
                const currentOwner = await tokenServiceWAleo.owner_TS(OWNER_INDEX);
                expect(currentOwner).toBe(admin);
                tokenServiceWAleo.connect(aleoUser2);
                const transferOwnershipTx = await tokenServiceWAleo.transfer_ownership_ts(aleoUser3);
                await transferOwnershipTx.wait();
            },
                TIMEOUT
            );

            test("Current owner can transfer ownership", async () => {
                const currentOwner = await tokenServiceWAleo.owner_TS(OWNER_INDEX);
                tokenServiceWAleo.connect(currentOwner);
                const transferOwnershipTx = await tokenServiceWAleo.transfer_ownership_ts(aleoUser3);
                await transferOwnershipTx.wait();

                const newOwner = await tokenServiceWAleo.owner_TS(OWNER_INDEX);
                expect(newOwner).toBe(aleoUser3);
            },
                TIMEOUT
            );
        });
    })
})
