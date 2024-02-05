import { Wusdc_token_v0001Contract } from "../artifacts/js/wusdc_token_v0001"
import { string2AleoArr } from "../utils/string";

const wusdcToken = new Wusdc_token_v0001Contract({mode: "execute"});

const TIMEOUT = 100_000; // 100 seconds

describe("Token", () => {
    const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = wusdcToken.getAccounts();
    describe("Setup", () => {

        test("Deploy", async () => {
            const tx = await wusdcToken.deploy();
            await tx.wait();
        }, TIMEOUT)

        test("Initialize", async () => {
            const tx = await wusdcToken.initialize_token(
                string2AleoArr("USD Coin", 32),
                string2AleoArr("USDC", 16),
                6 // decimals
            )
            // @ts-ignore
            await tx.wait();
        }, TIMEOUT)
    })

    describe("Mint Public", () => {
        test("Mints the right amount", async() => {
            const amount = BigInt(20_000);
            const initialBalance = await wusdcToken.account(aleoUser2, BigInt(0));

            const tx = await wusdcToken.mint_public(aleoUser2, amount);
            // @ts-ignore
            await tx.wait();

            const finalBalance = await wusdcToken.account(aleoUser2);
            expect(finalBalance).toBe(initialBalance + amount);
        }, TIMEOUT)

        test("Can only be called from admin", async () => {
            wusdcToken.connect(aleoUser3);

            const amount = BigInt(10_000);
            const initialBalance = await wusdcToken.account(aleoUser2, BigInt(0));

            const tx = await wusdcToken.mint_public(aleoUser2, amount);
            // @ts-ignore
            const txReceipt = await tx.wait();
            expect(txReceipt.error).toBeTruthy();

            const finalBalance = await wusdcToken.account(aleoUser2);
            expect(finalBalance).toBe(initialBalance);
        }, TIMEOUT)

    })

    describe("Burn Public", () => {
        test("Burns the right amount", async () => {
            wusdcToken.connect(aleoUser1);

            const amount = BigInt(5_000);
            const initialBalance = await wusdcToken.account(aleoUser2, BigInt(0));

            const tx = await wusdcToken.burn_public(aleoUser2, amount);
            // @ts-ignore
            const txReceipt = await tx.wait();

            const finalBalance = await wusdcToken.account(aleoUser2);
            expect(finalBalance).toBe(initialBalance - amount);


        }, TIMEOUT)
        test("Can only be called from admin", async () => {
            wusdcToken.connect(aleoUser4);
            const amount = BigInt(5_000);
            const initialBalance = await wusdcToken.account(aleoUser2, BigInt(0));

            const tx = await wusdcToken.burn_public(aleoUser2, amount);
            // @ts-ignore
            const txReceipt = await tx.wait();
            expect(txReceipt.error).toBeTruthy();

            const finalBalance = await wusdcToken.account(aleoUser2);
            expect(finalBalance).toBe(initialBalance);
        })
    })

    describe("Transfer Public", () => {
        test("Transfers the right amount from right wallet", async () => {
            wusdcToken.connect(aleoUser2);
            const aleoUser2InitialBalance = await wusdcToken.account(aleoUser2);
            const aleoUser3InitialBalance = await wusdcToken.account(aleoUser3, BigInt(0));
            const amount = BigInt(500);
            expect(aleoUser2InitialBalance).toBeGreaterThanOrEqual(amount);

            const tx = await wusdcToken.transfer_public(aleoUser3, amount);
            // @ts-ignore
            await tx.wait();

            const aleoUser2FinalBalance = await wusdcToken.account(aleoUser2);
            const aleoUser3FinalBalance = await wusdcToken.account(aleoUser3);
            expect(aleoUser2FinalBalance).toBe(aleoUser2InitialBalance - amount);
            expect(aleoUser3FinalBalance).toBe(aleoUser3InitialBalance + amount);
        }, TIMEOUT)

    })
    describe("Transfer Private To Public", () => {
        test.todo("Transfers the right amount")
        test.todo("Can only be called from sender wallet")
    })
    describe("Transfer Public to Private", () => {
        test.todo("Transfers the right amount")
        test.todo("Can only be called from sender wallet")
    })
    describe("Approve Public", () => {
        test.todo("Approves the right amount")
        test.todo("Can only be called from sender wallet")
    })
    describe("UnApprove Public", () => {
        test.todo("Unapproves the right amount")
        test.todo("Can only be called from sender wallet")
    })
    describe("Transfer from Public", () => {
        test.todo("Transfers the spenders's right amount")
        test.todo("Can only be called from approver wallet")
    })
})