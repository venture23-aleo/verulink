import { TbAddChain, TsAddToken, TbAddService } from "../artifacts/js/types";
import { evm2AleoArr, hashStruct } from "../utils/utils";

import * as js2leo from '../artifacts/js/js2leo';
import { TOTAL_PROPOSALS_INDEX, aleoTsProgramAddr, aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5, councilProgramAddr, councilThreshold, ethChainId, ethTsContractAddr, wusdcConnectorAddr, wusdcTokenAddr } from "./testnet.data";
import { Token_bridge_v0001Contract } from "../artifacts/js/token_bridge_v0001";
import { Token_service_v0001Contract } from "../artifacts/js/token_service_v0001";
import { Council_v0001Contract } from "../artifacts/js/council_v0001";
import { Wusdc_token_v0001Contract } from "../artifacts/js/wusdc_token_v0001";
import { Wusdc_holding_v0001Contract } from "../artifacts/js/wusdc_holding_v0001";
import { Wusdc_connector_v0001Contract } from "../artifacts/js/wusdc_connector_v0001";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const setup = async () => {
  const bridge = new Token_bridge_v0001Contract({mode: "execute", priorityFee: 10_000});
  const tokenService = new Token_service_v0001Contract({mode: "execute", priorityFee: 10_000});
  const council = new Council_v0001Contract({mode: "execute", priorityFee: 10_000});

  let tx, proposalId;

  // Deploy contracts
  tx = await bridge.deploy(); // 19_840_000
  await tx.wait()
  tx = await tokenService.deploy(); // 14_051_000
  await tx.wait();
  tx = await council.deploy(); // 29_917_000
  await tx.wait();
  
  // Initialize council program with a single council member and 1/5 threshold
  await council.initialize(
    [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
    councilThreshold
  );

  // Initialize bridge
  await bridge.initialize_tb(
    1,
    [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
    councilProgramAddr
  ); // 818_271
  await tokenService.initialize_ts(councilProgramAddr); // 117_842

  // TokenBridge: Add Ethereum Chain
  proposalId = parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbEnableChain: TbAddChain = {
    id: proposalId,
    chain_id: ethChainId
  };
  const tbEnableChainProposalHash = hashStruct(js2leo.getTbAddChainLeo(tbEnableChain)); 
  tx = await council.propose(proposalId, tbEnableChainProposalHash); // 477_914
  await tx.wait()

  await council.tb_enable_chain(
    tbEnableChain.id,
    tbEnableChain.chain_id,
  ) // 301_747

  // WrappedToken: Add new token
  const wusdcToken = new Wusdc_token_v0001Contract({mode: "execute"});
  const wusdcHolding = new Wusdc_holding_v0001Contract({mode: "execute"});
  const wusdcConnecter = new Wusdc_connector_v0001Contract({mode: "execute"});
  tx = await wusdcToken.deploy(); // 11_912_000
  await tx.wait();
  tx = await wusdcHolding.deploy(); // 5_039_000
  await tx.wait();
  tx = await wusdcConnecter.deploy(); // 7_653_000
  await tx.wait();
  await wusdcConnecter.initialize_wusdc(); // 239_906

  // TokenService: Support new token
  proposalId = parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tsAddToken: TsAddToken = {
    id: proposalId,
    token_address: wusdcTokenAddr,
    connector: wusdcConnectorAddr,
    min_transfer: BigInt(100),
    max_transfer: BigInt(100_000),
    outgoing_percentage: 100_00,
    time: 1,
    max_no_cap: BigInt(100_000)
  };
  const enableTokenProposalHash = hashStruct(js2leo.getTsAddTokenLeo(tsAddToken));
  await council.propose(proposalId, enableTokenProposalHash); // 477_914

  tx = await council.ts_support_token(
    tsAddToken.id,
    tsAddToken.token_address,
    tsAddToken.connector,
    tsAddToken.min_transfer,
    tsAddToken.max_transfer,
    tsAddToken.outgoing_percentage,
    tsAddToken.time,
    tsAddToken.max_no_cap
  );
  await tx.wait()

  // Bridge: EnableService
  proposalId = parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
  const tbAddService: TbAddService = {
    id: proposalId,
    service: aleoTsProgramAddr
  };
  const tbEnableServiceHash = hashStruct(js2leo.getTbAddServiceLeo(tbAddService));
  await council.propose(proposalId, tbEnableServiceHash);

  tx = await council.tb_enable_service(
    tbAddService.id,
    tbAddService.service,
  ); // 301_821
  await tx.wait()

};

setup();