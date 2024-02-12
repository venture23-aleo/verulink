import { Wusdc_token_v0002Contract } from "../artifacts/js/wusdc_token_v0002";
import { TIMEOUT, nullError } from "./mockData";



import { Wusdc_holding_v0002Contract } from "../artifacts/js/wusdc_holding_v0002";


const wusdcToken = new Wusdc_token_v0002Contract({mode: "execute"});
const wusdcHolding = new Wusdc_holding_v0002Contract({mode: "execute"});
const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = wusdcHolding.getAccounts();



let tx, errMsg;

describe("Holding", () => {
    describe("deploy and intialize", () => {
        test("should be deployed", async() => {
            tx = await wusdcHolding.deploy();
            await tx.wait();
        }, TIMEOUT);

        test("should not be intialized before", async() => {
            try{
                await wusdcHolding.owner_holding(true);
            }catch(err){
                errMsg =  err.message;
            }
            expect(errMsg).toStrictEqual(nullError);
        }, TIMEOUT);

        test("should be initialzied", async () => {
            tx = await wusdcHolding.initialize_holding();
            await tx.wait();
            expect(await wusdcHolding.owner_holding(true)).toBe(aleoUser1);
        }, TIMEOUT);

    });
    describe("Hold Fund", () => {
        test("should not be called from non-admin", async() => {
            wusdcHolding.connect(aleoUser3);
            tx = await wusdcHolding.hold_fund(aleoUser3, BigInt(100));
            const receipt = await tx.wait();
            expect(receipt.error).toBeTruthy();
        }, TIMEOUT);

        test("should be hold fund", async() => {
            wusdcHolding.connect(aleoUser1);
            tx = await wusdcHolding.hold_fund(aleoUser3, BigInt(75));
            await tx.wait();
            expect(await wusdcHolding.holdings(aleoUser3)).toBe(BigInt(75));
        }, TIMEOUT);
    });
    describe("Release Fund", () => {
        test("should not be called from non-admin", async() => {
            wusdcHolding.connect(aleoUser3);
            const holdings = await wusdcHolding.holdings(aleoUser3);
            tx = await wusdcHolding.release_fund(aleoUser3, BigInt(75));
            await tx.wait();
            expect(await wusdcHolding.holdings(aleoUser3)).toBe(holdings);
        }, TIMEOUT);
        
        test("should release fund", async() => {
            wusdcHolding.connect(aleoUser1);
            const balance =  await wusdcToken.account(aleoUser3);
            const holdings = await wusdcHolding.holdings(aleoUser3);
            tx = await wusdcToken.mint_public(wusdcHolding.address(), BigInt(75));
            await tx.wait();
            const newBalance = balance + BigInt(75);
            tx = await wusdcHolding.release_fund(aleoUser3, BigInt(75));
            await tx.wait();
            expect(await wusdcToken.account(aleoUser3)).toBe(newBalance);
            const newHolding = holdings - BigInt(75);
            expect(await wusdcHolding.holdings(aleoUser3)).toBe(newHolding);
        },TIMEOUT);
    });

    describe("Transfer Ownership", () => {

        test("should not tranfer_ownership by non-admin", async() => {
            wusdcHolding.connect(aleoUser2);
            tx = await wusdcHolding.transfer_ownership_holding(aleoUser2);
            const receipt = await tx.wait();
            expect(receipt.error).toBeTruthy();
        });

        test("should tranfer_ownership", async() => {
            wusdcHolding.connect(aleoUser1);
            tx = await wusdcHolding.transfer_ownership_holding(aleoUser2);
            await tx.wait();
            expect(await wusdcHolding.owner_holding(true)).toBe(aleoUser2);
        })
    })
})