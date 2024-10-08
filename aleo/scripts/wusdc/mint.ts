import {
  aleoChainId,
  ethChainId,
  ethTsContractAddr 
} from "../../utils/constants";
import { Token_bridge_v0003Contract } from "../../artifacts/js/token_bridge_v0003";
import { } from "../../utils/mainnet.data";
import { Wusdc_token_v0003Contract } from "../../artifacts/js/wusdc_token_v0003";
import { Wusdc_connector_v0003_0Contract } from "../../artifacts/js/wusdc_connector_v0003_0";
import { Address, PrivateKey } from "@aleohq/sdk";
import { generateRandomEthAddr } from "../../utils/ethAddress";
import { signPacket } from "../../utils/sign";
import { ALEO_ZERO_ADDRESS} from "../../utils/constants";
import { Token_service_v0003Contract } from "../../artifacts/js/token_service_v0003";
import { validateSetup } from "../setup";
import { InPacket } from "../../artifacts/js/types/token_bridge_v0003";
import { createRandomPacket } from "../../utils/packet";
import { getBytes } from "ethers";
import { ExecutionMode } from "@doko-js/core";

const mode = ExecutionMode.SnarkExecute;

const bridge = new Token_bridge_v0003Contract({ mode});
const wusdcToken = new Wusdc_token_v0003Contract({ mode});
const wusdcConnecter = new Wusdc_connector_v0003_0Contract({ mode });
const tokenService = new Token_service_v0003Contract({ mode });

const ethUser = generateRandomEthAddr();
const createPacket = (aleoUser: string, amount: bigint): InPacket => {
  return createRandomPacket(aleoUser, amount, ethChainId, aleoChainId, ethTsContractAddr, tokenService.address(), wusdcToken.address(), ethUser);
}

export const mintWrappedToken = async (aleoUser: string, amount: bigint) => {
  await validateSetup();
  const packet = createPacket(aleoUser, amount);
  console.log(bridge.config.privateKey);
  const signature = signPacket(
    packet,
    true, // screening passed
    bridge.config.privateKey
  );
  const signatures = [signature, signature, signature, signature, signature];

  const signers = [
    Address.from_private_key(
      PrivateKey.from_string(bridge.config.privateKey)
    ).to_string(),
    ALEO_ZERO_ADDRESS,
    ALEO_ZERO_ADDRESS,
    ALEO_ZERO_ADDRESS,
    ALEO_ZERO_ADDRESS,
  ];
  console.log(signers);

  const initialBalance = await wusdcToken.account(aleoUser, BigInt(0));
  const [tx] = await wusdcConnecter.wusdc_receive(
    Array.from(getBytes(ethUser)), // sender
    packet.message.receiver_address, // receiver
    packet.message.amount,
    packet.sequence,
    packet.height,
    signers,
    signatures
  );

  await wusdcConnecter.wait(tx);

  let finalBalance = await wusdcToken.account(aleoUser);
  console.log(`Balance of ${aleoUser}: ${initialBalance} -> ${finalBalance}`);
};

mintWrappedToken(
  "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px", 
  BigInt(400_000)
);