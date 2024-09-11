import { PrivateKey } from "@aleohq/sdk";
import { UtilsContract } from "../artifacts/js/utils";
import { ALEO_ZERO_ADDRESS } from "../utils/constants";
import { sign } from "aleo-signer";
import { js2leo } from "@doko-js/core";
import { ExecutionMode} from "@doko-js/core";

const mode = ExecutionMode.SnarkExecute;

const utils = new UtilsContract({ mode: mode});

describe("Unique Addresses", () => {
    const addr1 = new PrivateKey().to_address().to_string();
    const addr2 = new PrivateKey().to_address().to_string();
    const addr3 = new PrivateKey().to_address().to_string();
    const addr4 = new PrivateKey().to_address().to_string();
    const addr5 = new PrivateKey().to_address().to_string();

    describe("Unique", () => {
        test("All zero address", async () => {
            const [unique, _] = await utils.get_valid_unique_address_countT([
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
            ])
            expect(unique).toBe(0)
        })

        test("One non-zero address", async () => {
            const [unique, _] = await utils.get_valid_unique_address_countT([
                addr1,
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
            ])
            expect(unique).toBe(1)
        })

        test("Two non-zero address", async () => {
            const [unique, _] = await utils.get_valid_unique_address_countT([
                addr1,
                addr2,
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
            ])
            expect(unique).toBe(2)
        })

        test("Three non-zero address", async () => {
            const [unique, _] = await utils.get_valid_unique_address_countT([
                addr1,
                addr2,
                addr3,
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
            ])
            expect(unique).toBe(3)
        })

        test("Four non-zero address", async () => {
            const [unique, _] = await utils.get_valid_unique_address_countT([
                addr1,
                addr2,
                addr3,
                ALEO_ZERO_ADDRESS,
                addr4,
            ])
            expect(unique).toBe(4)
        })

        test("All non-zero address", async () => {
            const [unique, _] = await utils.get_valid_unique_address_countT([
                addr1,
                addr2,
                addr3,
                addr4,
                addr5
            ])
            expect(unique).toBe(5)
        })

    })

    // TODO: create a function and create this randomly and test on different iterations
    describe("Non Unique", () => {

        test.failing("Repeat first position", async () => {
            await utils.get_valid_unique_address_countT([
                addr1,
                addr1,
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
            ])
        })

        test.failing("Repeat last position", async () => {
            await utils.get_valid_unique_address_countT([
                addr1,
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
                addr1,
            ])
        })

        test.failing("Repeat fourth position", async () => {
            await utils.get_valid_unique_address_countT([
                addr1,
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
                addr1,
                ALEO_ZERO_ADDRESS,
            ])
        })

        test.failing("Repeat fourth position", async () => {
            await utils.get_valid_unique_address_countT([
                addr1,
                ALEO_ZERO_ADDRESS,
                ALEO_ZERO_ADDRESS,
                addr1,
                ALEO_ZERO_ADDRESS,
            ])
        })

        test.failing("Repeat fourth position", async () => {
            await utils.get_valid_unique_address_countT([
                addr1,
                ALEO_ZERO_ADDRESS,
                addr1,
                ALEO_ZERO_ADDRESS,
                addr2
            ])
        })
    })
})

import { InPacketWithScreening } from '../artifacts/js/types/token_bridge_v0003';
import { getInPacketWithScreeningLeo } from '../artifacts/js/js2leo/token_bridge_v0003';
import { hashStruct } from "../utils/hash";

const signPacketHash = (packet_hash: bigint, screening_passed: boolean, privateKey: string) => {
    const packetHashWithScreening: InPacketWithScreening = {
        packet_hash,
        screening_passed
    };
    const packetHashWithScreeningHash = hashStruct(getInPacketWithScreeningLeo(packetHashWithScreening));
    const signature = sign(privateKey, js2leo.field(packetHashWithScreeningHash))
    return signature
}

describe("Signature Verification", () => {
    const acc1 = new PrivateKey();
    const acc2 = new PrivateKey();
    const acc3 = new PrivateKey();
    const acc4 = new PrivateKey();
    const acc5 = new PrivateKey();

    const pKey1 = acc1.to_string();
    const pKey2 = acc2.to_string();
    const pKey3 = acc3.to_string();
    const pKey4 = acc4.to_string();
    const pKey5 = acc5.to_string();

    const addr1 = acc1.to_address().to_string()
    const addr2 = acc2.to_address().to_string()
    const addr3 = acc3.to_address().to_string()
    const addr4 = acc4.to_address().to_string()
    const addr5 = acc5.to_address().to_string()

    const packet_hash = BigInt(Math.round(Math.random() * Number.MAX_SAFE_INTEGER));

    describe("Screening Passed - All True", () => {

        const sign1 = signPacketHash(packet_hash, true, pKey1);
        const sign2 = signPacketHash(packet_hash, true, pKey2);
        const sign3 = signPacketHash(packet_hash, true, pKey3);
        const sign4 = signPacketHash(packet_hash, true, pKey4);
        const sign5 = signPacketHash(packet_hash, true, pKey5);


        test.failing("All zero address fails", async () => {
            await utils.get_majority_count(
                packet_hash,
                [
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                ],
                [
                    sign1,
                    sign1,
                    sign1,
                    sign1,
                    sign1,
                ]
            )
        })

        test("One non-zero address", async () => {
            const [passed, count] = await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                ],
                [
                    sign1,
                    sign1,
                    sign1,
                    sign1,
                    sign1,
                ]
            );
            expect(passed).toBe(true);
            expect(count).toBe(1);
        })

        test("Two non-zero address", async () => {
            const [passed, count] = await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    addr5,
                ],
                [
                    sign1,
                    sign1,
                    sign1,
                    sign1,
                    sign5,
                ]
            );
            expect(passed).toBe(true);
            expect(count).toBe(2);
        })

        test("Three non-zero address", async () => {
            const [passed, count] = await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    ALEO_ZERO_ADDRESS,
                    addr3,
                    ALEO_ZERO_ADDRESS,
                    addr5,
                ],
                [
                    sign1,
                    sign1,
                    sign3,
                    sign1,
                    sign5,
                ]
            );
            expect(passed).toBe(true);
            expect(count).toBe(3);
        })

        test("Four non-zero address", async () => {
            const [passed, count] = await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    ALEO_ZERO_ADDRESS,
                    addr3,
                    addr4,
                    addr5,
                ],
                [
                    sign1,
                    sign1,
                    sign3,
                    sign4,
                    sign5,
                ]
            );
            expect(passed).toBe(true);
            expect(count).toBe(4);
        })

        test("All non-zero address", async () => {
            const [passed, count] = await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    addr2,
                    addr3,
                    addr4,
                    addr5,
                ],
                [
                    sign1,
                    sign2,
                    sign3,
                    sign4,
                    sign5,
                ]
            );
            expect(passed).toBe(true);
            expect(count).toBe(5);
        })

        test.failing("Invalid signature", async () => {
            await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    addr2,
                    addr3,
                    addr4,
                    addr5,
                ],
                [
                    sign2,
                    sign2,
                    sign3,
                    sign4,
                    sign5,
                ]
            );
        })
    })

    describe("Screening Passed - All False", () => {

        const sign1 = signPacketHash(packet_hash, false, pKey1);
        const sign2 = signPacketHash(packet_hash, false, pKey2);
        const sign3 = signPacketHash(packet_hash, false, pKey3);
        const sign4 = signPacketHash(packet_hash, false, pKey4);
        const sign5 = signPacketHash(packet_hash, false, pKey5);


        test.failing("All zero address fails", async () => {
            await utils.get_majority_count(
                packet_hash,
                [
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                ],
                [
                    sign1,
                    sign1,
                    sign1,
                    sign1,
                    sign1,
                ]
            )
        })

        test("One non-zero address", async () => {
            const [passed, count] = await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                ],
                [
                    sign1,
                    sign1,
                    sign1,
                    sign1,
                    sign1,
                ]
            );
            expect(passed).toBe(false);
            expect(count).toBe(1);
        })

        test("Two non-zero address", async () => {
            const [passed, count] = await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    addr5,
                ],
                [
                    sign1,
                    sign1,
                    sign1,
                    sign1,
                    sign5,
                ]
            );
            expect(passed).toBe(false);
            expect(count).toBe(2);
        })

        test("Three non-zero address", async () => {
            const [passed, count] = await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    ALEO_ZERO_ADDRESS,
                    addr3,
                    ALEO_ZERO_ADDRESS,
                    addr5,
                ],
                [
                    sign1,
                    sign1,
                    sign3,
                    sign1,
                    sign5,
                ]
            );
            expect(passed).toBe(false);
            expect(count).toBe(3);
        })

        test("Four non-zero address", async () => {
            const [passed, count] = await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    ALEO_ZERO_ADDRESS,
                    addr3,
                    addr4,
                    addr5,
                ],
                [
                    sign1,
                    sign1,
                    sign3,
                    sign4,
                    sign5,
                ]
            );
            expect(passed).toBe(false);
            expect(count).toBe(4);
        })

        test("All non-zero address", async () => {
            const [passed, count] = await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    addr2,
                    addr3,
                    addr4,
                    addr5,
                ],
                [
                    sign1,
                    sign2,
                    sign3,
                    sign4,
                    sign5,
                ]
            );
            expect(passed).toBe(false);
            expect(count).toBe(5);
        })

        test.failing("Invalid signature", async () => {
            await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    addr2,
                    addr3,
                    addr4,
                    addr5,
                ],
                [
                    sign2,
                    sign2,
                    sign3,
                    sign4,
                    sign5,
                ]
            );
        })
    })

    describe("Screening Passed - Mixed", () => {

        const sign1 = signPacketHash(packet_hash, true, pKey1);
        const sign2 = signPacketHash(packet_hash, true, pKey2);
        const sign3 = signPacketHash(packet_hash, false, pKey3);
        const sign4 = signPacketHash(packet_hash, false, pKey4);
        const sign5 = signPacketHash(packet_hash, false, pKey5);


        test("One passed - passed majority", async () => {
            const [passed, count] = await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                ],
                [
                    sign1,
                    sign1,
                    sign1,
                    sign1,
                    sign1,
                ]
            );
            expect(passed).toBe(true);
            expect(count).toBe(1);
        })

        test.failing("One passed, one failed - invalid majority - must fail", async () => {
            await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    ALEO_ZERO_ADDRESS,
                    addr3,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                ],
                [
                    sign1,
                    sign1,
                    sign3,
                    sign1,
                    sign1,
                ]
            );
        })

        test("One passed, two failed - failed majority", async () => {
            const [passed, count] = await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    ALEO_ZERO_ADDRESS,
                    addr3,
                    addr4,
                    ALEO_ZERO_ADDRESS,
                ],
                [
                    sign1,
                    sign1,
                    sign3,
                    sign4,
                    sign1,
                ]
            );
            expect(passed).toBe(false);
            expect(count).toBe(2);
        })

        test("Two passed, one failed - passed majority", async () => {
            const [passed, count] = await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    addr2,
                    ALEO_ZERO_ADDRESS,
                    ALEO_ZERO_ADDRESS,
                    addr5,
                ],
                [
                    sign1,
                    sign2,
                    sign3,
                    sign1,
                    sign5,
                ]
            );
            expect(passed).toBe(true);
            expect(count).toBe(2);
        })

        test.failing("Two passed, two failed (equal failed and passed majority)- Must fail", async () => {
            await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    addr2,
                    addr3,
                    ALEO_ZERO_ADDRESS,
                    addr5,
                ],
                [
                    sign1,
                    sign2,
                    sign3,
                    sign4,
                    sign5,
                ]
            )
        })

        test("Two passed, three failed - failed majority", async () => {
            const [passed, count] = await utils.get_majority_count(
                packet_hash,
                [
                    addr1,
                    addr2,
                    addr3,
                    addr4,
                    addr5,
                ],
                [
                    sign1,
                    sign2,
                    sign3,
                    sign4,
                    sign5,
                ]
            );
            expect(passed).toBe(false);
            expect(count).toBe(3);
        })
    })
})