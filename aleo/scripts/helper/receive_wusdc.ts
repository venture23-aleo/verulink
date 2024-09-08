import { ExecutionMode } from "@doko-js/core";
import { Token_service_dev_v2Contract } from "../../artifacts/js/token_service_dev_v2";
import { InPacket } from "../../artifacts/js/types/token_bridge_dev_v2";
import { createRandomPacket } from "../../utils/bridge_packet";
import { ALEO_ZERO_ADDRESS, aleoChainId, ethChainId, ethTsContractAddr, ethTsContractAddr3 } from "../../utils/constants";
import { evm2AleoArrWithoutPadding, generateRandomEthAddr, prunePadding } from "../../utils/ethAddress";
import { PrivateKey } from "@aleohq/sdk";
import { signPacket } from "../../utils/sign";
import { TokenOwner } from "../../artifacts/js/types/token_service_dev_v2";
import { hashStruct } from "../../utils/hash";
import { getTokenLeo, getTokenOwnerLeo } from "../../artifacts/js/js2leo/multi_token_support_program";


const mode = ExecutionMode.SnarkExecute;

let tokenID=BigInt("7190692537453907461105790569797103513515746302149567971663963167242253971983");
const ethUser = generateRandomEthAddr();
const receiver = ethUser.toLowerCase();
const tokenService = new Token_service_dev_v2Contract({ mode });

// console.log(tokenService.getAccounts());

const aleoUser1 = "aleo1s9jt6t6esqg4caw0lzhr393f80jd5mw2w4mn0hudze60fvnrlq9s9ryctf";
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
            const signature = signPacket(packet, true, "APrivateKey1zkp6pbBEyRwBMhu32RySNRQC4Y5kBjxwiGvYT7xNJXVHaxy");
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


const getHash = () =>{
  const t_owner:TokenOwner ={
    account: aleoUser1,
    token_id: tokenID
  };

  const hash = hashStruct(getTokenOwnerLeo(t_owner));
  console.log(hash);
}
getHash();