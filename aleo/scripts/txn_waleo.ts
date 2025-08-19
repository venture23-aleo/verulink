import { ExecutionMode } from "@doko-js/core";
import { Vlink_token_service_cd_v2Contract } from "../artifacts/js/vlink_token_service_cd_v2";
import { evm2AleoArrWithoutPadding } from "../utils/ethAddress";
import { BSC_TESTNET, waleoBSCTokenAddress, waleoBSCTokenService } from "../utils/testdata.data";
import { ALEO_ZERO_ADDRESS } from "../utils/constants";



const mode = ExecutionMode.SnarkExecute;
const tokenServiceWAleo = new Vlink_token_service_cd_v2Contract({ mode: mode });



const txn = async () => {


  // amount should be greater than 10_000_000
  const sent_amount = BigInt(15_000_000);
  const receiver = "0x0C9119f08cF3361c3F3abbBC593a1CE2e63068f7";
  // Initialize token service
  const initializeTokenServiceTx = await tokenServiceWAleo.token_send_public(evm2AleoArrWithoutPadding(receiver), sent_amount, BSC_TESTNET, evm2AleoArrWithoutPadding(waleoBSCTokenService), evm2AleoArrWithoutPadding(waleoBSCTokenAddress), BigInt(0), false);
  await initializeTokenServiceTx.wait();


}
const receive = async () => {
  const sender = "0x0C9119f08cF3361c3F3abbBC593a1CE2e63068f7"
  const receiver = "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"
  const amount = BigInt(1200000)
  const sequence = BigInt(1)
  const height = BigInt(62219520)
  const signers = ["aleo1efm3hazscfvwawkg6rast4p9eq9gsvgwsdr9vv9wgzmula8ckqrsh7udnv","aleo1eslxvrgwtev68t9y6l0nxtts86exewrucgj33aw309k20tch45ps6pex24", ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS]
  const signs = ["sign1mq0m2d6adpgu2mts30usdfj5nytqyjejcpwdd42d5l7ej7tdsspprns628l6xjanuryyt405xuawn427a43w7sn7zcgm6cvg6a30xqg6zpdhm3pgu80a50s5gq4vcrk4xme27nqh2zh0dmzk8dgc8at5pu2fsfk7xu2wp5uvxn9sshly38cr59869hnrft8ra7zv9hat3rfssg74jkv",
    "sign19pzed0jlpwexx4332gr64de8jauxsvs4rv67e2af3u2u9pvfcqq8h2wvj5g9y8j2eq60ty8jcnthcs6nm02v7j3flwumx7swwxsfsq4gn5s3nawm2kd052ekynu68mg4jty0wshn8udha3ss2zar3839q52er42ve68ugrhtzupr2apptlpejtcnm605j9zdun6ehfzqaa53yhkj2ts",
    "sign123ejpcwax09hjdpneyjzamxqsq7yuqt0cgalkhvvyef0uctq0uqe35gu29e8jk05c57cny4j0ug9t3vpsp9q849xffuagp5j7fpg2qdgn5s3nawm2kd052ekynu68mg4jty0wshn8udha3ss2zar3839q52er42ve68ugrhtzupr2apptlpejtcnm605j9zdun6ehfzqaa53yw8s98a", 
    "sign123ejpcwax09hjdpneyjzamxqsq7yuqt0cgalkhvvyef0uctq0uqe35gu29e8jk05c57cny4j0ug9t3vpsp9q849xffuagp5j7fpg2qdgn5s3nawm2kd052ekynu68mg4jty0wshn8udha3ss2zar3839q52er42ve68ugrhtzupr2apptlpejtcnm605j9zdun6ehfzqaa53yw8s98a", 
    "sign123ejpcwax09hjdpneyjzamxqsq7yuqt0cgalkhvvyef0uctq0uqe35gu29e8jk05c57cny4j0ug9t3vpsp9q849xffuagp5j7fpg2qdgn5s3nawm2kd052ekynu68mg4jty0wshn8udha3ss2zar3839q52er42ve68ugrhtzupr2apptlpejtcnm605j9zdun6ehfzqaa53yw8s98a"];

  const source_chain_id = BigInt(422842677857)
  const source_token_service_address = "0xa85b0e240e1f081d7d8a9127731c4d2ff318124f"
  const receiveTx = await tokenServiceWAleo.token_receive_public(evm2AleoArrWithoutPadding(sender), receiver, amount, sequence, height, signers, signs, source_chain_id, evm2AleoArrWithoutPadding(source_token_service_address));
  await receiveTx.wait();
  console.log("Receive transaction completed successfully.");
}


// txn();
receive();
