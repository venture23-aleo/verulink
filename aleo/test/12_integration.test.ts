import { Vlink_token_bridge_v7Contract } from "../artifacts/js/vlink_token_bridge_v7";
import { InPacket, PacketId } from "../artifacts/js/types/vlink_token_bridge_v7";
import { evm2AleoArrWithoutPadding, generateRandomEthAddr, prunePadding } from "../utils/ethAddress";
import { signPacket } from "../utils/sign";
import {
    ALEO_ZERO_ADDRESS,
    BRIDGE_PAUSABILITY_INDEX,
    BRIDGE_UNPAUSED_VALUE,
    VERSION_PUBLIC_NORELAYER_NOPREDICATE,
    aleoChainId,
    ethTsContractAddr,
    ethTsRandomContractAddress,
    ethUsdcContractAddr,
    COUNCIL_THRESHOLD_INDEX,
    COUNCIL_TOTAL_MEMBERS_INDEX,
    COUNCIL_TOTAL_PROPOSALS_INDEX,
    baseChainId,
    arbitrumChainId,
    ALEO_CREDITS_TOKEN_ID,
    BSC_TESTNET,
    baseTsContractAddr,
    VERSION_PUBLIC_RELAYER_NOPREDICATE,
    VERSION_PRIVATE_RELAYER_NOPREDICATE,
    BRIDGE_TOTAL_ATTESTORS_INDEX,
    BRIDGE_THRESHOLD_INDEX
} from "../utils/testdata.data";

import { PrivateKey } from "@aleohq/sdk";
import { createRandomPacket } from "../utils/packet";
import { ExecutionMode, js2leo, leo2js } from "@doko-js/core";
import { ChainToken } from "../artifacts/js/types/vlink_token_service_cd_v7";
import { Vlink_token_service_cd_v7Contract } from "../artifacts/js/vlink_token_service_cd_v7";
import { Vlink_token_service_cd_cncl_v07Contract } from "../artifacts/js/vlink_token_service_cd_cncl_v07";
import { Vlink_holding_cd_v7Contract } from "../artifacts/js/vlink_holding_cd_v7";
import { Vlink_council_v07Contract } from "../artifacts/js/vlink_council_v07";
import { Token_registryContract } from "../artifacts/js/token_registry";
import { VERSION_PRIVATE_NORELAYER_NOPREDICATE } from "../utils/constants";
import { Holder } from "../artifacts/js/types/vlink_holding_cd_v7";
import { CreditsContract } from "../artifacts/js/credits";

import { Vlink_token_service_v7Contract } from "../artifacts/js/vlink_token_service_v7";
import { Vlink_holding_v7Contract } from "../artifacts/js/vlink_holding_v7";
import { hashStruct, hashStructToAddress } from "../utils/hash";
import { Image, WithdrawalLimit } from "../artifacts/js/types/vlink_token_service_v7";
import { Balance, TokenOwner } from "../artifacts/js/types/token_registry";
import { Transition } from "@doko-js/core/dist/outputs/types/transaction";
import { decryptToken } from "../artifacts/js/leo2js/token_registry";




const usdcContractAddr = ethUsdcContractAddr;
const mode = ExecutionMode.SnarkExecute;
const bridge = new Vlink_token_bridge_v7Contract({ mode: mode });
const tokenServiceWAleo = new Vlink_token_service_cd_v7Contract({ mode: mode });
const tokenServiceWAleoCouncil = new Vlink_token_service_cd_cncl_v07Contract({ mode: mode });
const holdingWAleo = new Vlink_holding_cd_v7Contract({ mode: mode });
const council = new Vlink_council_v07Contract({ mode });
const tokenRegistry = new Token_registryContract({ mode: mode });
const credits = new CreditsContract({ mode: mode });
const tokenService = new Vlink_token_service_v7Contract({ mode: mode });
const mtsp = new Token_registryContract({ mode: mode });
const holding = new Vlink_holding_v7Contract({ mode: mode });
const privateKey1 = process.env.ALEO_DEVNET_PRIVATE_KEY1;
const privateKey2 = process.env.ALEO_DEVNET_PRIVATE_KEY2;



const token_name = BigInt('614833282165187462067')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
const token_symbol = BigInt("143715203238") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
const token_decimals = 6
const token_max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615
let tokenID = leo2js.field(hash('bhp256', js2leo.u128(token_name), 'field'));
const public_platform_fee = 5000;
const private_platform_fee = 10000; 
const public_relayer_fee = BigInt(10000);
const private_relayer_fee = BigInt(20000);
const active_relayer = true;
const non_active_relayer = false;
import { getSignerPackets } from "../utils/getRecords";
import { hash } from "aleo-hasher";


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
const ethChainId = BigInt(27234042785);


describe("Deployment Token Service For ALeo", () => {
    const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = bridge.getAccounts();
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
    
         test("Deploy Holding program", async () => {
            const deployTx = await holding.deploy();
            await deployTx.wait();
        }, TIMEOUT);

        test("Deploy Token Service", async () => {
            const deployTx = await tokenService.deploy();
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
        }, TIMEOUT);

        test("Bridge: Add eth Chain", async () => {
            const addEthChainTx = await bridge.add_chain_tb(ethChainId);
            await addEthChainTx.wait();
        }, TIMEOUT);

        test("Bridge: add seq number in eth chain", async () => {
            const addEthChainTx = await bridge.migrate_eth_seq(BigInt(3000));
            await addEthChainTx.wait();
        }, TIMEOUT)

        test("Bridge: Add base Chain", async () => {
            const addBaseChainTx = await bridge.add_chain_tb(baseChainId);
            await addBaseChainTx.wait();
        }, TIMEOUT)

        test("Bridge: Add Service", async () => {
            const supportServiceTx = await bridge.add_service_tb(tokenServiceWAleo.address());
            await supportServiceTx.wait();
        }, TIMEOUT)

        test("Bridge: Add Service", async () => {
            const supportServiceTx = await bridge.add_service_tb(tokenService.address());
            await supportServiceTx.wait();
        }, TIMEOUT)

        test("Bridge: Unpause", async () => {
            const unpauseTx = await bridge.unpause_tb();
            await unpauseTx.wait();
        }, TIMEOUT)

        test("Holding: Waleo Initialize", async () => {
            holdingWAleo.connect(aleoUser1)
            const tx = await holdingWAleo.initialize_holding(tokenServiceWAleo.address());
            await tx.wait();
        }, TIMEOUT)

        test("Holding: eth Initialize", async () => {
            const tx = await holding.initialize_holding(tokenService.address());
            await tx.wait();
        }, TIMEOUT)

        test("Token Service WAleo: Initialize", async () => {
            tokenServiceWAleo.connect(aleoUser1)
            const tx = await tokenServiceWAleo.initialize_ts(admin);
            await tx.wait();
        }, TIMEOUT);

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

        const destToken = usdcContractAddr.toLowerCase();
        const receiver = ethUser.toLowerCase()
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

    describe("Token Receive WAleo", () => {
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
                ALEO_CREDITS_TOKEN_ID,
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
                expect(user_final_credits).toBeLessThan(user_initial_credits + receiveAmount) //375749 takes as a fee by credits contract
                expect(user_final_credits).toBeGreaterThan(user_initial_credits + receiveAmount - BigInt(500000))
                expect(finalTokenSupply).toBe(initialTokenSupply - receiveAmount) //need to pass this as well //currently isssue in contract
            }, TIMEOUT);

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

        describe("Token Receive Public ETH", () => {

            test("All Fund should go back to the holding account if screening fails", async () => {
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
    });


    describe("Token Send", () => {
        const destChainId = ethChainId;
        const destTsAddr = ethTsContractAddr.toLowerCase();

        const destToken = usdcContractAddr.toLowerCase();
        const receiver = ethUser.toLowerCase()
        const amount = BigInt(100000);

        let minAmount: bigint;
        let maxAmount: bigint;

        test("Get minimum and maximum amount", async () => {
            minAmount = await tokenService.min_transfers(tokenID, BigInt(0));
            maxAmount = await tokenService.max_transfers(tokenID, BigInt(0));
        }, TIMEOUT)

        describe("Token Send Public", () => {

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

        })

        describe("Token Send Private", () => {

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

})


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
