import { Vlink_token_bridge_v2Contract } from "../artifacts/js/vlink_token_bridge_v2";
import { InPacket, PacketId } from "../artifacts/js/types/vlink_token_bridge_v2";
import { Vlink_token_service_v2Contract } from "../artifacts/js/vlink_token_service_v2";
import { Token_registryContract } from "../artifacts/js/token_registry";

import { evm2AleoArr, evm2AleoArrWithoutPadding, generateRandomEthAddr, prunePadding } from "../utils/ethAddress";
import { signPacket } from "../utils/sign";

import {
    ALEO_ZERO_ADDRESS,
    BRIDGE_PAUSABILITY_INDEX,
    BRIDGE_UNPAUSED_VALUE,
    VERSION_PUBLIC_NORELAYER_NOPREDICATE,
    VERSION_PRIVATE_NORELAYER_NOPREDICATE,
    aleoChainId,
    arbitrumChainId,
    arbitrumTsContractAddr,
    baseChainId,
    baseTsContractAddr,
    ethChainId,
    ethTsContractAddr,
    ethTsRandomContractAddress,
    ethUsdcContractAddr,
    VERSION_PUBLIC_RELAYER_NOPREDICATE,
    VERSION_PRIVATE_RELAYER_NOPREDICATE,
    BRIDGE_TOTAL_ATTESTORS_INDEX,
    BRIDGE_THRESHOLD_INDEX,
    OWNER_INDEX,
    BRIDGE_PAUSED_VALUE,
} from "../utils/testdata.data";
import { PrivateKey } from "@aleohq/sdk";
import { createRandomPacket } from "../utils/packet";
import { Image, WithdrawalLimit } from "../artifacts/js/types/vlink_token_service_v2";
import { ExecutionMode } from "@doko-js/core";
import { ChainToken } from "../artifacts/js/types/vlink_token_service_council_v2";
import { Balance, TokenOwner } from "../artifacts/js/types/token_registry";
import { hashStruct, hashStructToAddress } from "../utils/hash";
import { decryptToken } from "../artifacts/js/leo2js/token_registry";
import { Vlink_council_v2Contract } from "../artifacts/js/vlink_council_v2";
import { getSignerPackets } from "../utils/getRecords";
import { Transition } from "@doko-js/core/dist/outputs/types/transaction";
import { Vlink_holding_v2Contract } from "../artifacts/js/vlink_holding_v2";
import { log } from "console";
import { Holder } from "../artifacts/js/types/vlink_holding_v2";
import { ethTsRandomContractAddress2, TOKEN_PAUSED_VALUE, TOKEN_UNPAUSED_VALUE } from "../utils/constants";

const usdcContractAddr = ethUsdcContractAddr;
const mode = ExecutionMode.SnarkExecute;
// npm run test -- --runInBand ./test/2_2tokenService_core.test.ts

const bridge = new Vlink_token_bridge_v2Contract({ mode: mode });
const tokenService = new Vlink_token_service_v2Contract({ mode: mode });
const mtsp = new Token_registryContract({ mode: mode });
const council = new Vlink_council_v2Contract({ mode: mode });
const holding = new Vlink_holding_v2Contract({ mode: mode });

let tokenID;
(BigInt.prototype as any).toJSON = function () {
    return this.toString() + "field";
};
const TIMEOUT = 20000_000;
const ethUser = generateRandomEthAddr();

const sleepTimer = ms => new Promise(resolve => setTimeout(resolve, ms));

const getPlatformFeeInAmount = async (amount: bigint, platform_fee_percentage: number) => {
    //5% is equivalent to 500
    return (BigInt(platform_fee_percentage) * amount) / BigInt(100 * 1000);
}

describe("Token Service Core", () => {
    const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = bridge.getAccounts();
    const aleoUser5 = new PrivateKey().to_address().to_string();
    const token_name = BigInt('614833282165187462067')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
    const token_symbol = BigInt("143715203238") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
    const token_decimals = 6
    const token_max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615
    tokenID = hashStruct(token_name);
    const public_platform_fee = 5000;
    const private_platform_fee = 10000;
    const public_relayer_fee = BigInt(10000);
    const private_relayer_fee = BigInt(20000);
    const ALEO_SEQ_NUM = BigInt(1);
    const ETH_SEQ_NUM = BigInt(1);
    console.log(tokenID);
    const privateKey1 = process.env.ALEO_DEVNET_PRIVATE_KEY1;
    const privateKey2 = process.env.ALEO_DEVNET_PRIVATE_KEY2;
    const active_relayer = true;
    const non_active_relayer = false;


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
            const tx = await bridge.initialize_tb(
                [aleoUser1, aleoUser2, ALEO_ZERO_ADDRESS, aleoUser4, ALEO_ZERO_ADDRESS],
                threshold,
                admin,
                ALEO_SEQ_NUM,
                ETH_SEQ_NUM,
            );
            await tx.wait();
        }, TIMEOUT);

        test("Bridge: Add ethereum Chain", async () => {
            const addEthChainTx = await bridge.add_chain_tb(ethChainId);
            await addEthChainTx.wait();
        }, TIMEOUT)

        test("Bridge: Add base Chain", async () => {
            const addBaseChainTx = await bridge.add_chain_tb(baseChainId);
            await addBaseChainTx.wait();
        }, TIMEOUT)

        test("Bridge: Add Service", async () => {
            const supportServiceTx = await bridge.add_service_tb(tokenService.address());
            await supportServiceTx.wait();
        }, TIMEOUT)

        test("Bridge: Unpause", async () => {
            const unpauseTx = await bridge.unpause_tb();
            await unpauseTx.wait();
        }, TIMEOUT)

        test("Holding: Initialize", async () => {
            const tx = await holding.initialize_holding(tokenService.address());
            await tx.wait();
        }, TIMEOUT)

        test("Token Service: Initialize", async () => {
            const tx = await tokenService.initialize_ts(admin);
            await tx.wait();
        }, TIMEOUT);

        test("Token Service: Register token in Token registry", async () => {
            console.log("registered tokenID ", tokenID)
            const tx = await mtsp.register_token(tokenID, token_name, token_symbol, token_decimals, token_max_supply, false, tokenService.address());
            await tx.wait();
        }, TIMEOUT);

        test("Token Service: Set role for MINTER and BURNER", async () => {
            await sleepTimer(5000);
            const setSupplyManagerRoleTx = await mtsp.set_role(tokenID, tokenService.address(), 3);
            await setSupplyManagerRoleTx.wait();
        }, TIMEOUT);

        test("Token Service: Add Token", async () => {
            const limit: WithdrawalLimit = {
                percentage: 100_00, // 100%
                duration: 1, // per block
                threshold_no_limit: BigInt(100)
            };
            const minimumTransfer = BigInt(100);
            const maximumTransfer = BigInt(100000_000_000);
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
            await sleepTimer(5000);
        }, TIMEOUT)

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
        }, TIMEOUT);

        test("Token Service: Unpause Token", async () => {
            const unpauseTx = await tokenService.unpause_token_ts(tokenID);
            await unpauseTx.wait();
        }, TIMEOUT)
    })


    describe("Token Receive", () => {
        const createPacket = (
            receiver: string,
            amount: bigint,
            aleoTsAddr: string,
            sourcecChainId: bigint,
            tsContractAddress: string,
            version = VERSION_PUBLIC_NORELAYER_NOPREDICATE,

        ): InPacket => {
            return createRandomPacket(
                receiver,
                amount,
                sourcecChainId,
                aleoChainId,
                tsContractAddress,
                aleoTsAddr,
                tokenID,
                version,
                ethUser,
            );
        };

        describe("Token Receive Public", () => {
            test.failing("version should be less then 10 for public receive", async () => {
                const receiveAmount: bigint = BigInt(100_000_000)
                const packet = createPacket(aleoUser1, receiveAmount, tokenService.address(), ethChainId, ethTsContractAddr, VERSION_PRIVATE_NORELAYER_NOPREDICATE);

                tokenService.connect(admin);
                const signature = signPacket(packet, true, tokenService.config.privateKey);
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

                let packetId: PacketId = {
                    chain_id: packet.source.chain_id,
                    sequence: packet.sequence
                }

                //check bridge pausability status
                expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
                expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);

                tokenService.connect(aleoUser1);
                const tx = await tokenService.token_receive_public(
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
                    public_relayer_fee,
                    packet.version
                );
                await tx.wait();
            })

            test.failing("should fail if amount is less than relayer fee", async () => {
                const receiveAmount: bigint = BigInt(10)
                const packet = createPacket(aleoUser1, receiveAmount, tokenService.address(), ethChainId, ethTsContractAddr, VERSION_PRIVATE_NORELAYER_NOPREDICATE);

                tokenService.connect(admin);
                const signature = signPacket(packet, true, tokenService.config.privateKey);
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

                let packetId: PacketId = {
                    chain_id: packet.source.chain_id,
                    sequence: packet.sequence
                }

                //check bridge pausability status
                expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
                expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);

                tokenService.connect(aleoUser1);
                const tx = await tokenService.token_receive_public(
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
                    public_relayer_fee,
                    packet.version
                );
                await tx.wait();
            })

            test.failing("zero addresss should not be able to receive token", async () => {
                const receiveAmount: bigint = BigInt(100_000_000)
                const packet = createPacket(ALEO_ZERO_ADDRESS, receiveAmount, tokenService.address(), ethChainId, ethTsContractAddr);

                tokenService.connect(admin);
                const signature = signPacket(packet, true, tokenService.config.privateKey);
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

                let packetId: PacketId = {
                    chain_id: packet.source.chain_id,
                    sequence: packet.sequence
                }

                //check bridge pausability status
                expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
                expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);

                tokenService.connect(aleoUser1);
                const tx = await tokenService.token_receive_public(
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
                    public_relayer_fee,
                    packet.version
                );
                await tx.wait();
            })

            test("should failed if tokeninfo not included in other_chain_token_service mapping", async () => {
                const receiveAmount: bigint = BigInt(100_000_000)
                const packet = createPacket(aleoUser1, receiveAmount, tokenService.address(), BigInt("285563657430695784"), ethTsRandomContractAddress);

                tokenService.connect(admin);
                const signature = signPacket(packet, true, tokenService.config.privateKey);
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

                let packetId: PacketId = {
                    chain_id: packet.source.chain_id,
                    sequence: packet.sequence
                }

                //check bridge pausability status
                expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
                expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);

                tokenService.connect(aleoUser1);
                const tx = await tokenService.token_receive_public(
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
                    public_relayer_fee,
                    packet.version
                );
                await expect(tx.wait()).rejects.toThrow();
            }, TIMEOUT)

            test.failing("Should fail the transaction if stored token service address is not same as the one in mapping", async () => {
                const receiveAmount: bigint = BigInt(100_000_000)
                const packet = createPacket(aleoUser1, receiveAmount, tokenService.address(), BigInt("285563657430695784"), ethTsRandomContractAddress);

                tokenService.connect(admin);
                const signature = signPacket(packet, true, tokenService.config.privateKey);
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

                let packetId: PacketId = {
                    chain_id: packet.source.chain_id,
                    sequence: packet.sequence
                }

                //check bridge pausability status
                expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
                expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);

                tokenService.connect(aleoUser1);
                const tx = await tokenService.token_receive_public(
                    prunePadding(packet.message.sender_address),
                    packet.message.dest_token_id,
                    packet.message.receiver_address,
                    packet.message.amount,
                    packet.sequence,
                    packet.height,
                    signers,
                    signatures,
                    packet.source.chain_id,
                    prunePadding(evm2AleoArr(ethTsRandomContractAddress2)),
                    public_relayer_fee,
                    packet.version
                );
                await expect(tx.wait()).rejects.toThrow();
            }, TIMEOUT)

            test("should fail if user send fee and fee set in mapping are different", async () => {
                const receiveAmount: bigint = BigInt(100_000_000)
                const packet = createPacket(aleoUser1, receiveAmount, tokenService.address(), ethChainId, ethTsContractAddr);

                tokenService.connect(admin);
                const signature = signPacket(packet, true, tokenService.config.privateKey);
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

                let packetId: PacketId = {
                    chain_id: packet.source.chain_id,
                    sequence: packet.sequence
                }

                //check bridge pausability status
                expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
                expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);

                tokenService.connect(aleoUser1);
                const tx = await tokenService.token_receive_public(
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
                    BigInt(50000), //fee diferent here
                    packet.version
                );
                tx.wait().then(() => {
                    throw new Error("Expected failure, but got success");
                }).catch((err) => {
                    expect(err.message).toMatch(/transitions|execution|undefined/);
                });
                await sleepTimer(5000);
            }, TIMEOUT)

            test(" All Fund should go back to the holding account if screening fails", async () => {
                const receiveAmount: bigint = BigInt(100_000_000)
                const packet = createPacket(aleoUser1, receiveAmount, tokenService.address(), ethChainId, ethTsContractAddr, VERSION_PUBLIC_RELAYER_NOPREDICATE);
                const initialHoldingBalanceInRegistery = await getUserAuthorizedBalance(holding.address(), tokenID);
                tokenService.connect(admin);
                const signature = signPacket(packet, false, tokenService.config.privateKey);
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

                let packetId: PacketId = {
                    chain_id: packet.source.chain_id,
                    sequence: packet.sequence
                }

                //check bridge pausability status
                expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
                expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);

                const holder: Holder = {
                    account: aleoUser1,
                    token_id: tokenID
                }
                const initialHoldingBalance = await holding.holdings(holder, BigInt(0));
                const relayer_initial_balance = await getUserAuthorizedBalance(aleoUser2, tokenID);

                tokenService.connect(aleoUser2);
                const tx = await tokenService.token_receive_public(
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
                    public_relayer_fee,
                    packet.version
                );
                const [screeningPassed] = await tx.wait();
                expect(screeningPassed).toBe(false);

                // check holding balance
                const finalHoldingBalance = await holding.holdings(holder, BigInt(0))
                const relayer_final_balance = await getUserAuthorizedBalance(aleoUser2, tokenID);
                expect(relayer_final_balance.balance).toEqual(relayer_initial_balance.balance);
                const finalHoldingBalanceInRegistery = await getUserAuthorizedBalance(holding.address(), tokenID);
                expect(finalHoldingBalance).toBe(initialHoldingBalance + receiveAmount);
                expect(finalHoldingBalanceInRegistery.balance).toBe(initialHoldingBalanceInRegistery.balance + receiveAmount);
            }, TIMEOUT)

            test("Happy receive token(ethereum chain) public with no relayer", async () => {
                await sleepTimer(5000);
                const receiveAmount: bigint = BigInt(100_000_000)
                const packet = createPacket(aleoUser1, receiveAmount, tokenService.address(), ethChainId, ethTsContractAddr);
                console.log(packet);

                tokenService.connect(admin);
                const token_status = await tokenService.token_status(tokenID);
                console.log("token status", token_status);
                expect(token_status).toBe(false); //SHOULD UNPAUSE TOKEN
                const signature = signPacket(packet, true, tokenService.config.privateKey);
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

                let packetId: PacketId = {
                    chain_id: packet.source.chain_id,
                    sequence: packet.sequence
                }

                const TokenInfo: ChainToken = {
                    chain_id: ethChainId,
                    token_id: tokenID
                }

                //check bridge pausability status
                expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
                const totalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);
                const threshold = await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX);
                const other_chain_token_service = await tokenService.other_chain_token_service(TokenInfo)
                expect(other_chain_token_service).not.toBeNull()
                expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);
                // check relayer balance
                const relayer_initial_balance = await getUserAuthorizedBalance(aleoUser2, packet.message.dest_token_id);
                const user_initial_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);

                const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
                tokenService.connect(aleoUser1);
                const tx = await tokenService.token_receive_public(
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
                    public_relayer_fee,
                    packet.version
                );
                const [screeningPassed] = await tx.wait();

                const finalTokenSupply = await tokenService.total_supply(tokenID);
                expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
                expect(screeningPassed).toBe(true);


                // if version is 1 or 3 ,relayer off. relayer balance should not increased default packet with no relayer
                const minimumTransfer = await tokenService.min_transfers(tokenID);
                const relayer_final_balance = await getUserAuthorizedBalance(aleoUser2, packet.message.dest_token_id);
                const user_final_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);
                const expected_user_balance: bigint = user_initial_balance.balance + packet.message.amount;
                expect(relayer_final_balance.balance).toEqual(relayer_initial_balance.balance);
                expect(user_final_balance.balance).toEqual(expected_user_balance);
                expect(receiveAmount).toBeGreaterThanOrEqual(minimumTransfer);
                expect(await tokenService.token_status(tokenID)).toBe(false)
                await sleepTimer(5000);
            },
                TIMEOUT
            );

            test("Happy receive token(ethereum chain) public with active relayer", async () => {
                const packet = createPacket(aleoUser1, BigInt(100_000_000), tokenService.address(), ethChainId, ethTsContractAddr, VERSION_PUBLIC_RELAYER_NOPREDICATE);
                const signature = signPacket(packet, true, tokenService.config.privateKey);
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

                // check relayer balance
                const relayer_initial_balance = await getUserAuthorizedBalance(aleoUser2, packet.message.dest_token_id);
                const user_initial_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);

                const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
                tokenService.connect(aleoUser2);
                const token_status = await tokenService.token_status(tokenID);
                expect(token_status).toBe(false); //SHOULD UNPAUSE TOKEN
                const tx = await tokenService.token_receive_public(
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
                    public_relayer_fee,
                    packet.version
                );
                const [screeningPassed] = await tx.wait();
                console.log(screeningPassed);

                const finalTokenSupply = await tokenService.total_supply(tokenID);
                expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
                expect(screeningPassed).toBe(true);


                // if version is 2 or 4 ,relayer on. relayer balance should increased
                const relayer_final_balance = await getUserAuthorizedBalance(aleoUser2, packet.message.dest_token_id);
                const user_final_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);

                const expected_user_balance: bigint = user_initial_balance.balance + packet.message.amount;
                expect(relayer_final_balance.balance).toEqual(relayer_initial_balance.balance + public_relayer_fee);
                expect(user_final_balance.balance).toEqual(expected_user_balance - public_relayer_fee);

            },
                TIMEOUT
            );

            test("Happy receive token(base chain) public with no active relayer", async () => {
                const BaseSequence = BigInt(1);
                const createPacketBase = (
                    receiver: string,
                    amount: bigint,
                    aleoTsAddr: string,
                    sourcecChainId: bigint,
                    tsContractAddress: string,
                    version = VERSION_PUBLIC_NORELAYER_NOPREDICATE
                ): InPacket => {
                    return createRandomPacket(
                        receiver,
                        amount,
                        sourcecChainId,
                        aleoChainId,
                        tsContractAddress,
                        aleoTsAddr,
                        tokenID,
                        version,
                        ethUser,
                        BaseSequence
                    );
                };
                const receiveAmount: bigint = BigInt(90_000_000)
                const packet = createPacketBase(aleoUser1, receiveAmount, tokenService.address(), baseChainId, baseTsContractAddr);
                tokenService.connect(admin);
                const signature = signPacket(packet, true, tokenService.config.privateKey);
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
                const user_initial_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);

                const tx = await tokenService.token_receive_public(
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
                    public_relayer_fee,
                    packet.version
                );
                const [screeningPassed] = await tx.wait();
                const user_final_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);

                const finalTokenSupply = await tokenService.total_supply(tokenID);
                expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
                expect(screeningPassed).toBe(true);
                const expected_user_balance: bigint = user_initial_balance.balance + BigInt(90_000_000);
                const is_relayer_off: boolean = packet.version === 1 || packet.version === 3;

                if (is_relayer_off) {
                    expect(user_final_balance.balance).toEqual(expected_user_balance);
                } else {
                    expect(user_final_balance.balance).toEqual(expected_user_balance - public_relayer_fee);
                }
            },
                TIMEOUT
            );

            test("Happy receive token(base chain) public with active relayer", async () => {
                const BaseSequence = BigInt(2);
                const createPacketBase = (
                    receiver: string,
                    amount: bigint,
                    aleoTsAddr: string,
                    sourcecChainId: bigint,
                    tsContractAddress: string,
                    version = VERSION_PUBLIC_NORELAYER_NOPREDICATE
                ): InPacket => {
                    return createRandomPacket(
                        receiver,
                        amount,
                        sourcecChainId,
                        aleoChainId,
                        tsContractAddress,
                        aleoTsAddr,
                        tokenID,
                        version,
                        ethUser,
                        BaseSequence
                    );
                };
                const packet = createPacketBase(aleoUser1, BigInt(80_000_000), tokenService.address(), baseChainId, baseTsContractAddr, VERSION_PUBLIC_RELAYER_NOPREDICATE);
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
                const user_initial_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);
                tokenService.connect(aleoUser2);
                const tx = await tokenService.token_receive_public(
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
                    public_relayer_fee,
                    packet.version
                );
                const [screeningPassed] = await tx.wait();
                const user_final_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);
                const finalTokenSupply = await tokenService.total_supply(tokenID);
                expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
                expect(screeningPassed).toBe(true);
                const expected_user_balance: bigint = user_initial_balance.balance + BigInt(80_000_000);
                const is_relayer_off: boolean = packet.version === 1 || packet.version === 3;

                if (is_relayer_off) {
                    expect(user_final_balance.balance).toEqual(expected_user_balance);
                } else {
                    expect(user_final_balance.balance).toEqual(expected_user_balance - public_relayer_fee);
                }
            },
                TIMEOUT
            );

        })

        describe("Token Receive Private", () => {
            test.failing("version should be greater then 10 for private receive", async () => {
                const pre_image = BigInt(123);
                const image: Image = {
                    pre_image,
                    receiver: aleoUser1
                }
                const hashed_address = hashStructToAddress(image);
                const packet = createPacket(hashed_address, BigInt(100_000_000), tokenService.address(), ethChainId, ethTsContractAddr, VERSION_PUBLIC_NORELAYER_NOPREDICATE);
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

                const tx = await tokenService.token_receive_private(
                    prunePadding(packet.message.sender_address),
                    packet.message.dest_token_id,
                    packet.message.amount,
                    packet.sequence,
                    packet.height,
                    signers,
                    signatures,
                    packet.source.chain_id,
                    prunePadding(packet.source.addr),
                    pre_image,
                    aleoUser1,
                    packet.version,
                    private_relayer_fee
                );
                await tx.wait();
            })

            test.failing("should fail if amount is less than relayer fee", async () => {
                const pre_image = BigInt(123);
                const image: Image = {
                    pre_image,
                    receiver: aleoUser1
                }
                const hashed_address = hashStructToAddress(image);
                const packet = createPacket(hashed_address, BigInt(10), tokenService.address(), ethChainId, ethTsContractAddr, VERSION_PRIVATE_NORELAYER_NOPREDICATE);
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

                const tx = await tokenService.token_receive_private(
                    prunePadding(packet.message.sender_address),
                    packet.message.dest_token_id,
                    packet.message.amount,
                    packet.sequence,
                    packet.height,
                    signers,
                    signatures,
                    packet.source.chain_id,
                    prunePadding(packet.source.addr),
                    pre_image,
                    aleoUser1,
                    packet.version,
                    private_relayer_fee
                );
                await tx.wait();
            })

            test("should fail if user send fee and fee set in mapping are different", async () => {
                const pre_image = BigInt(123);
                const image: Image = {
                    pre_image,
                    receiver: aleoUser1
                }
                const hashed_address = hashStructToAddress(image);
                const packet = createPacket(hashed_address, BigInt(100_000_000), tokenService.address(), ethChainId, ethTsContractAddr, VERSION_PRIVATE_NORELAYER_NOPREDICATE);
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

                const tx = await tokenService.token_receive_private(
                    prunePadding(packet.message.sender_address),
                    packet.message.dest_token_id,
                    packet.message.amount,
                    packet.sequence,
                    packet.height,
                    signers,
                    signatures,
                    packet.source.chain_id,
                    prunePadding(packet.source.addr),
                    pre_image,
                    aleoUser1,
                    packet.version,
                    BigInt(3000) //Fee different
                );
                tx.wait().then(() => {
                    throw new Error("Expected failure, but got success");
                }).catch((err) => {
                    expect(err.message).toMatch(/transitions|execution|undefined/);
                });
            }, TIMEOUT)

            test("If screening failed, All Funds minted in holding account publicly ", async () => {
                const receiveAmount: bigint = BigInt(1000_000)
                const initialHoldingBalanceInRegistery = await getUserAuthorizedBalance(holding.address(), tokenID);
                const pre_image = BigInt(123);
                const image: Image = {
                    pre_image,
                    receiver: aleoUser1
                }
                const hashed_address = hashStructToAddress(image);
                const packet = createPacket(hashed_address, receiveAmount, tokenService.address(), ethChainId, ethTsContractAddr, VERSION_PRIVATE_RELAYER_NOPREDICATE);
                tokenService.connect(admin);
                const signature = signPacket(packet, false, tokenService.config.privateKey);
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

                let packetId: PacketId = {
                    chain_id: packet.source.chain_id,
                    sequence: packet.sequence
                }

                //check bridge pausability status
                expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
                expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);

                const holder: Holder = {
                    account: hashed_address,
                    token_id: tokenID
                }
                const initialHoldingBalance = await holding.holdings(holder, BigInt(0));
                const relayer_initial_balance = await getUserAuthorizedBalance(aleoUser2, tokenID);

                tokenService.connect(aleoUser2);
                const tx = await tokenService.token_receive_private(
                    prunePadding(packet.message.sender_address),
                    packet.message.dest_token_id,
                    packet.message.amount,
                    packet.sequence,
                    packet.height,
                    signers,
                    signatures,
                    packet.source.chain_id,
                    prunePadding(packet.source.addr),
                    pre_image,
                    aleoUser1,
                    packet.version,
                    private_relayer_fee
                );
                const [screeningPassed] = await tx.wait();
                expect(screeningPassed).toBe(false);

                // check holding balance
                const finalHoldingBalanceInRegistery = await getUserAuthorizedBalance(holding.address(), tokenID);
                const finalHoldingBalance = await holding.holdings(holder, BigInt(0))
                const relayer_final_balance = await getUserAuthorizedBalance(aleoUser2, tokenID);
                expect(relayer_final_balance.balance).toEqual(relayer_initial_balance.balance);
                expect(finalHoldingBalance).toBe(initialHoldingBalance + receiveAmount);
                expect(finalHoldingBalanceInRegistery.balance).toBe(initialHoldingBalanceInRegistery.balance + receiveAmount);
            }, TIMEOUT)

            test("Happy receive token(ethereum chain) private with no relayer", async () => {
                const pre_image = BigInt(123);
                const image: Image = {
                    pre_image,
                    receiver: aleoUser1
                }
                const hashed_address = hashStructToAddress(image);
                const packet = createPacket(hashed_address, BigInt(100_000_000), tokenService.address(), ethChainId, ethTsContractAddr, VERSION_PRIVATE_NORELAYER_NOPREDICATE);
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
                const tx = await tokenService.token_receive_private(
                    prunePadding(packet.message.sender_address),
                    packet.message.dest_token_id,
                    packet.message.amount,
                    packet.sequence,
                    packet.height,
                    signers,
                    signatures,
                    packet.source.chain_id,
                    prunePadding(packet.source.addr),
                    pre_image,
                    aleoUser1,
                    packet.version,
                    private_relayer_fee
                );

                const [screeningPassed, txnRecord] = await tx.wait();
                const txn = await tx.getTransaction()
                const transitionsList: Transition[] = txn.execution.transitions;
                const total_receieve_amount = await getSignerPackets(transitionsList, privateKey1)
                console.log(total_receieve_amount);
                //seperate mint in receiver (1 for relayer and 1 for receiver) in this case both record have same owner with with different amount
                const finalTokenSupply = await tokenService.total_supply(tokenID);
                expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
                expect(screeningPassed).toBe(true);
                expect(total_receieve_amount).toEqual(BigInt(100_000_000));
            },
                TIMEOUT
            );

            test("Happy receive token(ethereum chain) private with active relayer", async () => {
                const pre_image = BigInt(123);
                const image: Image = {
                    pre_image,
                    receiver: aleoUser1
                }
                const hashed_address = hashStructToAddress(image);
                const send_amount = BigInt(100_000_000);
                const packet = createPacket(hashed_address, send_amount, tokenService.address(), ethChainId, ethTsContractAddr, VERSION_PRIVATE_RELAYER_NOPREDICATE);
                // tokenService.connect(admin);
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
                tokenService.connect(aleoUser2);
                const tx = await tokenService.token_receive_private(
                    prunePadding(packet.message.sender_address),
                    packet.message.dest_token_id,
                    packet.message.amount,
                    packet.sequence,
                    packet.height,
                    signers,
                    signatures,
                    packet.source.chain_id,
                    prunePadding(packet.source.addr),
                    pre_image,
                    aleoUser1,
                    packet.version,
                    private_relayer_fee
                );
                const [screeningPassed] = await tx.wait();
                const txn = await tx.getTransaction()
                const transitionsList: Transition[] = txn.execution.transitions;
                const fetchReceiverTokenAmount = await getSignerPackets(transitionsList, privateKey1)
                const fetchRelayerTokenAmount = await getSignerPackets(transitionsList, privateKey2)

                const finalTokenSupply = await tokenService.total_supply(tokenID);
                expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
                expect(screeningPassed).toBe(true);
                const expected_receiver_balance: bigint = send_amount - private_relayer_fee;;
                expect(expected_receiver_balance).toEqual(fetchReceiverTokenAmount);
                expect(fetchRelayerTokenAmount).toEqual(private_relayer_fee)
            },
                TIMEOUT
            );

            test("Happy receive token(base chain) private with no relayer", async () => {
                const pre_image = BigInt(123);
                const image: Image = {
                    pre_image,
                    receiver: aleoUser1
                }
                const hashed_address = hashStructToAddress(image);
                const packet = createPacket(hashed_address, BigInt(100_000_000), tokenService.address(), baseChainId, baseTsContractAddr, VERSION_PRIVATE_NORELAYER_NOPREDICATE);
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
                const tx = await tokenService.token_receive_private(
                    prunePadding(packet.message.sender_address),
                    packet.message.dest_token_id,
                    packet.message.amount,
                    packet.sequence,
                    packet.height,
                    signers,
                    signatures,
                    packet.source.chain_id,
                    prunePadding(packet.source.addr),
                    pre_image,
                    aleoUser1,
                    packet.version,
                    private_relayer_fee
                );

                const [screeningPassed, txnRecord] = await tx.wait();
                const txn = await tx.getTransaction()
                const transitionsList: Transition[] = txn.execution.transitions;
                const total_receieve_amount = await getSignerPackets(transitionsList, privateKey1)
                console.log(total_receieve_amount);
                //seperate mint in receiver (1 for relayer and 1 for receiver) in this case both record have same owner with with different amount
                const finalTokenSupply = await tokenService.total_supply(tokenID);
                expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
                expect(screeningPassed).toBe(true);
                expect(total_receieve_amount).toEqual(BigInt(100_000_000));
            },
                TIMEOUT
            );

            test("Happy receive token(base chain) private with active relayer", async () => {
                const pre_image = BigInt(123);
                const image: Image = {
                    pre_image,
                    receiver: aleoUser1
                }
                const hashed_address = hashStructToAddress(image);
                const send_amount = BigInt(100_000_000);
                const packet = createPacket(hashed_address, send_amount, tokenService.address(), baseChainId, baseTsContractAddr, VERSION_PRIVATE_RELAYER_NOPREDICATE);
                // tokenService.connect(admin);
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
                tokenService.connect(aleoUser2);
                const tx = await tokenService.token_receive_private(
                    prunePadding(packet.message.sender_address),
                    packet.message.dest_token_id,
                    packet.message.amount,
                    packet.sequence,
                    packet.height,
                    signers,
                    signatures,
                    packet.source.chain_id,
                    prunePadding(packet.source.addr),
                    pre_image,
                    aleoUser1,
                    packet.version,
                    private_relayer_fee
                );
                const [screeningPassed] = await tx.wait();
                const txn = await tx.getTransaction()
                const transitionsList: Transition[] = txn.execution.transitions;
                const fetchReceiverTokenAmount = await getSignerPackets(transitionsList, privateKey1)
                const fetchRelayerTokenAmount = await getSignerPackets(transitionsList, privateKey2)

                const finalTokenSupply = await tokenService.total_supply(tokenID);
                expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
                expect(screeningPassed).toBe(true);
                const expected_receiver_balance: bigint = send_amount - private_relayer_fee;;
                expect(expected_receiver_balance).toEqual(fetchReceiverTokenAmount);
                expect(fetchRelayerTokenAmount).toEqual(private_relayer_fee)
            },
                TIMEOUT
            );

        })

        test.failing("Wrong token service cannot receive the token, transaction is expected to fail", async () => {
            const packet = createPacket(aleoUser1, BigInt(100_000_000), tokenService.address(), ethChainId, ethTsContractAddr);
            tokenService.connect(admin);
            const signature = signPacket(packet, true, tokenService.config.privateKey);
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
            const tx = await tokenService.token_receive_public(
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
                public_relayer_fee,
                packet.version
            );
            await expect(tx.wait()).rejects.toThrow()
        },
            TIMEOUT
        );
    });


    describe("Token Send", () => {
        const destChainId = ethChainId;
        const destTsAddr = ethTsContractAddr.toLowerCase();
        const destTsAddr2 = ethTsRandomContractAddress.toLowerCase();

        const destToken = usdcContractAddr.toLowerCase();
        const sender = aleoUser5
        const receiver = ethUser.toLowerCase()
        const amount = BigInt(100000);

        let minAmount: bigint;
        let maxAmount: bigint;

        test("Get minimum and maximum amount", async () => {
            minAmount = await tokenService.min_transfers(tokenID, BigInt(0));
            maxAmount = await tokenService.max_transfers(tokenID, BigInt(0));
        }, TIMEOUT)

        test("Wrong connector for the token cannot send token",
            async () => {
                tokenService.connect(admin);
                const platformFee = await getPlatformFeeInAmount(amount, public_platform_fee);
                const tx = await tokenService.token_send_public(
                    tokenID,
                    evm2AleoArrWithoutPadding(receiver),
                    amount,
                    destChainId,
                    evm2AleoArrWithoutPadding(destTsAddr2),
                    evm2AleoArrWithoutPadding(destToken),
                    platformFee,
                    non_active_relayer
                );
                await expect(tx.wait()).rejects.toThrow()
            },
            TIMEOUT
        );

        test("Transferred amount must be greater than or equal to min amount",
            async () => {
                const amount = BigInt(99);
                expect(amount).toBeLessThan(minAmount);
                tokenService.connect(connector);
                const platformFee = await getPlatformFeeInAmount(amount, public_platform_fee);
                const tx = await tokenService.token_send_public(
                    tokenID,
                    evm2AleoArrWithoutPadding(receiver),
                    amount,
                    destChainId,
                    evm2AleoArrWithoutPadding(destTsAddr),
                    evm2AleoArrWithoutPadding(destToken),
                    platformFee,
                    non_active_relayer
                );
                await expect(tx.wait()).rejects.toThrow()
            },
            TIMEOUT
        );

        test("Transferred amount must be less than or equal to max amount",
            async () => {
                const amount = BigInt(100_000);
                expect(amount).toBeLessThanOrEqual(maxAmount);
                tokenService.connect(connector);
                const platformFee = await getPlatformFeeInAmount(amount, public_platform_fee);
                const tx = await tokenService.token_send_public(
                    tokenID,
                    evm2AleoArrWithoutPadding(receiver),
                    amount,
                    destChainId,
                    evm2AleoArrWithoutPadding(destTsAddr),
                    evm2AleoArrWithoutPadding(destToken),
                    platformFee,
                    non_active_relayer
                );
                await expect(tx.wait()).rejects.toThrow()
            },
            TIMEOUT
        );

        describe("Token Send Public", () => {
            test("Cannot send if user has insufficient fund", async () => {
                const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));

                expect(await tokenService.min_transfers(tokenID)).toBeLessThanOrEqual(amount)
                expect(await tokenService.max_transfers(tokenID)).toBeGreaterThanOrEqual(amount)
                expect(await tokenService.total_supply(tokenID)).toBeGreaterThanOrEqual(amount)
                tokenService.connect(admin);
                mtsp.connect(admin);
                const balance: Balance = await getUserAuthorizedBalance(admin, tokenID)

                //council contract hold the platform fee[after send platform fee need to be deposited in council]
                const council_initial_balance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);

                const platformFee = await getPlatformFeeInAmount(amount, public_platform_fee);
                if (balance.balance > amount && initialTokenSupply > amount) {
                    console.log("check passedd");

                    const tx = await tokenService.token_send_public(
                        tokenID,
                        evm2AleoArrWithoutPadding(receiver),
                        balance.balance + BigInt(10000000000000),
                        destChainId,
                        evm2AleoArrWithoutPadding(destTsAddr),
                        evm2AleoArrWithoutPadding(destToken),
                        platformFee,
                        non_active_relayer
                    );
                    expect(tx.wait()).rejects.toThrow();
                }
            }, TIMEOUT);

            test("Should failed if platform fee is mismatched", async () => {
                const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
                expect(await tokenService.min_transfers(tokenID)).toBeLessThanOrEqual(amount)
                expect(await tokenService.max_transfers(tokenID)).toBeGreaterThanOrEqual(amount)
                expect(await tokenService.total_supply(tokenID)).toBeGreaterThanOrEqual(amount)
                tokenService.connect(admin);
                mtsp.connect(admin);
                const balance: Balance = await getUserAuthorizedBalance(admin, tokenID)

                //council contract hold the platform fee[after send platform fee need to be deposited in council]
                const council_initial_balance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);

                const platformFee = await getPlatformFeeInAmount(amount, public_platform_fee);
                if (balance.balance > amount && initialTokenSupply > amount) {

                    const tx = await tokenService.token_send_public(
                        tokenID,
                        evm2AleoArrWithoutPadding(receiver),
                        balance.balance + BigInt(10000000000000),
                        destChainId,
                        evm2AleoArrWithoutPadding(destTsAddr),
                        evm2AleoArrWithoutPadding(destToken),
                        BigInt(1),
                        non_active_relayer
                    );
                    expect(tx.wait()).rejects.toThrow();
                }
            }, TIMEOUT);

            test("happy token send in public version with non active relayer",
                async () => {
                    const send_amount = BigInt(1000);
                    // const mintTx = await mtsp.mint_public(tokenID, aleoUser1, BigInt(1000_000), 4294967295);
                    // const tx = await mintTx.wait();
                    const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));

                    const chainTokenInfo: ChainToken = {
                        chain_id: ethChainId,
                        token_id: tokenID
                    }

                    expect(await tokenService.min_transfers(tokenID)).toBeLessThanOrEqual(send_amount)
                    expect(await tokenService.max_transfers(tokenID)).toBeGreaterThanOrEqual(send_amount)
                    tokenService.connect(admin);
                    mtsp.connect(admin);
                    const balance: Balance = await getUserAuthorizedBalance(admin, tokenID)
                    console.log("Admin initial balance", balance.balance);
                    const other_chain_token_service = await tokenService.other_chain_token_service(chainTokenInfo)
                    const other_chain_token_address = await tokenService.other_chain_token_address(chainTokenInfo)
                    expect(other_chain_token_service).not.toBeNull()
                    expect(other_chain_token_address).not.toBeNull()

                    //council contract hold the platform fee[after send platform fee need to be deposited in council]
                    const council_initial_balance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);
                    const pre_token_amount_withdrawal = BigInt(0);
                    const platformFee = await getPlatformFeeInAmount(send_amount, public_platform_fee);
                    console.log(platformFee, "platformFee");
                    if (balance.balance > send_amount && send_amount < initialTokenSupply) {
                        const tx = await tokenService.token_send_public(
                            tokenID,
                            evm2AleoArrWithoutPadding(receiver),
                            send_amount,
                            destChainId,
                            evm2AleoArrWithoutPadding(destTsAddr),
                            evm2AleoArrWithoutPadding(destToken),
                            platformFee,
                            non_active_relayer
                        );
                        await tx.wait();
                    }

                    const admin_final_balance = await getUserAuthorizedBalance(admin, tokenID)

                    console.log("Admin initial balance", balance.balance);
                    console.log("Admin final balance", admin_final_balance.balance);
                    console.log("Send amont", send_amount);
                    const post_token_amount_withdrawal = await tokenService.token_amount_withdrawn(tokenID)
                    expect(post_token_amount_withdrawal).toEqual(pre_token_amount_withdrawal + send_amount - platformFee)
                    expect(admin_final_balance.balance).toEqual(balance.balance - send_amount)
                    const finalTokenSupply = await tokenService.total_supply(tokenID);
                    const council_final_balance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);
                    expect(finalTokenSupply).toBe(initialTokenSupply - send_amount + platformFee);
                    expect(council_final_balance.balance).toBe(council_initial_balance.balance + platformFee);
                },
                TIMEOUT
            );

            test("happy token send in public version with  active relayer",
                async () => {
                    console.log(minAmount, maxAmount);
                    const mintTx = await mtsp.mint_public(tokenID, aleoUser1, BigInt(1000_000), 4294967295);
                    await mintTx.wait();
                    const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
                    console.log(initialTokenSupply, "initialTokenSupply");

                    expect(await tokenService.min_transfers(tokenID)).toBeLessThanOrEqual(amount)
                    expect(await tokenService.max_transfers(tokenID)).toBeGreaterThanOrEqual(amount)
                    expect(await tokenService.total_supply(tokenID)).toBeGreaterThanOrEqual(amount)
                    tokenService.connect(admin);
                    mtsp.connect(admin);
                    const chainTokenInfo: ChainToken = {
                        chain_id: ethChainId,
                        token_id: tokenID
                    }

                    const balance: Balance = await getUserAuthorizedBalance(admin, tokenID)
                    console.log("Admin initial balance", balance.balance);

                    const other_chain_token_service = await tokenService.other_chain_token_service(chainTokenInfo)
                    const other_chain_token_address = await tokenService.other_chain_token_address(chainTokenInfo)
                    expect(other_chain_token_service).not.toBeNull()
                    expect(other_chain_token_address).not.toBeNull()

                    //council contract hold the platform fee[after send platform fee need to be deposited in council]
                    const council_initial_balance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);
                    // const pre_token_amount_withdrawal = await tokenService.token_amount_withdrawn(tokenID)
                    const platformFee = await getPlatformFeeInAmount(amount, public_platform_fee);
                    console.log(initialTokenSupply, "initialTokenSupplyinitialTokenSupply");

                    if (balance.balance > amount && initialTokenSupply > amount) {
                        console.log("check passedd");

                        const tx = await tokenService.token_send_public(
                            tokenID,
                            evm2AleoArrWithoutPadding(receiver),
                            amount,
                            destChainId,
                            evm2AleoArrWithoutPadding(destTsAddr),
                            evm2AleoArrWithoutPadding(destToken),
                            platformFee,
                            active_relayer
                        );
                        await tx.wait();
                    }

                    const admin_final_balance = await getUserAuthorizedBalance(admin, tokenID)
                    // const post_token_amount_withdrawal = await tokenService.token_amount_withdrawn(tokenID)
                    // expect(post_token_amount_withdrawal).toEqual(pre_token_amount_withdrawal + amount - platformFee)
                    expect(admin_final_balance.balance).toEqual(balance.balance - amount)
                    const finalTokenSupply = await tokenService.total_supply(tokenID);
                    const council_final_balance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);
                    expect(finalTokenSupply).toBe(initialTokenSupply - amount + platformFee);
                    expect(council_final_balance.balance).toBe(council_initial_balance.balance + platformFee);

                    console.log(balance.balance, "admin initial balance");
                    console.log(admin_final_balance.balance, "admin final balance");
                },
                TIMEOUT
            );

            test("Cannot send if token status is paused", async () => {
                // Pause the token
                tokenService.connect(admin);
                const pauseTx = await tokenService.pause_token_ts(tokenID);
                await pauseTx.wait();
                expect(await tokenService.token_status(tokenID)).toBe(TOKEN_PAUSED_VALUE);
                const platformFee = await getPlatformFeeInAmount(amount, public_platform_fee);
                const tx = await tokenService.token_send_public(
                    tokenID,
                    evm2AleoArrWithoutPadding(receiver),
                    amount,
                    destChainId,
                    evm2AleoArrWithoutPadding(destTsAddr),
                    evm2AleoArrWithoutPadding(destToken),
                    platformFee,
                    active_relayer
                );
                await expect(tx.wait()).rejects.toThrow();
            }, TIMEOUT)

            test("Unpause the token for rest of the transaction", async () => {
                tokenService.connect(admin);
                const unpauseTx = await tokenService.unpause_token_ts(tokenID);
                await unpauseTx.wait();
                expect(await tokenService.token_status(tokenID)).toBe(TOKEN_UNPAUSED_VALUE);
            }, TIMEOUT)

            test("Cannot send if other_chain_token_address is wrong data", async () => {
                tokenService.connect(admin);
                const platformFee = await getPlatformFeeInAmount(amount, public_platform_fee);
                const tx = await tokenService.token_send_public(
                    hashStruct(BigInt('6148332741585187462067')), //wrong tokenId so it gives wrong chain_token_info
                    evm2AleoArrWithoutPadding(receiver),
                    amount,
                    BigInt("28556963456465430695"), // wrong chain id so it  gives wrong chain_token_info
                    evm2AleoArrWithoutPadding(destTsAddr),
                    evm2AleoArrWithoutPadding(destToken),
                    platformFee,
                    active_relayer
                );
                await expect(tx.wait()).rejects.toThrow();
            }, TIMEOUT)

            test("Cannot send if other_chain_token_service is wrong data", async () => {
                tokenService.connect(admin);
                const platformFee = await getPlatformFeeInAmount(amount, public_platform_fee);
                const tx = await tokenService.token_send_public(
                    hashStruct(BigInt('6148332741585187462067')), //wrong tokenId so it gives wrong chain_token_info
                    evm2AleoArrWithoutPadding(receiver),
                    amount,
                    destChainId,
                    evm2AleoArrWithoutPadding(destTsAddr2), //wrong ts address so it gives wrong chain_token_info
                    evm2AleoArrWithoutPadding(destToken),
                    platformFee,
                    active_relayer
                );
                await expect(tx.wait()).rejects.toThrow();
            }, TIMEOUT)
        })

        describe("Token Send Private", () => {
            test.failing("Cannot send if user has insufficient fund", async () => {
                const authorized_until = 4294967295;
                const amount_minted = BigInt(100_000_000);
                const send_amount = BigInt(100_000);

                const mintTx = await mtsp.mint_private(tokenID, aleoUser1, amount_minted, false, authorized_until);
                const [record] = await mintTx.wait();
                console.log(record);
                const decryptedRecord = decryptToken(record, privateKey1)
                const platformFee = await getPlatformFeeInAmount(send_amount, private_platform_fee);
                //council contract hold the platform fee[after send platform fee need to be deposited in council]
                // const council_initial_balance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);
                tokenService.connect(aleoUser1)
                const sendPrivateTx = await tokenService.token_send_private(
                    tokenID,
                    evm2AleoArrWithoutPadding(receiver),
                    BigInt(1000_000_000),
                    destChainId,
                    evm2AleoArrWithoutPadding(destTsAddr),
                    evm2AleoArrWithoutPadding(destToken),
                    decryptedRecord,
                    platformFee,
                    non_active_relayer
                )
                await sendPrivateTx.wait();
            })

            test.failing("Should failed if platform fee is mismatched", async () => {
                const authorized_until = 4294967295;
                const amount_minted = BigInt(100_000_000);
                const send_amount = BigInt(100_000);

                const mintTx = await mtsp.mint_private(tokenID, aleoUser1, amount_minted, false, authorized_until);
                const [record] = await mintTx.wait();
                console.log(record);
                const decryptedRecord = decryptToken(record, privateKey1)
                const platformFee = await getPlatformFeeInAmount(send_amount, private_platform_fee);
                //council contract hold the platform fee[after send platform fee need to be deposited in council]
                // const council_initial_balance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);
                tokenService.connect(aleoUser1)
                const sendPrivateTx = await tokenService.token_send_private(
                    tokenID,
                    evm2AleoArrWithoutPadding(receiver),
                    BigInt(1000_000_000),
                    destChainId,
                    evm2AleoArrWithoutPadding(destTsAddr),
                    evm2AleoArrWithoutPadding(destToken),
                    decryptedRecord,
                    BigInt(10),
                    non_active_relayer
                )
                await sendPrivateTx.wait();
            })

            test("Token send private with non active relayer", async () => {
                //mint record for aleoUser1
                const total_supply = await tokenService.total_supply(tokenID);
                const authorized_until = 4294967295;
                const amount_minted = BigInt(100_000_000);
                const send_amount = BigInt(100_000);

                const mintTx = await mtsp.mint_private(tokenID, aleoUser1, amount_minted, false, authorized_until);
                const [record] = await mintTx.wait();
                console.log(record);
                const decryptedRecord = decryptToken(record, privateKey1)
                const platformFee = await getPlatformFeeInAmount(send_amount, private_platform_fee);
                //council contract hold the platform fee[after send platform fee need to be deposited in council]
                // const council_initial_balance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);
                tokenService.connect(aleoUser1)
                const sendPrivateTx = await tokenService.token_send_private(
                    tokenID,
                    evm2AleoArrWithoutPadding(receiver),
                    send_amount,
                    destChainId,
                    evm2AleoArrWithoutPadding(destTsAddr),
                    evm2AleoArrWithoutPadding(destToken),
                    decryptedRecord,
                    platformFee,
                    non_active_relayer
                )
                const [returnRecord] = await sendPrivateTx.wait();
                const txn = await sendPrivateTx.getTransaction()
                const transitionsList: Transition[] = txn.execution.transitions;
                const total_receieve_amount_fee = await getSignerPackets(transitionsList, council.getPrivateKey(council.address()))
                console.log(total_receieve_amount_fee, "total_receieve_amount_fee");
                const finalTokenSupply = await tokenService.total_supply(tokenID);
                const council_final_balance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);
                expect(finalTokenSupply).toBe(total_supply - send_amount + BigInt(private_platform_fee));
                // expect(total_receieve_amount_fee).toBe(private_platform_fee);
            }, TIMEOUT);

            test("Token send private with active relayer", async () => {
                //mint record for aleoUser1
                const total_supply = await tokenService.total_supply(tokenID);
                const authorized_until = 4294967295;
                const amount_minted = BigInt(100_000_000);
                const send_amount = BigInt(100_000);

                const mintTx = await mtsp.mint_private(tokenID, aleoUser1, amount_minted, false, authorized_until);
                const [record] = await mintTx.wait();
                console.log(record);
                const decryptedRecord = decryptToken(record, privateKey1)
                console.log(decryptedRecord, "decrypted record");

                const platformFee = await getPlatformFeeInAmount(send_amount, private_platform_fee);
                const beforeCouncilBalance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);
                tokenService.connect(aleoUser1)
                const sendPrivateTx = await tokenService.token_send_private(
                    tokenID,
                    evm2AleoArrWithoutPadding(receiver),
                    send_amount,
                    destChainId,
                    evm2AleoArrWithoutPadding(destTsAddr),
                    evm2AleoArrWithoutPadding(destToken),
                    decryptedRecord,
                    platformFee,
                    active_relayer
                )
                const [returnRecord] = await sendPrivateTx.wait();
                const finalTokenSupply = await tokenService.total_supply(tokenID);
                const council_final_balance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);
                expect(finalTokenSupply).toBe(total_supply - send_amount + BigInt(private_platform_fee));
                expect(council_final_balance.balance).toBe(BigInt(private_platform_fee) + beforeCouncilBalance.balance);
            }, TIMEOUT);
        })
    });

});



//function to fetch user balance
const getUserAuthorizedBalance = async (user: string, tokenId: bigint) => {
    const owner: TokenOwner = {
        account: user,
        token_id: tokenId
    }
    const hash = hashStruct(owner);
    let default_balance: Balance = {
        token_id: BigInt(0),
        account: "",
        balance: BigInt(0),
        authorized_until: 0
    }
    const balance: Balance = await mtsp.authorized_balances(hash, default_balance);
    return balance;
}



//{pre_image:123field,receiver:aleo1wfaqpfc57m0wxmr9l6r8a5g95c0cthe54shzmcyu6wf6tqvady9syt27xt}