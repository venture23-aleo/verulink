import { CouncilContract } from "../artifacts/js/council";
import { HoldingContract } from "../artifacts/js/holding";
import { Token_bridgeContract } from "../artifacts/js/token_bridge";
import { Token_serviceContract } from "../artifacts/js/token_service";
import { TbEnableChain, WtAddToken, TsSupportToken, TbEnableService, TsSupportChain } from "../artifacts/js/types";
import { Wrapped_tokenContract } from "../artifacts/js/wrapped_token";
import { evm2AleoArr } from "../test/utils";

import * as js2leo from '../artifacts/js/js2leo';
import * as js2leoCommon from '../artifacts/js/js2leo/common';
import * as leo2jsCommon from '../artifacts/js/leo2js/common';

import { hash } from "aleo-hasher";
import { TOTAL_PROPOSALS_INDEX, aleoTsContract, attestor, councilMember, councilThreshold, ethChainId, usdcInfo, usdcOrigin, wUSDCProgramAddr } from "../test/mockData";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const hashStruct = (struct: any): bigint => {
  const structString= js2leoCommon.json(struct)
  const structHash = hash("bhp256", structString, "field");
  const hashBigInt = leo2jsCommon.field(structHash);
  return hashBigInt
}

const setup = async () => {
  const bridge = new Token_bridgeContract({mode: "execute"});
  const tokenService = new Token_serviceContract({mode: "execute"});
  const wrappedToken = new Wrapped_tokenContract({mode: "execute"});
  const council = new CouncilContract({mode: "execute"});
  const holding = new HoldingContract({mode: "execute"});

  let tx;

  // Deploy contracts
  await bridge.deploy();
  tx = await wrappedToken.deploy();
  await tx.wait();
  await holding.deploy();
  await tokenService.deploy();
  tx = await council.deploy();
  await tx.wait();

  // Initialize council program with a single council member and 1/5 threshold
  await council.initialize(
    councilMember,
    councilMember,
    councilMember,
    councilMember,
    councilMember,
    councilThreshold
  );

  // Initialize bridge
  const councilAddress = "aleo17kz55dul4jmqmw7j3c83yh3wh82hlxnz7v2y5ccqzzj7r6yyeupq4447kp";
  await bridge.initialize_tb(
    1,
    attestor,
    attestor,
    attestor,
    attestor,
    attestor,
    councilAddress
  );
  await wrappedToken.wrapped_token_initialize(councilAddress);
  await holding.initialize_holding(councilAddress);
  await tokenService.initialize_ts(councilAddress, councilAddress);

  let proposalId;

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
  proposalId = parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const wtAddToken: WtAddToken = {
    id: proposalId,
    name: usdcInfo.name,
    symbol: usdcInfo.symbol,
    decimals: usdcInfo.decimals,
    origin_chain_id: usdcOrigin.chain_id,
    origin_contract_address: usdcOrigin.contract_address
  };
  const tbAddNewProposalHash = hashStruct(js2leo.getWtAddTokenLeo(wtAddToken))
  tx = await council.propose(proposalId, tbAddNewProposalHash)
  await tx.wait()

  await council.wt_add_token(
    wtAddToken.id,
    wtAddToken.name,
    wtAddToken.symbol,
    wtAddToken.decimals,
    wtAddToken.origin_chain_id,
    wtAddToken.origin_contract_address
  );

  // TokenService: Support new token
  proposalId = parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tsSupportToken: TsSupportToken = {
    id: proposalId,
    token_id: wUSDCProgramAddr,
    minimum_transfer: BigInt(100),
    outgoing_percentage: 100_00,
    time: 1
  };
  const enableTokenProposalHash = hashStruct(js2leo.getTsSupportTokenLeo(tsSupportToken));
  await council.propose(proposalId, enableTokenProposalHash);

  await council.ts_support_token(
    tsSupportToken.id,
    tsSupportToken.token_id,
    tsSupportToken.minimum_transfer,
    tsSupportToken.outgoing_percentage,
    tsSupportToken.time,
  );

  // TODO: token_service.address()
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
