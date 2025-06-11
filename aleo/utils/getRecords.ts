import { Transition } from "@doko-js/core/dist/outputs/types/transaction";
import { decryptToken } from "../artifacts/js/leo2js/token_registry";

export const getSignerPackets = async (transitions: Transition[], privateKey: string) => {
    console.log("============Finding the signers balance===============");
    const records = []
    const mintPrivatetransactions = transitions.filter(txn => txn.function == "mint_private");
    for (let i = 0; i < mintPrivatetransactions.length; i++) {
        try {
            const outputs = mintPrivatetransactions[i].outputs;
            const minted_record = outputs.filter(value => value.type == "record")
            const decryptedRecord = decryptToken(minted_record[0].value, privateKey)
            records.push(decryptedRecord)
        } catch (error) {
            console.log("Errror during record decryption!", error)
        }
    }

    const total_receieve_amount = records.reduce((sum, item) => BigInt(item.amount) + BigInt(sum), BigInt(0))
    return total_receieve_amount;
}