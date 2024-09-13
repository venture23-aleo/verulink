import { ExecutionMode, leo2js } from "@doko-js/core";
import { Vlink_token_service_council_v1Contract } from "../../artifacts/js/vlink_token_service_council_v1";
import { InPacket } from "../../artifacts/js/types/vlink_token_bridge_v1";
import { createRandomPacket } from "../../utils/bridge_packet";
import { ALEO_ZERO_ADDRESS, aleoChainId, ethChainId, ethTsContractAddr, ethTsContractAddr3 } from "../../utils/constants";
import { evm2AleoArrWithoutPadding, generateRandomEthAddr, prunePadding } from "../../utils/ethAddress";
import { PrivateKey } from "@aleohq/sdk";
import { signPacket } from "../../utils/sign";
import { TokenOwner } from "../../artifacts/js/types/token_registry";
import { hashStruct } from "../../utils/hash";
import { getTokenLeo, getTokenOwnerLeo } from "../../artifacts/js/js2leo/token_registry";
import { Vlink_token_service_v1Contract } from "../../artifacts/js/vlink_token_service_v1";
import { wusdcName } from "../../utils/mainnet.data";
import { hash } from "aleo-hasher";


const mode = ExecutionMode.SnarkExecute;

let tokenID = leo2js.field(hash('bhp256', wusdcName.toString()+"u128", "field"));
const ethUser = generateRandomEthAddr();
const receiver = ethUser.toLowerCase();
console.log("Receiver : ", receiver);
const tokenService = new Vlink_token_service_v1Contract({ mode });

// console.log(tokenService.getAccounts());

const aleoUser1 = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
const admin = aleoUser1;

const createPacket = (
    receiver: string,
    amount: bigint,
    aleoTsAddr: string
  ): InPacket => {
    return createRandomPacket(
      receiver,
      amount,
      ethChainId,
      aleoChainId,
      ethTsContractAddr,
      aleoTsAddr,
      tokenID,
      ethUser
    );
  };


  const receive_wusdc = async () =>{
    const packet = createPacket(aleoUser1, BigInt(100_000_000), tokenService.address());
            const signature = signPacket(packet, true, "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH");
            const signatures = [
              signature,
              signature,
              signature,
              signature,
              signature,
            ];
            const signers = [
              admin,
              ALEO_ZERO_ADDRESS,
              ALEO_ZERO_ADDRESS,
              ALEO_ZERO_ADDRESS,
              ALEO_ZERO_ADDRESS,
            ];
      
            const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
      
            const [screeningPassed, tx] = await tokenService.token_receive(
              prunePadding(packet.message.sender_address),
              packet.message.dest_token_id,
              packet.message.receiver_address,
              packet.message.amount,
              packet.sequence,
              packet.height,
              signers,
              signatures,
              packet.source.chain_id,
              prunePadding(packet.source.addr),
            );
            await tx.wait();
      
            const finalTokenSupply = await tokenService.total_supply(tokenID);
            console.log(finalTokenSupply);
  }

  const destTsAddr = ethTsContractAddr3.toLowerCase();
  const usdcContractAddr = "0xD342C031453c66A6D6c2a23D6dA86c30adA08C79"
  const destToken = usdcContractAddr.toLowerCase();


  const send_wusdc = async () =>{
    const amount = BigInt(100);
              const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
              console.log(initialTokenSupply);
              tokenService.connect(admin);
                const [tx] = await tokenService.token_send(
                  tokenID,
                  evm2AleoArrWithoutPadding(receiver),
                  amount,
                  ethChainId,
                  evm2AleoArrWithoutPadding(destTsAddr),
                  evm2AleoArrWithoutPadding(destToken),
                );
                await tx.wait();
              const finalTokenSupply = await tokenService.total_supply(tokenID);
              console.log(finalTokenSupply);
  }

receive_wusdc();

const getHash = () =>{
  const t_owner:TokenOwner ={
    account: aleoUser1,
    token_id: tokenID
  };

  const hash = hashStruct(getTokenOwnerLeo(t_owner));
  console.log(hash);
}
getHash();