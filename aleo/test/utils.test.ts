import { PrivateKey } from "@aleohq/sdk";
import { UtilsContract } from "../artifacts/js/utils";
import { ALEO_ZERO_ADDRESS } from "../utils/constants";

const utils = new UtilsContract({ mode: "evaluate" });

const generateRandomAddresses = () => {
}

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

})