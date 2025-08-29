import { ALEO_ZERO_ADDRESS, OWNER_INDEX } from "../utils/constants";
import { ExecutionMode } from "@doko-js/core";
import { Holder } from "../artifacts/js/types/vlink_token_service_v2";
import { Vlink_holding_cd_v7Contract } from "../artifacts/js/vlink_holding_cd_v7";
import { CreditsContract } from "../artifacts/js/credits";


const mode = ExecutionMode.SnarkExecute;

const holding = new Vlink_holding_cd_v7Contract({ mode: mode });
const credits = new CreditsContract({ mode: mode });
const TIMEOUT = 20000_000;
(BigInt.prototype as any).toJSON = function () {
    return this.toString() + "field";
};

const NATIVE_TOKEN_ID = BigInt("3443843282313283355522573239085696902919850365217539366784739393210722344986"); // The native token address of the Aleo network


describe("Holding", () => {
    const [aleoUser1, aleoUser2, aleoUser3] = holding.getAccounts();
    const admin = aleoUser1;
    const user = aleoUser3;

    const amountToHold = BigInt(75);
    const amountToRelease = BigInt(10);


    describe("Deployment", () => {

        test(
            "Deploy Holding",
            async () => {
                const deployTx = await holding.deploy();
                await deployTx.wait()
            },
            TIMEOUT
        );
    })

    describe("Initialization", () => {

        test.failing("Should not initialized from non initializer", async () => {
            holding.connect(aleoUser3);
            const tx = await holding.initialize_holding(admin);
            await tx.wait();
        }, TIMEOUT);

        test("Initialize token holding", async () => {
            const isHoldingInitialized = (await holding.owner_holding(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
            expect(isHoldingInitialized).toBe(false)
            if (!isHoldingInitialized) {
                holding.connect(admin);
                const tx = await holding.initialize_holding(admin);
                await tx.wait();
                expect(await holding.owner_holding(OWNER_INDEX)).toBe(admin);
            }
        }, TIMEOUT);

        test.failing("cannot initialize token holding twice", async () => {
            holding.connect(admin);
            const tx = await holding.initialize_holding(aleoUser1);
            await tx.wait();
        }, TIMEOUT);
    })

    describe("Hold Fund", () => {
        const holder: Holder = {
            account: user,
            token_id: NATIVE_TOKEN_ID
        };

        test("should not be called from non-admin", async () => {
            holding.connect(aleoUser3);
            const tx = await holding.hold_fund(user, amountToHold);
            await expect(tx.wait()).rejects.toThrow()
        }, TIMEOUT);

        test("should hold fund", async () => {
            expect(await holding.owner_holding(OWNER_INDEX)).toBe(admin)
            const initialHeldFund = await holding.holdings(holder, BigInt(0));

            holding.connect(admin);
            const tx = await holding.hold_fund(user, amountToHold);
            await tx.wait();

            const finalHeldAmount = await holding.holdings(holder);
            expect(finalHeldAmount).toBe(initialHeldFund + amountToHold);
        }, TIMEOUT);
    });

    describe("Release Fund", () => {
        const holder: Holder = {
            account: user,
            token_id: NATIVE_TOKEN_ID
        };

        const holdingContract = holding.address();

        test("should not be called from non-admin", async () => {
            holding.connect(aleoUser3);
            const tx = await holding.hold_fund(user, amountToHold);
            await expect(tx.wait()).rejects.toThrow()
        }, TIMEOUT);

        test("Releasing fund greater than held amount must fail", async () => {
            const heldAmount = await holding.holdings(holder, BigInt(0));
            holding.connect(admin);
            const tx = await holding.release_fund(user, heldAmount + BigInt(1));
            await expect(tx.wait()).rejects.toThrow()
        }, TIMEOUT);


        // todo, watch list
        test("Releasing fund greater than balance must fail", async () => {
            const holdingBalance = await credits.account(holdingContract, BigInt(0));
            holding.connect(admin);
            const tx = await holding.release_fund(user, holdingBalance + BigInt(1000));
            await expect(tx.wait()).rejects.toThrow()
        }, TIMEOUT);

        test("Transfer credits to holding", async () => {
            credits.connect(admin);
            const initialHoldingBalance = await credits.account(holdingContract, BigInt(0));
            const tx = await credits.transfer_public(holdingContract, amountToHold);
            await tx.wait();
            const finalHoldingBalance = await credits.account(holdingContract);
            expect(finalHoldingBalance).toBe(initialHoldingBalance + amountToHold);
        }, TIMEOUT);

        test("Release fund", async () => {
            const initialHoldingBalance = await credits.account(holdingContract, BigInt(0));

            const heldAmount = await holding.holdings(holder);
            expect(heldAmount).toBeGreaterThanOrEqual(amountToRelease);

            holding.connect(admin)
            const tx = await holding.release_fund(user, amountToRelease); // keep holding 1unit
            await tx.wait();

            const finalHoldingBalance = await credits.account(holdingContract);
            const finalHeldAmount = await holding.holdings(holder);

            expect(finalHoldingBalance).toBe(initialHoldingBalance - amountToRelease);
            expect(finalHeldAmount).toBe(heldAmount - amountToRelease);
        }, TIMEOUT);
    });


    describe("Transfer Ownership", () => {
        test("should not tranfer_ownership by non-admin", async () => {
            holding.connect(aleoUser2);
            const tx = await holding.transfer_ownership_holding(aleoUser2);
            await expect(tx.wait()).rejects.toThrow()
        }, TIMEOUT);

        test("should tranfer_ownership", async () => {
            holding.connect(admin);
            const tx = await holding.transfer_ownership_holding(aleoUser2);
            await tx.wait();
            expect(await holding.owner_holding(OWNER_INDEX)).toBe(aleoUser2);
        }, TIMEOUT)
    })
})