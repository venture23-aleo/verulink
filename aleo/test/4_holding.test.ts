import { Token_registryContract } from "../artifacts/js/token_registry";
import { Vlink_holding_v2Contract } from "../artifacts/js/vlink_holding_v2";
import { ALEO_ZERO_ADDRESS, OWNER_INDEX } from "../utils/constants";
import { ExecutionMode } from "@doko-js/core";
import { hashStruct, hashStructToAddress } from "../utils/hash";
import { TokenOwner } from "../artifacts/js/types/token_registry";
import { Image } from "../artifacts/js/types/vlink_holding_v2";
import { Holder } from "../artifacts/js/types/vlink_token_service_v2";


const mode = ExecutionMode.SnarkExecute;
// npm run test -- --runInBand ./test/4_holding.test.ts

const tokenRegistry = new Token_registryContract({ mode: mode });
const holding = new Vlink_holding_v2Contract({ mode: mode });
const TIMEOUT = 20000_000;
(BigInt.prototype as any).toJSON = function () {
    return this.toString() + "field";
};


describe("Holding", () => {
    const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = holding.getAccounts();
    const admin = aleoUser1;
    const user = aleoUser3;

    const amountToHold = BigInt(75);
    const amountToRelease = BigInt(10);

    const name = BigInt('6148332821651876206');
    const tokenID = hashStruct(name);
    const symbol = BigInt(12345);
    const decimals = 18;
    const max_supply = BigInt(1000000000000000000000000);
    const external_authorization_required = false;
    const external_authorization_party = aleoUser4;

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
        test("Registering token", async () => {
            const registerTx = await tokenRegistry.register_token(tokenID, name, symbol, decimals, max_supply, external_authorization_required, external_authorization_party);
            await registerTx.wait();
        }, TIMEOUT)


        test("Mint Registering token", async () => {
            const minttx = await tokenRegistry.mint_public(tokenID, holding.address(), BigInt(10000), 4294967295);
            await minttx.wait();
        }, TIMEOUT)

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
            const isHoldingInitialized = (await holding.owner_holding(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
            expect(isHoldingInitialized).toBe(true);
            holding.connect(admin);
            const tx = await holding.initialize_holding(aleoUser1);
            await tx.wait();
        }, TIMEOUT);
    })

    describe("Hold Fund", () => {
        const holder: Holder = {
            account: user,
            token_id: tokenID
        };

        test.failing("should not be called from non-admin", async () => {
            holding.connect(aleoUser3);
            const tx = await holding.hold_fund(user, tokenID, amountToHold);
            await tx.wait();
        }, TIMEOUT);

        test("should hold fund", async () => {
            expect(await holding.owner_holding(OWNER_INDEX)).toBe(admin)
            const initialHeldFund = await holding.holdings(holder, BigInt(0));

            holding.connect(admin);
            const tx = await holding.hold_fund(user, tokenID, amountToHold);
            await tx.wait();

            const finalHeldAmount = await holding.holdings(holder);
            expect(finalHeldAmount).toBe(initialHeldFund + amountToHold);
        }, TIMEOUT);
    });

    describe("Release Fund", () => {
        const holder: Holder = {
            account: user,
            token_id: tokenID
        };

        const holdingContract = holding.address();
        const tokenOwner: TokenOwner = {
            account: holdingContract,
            token_id: tokenID
        };

        const holding_balance = hashStruct(tokenOwner);
        const alice = {
            account: user,
            token_id: tokenID,
        };
        const alice_balance = hashStruct(alice);

        test.failing("should not be called from non-admin", async () => {
            holding.connect(aleoUser3);
            const tx = await holding.hold_fund(user, tokenID, amountToHold);
            await tx.wait();
        }, TIMEOUT);

        test.failing("Releasing fund greater than held amount must fail", async () => {
            const heldAmount = await holding.holdings(holder, BigInt(0));
            holding.connect(admin);
            const tx = await holding.release_fund(user, tokenID, heldAmount + BigInt(1));
            await tx.wait();
        }, TIMEOUT);

        test.failing("Releasing fund greater than balance must fail", async () => {
            const holdingBalance = await tokenRegistry.authorized_balances(holding_balance);
            holding.connect(admin);
            const tx = await holding.release_fund(user, tokenID, holdingBalance.balance + BigInt(1000));
            await tx.wait();
        }, TIMEOUT);

        test("Mint token balance in holding", async () => {
            tokenRegistry.connect(admin);
            const initialHoldingBalance = await tokenRegistry.authorized_balances(holding_balance);
            const tx = await tokenRegistry.mint_public(tokenID, holding.address(), amountToHold, 100000);
            await tx.wait();
            const finalHoldingBalance = await tokenRegistry.authorized_balances(holding_balance);
            expect(finalHoldingBalance.balance).toBe(initialHoldingBalance.balance + amountToHold);
        }, TIMEOUT);

        test("Release fund", async () => {
            const initialHoldingBalance = await tokenRegistry.authorized_balances(holding_balance);
            // const initialUserBalance = await tokenRegistry.authorized_balances(alice_balance, );
            const heldAmount = await holding.holdings(holder);
            expect(heldAmount).toBeGreaterThanOrEqual(amountToRelease);
            // expect(initialHoldingBalance.balance).toBeGreaterThanOrEqual(amountToRelease);

            holding.connect(admin)
            const tx = await holding.release_fund(user, tokenID, amountToRelease); // keep holding 1unit
            await tx.wait();

            const finalHoldingBalance = await tokenRegistry.authorized_balances(holding_balance);
            const finalUserBalance = await tokenRegistry.authorized_balances(alice_balance);
            const finalHeldAmount = await holding.holdings(holder);
            // expect(finalUserBalance).toBe(initialUserBalance.balance + amountToRelease);
            expect(finalHoldingBalance.balance).toBe(initialHoldingBalance.balance - amountToRelease);
            expect(finalHeldAmount).toBe(heldAmount - amountToRelease);
        }, TIMEOUT);
    });

    describe("Release Fund Private", () => {
        const holdingContract = holding.address();
        const tokenOwner: TokenOwner = {
            account: holdingContract,
            token_id: tokenID
        };
        const holding_balance = hashStruct(tokenOwner);
        const pre_image = BigInt(123);
        const image: Image = {
            pre_image,
            receiver: aleoUser1
        }
        const hashed_address = hashStructToAddress(image);
        const hashedHoldAmount = BigInt(1000);
        const hashedHolder: Holder = {
            account: hashed_address,
            token_id: tokenID
        }

        test.failing("should not be called from non-admin", async () => {
            holding.connect(aleoUser3);
            const tx = await holding.release_fund_private(image.receiver, pre_image, tokenID, amountToRelease);
            await tx.wait();
        }, TIMEOUT);

        test.failing("Releasing fund greater than held amount must fail", async () => {
            const heldAmount = await holding.holdings(hashedHolder, BigInt(0));
            holding.connect(admin);
            const tx = await holding.release_fund_private(image.receiver, pre_image, tokenID, heldAmount + BigInt(5));
            await tx.wait()
        }, TIMEOUT);

        test("should hold fund for hashed address", async () => {
            expect(await holding.owner_holding(OWNER_INDEX)).toBe(admin)
            const initialHeldFund = await holding.holdings(hashedHolder, BigInt(0));

            holding.connect(admin);
            const tx = await holding.hold_fund(hashed_address, tokenID, hashedHoldAmount);
            await tx.wait();

            const finalHeldAmount = await holding.holdings(hashedHolder);
            expect(finalHeldAmount).toBe(initialHeldFund + hashedHoldAmount);
        }, TIMEOUT);

        test("Release fund", async () => {
            const initialHoldingBalance = await tokenRegistry.authorized_balances(holding_balance);
            const heldAmount = await holding.holdings(hashedHolder);
            expect(heldAmount).toBeGreaterThanOrEqual(amountToRelease);
            holding.connect(admin)
            const tx = await holding.release_fund_private(image.receiver, pre_image, tokenID, amountToRelease); // keep holding 1unit
            await tx.wait();

            const finalHoldingBalance = await tokenRegistry.authorized_balances(holding_balance);
            const finalHeldAmount = await holding.holdings(hashedHolder);
            expect(finalHoldingBalance.balance).toBe(initialHoldingBalance.balance - amountToRelease);
            expect(finalHeldAmount).toBe(heldAmount - amountToRelease);
        }, TIMEOUT);
    });

    describe("Transfer Ownership", () => {
        test.failing("should not tranfer_ownership by non-admin", async () => {
            holding.connect(aleoUser2);
            const tx = await holding.transfer_ownership_holding(aleoUser2);
            await tx.wait();
        }, TIMEOUT);

        test("should tranfer_ownership", async () => {
            holding.connect(admin);
            const tx = await holding.transfer_ownership_holding(aleoUser2);
            await tx.wait();
            expect(await holding.owner_holding(OWNER_INDEX)).toBe(aleoUser2);
        }, TIMEOUT)
    })
})