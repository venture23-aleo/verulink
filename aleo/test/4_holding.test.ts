import { MtspContract } from "../artifacts/js/mtsp";
import { Holding_v0003Contract } from "../artifacts/js/holding_v0003";
import { ALEO_ZERO_ADDRESS, OWNER_INDEX } from "../utils/constants";
import { ExecutionMode} from "@doko-js/core";
import {Holder} from "../artifacts/js/types/holding_v0003"
import { hashStruct } from "../utils/hash";


const mode = ExecutionMode.SnarkExecute;

const Mtsp = new MtspContract({ mode: mode });

const holding = new Holding_v0003Contract({mode: mode });

const TIMEOUT = 20000_000;

describe("Holding", () => {

    const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = holding.getAccounts();

    const admin = aleoUser1;
    const user = aleoUser3;

    const amountToHold = BigInt(75);
    const amountToRelease = BigInt(50);

    const tokenID = BigInt(123456789);
    const name = BigInt(123456789);
    const symbol = BigInt(12345);
    const decimals = 18;
    const max_supply = BigInt(1000000000000000000000000);
    const external_authorization_required = false;
    const external_authorization_party = "";

    describe("Deployment and setup", () => {    
        test("Deploy MTSP and registering token", async () => {
            const tx = await Mtsp.deploy();
            await tx.wait();

            const [registerTx] = await Mtsp.register_token(tokenID, name, symbol, decimals, max_supply, external_authorization_required, external_authorization_party);
            await registerTx.wait();
        }, TIMEOUT)

        test("Deploy token holding", async () => {
            const tx = await holding.deploy();
            await tx.wait();
        }, TIMEOUT);

        test("Initialize token holding", async () => {
            holding.connect(admin);
            const [tx] = await holding.initialize_holding(admin);
            await tx.wait();
            expect(await holding.owner_holding(OWNER_INDEX)).toBe(admin);
        }, TIMEOUT);
    });

    describe("Hold Fund", () => {

        const holder: Holder = {
            account: user,
            token_id: tokenID
        };

        test("should hold fund", async () => {
            expect(await holding.owner_holding(OWNER_INDEX)).toBe(admin)
            const initialHeldFund = await holding.holdings(holder, BigInt(0));

            holding.connect(admin);
            const [tx] = await holding.hold_fund(user, tokenID, amountToHold);
            await tx.wait();

            const finalHeldAmount = await holding.holdings(holder);
            expect(finalHeldAmount).toBe(initialHeldFund + amountToHold);
        }, TIMEOUT);

        test("should not be called from non-admin", async () => {
            holding.connect(aleoUser3);
            const [tx] = await holding.hold_fund(user, tokenID, amountToHold);
            const result = await tx.wait();
            expect(result.execution).toBeUndefined(); 
        }, TIMEOUT);

    });

    describe("Release Fund", () => {

        // test("Initialize token", async () => {
        //     const isTokenInitialized = (await Mtsp.token_owner(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
        //     if (!isTokenInitialized) {
        //         wusdcHolding.connect(admin);
        //         const [tx] = await wusdcToken.initialize_token(admin);
        //         await tx.wait();
        //         expect(await wusdcToken.token_owner(OWNER_INDEX)).toBe(admin);
        //     }
        // }, TIMEOUT);

        const holder: Holder = {
            account: user,
            token_id: tokenID
        };

        const holdingContract = holding.address();
        const tokenOwner = { 
                tokenID, 
                holdingContract
            };
        const holding_balance = hashStruct(tokenOwner);

        const alice = {
            tokenID, 
            user
        };
        const alice_balance = hashStruct(alice);

        test("Releasing fund greater than held amount must fail", async () => {
            const heldAmount = await holding.holdings(holder, BigInt(0));
            holding.connect(admin);
            const [tx] = await holding.release_fund(user, tokenID, heldAmount + BigInt(1));
            const result = await tx.wait();
            expect(result.execution).toBeUndefined(); 
        }, TIMEOUT);

        test("Releasing fund greater than balance must fail", async () => {
            const holdingBalance = await Mtsp.balances(holding_balance);
            const heldAmount = await holding.holdings(holder);
            expect(holdingBalance).toBeLessThan(heldAmount);

            holding.connect(admin);
            const [tx] = await holding.release_fund(user, tokenID, heldAmount);
            const result = await tx.wait();
            expect(result.execution).toBeUndefined(); 
        }, TIMEOUT);

        test("Mint token balance in holding", async () => {
            Mtsp.connect(admin);
            const initialHoldingBalance = await Mtsp.balances(holding_balance);
            const [tx] = await Mtsp.mint_public(tokenID, holding.address(), amountToHold, 100000);
            await tx.wait();
            const finalHoldingBalance = await Mtsp.balances(holding_balance);
            expect(finalHoldingBalance.balance).toBe(initialHoldingBalance.balance + amountToHold);
        }, TIMEOUT);

        test("Release fund", async () => {
            const initialHoldingBalance = await Mtsp.balances(holding_balance);
            const initialUserBalance = await Mtsp.balances(alice_balance);
            const heldAmount = await holding.holdings(holder);
            expect(heldAmount).toBeGreaterThanOrEqual(amountToRelease);
            expect(initialHoldingBalance.balance).toBeGreaterThanOrEqual(amountToRelease);

            holding.connect(admin)
            const [tx] = await holding.release_fund(user, tokenID, amountToRelease); // keep holding 1unit
            await tx.wait();

            const finalHoldingBalance = await Mtsp.balances(holding_balance);
            const finalUserBalance = await Mtsp.balances(alice_balance);
            const finalHeldAmount = await holding.holdings(holder);
            expect(finalUserBalance).toBe(initialUserBalance.balance + amountToRelease);
            expect(finalHoldingBalance).toBe(initialHoldingBalance.balance - amountToRelease);
            expect(finalHeldAmount).toBe(heldAmount - amountToRelease);
        }, TIMEOUT);

        test("should not be called from non-admin", async () => {
            const heldAmount = await holding.holdings(holder);
            expect(heldAmount).toBeGreaterThanOrEqual(BigInt(1))

            holding.connect(aleoUser4);
            const [tx] = await holding.release_fund(user, tokenID, BigInt(1)); // release remaining 1unit
            const result = await tx.wait();
            expect(result.execution).toBeUndefined(); 
        }, TIMEOUT);
    });

    describe("Transfer Ownership", () => {

        test("should not tranfer_ownership by non-admin", async () => {
            holding.connect(aleoUser2);
            const [tx] = await holding.transfer_ownership_holding(aleoUser2);
            const result = await tx.wait();
            expect(result.execution).toBeUndefined(); 
        }, TIMEOUT);

        test("should tranfer_ownership", async () => {
            holding.connect(admin);
            const [tx] = await holding.transfer_ownership_holding(aleoUser2);
            await tx.wait();
            expect(await holding.owner_holding(OWNER_INDEX)).toBe(aleoUser2);
        }, TIMEOUT)
    })
})