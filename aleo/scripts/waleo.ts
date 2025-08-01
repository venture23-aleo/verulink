import { Vlink_token_service_cd_v2Contract } from "../artifacts/js/vlink_token_service_cd_v2";
import { deployMainPrograms } from "./deployment/waleoProgram";
import { ExecutionMode } from "@doko-js/core";
import { ethChainId, ethTsContractAddr, testnetBNB, usdcContractAddr } from "../utils/constants";
import { execAddChain, proposeAddChain } from "./council/bridge/addChain";
import { execAddService, proposeAddService } from "./council/bridge/addService";
import { execAddTokenInfo, proposeAddTokenInfo } from "./council/tokenServiceWAleo/addNewToken";
import { execUnpauseToken, proposeUnpauseToken } from "./council/tokenServiceWAleo/unpause";


const mode = ExecutionMode.SnarkExecute;
const tokenServiceWAleo = new Vlink_token_service_cd_v2Contract({ mode: mode });



const setup = async (platform_fee: number, relayer_fee: bigint) => {

    // program deployment
    deployMainPrograms();

    // Bridge: Add BNB chain
    const addChainProposalId = await proposeAddChain(testnetBNB);
    await execAddChain(addChainProposalId, testnetBNB);

    // add new token service in tokenBridge
    const enableTokenServiceProposalId = await proposeAddService(tokenServiceWAleo.address());
    await execAddService(enableTokenServiceProposalId, tokenServiceWAleo.address());

    const minimumTransfer = BigInt(100);
    const maximumTransfer = BigInt(100000_000_000);


      const addWUSDCTokenProposalId = await proposeAddTokenInfo(
        minimumTransfer,
        maximumTransfer,
        usdcContractAddr,
        ethTsContractAddr,
        ethChainId,
        platform_fee,
        relayer_fee,
      );
      await execAddTokenInfo(
        addWUSDCTokenProposalId,
        minimumTransfer,
        maximumTransfer,
        usdcContractAddr,
        ethTsContractAddr,
        ethChainId,
        platform_fee,
        relayer_fee,
      );

    // unpause tokenService
    const unpauseTokenServiceProposalId = await proposeUnpauseToken();
    await execUnpauseToken(unpauseTokenServiceProposalId);
}