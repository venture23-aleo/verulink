import { ExecutionMode } from "@doko-js/core";
import { Vlink_token_service_v5Contract } from "../artifacts/js/vlink_token_service_v5";
import { evm2AleoArrWithoutPadding } from "./ethAddress";
import { ALEO_ZERO_ADDRESS, wethFeeRelayer, wethPlatformFee, wusdcFeeRelayer, wusdcPlatformFee } from "./testdata.data";
import { Token_registryContract } from "../artifacts/js/token_registry";
import { decryptToken } from "../artifacts/js/leo2js/token_registry";

const tokenService = new Vlink_token_service_v5Contract({ mode: ExecutionMode.SnarkExecute });
const tokenRegistry = new Token_registryContract({ mode: ExecutionMode.SnarkExecute });

const getPlatformFeeInAmount = (amount: bigint, platform_fee_percentage: number) => {
    //5% is equivalent to 500
    return (BigInt(platform_fee_percentage) * amount) / BigInt(100 * 100);
}



async function publicMint() {
    const sender = evm2AleoArrWithoutPadding("0x0c9119f08cf3361c3f3abbbc593a1ce2e63068f7")
    const token_id = BigInt("4319932120562127452403320957113880068475069215609937485736203163596013196688")
    const receiver = "aleo1wfaqpfc57m0wxmr9l6r8a5g95c0cthe54shzmcyu6wf6tqvady9syt27xt"
    const amount = BigInt("10000000000000000")
    const sequence = BigInt(1)
    const height = BigInt(23350122)
    const signers = [
        "aleo1eslxvrgwtev68t9y6l0nxtts86exewrucgj33aw309k20tch45ps6pex24",
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
    ]
    const signs = [
        "sign1lsm7h4659kx0qn7t2gern6hh6yuvgpc60qwmgh9d5ep95u49m5qxrn95s6cwlqct4e0zusyuth5ttm70l3jvvnlt2jdrvnjep692vq4gn5s3nawm2kd052ekynu68mg4jty0wshn8udha3ss2zar3839q52er42ve68ugrhtzupr2apptlpejtcnm605j9zdun6ehfzqaa53yqdmh63",
        "sign14kg6dqcma0q5fruuadf858zv83m4pm8hnx8kw067c6ehd6c3gup4fy76tqwtskftemdf8xgfnfsv6cfcrg7v2daegz7sclnn6ch5uqagn5s3nawm2kd052ekynu68mg4jty0wshn8udha3ss2zar3839q52er42ve68ugrhtzupr2apptlpejtcnm605j9zdun6ehfzqaa53y6f30es",
        "sign14kg6dqcma0q5fruuadf858zv83m4pm8hnx8kw067c6ehd6c3gup4fy76tqwtskftemdf8xgfnfsv6cfcrg7v2daegz7sclnn6ch5uqagn5s3nawm2kd052ekynu68mg4jty0wshn8udha3ss2zar3839q52er42ve68ugrhtzupr2apptlpejtcnm605j9zdun6ehfzqaa53y6f30es",
        "sign14kg6dqcma0q5fruuadf858zv83m4pm8hnx8kw067c6ehd6c3gup4fy76tqwtskftemdf8xgfnfsv6cfcrg7v2daegz7sclnn6ch5uqagn5s3nawm2kd052ekynu68mg4jty0wshn8udha3ss2zar3839q52er42ve68ugrhtzupr2apptlpejtcnm605j9zdun6ehfzqaa53y6f30es",
        "sign14kg6dqcma0q5fruuadf858zv83m4pm8hnx8kw067c6ehd6c3gup4fy76tqwtskftemdf8xgfnfsv6cfcrg7v2daegz7sclnn6ch5uqagn5s3nawm2kd052ekynu68mg4jty0wshn8udha3ss2zar3839q52er42ve68ugrhtzupr2apptlpejtcnm605j9zdun6ehfzqaa53y6f30es"
    ]
    const source_chain_id = BigInt("443067135441324596")
    const source_token_service_address = evm2AleoArrWithoutPadding("0xbb478fe03c90fff7770b57bdf00eeb576f4f4f41")
    const fee_relayer = wethFeeRelayer
    const version = 101
    const prev_total_supply = await tokenService.total_supply(token_id, BigInt(0))
    console.log("Previous Total Supply: ", prev_total_supply)
    const mintPacket = await tokenService.token_receive_public(
        sender,
        token_id,
        receiver,
        amount,
        sequence,
        height,
        signers,
        signs,
        source_chain_id,
        source_token_service_address,
        fee_relayer,
        version
    )
    await mintPacket.wait()
    const total_supply = await tokenService.total_supply(token_id)
    console.log("After Mint Total Supply: ", total_supply)
}

async function privateMint() {
    const sender = evm2AleoArrWithoutPadding("0x0c9119f08cf3361c3f3abbbc593a1ce2e63068f7")
    const token_id = BigInt("4319932120562127452403320957113880068475069215609937485736203163596013196688")
    const amount = BigInt("100000000000000000")
    const sequence = BigInt(16)
    const height = BigInt("7940141")
    const signers = [
        "aleo1eslxvrgwtev68t9y6l0nxtts86exewrucgj33aw309k20tch45ps6pex24",
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
    ]
    const signs = [
        "sign1lluk3xl25nt90faqjj975l0cmy7zcect2n7p2f4htk82xn9ervqrqse9xmam4u9lmd29u8yk4fcdrtrat5mxx3u3prq4ewq89z7d2q4gn5s3nawm2kd052ekynu68mg4jty0wshn8udha3ss2zar3839q52er42ve68ugrhtzupr2apptlpejtcnm605j9zdun6ehfzqaa53ys488wr",
        "sign14kg6dqcma0q5fruuadf858zv83m4pm8hnx8kw067c6ehd6c3gup4fy76tqwtskftemdf8xgfnfsv6cfcrg7v2daegz7sclnn6ch5uqagn5s3nawm2kd052ekynu68mg4jty0wshn8udha3ss2zar3839q52er42ve68ugrhtzupr2apptlpejtcnm605j9zdun6ehfzqaa53y6f30es",
        "sign14kg6dqcma0q5fruuadf858zv83m4pm8hnx8kw067c6ehd6c3gup4fy76tqwtskftemdf8xgfnfsv6cfcrg7v2daegz7sclnn6ch5uqagn5s3nawm2kd052ekynu68mg4jty0wshn8udha3ss2zar3839q52er42ve68ugrhtzupr2apptlpejtcnm605j9zdun6ehfzqaa53y6f30es",
        "sign14kg6dqcma0q5fruuadf858zv83m4pm8hnx8kw067c6ehd6c3gup4fy76tqwtskftemdf8xgfnfsv6cfcrg7v2daegz7sclnn6ch5uqagn5s3nawm2kd052ekynu68mg4jty0wshn8udha3ss2zar3839q52er42ve68ugrhtzupr2apptlpejtcnm605j9zdun6ehfzqaa53y6f30es",
        "sign14kg6dqcma0q5fruuadf858zv83m4pm8hnx8kw067c6ehd6c3gup4fy76tqwtskftemdf8xgfnfsv6cfcrg7v2daegz7sclnn6ch5uqagn5s3nawm2kd052ekynu68mg4jty0wshn8udha3ss2zar3839q52er42ve68ugrhtzupr2apptlpejtcnm605j9zdun6ehfzqaa53y6f30es"
    ]
    const source_chain_id = BigInt("28556963657430695")
    const source_token_service_address = evm2AleoArrWithoutPadding("0x5d2fe549d3b7c35f0ed3f4f8a3870e476622b303")
    const pre_image = BigInt('123')
    const receiver = "aleo1wfaqpfc57m0wxmr9l6r8a5g95c0cthe54shzmcyu6wf6tqvady9syt27xt"
    const version = 200
    const prev_total_supply = await tokenService.total_supply(token_id, BigInt(0))
    console.log("Previous Total Supply: ", prev_total_supply)
    const mintPacket = await tokenService.token_receive_private(
        sender,
        token_id,
        amount,
        sequence,
        height,
        signers,
        signs,
        source_chain_id,
        source_token_service_address,
        pre_image,
        receiver,
        version
    )
    await mintPacket.wait()
    const total_supply = await tokenService.total_supply(token_id)
    console.log("After Mint Total Supply: ", total_supply)

}


async function publicBurn() {
    const [aleoUser1, san] = tokenService.getAccounts()
    const token_id = BigInt("4319932120562127452403320957113880068475069215609937485736203163596013196688")
    const receiver = evm2AleoArrWithoutPadding("0x0c9119f08cf3361c3f3abbbc593a1ce2e63068f7")
    const amount = BigInt("5000000000000000")
    const dest_chain_id = BigInt("443067135441324596")
    const dest_token_service_address = evm2AleoArrWithoutPadding("0xbb478fe03c90fff7770b57bdf00eeb576f4f4f41")
    const dest_token_address = evm2AleoArrWithoutPadding("0x0000000000000000000000000000000000000001")
    const fee_platform = getPlatformFeeInAmount(amount, wethPlatformFee)
    const is_relayer_on = false
    tokenService.connect(san)
    const prev_total_supply = await tokenService.total_supply(token_id, BigInt(0))
    console.log("Previous Total Supply: ", prev_total_supply)
    const burnPublicTx = await tokenService.token_send_public(
        token_id,
        receiver,
        amount,
        dest_chain_id,
        dest_token_service_address,
        dest_token_address,
        fee_platform,
        is_relayer_on
    )
    await burnPublicTx.wait()
    const total_supply = await tokenService.total_supply(token_id)
    console.log("After Burn Total Supply: ", total_supply)

}

async function privateBurn() {
    const [aleoUser1, san] = tokenService.getAccounts()
    const token_id = BigInt("4319932120562127452403320957113880068475069215609937485736203163596013196688")
    const receiver = evm2AleoArrWithoutPadding("0x0c9119f08cf3361c3f3abbbc593a1ce2e63068f7")
    const amount = BigInt("1000000000000000")
    const dest_chain_id = BigInt("443067135441324596")
    const dest_token_service_address = evm2AleoArrWithoutPadding("0xbb478fe03c90fff7770b57bdf00eeb576f4f4f41")
    const dest_token_address = evm2AleoArrWithoutPadding("0x0000000000000000000000000000000000000001")
    const fee_platform = getPlatformFeeInAmount(amount, wethPlatformFee)
    const is_relayer_on = false

    tokenRegistry.connect(san)
    const makePrivate = await tokenRegistry.transfer_public_to_private(token_id, san, BigInt("1000000000000000"), false)
    const [ethRecord] = await makePrivate.wait()
    const sanPrivateKey = process.env.MINE_PRIVATE_KEY
    const decryptedRecord = decryptToken(ethRecord, sanPrivateKey)
    const prev_total_supply = await tokenService.total_supply(token_id, BigInt(0))
    console.log("Previous Total Supply: ", prev_total_supply)
    tokenService.connect(san)
    const burnPrivateTx = await tokenService.token_send_private(
        token_id,
        receiver,
        amount,
        dest_chain_id,
        dest_token_service_address,
        dest_token_address,
        decryptedRecord,
        fee_platform,
        is_relayer_on,
    )
    await burnPrivateTx.wait()
    const total_supply = await tokenService.total_supply(token_id)
    console.log("After Burn Total Supply: ", total_supply)
}



privateBurn()