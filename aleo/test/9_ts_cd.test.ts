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
    BRIDGE_TOTAL_ATTESTORS_INDEX,
    BRIDGE_THRESHOLD_INDEX,
    COUNCIL_THRESHOLD_INDEX,
    COUNCIL_TOTAL_MEMBERS_INDEX,
    COUNCIL_TOTAL_PROPOSALS_INDEX
} from "../utils/testdata.data";
import { PrivateKey } from "@aleohq/sdk";
import { createRandomPacket } from "../utils/packet";
import { ExecutionMode } from "@doko-js/core";
import { ChainToken } from "../artifacts/js/types/vlink_token_service_cd_v2";


import { Vlink_token_service_cd_v2Contract } from "../artifacts/js/vlink_token_service_cd_v2";
import { Vlink_token_service_cd_cuncl_v2Contract } from "../artifacts/js/vlink_token_service_cd_cuncl_v2";
import { Vlink_holding_cd_v2Contract } from "../artifacts/js/vlink_holding_cd_v2";
import { Vlink_council_v2Contract } from "../artifacts/js/vlink_council_v2";

const usdcContractAddr = ethUsdcContractAddr;
const mode = ExecutionMode.SnarkExecute;

const bridge = new Vlink_token_bridge_v2Contract({ mode: mode });
const tokenServiceWAleo = new Vlink_token_service_cd_v2Contract({ mode: mode });
const tokenServiceWAleoCouncil = new Vlink_token_service_cd_cuncl_v2Contract({ mode: mode });
const holdingWAleo = new Vlink_holding_cd_v2Contract({ mode: mode });
const council = new Vlink_council_v2Contract({ mode });


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
        const aleoUser5 = new PrivateKey().to_address().to_string();
        tokenID = BigInt("3443843282313283355522573239085696902919850365217539366784739393210722344986");
        const platform_fee = 5000;
        const relayer_fee = BigInt(10000);
        console.log(tokenID);
        const admin = aleoUser1;
        const active_relayer = true;

        const [councilMember1, councilMember2, councilMember3] = council.getAccounts();
        const initialThreshold = 2;

        tokenServiceWAleo.connect(admin)

        describe.skip("Deployment", () => {
            test("Deploy Council",async () => {
                const deployTx = await council.deploy();
                await deployTx.wait();
            },
            TIMEOUT
            );

            test("Deploy HoldingWAleo", async () => {
                const deployTx = await holdingWAleo.deploy();
                await deployTx.wait();
            }, TIMEOUT);

            test("Deploy Token Service WAleo", async () => {
                const deployTx = await tokenServiceWAleo.deploy();
                await deployTx.wait();
            }, TIMEOUT);

            test("Deploy Token Service Council WAleo", async () => {
                const deployTx = await tokenServiceWAleoCouncil.deploy();
                await deployTx.wait();
            }, TIMEOUT);
        });

        describe.skip("Initialization", () => {

            test("Initialize Council",
                  async () => {
                    let isCouncilInitialized = (await council.settings(COUNCIL_THRESHOLD_INDEX, 0)) != 0;
                    if (!isCouncilInitialized) {
                      council.connect(councilMember1);
                      const initializeTx = await council.initialize(
                        [councilMember1, councilMember2, councilMember3, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS], initialThreshold
                      );
                      await initializeTx.wait();
                      expect(await council.members(councilMember1)).toBe(true);
                      expect(await council.members(councilMember2)).toBe(true);
                      expect(await council.members(councilMember3)).toBe(true);
                      expect(await council.members(ALEO_ZERO_ADDRESS)).toBe(true);
                      expect(await council.members(aleoUser4, false)).toBe(false);
                      expect(await council.settings(COUNCIL_THRESHOLD_INDEX)).toBe(initialThreshold);
                      expect(await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)).toBe(3);
                      expect(await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toBe(BigInt(0));
                    }
                  },
                  TIMEOUT
            );


            test("Bridge: Add Service", async () => {
                const supportServiceTx = await bridge.add_service_tb(tokenServiceWAleo.address());
                await supportServiceTx.wait();
            }, TIMEOUT)
    
            test("Holding: Initialize", async () => {
                const tx = await holdingWAleo.initialize_holding(tokenServiceWAleo.address());
                await tx.wait();
            }, TIMEOUT)
    
            test("Token Service WAleo: Initialize", async () => {
                const tx = await tokenServiceWAleo.initialize_ts(admin);
                await tx.wait();
            }, TIMEOUT);
    
            test("Token Service: Add Token Info", async () => {
                const minimumTransfer = BigInt(100);
                const maximumTransfer = BigInt(100000_000_000);
                const tx = await tokenServiceWAleo.add_token_info(
                    minimumTransfer,
                    maximumTransfer,
                    evm2AleoArrWithoutPadding(usdcContractAddr),
                    evm2AleoArrWithoutPadding(ethTsContractAddr),
                    ethChainId,
                    platform_fee,
                    relayer_fee,
                );
                await tx.wait();
                await sleepTimer(5000);
            }, TIMEOUT)
    
            test("Token Service: Unpause Token", async () => {
                const unpauseTx = await tokenServiceWAleo.unpause_token_ts();
                await unpauseTx.wait();
            }, TIMEOUT)
        });

        describe.skip("Token Send WAleo", () => {
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
                minAmount = await tokenServiceWAleo.min_transfers(tokenID, BigInt(0));
                maxAmount = await tokenServiceWAleo.max_transfers(tokenID, BigInt(0));
            }, TIMEOUT)


            test("happy token send in public version with  active relayer",
                async () => {
                    const initialTokenSupply = await tokenServiceWAleo.total_supply(tokenID, BigInt(0));
                    console.log(initialTokenSupply, "initialTokenSupply")
                    const platformFee = await getPlatformFeeInAmount(amount, platform_fee);
                    const tx = await tokenServiceWAleo.token_send_public(
                            evm2AleoArrWithoutPadding(receiver),
                            amount,
                            destChainId,
                            evm2AleoArrWithoutPadding(destTsAddr),
                            evm2AleoArrWithoutPadding(destToken),
                            platformFee,
                            active_relayer
                    );
                    await tx.wait();
                },
                TIMEOUT
            );       

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

                test("Happy receive token(ethereum chain) public with no relayer", async () => {
                    await sleepTimer(5000);
                    const receiveAmount: bigint = BigInt(10000);
                    const packet = createPacket(aleoUser1, receiveAmount, tokenServiceWAleo.address(), ethChainId, ethTsContractAddr);
                    console.log(packet);

                    tokenServiceWAleo.connect(admin);
                    const token_status = await tokenServiceWAleo.status(true);
                    console.log("token status", token_status);
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

                    const TokenInfo: ChainToken = {
                        chain_id: ethChainId,
                        native_token_id: tokenID
                    }

                    //check bridge pausability status
                    expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
                    const totalAttestors = await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX);
                    const threshold = await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX);
                    const other_chain_token_service = await tokenServiceWAleo.other_chain_token_service(TokenInfo)
                    expect(other_chain_token_service).not.toBeNull()
                    expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);
                    // check relayer balance
            

                    const initialTokenSupply = await tokenServiceWAleo.total_supply(tokenID, BigInt(0));
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
                        prunePadding(packet.source.addr),
                        relayer_fee,
                    );
                    const [screeningPassed] = await tx.wait();

                    const finalTokenSupply = await tokenServiceWAleo.total_supply(tokenID);
                    expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
                    expect(screeningPassed).toBe(true);
                    await sleepTimer(5000);
                },
                    TIMEOUT
                );

            })

        });
    


    })
