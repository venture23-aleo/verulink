import { CouncilContract } from "../artifacts/js/council";
import { HoldingContract } from "../artifacts/js/holding";
import { Token_bridgeContract } from "../artifacts/js/token_bridge";
import { Token_serviceContract } from "../artifacts/js/token_service";
import { TbEnableChain, TsSupportToken, TbEnableService, TsSupportChain } from "../artifacts/js/types";
import { evm2AleoArr, hashStruct } from "../test/utils";

import * as js2leo from '../artifacts/js/js2leo';
import * as js2leoCommon from '../artifacts/js/js2leo/common';
import * as leo2jsCommon from '../artifacts/js/leo2js/common';

import { TOTAL_PROPOSALS_INDEX, aleoTsContract, aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5, councilThreshold, ethChainId, wusdcConnectorAddr, wusdcTokenAddr } from "../test/mockData";
import { Wusdc_tokenContract } from "../artifacts/js/wusdc_token";
import { Wusdc_holdingContract } from "../artifacts/js/wusdc_holding";
import { Wusdc_connectorContract } from "../artifacts/js/wusdc_connector";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const setup = async () => {
  const bridge = new Token_bridgeContract({mode: "execute"});
  const tokenService = new Token_serviceContract({mode: "execute"});
  const council = new CouncilContract({mode: "execute"});

  let tx, proposalId;

  // Deploy contracts
  await bridge.deploy();
  tx = await tokenService.deploy();
  await tx.wait();
  tx = await council.deploy();
  await tx.wait();
  
  // Initialize council program with a single council member and 1/5 threshold
  await council.initialize(
    [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
    councilThreshold
  );

  // Initialize bridge
  const councilAddress = "aleo17kz55dul4jmqmw7j3c83yh3wh82hlxnz7v2y5ccqzzj7r6yyeupq4447kp";
  await bridge.initialize_tb(
    1,
    [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
    councilAddress
  );
  await tokenService.initialize_ts(councilAddress);

  // TokenBridge: Add Ethereum Chain
  proposalId = parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbEnableChain: TbEnableChain = {
    id: proposalId,
    chain_id: ethChainId
  };
  const tbEnableChainProposalHash = hashStruct(js2leo.getTbEnableChainLeo(tbEnableChain));
  tx = await council.propose(proposalId, tbEnableChainProposalHash);
  await tx.wait()

  await council.tb_enable_chain(
    tbEnableChain.id,
    tbEnableChain.chain_id,
  )

  // TokenService: Add Token Service on Ethereum
  const tsEthereum = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
  proposalId = parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tsSupportChain: TsSupportChain = {
    id: proposalId,
    chain_id: ethChainId,
    token_service: evm2AleoArr(tsEthereum)
  };
  const supportChainTsProposalHash = hashStruct(js2leo.getTsSupportChainLeo(tsSupportChain));
  await council.propose(proposalId, supportChainTsProposalHash);

  tx = await council.ts_support_chain(
    tsSupportChain.id,
    tsSupportChain.chain_id,
    tsSupportChain.token_service,
  )
  await tx.wait()


  // WrappedToken: Add new token
  const wusdcToken = new Wusdc_tokenContract({mode: "execute"});
  const wusdcHolding = new Wusdc_holdingContract({mode: "execute"});
  const wusdcConnecter = new Wusdc_connectorContract({mode: "execute"});
  tx = await wusdcToken.deploy();
  await tx.wait();
  tx = await wusdcHolding.deploy();
  await tx.wait();
  tx = await wusdcConnecter.deploy();
  await tx.wait();
  await wusdcConnecter.initialize_wusdc();

  // TokenService: Support new token
  proposalId = parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tsSupportToken: TsSupportToken = {
    id: proposalId,
    token_id: wusdcTokenAddr,
    connector: wusdcConnectorAddr,
    minimum_transfer: BigInt(100),
    outgoing_percentage: 100_00,
    time: 1
  };
  const enableTokenProposalHash = hashStruct(js2leo.getTsSupportTokenLeo(tsSupportToken));
  await council.propose(proposalId, enableTokenProposalHash);

  tx = await council.ts_support_token(
    tsSupportToken.id,
    tsSupportToken.token_id,
    tsSupportToken.connector,
    tsSupportToken.minimum_transfer,
    tsSupportToken.outgoing_percentage,
    tsSupportToken.time,
  );
  await tx.wait()

  // Bridge: EnableService
  proposalId = parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbEnableService: TbEnableService = {
    id: proposalId,
    service: aleoTsContract
  };
  const tbEnableServiceHash = hashStruct(js2leo.getTbEnableServiceLeo(tbEnableService));
  await council.propose(proposalId, tbEnableServiceHash);

  tx = await council.tb_enable_service(
    tbEnableService.id,
    tbEnableService.service,
  );
  await tx.wait()

};

setup();
