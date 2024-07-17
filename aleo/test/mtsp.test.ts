import { ExecutionMode } from "@doko-js/core";
import { Multi_token_support_program_v1Contract } from "../artifacts/js/multi_token_support_program_v1";
import { hashStruct } from "../utils/hash";
import { TokenOwner } from "../artifacts/js/types/holding_v0003";

const mtsp = new Multi_token_support_program_v1Contract({mode:ExecutionMode.SnarkExecute});
(BigInt.prototype as any).toJSON = function () {
    return this.toString()+"field";
};

describe("Initialize state", () => {
    
    const TIMEOUT = 20000_000;
    const token_name = BigInt('6148332821651876206')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
    const token_symbol = BigInt("1431520323") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
    const token_decimals = 6
    const token_max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615
    const token_id = BigInt("7190692537453907461105790569797103513515746302149567971663963167242253971983");
    const [admin, aleouser2, aleoUser3, aleoUser4, aleoUser5] = mtsp.getAccounts();
    let token_hash ;

    // test ("Deploy mtsp", async()=>{
    //     const deployMtspTx = await mtsp.deploy();
    //     await deployMtspTx.wait();
    // }, TIMEOUT);
    // test ("Register token", async()=>{
    //     const [tx] = await mtsp.register_token(token_id, token_name, token_symbol, token_decimals, token_max_supply, false, admin);
    //     await tx.wait();
    // }, TIMEOUT);
    
    // test("Mint token", async()=>{
    //     const [tx] = await mtsp.mint_public(token_id, admin, BigInt(10000), 4294967295);
    //     await tx.wait();
    //     let token_owner:TokenOwner = {
    //         account: admin,
    //         token_id: token_id
    //     }
    //     const hash = hashStruct(token_owner);
    //     token_hash = hash;
    //     console.log(token_hash);
    //     const balance = await mtsp.authorized_balances(hash);
    //     console.log("Balances ",balance);
    // }, TIMEOUT);
    test("Burn token", async()=>{
        let token_owner:TokenOwner = {
            account: admin,
            token_id: token_id
        }
        const [tx] = await mtsp.burn_public(token_owner, BigInt(100));
        await tx.wait();
        // const bal = await mtsp.authorized_balances(token_hash);
        // console.log(bal);
        const balance = await mtsp.authorized_balances(token_hash);
        console.log("Balances ",balance);
    }, TIMEOUT);

});
