import { Wusdc_token_v0003Contract } from "../artifacts/js/wusdc_token_v0003";
import { Wusdc_holding_v0003Contract } from "../artifacts/js/wusdc_holding_v0003";
import { ALEO_ZERO_ADDRESS, OWNER_INDEX } from "../utils/constants";
import { ExecutionMode} from "@doko-js/core";


const mode = ExecutionMode.SnarkExecute;

const wusdcToken = new Wusdc_token_v0003Contract({ mode: mode });

const wusdcHolding = new Wusdc_holding_v0003Contract({mode: mode });

const TIMEOUT = 20000_000;

describe("Holding", () => {

    const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = wusdcHolding.getAccounts();

    const admin = aleoUser1;
    const user = aleoUser3;

    const amountToHold = BigInt(75);
    const amountToRelease = BigInt(50);

    describe("Deployment and setup", () => {
        test("Deploy token", async () => {
            const tx = await wusdcToken.deploy();
            await tx.wait();
        }, TIMEOUT)

        test("Deploy token holding", async () => {
            const tx = await wusdcHolding.deploy();
            await tx.wait();
        }, TIMEOUT);

        test("Initialize token holding", async () => {
            wusdcHolding.connect(admin);
            const [tx] = await wusdcHolding.initialize_holding(admin);
            await tx.wait();
            expect(await wusdcHolding.owner_holding(OWNER_INDEX)).toBe(admin);
        }, TIMEOUT);
    });

    describe("Hold Fund", () => {

        test("should hold fund", async () => {
            expect(await wusdcHolding.owner_holding(OWNER_INDEX)).toBe(admin)
            const initialHeldFund = await wusdcHolding.holdings(user, BigInt(0));

            wusdcHolding.connect(admin);
            const [tx] = await wusdcHolding.hold_fund(user, amountToHold);
            await tx.wait();

            const finalHeldAmount = await wusdcHolding.holdings(user);
            expect(finalHeldAmount).toBe(initialHeldFund + amountToHold);
        }, TIMEOUT);

        test.failing("should not be called from non-admin", async () => {
            wusdcHolding.connect(aleoUser3);
            const [tx] = await wusdcHolding.hold_fund(user, amountToHold);
            await tx.wait();
        }, TIMEOUT);

    });

    describe("Release Fund", () => {

        test("Initialize token", async () => {
            const isTokenInitialized = (await wusdcToken.token_owner(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
            if (!isTokenInitialized) {
                wusdcHolding.connect(admin);
                const [tx] = await wusdcToken.initialize_token(admin);
                await tx.wait();
                expect(await wusdcToken.token_owner(OWNER_INDEX)).toBe(admin);
            }
        }, TIMEOUT);

        test.failing("Releasing fund greater than held amount must fail", async () => {
            const heldAmount = await wusdcHolding.holdings(user, BigInt(0));
            wusdcHolding.connect(admin);
            const [tx] = await wusdcHolding.release_fund(user, heldAmount + BigInt(1));
            await tx.wait();
        }, TIMEOUT);

        test.failing("Releasing fund greater than balance must fail", async () => {
            const holdingBalance = await wusdcToken.account(wusdcHolding.address(), BigInt(0));
            const heldAmount = await wusdcHolding.holdings(user);
            expect(holdingBalance).toBeLessThan(heldAmount);

            wusdcHolding.connect(admin);
            const [tx] = await wusdcHolding.release_fund(user, heldAmount);
            await tx.wait();
        }, TIMEOUT);

        test("Mint token balance in holding", async () => {
            wusdcToken.connect(admin);
            const initialHoldingBalance = await wusdcToken.account(wusdcHolding.address(), BigInt(0));
            const [tx] = await wusdcToken.mint_public(wusdcHolding.address(), amountToHold);
            await tx.wait();
            const finalHoldingBalance = await wusdcToken.account(wusdcHolding.address());
            expect(finalHoldingBalance).toBe(initialHoldingBalance + amountToHold);
        }, TIMEOUT);

        test("Release fund", async () => {
            const initialHoldingBalance = await wusdcToken.account(wusdcHolding.address());
            const initialUserBalance = await wusdcToken.account(user, BigInt(0));
            const heldAmount = await wusdcHolding.holdings(user);
            expect(heldAmount).toBeGreaterThanOrEqual(amountToRelease);
            expect(initialHoldingBalance).toBeGreaterThanOrEqual(amountToRelease);

            wusdcHolding.connect(admin)
            const [tx] = await wusdcHolding.release_fund(user, amountToRelease); // keep holding 1unit
            await tx.wait();

            const finalHoldingBalance = await wusdcToken.account(wusdcHolding.address());
            const finalUserBalance = await wusdcToken.account(user);
            const finalHeldAmount = await wusdcHolding.holdings(user);
            expect(finalUserBalance).toBe(initialUserBalance + amountToRelease);
            expect(finalHoldingBalance).toBe(initialHoldingBalance - amountToRelease);
            expect(finalHeldAmount).toBe(heldAmount - amountToRelease);
        }, TIMEOUT);

        test.failing("should not be called from non-admin", async () => {
            const heldAmount = await wusdcHolding.holdings(user);
            expect(heldAmount).toBeGreaterThanOrEqual(BigInt(1))

            wusdcHolding.connect(aleoUser4);
            const [tx] = await wusdcHolding.release_fund(user, BigInt(1)); // release remaining 1unit
            await tx.wait();
        }, TIMEOUT);
    });

    describe("Transfer Ownership", () => {

        test.failing("should not tranfer_ownership by non-admin", async () => {
            wusdcHolding.connect(aleoUser2);
            const [tx] = await wusdcHolding.transfer_ownership_holding(aleoUser2);
            await tx.wait();
        }, TIMEOUT);

        test("should tranfer_ownership", async () => {
            wusdcHolding.connect(admin);
            const [tx] = await wusdcHolding.transfer_ownership_holding(aleoUser2);
            await tx.wait();
            expect(await wusdcHolding.owner_holding(OWNER_INDEX)).toBe(aleoUser2);
        }, TIMEOUT)
    })
})