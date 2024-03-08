import { PrivateKey } from "@aleohq/sdk";
import { gettoken } from "../artifacts/js/leo2js/wusdc_token_v0003";
import { Approval, token, tokenLeo } from "../artifacts/js/types/wusdc_token_v0003";
import { Wusdc_token_v0003Contract } from "../artifacts/js/wusdc_token_v0003"
import { getApprovalLeo } from "../artifacts/js/js2leo/wusdc_token_v0003";
import { parseRecordString } from "@doko-js/core";
import { hashStruct } from "../utils/hash";

const wusdcToken = new Wusdc_token_v0003Contract({ mode: "execute" });

const TIMEOUT = 1000_000; // 100 seconds

describe.skip("Token", () => {
    const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = wusdcToken.getAccounts();
    const admin = aleoUser1

    describe("Setup", () => {

        test("Deploy", async () => {
            const tx = await wusdcToken.deploy();
            await wusdcToken.wait(tx);
        }, TIMEOUT)

        test("Initialize", async () => {
            const [tx] = await wusdcToken.initialize_token(admin)
            await wusdcToken.wait(tx);
        }, TIMEOUT)

    })

    describe("Mint Public", () => {
        test("Mints the right amount", async () => {
            const amount = BigInt(20_000);
            const initialBalance = await wusdcToken.account(aleoUser2, BigInt(0));

            const [tx] = await wusdcToken.mint_public(aleoUser2, amount);
            await wusdcToken.wait(tx);

            const finalBalance = await wusdcToken.account(aleoUser2);
            expect(finalBalance).toBe(initialBalance + amount);
        }, TIMEOUT)

        test.failing("Can only be called from admin", async () => {
            wusdcToken.connect(aleoUser3);
            const amount = BigInt(10_000);
            const [tx] = await wusdcToken.mint_public(aleoUser2, amount);
            await wusdcToken.wait(tx);
        }, TIMEOUT)
    })

    describe("Burn Public", () => {
        test("Burns the right amount", async () => {
            wusdcToken.connect(aleoUser1);

            const amount = BigInt(5_000);
            const initialBalance = await wusdcToken.account(aleoUser2, BigInt(0));

            const [tx] = await wusdcToken.burn_public(aleoUser2, amount);
            await wusdcToken.wait(tx);

            const finalBalance = await wusdcToken.account(aleoUser2);
            expect(finalBalance).toBe(initialBalance - amount);

        }, TIMEOUT)

        test.failing("Burns less than balance - must fail", async () => {
            const amount = BigInt(100_000);
            const initialBalance = await wusdcToken.account(aleoUser2, BigInt(0));
            expect(initialBalance).toBeLessThan(amount);

            const [tx] = await wusdcToken.burn_public(aleoUser2, amount);
            await wusdcToken.wait(tx);

        }, TIMEOUT)
    })

    describe("Public Transfers ", () => {
        const sender = aleoUser2;
        const receiverPrivateKey = new PrivateKey().to_string();
        const receiver = PrivateKey.from_string(receiverPrivateKey).to_address().to_string();
        test("Transfer Public", async () => {
            wusdcToken.connect(sender);
            const senderInitialBalance = await wusdcToken.account(sender);
            const receiverInitialBalance = await wusdcToken.account(receiver, BigInt(0));

            const amount = BigInt(500);
            expect(senderInitialBalance).toBeGreaterThanOrEqual(amount);

            wusdcToken.connect(sender);
            const [tx] = await wusdcToken.transfer_public(receiver, amount);
            await wusdcToken.wait(tx);

            const senderFinalBalance = await wusdcToken.account(sender);
            const receiverFinalBalance = await wusdcToken.account(receiver);
            expect(senderFinalBalance).toBe(senderInitialBalance - amount);
            expect(receiverFinalBalance).toBe(receiverInitialBalance + amount);
        }, TIMEOUT)

        test("Transfer Public To Private", async () => {
            wusdcToken.connect(sender);
            const senderInitialBalance = await wusdcToken.account(sender);

            const amount = BigInt(100);
            expect(senderInitialBalance).toBeGreaterThanOrEqual(amount);

            const [recordString, tx] = await wusdcToken.transfer_public_to_private(receiver, amount);
            await wusdcToken.wait(tx);

            const tokenRecord: token = gettoken(parseRecordString(PrivateKey.from_string(receiverPrivateKey).to_view_key().decrypt(recordString)) as tokenLeo);
            expect(tokenRecord.owner).toBe(receiver);
            expect(tokenRecord.amount).toBe(amount);

            const senderFinalBalance = await wusdcToken.account(sender);
            expect(senderFinalBalance).toBe(senderInitialBalance - amount);
        }, TIMEOUT)

    })

    describe("Private Transfers", () => {
        const sender = aleoUser2;
        const receiver = aleoUser4;
        let tokenRecord: token;
        let privateAmount = BigInt(100);

        beforeEach(async () => {
            wusdcToken.connect(sender);
            const senderInitialBalance = await wusdcToken.account(sender);
            expect(senderInitialBalance).toBeGreaterThanOrEqual(privateAmount);

            const [recordString, tx] = await wusdcToken.transfer_public_to_private(aleoUser2, privateAmount);
            await wusdcToken.wait(tx);
            tokenRecord = gettoken(parseRecordString(PrivateKey.from_string(wusdcToken.config.privateKey).to_view_key().decrypt(recordString)) as tokenLeo);

            const senderFinalBalance = await wusdcToken.account(sender);
            expect(senderFinalBalance).toBe(senderInitialBalance - privateAmount);
        }, TIMEOUT)

        test("Transfer Private to Public", async () => {
            const amount = BigInt(55);

            const receiverInitialBalance = await wusdcToken.account(aleoUser4, BigInt(0));
            const [remainingRecordString, pvtToPubTx] = await wusdcToken.transfer_private_to_public(tokenRecord, aleoUser4, amount);
            await wusdcToken.wait(pvtToPubTx);
            const receiverFinalBalance = await wusdcToken.account(aleoUser4);

            const remainingRecord: token = gettoken(parseRecordString(PrivateKey.from_string(wusdcToken.config.privateKey).to_view_key().decrypt(remainingRecordString)) as tokenLeo);
            expect(remainingRecord.amount).toBe(tokenRecord.amount - amount);
            expect(receiverFinalBalance).toBe(receiverInitialBalance + amount);
        }, TIMEOUT)

        test("Transfer Private", async () => {
            const amount = BigInt(75);

            const [senderRecordString, receiverRecordString, tx] = await wusdcToken.transfer_private(tokenRecord, receiver, amount);
            await wusdcToken.wait(tx);

            wusdcToken.connect(sender);
            const senderRecord: token = gettoken(parseRecordString(PrivateKey.from_string(wusdcToken.config.privateKey).to_view_key().decrypt(senderRecordString)) as tokenLeo);

            wusdcToken.connect(receiver);
            const receiverRecord: token = gettoken(parseRecordString(PrivateKey.from_string(wusdcToken.config.privateKey).to_view_key().decrypt(receiverRecordString)) as tokenLeo);

            expect(senderRecord.amount).toBe(tokenRecord.amount - amount);
            expect(receiverRecord.amount).toBe(amount);
        }, TIMEOUT)
    })

    describe("TransferFrom", () => {
        const approver = aleoUser2;
        const spender = aleoUser1;
        const receiver = aleoUser4;
        const amount = BigInt(100);

        const approval: Approval = {
            approver,
            spender
        };
        const approvalHash = hashStruct(getApprovalLeo(approval));

        test("Approve", async () => {
            const initialApproval = await wusdcToken.approvals(approvalHash, BigInt(0));

            wusdcToken.connect(approver);
            const [tx] = await wusdcToken.approve_public(spender, amount);
            await wusdcToken.wait(tx);

            const finalApproval = await wusdcToken.approvals(approvalHash, BigInt(0));
            expect(finalApproval).toBe(initialApproval + amount);

        }, TIMEOUT)

        test("Transfer", async () => {
            const approverInitialBalance = await wusdcToken.account(approver);
            const initialApproval = await wusdcToken.approvals(approvalHash, BigInt(0));
            const receiverInitialbalance = await wusdcToken.account(receiver, BigInt(0));

            wusdcToken.connect(spender);
            const [tx] = await wusdcToken.transfer_from_public(approver, receiver, amount);
            await wusdcToken.wait(tx);

            const approverFinalBalance = await wusdcToken.account(approver);
            const finalApproval = await wusdcToken.approvals(approvalHash, BigInt(0));
            const receiverFinalbalance = await wusdcToken.account(receiver, BigInt(0));

            expect(approverFinalBalance).toBe(approverInitialBalance - amount);
            expect(receiverFinalbalance).toBe(receiverInitialbalance + amount);
            expect(finalApproval).toBe(initialApproval - amount);

        }, TIMEOUT)

    })

})


describe("Transition Test Cases", () => {
    const wusdcToken = new Wusdc_token_v0003Contract({ mode: "evaluate" });
    const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = wusdcToken.getAccounts();

    describe("Private Transfers", () => {
        const sender = aleoUser2;
        const receiver = aleoUser4;
        let tokenRecord: token;
        let privateAmount = BigInt(100);

        test("Transfer Private", async () => {
            wusdcToken.connect(sender);
            tokenRecord = { owner: sender, amount: privateAmount, _nonce: BigInt(0) }
            const [remainingRecord, transferredRecord, tx] = await wusdcToken.transfer_private(tokenRecord, receiver, privateAmount);
            // @ts-ignore
            expect(remainingRecord.amount).toBe("0u128.private");
            // @ts-ignore
            expect(transferredRecord.amount).toBe("100u128.private");
        }, TIMEOUT)


        test("Transfer Private to Public", async () => {
            wusdcToken.connect(sender);
            tokenRecord = { owner: sender, amount: privateAmount, _nonce: BigInt(0) }
            const [remainingRecord, tx] = await wusdcToken.transfer_private_to_public(tokenRecord, receiver, privateAmount);
            // @ts-ignore
            expect(remainingRecord.amount).toBe("0u128.private");
        })


        test("Transfer Public to Private", async () => {
            wusdcToken.connect(sender);
            const [record, tx] = await wusdcToken.transfer_public_to_private(receiver, privateAmount);
            // @ts-ignore
            expect(record.amount).toBe("100u128.private");
        })
    })
})