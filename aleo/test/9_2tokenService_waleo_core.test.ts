import { Vlink_token_bridge_v2Contract } from "../artifacts/js/vlink_token_bridge_v2";
import { InPacket, PacketId } from "../artifacts/js/types/vlink_token_bridge_v2";
import { evm2AleoArrWithoutPadding, generateRandomEthAddr, prunePadding } from "../utils/ethAddress";
import { signPacket } from "../utils/sign";
import {
    ALEO_ZERO_ADDRESS,
    BRIDGE_PAUSABILITY_INDEX,
    BRIDGE_UNPAUSED_VALUE,
    VERSION_PUBLIC_NORELAYER_NOPREDICATE,
    aleoChainId,
    ethChainId,
    ethTsContractAddr,
    ethTsRandomContractAddress,
    ethUsdcContractAddr,
    COUNCIL_THRESHOLD_INDEX,
    COUNCIL_TOTAL_MEMBERS_INDEX,
    COUNCIL_TOTAL_PROPOSALS_INDEX,
    baseChainId,
    arbitrumChainId,
    ALEO_CREDITS_TOKEN_ID,
    BSC_TESTNET
} from "../utils/testdata.data";
import { PrivateKey } from "@aleohq/sdk";
import { createRandomPacket } from "../utils/packet";
import { ExecutionMode } from "@doko-js/core";
import { ChainToken } from "../artifacts/js/types/vlink_token_service_cd_v2";
import { Vlink_token_service_cd_v2Contract } from "../artifacts/js/vlink_token_service_cd_v2";
import { Vlink_token_service_cd_cuncl_v2Contract } from "../artifacts/js/vlink_token_service_cd_cuncl_v2";
import { Vlink_holding_cd_v2Contract } from "../artifacts/js/vlink_holding_cd_v2";
import { Vlink_council_v2Contract } from "../artifacts/js/vlink_council_v2";
import { Token_registryContract } from "../artifacts/js/token_registry";
import { VERSION_PRIVATE_NORELAYER_NOPREDICATE } from "../utils/constants";
import { Holder } from "../artifacts/js/types/vlink_holding_cd_v2";
import { CreditsContract } from "../artifacts/js/credits";

const usdcContractAddr = ethUsdcContractAddr;
const mode = ExecutionMode.SnarkExecute;
const bridge = new Vlink_token_bridge_v2Contract({ mode: mode });
const tokenServiceWAleo = new Vlink_token_service_cd_v2Contract({ mode: mode });
const tokenServiceWAleoCouncil = new Vlink_token_service_cd_cuncl_v2Contract({ mode: mode });
const holdingWAleo = new Vlink_holding_cd_v2Contract({ mode: mode });
const council = new Vlink_council_v2Contract({ mode });
const tokenRegistry = new Token_registryContract({ mode: mode });
const credits = new CreditsContract({ mode: mode });
//npm run test -- --runInBand ./test/9_2_ts_waleo_core.test.ts

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



describe("Deployment Token Service For ALeo", () => {
    const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = bridge.getAccounts();
    tokenID = BigInt("3443843282313283355522573239085696902919850365217539366784739393210722344986");
    const platform_fee = 5000; // 5% in basis points, so 5000 means 5%
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
                admin
            );
            await tx.wait();
        }, TIMEOUT);

        test("Bridge: Add BSc Chain", async () => {
                const addEthChainTx = await bridge.add_chain_tb(BSC_TESTNET);
                await addEthChainTx.wait();
        }, TIMEOUT)

        test("Bridge: Add Service", async () => {
            const supportServiceTx = await bridge.add_service_tb(tokenServiceWAleo.address());
            await supportServiceTx.wait();
        }, TIMEOUT)

        test("Bridge: Unpause", async () => {
                const unpauseTx = await bridge.unpause_tb();
                await unpauseTx.wait();
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
    });

    describe("Add  Token Info", () => {


        test("Token Service: Add Token Info", async () => {
            const minimumTransfer = BigInt(100);
            const maximumTransfer = BigInt(100_00_000);
            tokenServiceWAleo.connect(admin);
            const tx = await tokenServiceWAleo.add_token_info(
                minimumTransfer,
                maximumTransfer,
                evm2AleoArrWithoutPadding(usdcContractAddr),
                evm2AleoArrWithoutPadding(ethTsContractAddr),
                BSC_TESTNET,
                platform_fee,
            );
            await tx.wait();
        }, TIMEOUT)

        test("Token Service: Unpause Token", async () => {
            const unpauseEthTx = await tokenServiceWAleo.unpause_token_ts(BSC_TESTNET);
            await unpauseEthTx.wait();
        }, TIMEOUT)
    })


    describe("Token Send WAleo", () => {
        const destChainId = BSC_TESTNET;
        const destTsAddr = ethTsContractAddr.toLowerCase();
        const destTsAddr2 = ethTsRandomContractAddress.toLowerCase();

        const destToken = usdcContractAddr.toLowerCase();
        const receiver = ethUser.toLowerCase()
        const amount = BigInt(100000);
        const ethChainTokenInfo: ChainToken = {
            chain_id: BSC_TESTNET,
            token_id: ALEO_CREDITS_TOKEN_ID
        }

        let minAmount: bigint;
        let maxAmount: bigint;

        test("Get minimum and maximum amount", async () => {
            minAmount = await tokenServiceWAleo.min_transfers(ethChainTokenInfo, BigInt(0));
            maxAmount = await tokenServiceWAleo.max_transfers(ethChainTokenInfo, BigInt(0));
        }, TIMEOUT)


        test.failing("Wrong connector for the token cannot send token",
            async () => {
                tokenServiceWAleo.connect(admin);
                const platformFee = await getPlatformFeeInAmount(amount, platform_fee);
                const tx = await tokenServiceWAleo.token_send_public(
                    evm2AleoArrWithoutPadding(receiver),
                    amount,
                    destChainId,
                    evm2AleoArrWithoutPadding(destTsAddr2),
                    evm2AleoArrWithoutPadding(destToken),
                    platformFee
                );
                await tx.wait();
            },
            TIMEOUT
        );

        test.failing("Transferred amount must be greater than or equal to min amount",
            async () => {
                const amount = await tokenServiceWAleo.min_transfers(ethChainTokenInfo) - BigInt(10)
                expect(amount).toBeLessThan(minAmount);
                tokenServiceWAleo.connect(aleoUser4);
                const platformFee = await getPlatformFeeInAmount(amount, platform_fee);
                const tx = await tokenServiceWAleo.token_send_public(
                    evm2AleoArrWithoutPadding(receiver),
                    amount,
                    destChainId,
                    evm2AleoArrWithoutPadding(destTsAddr),
                    evm2AleoArrWithoutPadding(destToken),
                    platformFee
                );
                await tx.wait();
            },
            TIMEOUT
        );

        test.failing("Transferred amount must be less than or equal to max amount",
            async () => {
                const amount = await tokenServiceWAleo.max_transfers(ethChainTokenInfo) + BigInt(10);
                tokenServiceWAleo.connect(aleoUser4);
                const platformFee = await getPlatformFeeInAmount(amount, platform_fee);
                const tx = await tokenServiceWAleo.token_send_public(
                    evm2AleoArrWithoutPadding(receiver),
                    amount + BigInt(1000000000000000), //adding some extra amount to make sure it is greater than max transfer
                    destChainId,
                    evm2AleoArrWithoutPadding(destTsAddr),
                    evm2AleoArrWithoutPadding(destToken),
                    platformFee
                );
                await tx.wait();
            },
            TIMEOUT
        );

        test.failing("Cannot send if user has insufficient fund", async () => {
                expect(await tokenServiceWAleo.min_transfers(ethChainTokenInfo)).toBeLessThanOrEqual(amount)
                expect(await tokenServiceWAleo.max_transfers(ethChainTokenInfo)).toBeGreaterThanOrEqual(amount)
                tokenServiceWAleo.connect(admin);
                tokenRegistry.connect(admin);
                const balance = await credits.account(aleoUser1)
                const platformFee = await getPlatformFeeInAmount(amount, platform_fee);

                const tx = await tokenServiceWAleo.token_send_public(
                    evm2AleoArrWithoutPadding(receiver),
                    balance + BigInt(10000000000000),
                    destChainId,
                    evm2AleoArrWithoutPadding(destTsAddr),
                    evm2AleoArrWithoutPadding(destToken),
                    platformFee
                );
                await tx.wait();
        }, TIMEOUT)

        test.failing("Should failed if platform fee is mismatched", async () => {
                expect(await tokenServiceWAleo.min_transfers(ethChainTokenInfo)).toBeLessThanOrEqual(amount)
                expect(await tokenServiceWAleo.max_transfers(ethChainTokenInfo)).toBeGreaterThanOrEqual(amount)
                tokenServiceWAleo.connect(admin);
                tokenRegistry.connect(admin);
                const balance = await credits.account(admin)
                if (balance > amount) {
                    const tx = await tokenServiceWAleo.token_send_public(
                        evm2AleoArrWithoutPadding(receiver),
                        balance - BigInt(1000),
                        destChainId,
                        evm2AleoArrWithoutPadding(destTsAddr),
                        evm2AleoArrWithoutPadding(destToken),
                        BigInt(1)
                    );
                    await tx.wait();
                }
        }, TIMEOUT)


        describe("Token Send Public", () => {
            const ethChainTokenInfo: ChainToken = {
                chain_id: BSC_TESTNET,
                token_id: ALEO_CREDITS_TOKEN_ID
            }

            test("happy token send in public version",
                async () => {
                    const send_amount = BigInt(1_000_000);
                    const initialTokenSupply = await tokenServiceWAleo.total_supply(ethChainTokenInfo, BigInt(0));
                    // const aleocredit = await credits.account(aleoUser1, BigInt(0));
                    expect(await tokenServiceWAleo.min_transfers(ethChainTokenInfo)).toBeLessThanOrEqual(send_amount)
                    expect(await tokenServiceWAleo.max_transfers(ethChainTokenInfo)).toBeGreaterThanOrEqual(send_amount)
                    tokenServiceWAleo.connect(admin);
                    tokenRegistry.connect(admin);
                    const admin_initial_credit = await credits.account(admin, BigInt(0));
                    const contract_initial_credit = await credits.account(tokenServiceWAleo.address(), BigInt(0));
                    const other_chain_token_service = await tokenServiceWAleo.other_chain_token_service(ethChainTokenInfo);
                    const other_chain_token_address = await tokenServiceWAleo.other_chain_token_address(ethChainTokenInfo);
                    expect(other_chain_token_service).not.toBeNull();
                    expect(other_chain_token_address).not.toBeNull();
                    // const council_initial_balance = await credits.account(tokenServiceWAleoCouncil.address());
                    const platformFee = await getPlatformFeeInAmount(send_amount, platform_fee);
                    tokenServiceWAleo.connect(aleoUser1);
                    const tx = await tokenServiceWAleo.token_send_public(
                        evm2AleoArrWithoutPadding(receiver),
                        send_amount,
                        destChainId,
                        evm2AleoArrWithoutPadding(destTsAddr),
                        evm2AleoArrWithoutPadding(destToken),
                        platformFee
                    );
                    await tx.wait();
                    const admin_final_credit = await credits.account(admin);
                    const finalTokenSupply = await tokenServiceWAleo.total_supply(ethChainTokenInfo);
                    const contract_final_credit = await credits.account(tokenServiceWAleo.address(), BigInt(0));
                    expect(admin_final_credit).toBeLessThan(admin_initial_credit - send_amount) //346816 takes as a from aleo credits
                    expect(finalTokenSupply).toBe(initialTokenSupply + send_amount - platformFee) //need to pass this as well
                    //check total supply as well //need fix in contract side as well
                },
                TIMEOUT
            );
        })
    });

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
            const ethChainTokenInfo: ChainToken = {
                chain_id: BSC_TESTNET,
                token_id: ALEO_CREDITS_TOKEN_ID
            }
            test("All Fund should go back to the holding account if screening fails", async () => {
                const receiveAmount: bigint = BigInt(100_00)
                const packet = createPacket(aleoUser1, receiveAmount, tokenServiceWAleo.address(), BSC_TESTNET, ethTsContractAddr);
                tokenServiceWAleo.connect(admin);
                const token_status = await tokenServiceWAleo.status(ethChainTokenInfo);
                expect(token_status).toBe(false); //SHOULD UNPAUSE TOKEN
                const signature = signPacket(packet, false, tokenServiceWAleo.config.privateKey);
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
                const other_chain_token_service = await tokenServiceWAleo.other_chain_token_service(ethChainTokenInfo)
                expect(other_chain_token_service).not.toBeNull()
                expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);
                const user_initial_credits = await credits.account(aleoUser1);
                const initial_held_amount = await tokenServiceWAleo.token_holding(ALEO_CREDITS_TOKEN_ID, BigInt(0))
                const initialTokenSupply = await tokenServiceWAleo.total_supply(ethChainTokenInfo, BigInt(0));
                tokenServiceWAleo.connect(aleoUser1);
                const tx = await tokenServiceWAleo.token_receive_public(
                    prunePadding(packet.message.sender_address),
                    packet.message.receiver_address,
                    packet.message.amount,
                    packet.sequence,
                    packet.height,
                    signers,
                    signatures,
                    packet.source.chain_id,
                    prunePadding(packet.source.addr)
                );
                const [screeningPassed] = await tx.wait();

                const finalTokenSupply = await tokenServiceWAleo.total_supply(ethChainTokenInfo);
                const finalHeldAmount = await tokenServiceWAleo.token_holding(ALEO_CREDITS_TOKEN_ID)
                const user_final_credits = await credits.account(aleoUser1);

                expect(finalHeldAmount).toBe(initial_held_amount + receiveAmount);
                // expect(finalTokenSupply).toBe(initialTokenSupply - receiveAmount + relayer_fee) //need to pass this as well //currently isssue in contract
            }, TIMEOUT)

            test.failing("cannot receive if token is paused", async () => {

                const pauseEthTx = await tokenServiceWAleo.pause_token_ts(BSC_TESTNET);
                await pauseEthTx.wait();

                const receiveAmount: bigint = BigInt(100_00)
                const packet = createPacket(aleoUser1, receiveAmount, tokenServiceWAleo.address(), BSC_TESTNET, ethTsContractAddr);
                tokenServiceWAleo.connect(admin);
                const token_status = await tokenServiceWAleo.status(ethChainTokenInfo);
                expect(token_status).toBe(false); //SHOULD UNPAUSE TOKEN
                const signature = signPacket(packet, true, tokenServiceWAleo.config.privateKey);
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
                const other_chain_token_service = await tokenServiceWAleo.other_chain_token_service(ethChainTokenInfo)
                expect(other_chain_token_service).not.toBeNull()
                expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);
                tokenServiceWAleo.connect(aleoUser1);
                const tx = await tokenServiceWAleo.token_receive_public(
                    prunePadding(packet.message.sender_address),
                    packet.message.receiver_address,
                    packet.message.amount,
                    packet.sequence,
                    packet.height,
                    signers,
                    signatures,
                    packet.source.chain_id,
                    prunePadding(packet.source.addr)
                );
                await tx.wait();
            }, TIMEOUT);

            test("Happy receive token(bsc chain) public", async () => {

               const unpauseEthTx = await tokenServiceWAleo.unpause_token_ts(BSC_TESTNET);
                await unpauseEthTx.wait();

                const receiveAmount: bigint = BigInt(100_00)
                const packet = createPacket(aleoUser1, receiveAmount, tokenServiceWAleo.address(), BSC_TESTNET, ethTsContractAddr);
                tokenServiceWAleo.connect(admin);
                const token_status = await tokenServiceWAleo.status(ethChainTokenInfo);
                expect(token_status).toBe(false); //SHOULD UNPAUSE TOKEN
                const signature = signPacket(packet, true, tokenServiceWAleo.config.privateKey);
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
                const other_chain_token_service = await tokenServiceWAleo.other_chain_token_service(ethChainTokenInfo)
                expect(other_chain_token_service).not.toBeNull()
                expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);
                const user_initial_credits = await credits.account(aleoUser1);
                const initial_held_amount = await tokenServiceWAleo.token_holding(ALEO_CREDITS_TOKEN_ID, BigInt(0))
                const initialTokenSupply = await tokenServiceWAleo.total_supply(ethChainTokenInfo, BigInt(0));
                tokenServiceWAleo.connect(aleoUser1);
                const tx = await tokenServiceWAleo.token_receive_public(
                    prunePadding(packet.message.sender_address),
                    packet.message.receiver_address,
                    packet.message.amount,
                    packet.sequence,
                    packet.height,
                    signers,
                    signatures,
                    packet.source.chain_id,
                    prunePadding(packet.source.addr)
                );
                const [screeningPassed] = await tx.wait();

                const finalTokenSupply = await tokenServiceWAleo.total_supply(ethChainTokenInfo);
                const finalHeldAmount = await tokenServiceWAleo.token_holding(ALEO_CREDITS_TOKEN_ID)
                const user_final_credits = await credits.account(aleoUser1);

                expect(finalHeldAmount).toBe(initial_held_amount);
                expect(user_final_credits).toBe(user_initial_credits + receiveAmount) //375749 takes as a fee by credits contract
                expect(finalTokenSupply).toBe(initialTokenSupply - receiveAmount) //need to pass this as well //currently isssue in contract
            }, TIMEOUT);

        })

    });

})
