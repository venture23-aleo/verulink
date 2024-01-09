import { CouncilContract } from "../artifacts/js/council";
import { HoldingContract } from "../artifacts/js/holding";
import { getSupportTokenLeo } from "../artifacts/js/js2leo/council_v2";
import { Token_bridgeContract } from "../artifacts/js/token_bridge";
import { Token_serviceContract } from "../artifacts/js/token_service";
import { ApproveChainBridgeProposal, EnableServiceProposal, EnableToken, SupportChainTS, SupportToken, TokenInfo, WTForeignContract, WrappedTokenInfo } from "../artifacts/js/types";
import { Wrapped_tokenContract } from "../artifacts/js/wrapped_token";
import { evm2AleoArr, string2AleoArr } from "../test/utils";

import * as js2leo from '../artifacts/js/js2leo';
import * as js2leoCommon from '../artifacts/js/js2leo/common';
import * as leo2jsCommon from '../artifacts/js/leo2js/common';

import { hash } from "aleo-hasher";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const hashStruct = (struct: any): BigInt => {
  const structString= js2leoCommon.json(struct)
  const structHash = hash("bhp256", structString, "field");
  const hashBigInt = leo2jsCommon.field(structHash);
  return hashBigInt
}

const setup = async () => {
  const bridge = new Token_bridgeContract({
    networkName: "testnet3",
    privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH",
    mode: "execute"
  });
  const tokenService = new Token_serviceContract({
    networkName: "testnet3",
    privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH",
    mode: "execute"
  });
  const wrappedToken = new Wrapped_tokenContract({
    networkName: "testnet3",
    privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH",
    mode: "execute"
  });
  const council = new CouncilContract({
    networkName: "testnet3",
    privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH",
    mode: "execute",
  });
  const holding = new HoldingContract({
    networkName: "testnet3",
    privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH",
    mode: "execute",
  });

  let tx;

  // USDC Contract Address on Ethereum
  const USDC = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

  // User Address on Ethereum
  const ethUser = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

  // Token Service Contract Address on Ethereum
  const ethTsContract = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48";

  // Token Service Contract on Aleo
  const aleoTsContract =
    "aleo1r55t75nceunfds6chwmmhhw3zx5c6wvf62jed0ldyygqctckaurqr8fnd3";

  // User address on Aleo
  const aleoUser =
    "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";

  // Deploy contracts
  await bridge.deploy();
  tx = await wrappedToken.deploy();
  await tx.wait();
  await holding.deploy();
  await tokenService.deploy();
  tx = await council.deploy();
  await tx.wait();

  // Initialize council program with a single council member and 1/5 threshold
  const councilMember =
    "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px";
  const councilThreshold = 1;
  await council.initialize(
    councilMember,
    councilMember,
    councilMember,
    councilMember,
    councilMember,
    councilThreshold
  );

  const councilAddress = "aleo17kz55dul4jmqmw7j3c83yh3wh82hlxnz7v2y5ccqzzj7r6yyeupq4447kp";
  // Initialize bridge
  const attestor = "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px"
  await bridge.bridge_initialize(
    1,
    attestor,
    attestor,
    attestor,
    attestor,
    attestor,
    councilAddress
  );
  await wrappedToken.wrapped_token_initialize(councilAddress);
  await holding.holding_initialize(councilAddress);
  await tokenService.token_service_initialize(councilAddress, councilAddress);

  // Add new token
  const TOTAL_PROPOSALS_INDEX = 3;
  const ethChainId = 1
  let proposalId = await council.settings(TOTAL_PROPOSALS_INDEX);
  const tokenInfo: TokenInfo = {
    name: string2AleoArr("Wrapped USDC", 32),
    symbol: string2AleoArr("USDC", 16),
    decimals: 18
  }
  const tokenOrigin: WTForeignContract = {
    chain_id: ethChainId,
    contract_address: evm2AleoArr(USDC)
  };
  const addNewTokenProposal: SupportToken = {
    id: proposalId,
    name: tokenInfo.name,
    symbol: tokenInfo.symbol,
    decimals: tokenInfo.decimals,
    origin_chain_id: tokenOrigin.chain_id,
    origin_contract_address: tokenOrigin.contract_address
  };
  const addNewProposalHash = hashStruct(js2leo.getSupportTokenLeo(addNewTokenProposal))
  tx = await council.propose(proposalId, addNewProposalHash)
  await tx.wait()

  await council.exec_add_new_token(
    addNewTokenProposal.id,
    addNewTokenProposal.name,
    addNewTokenProposal.symbol,
    addNewTokenProposal.decimals,
    addNewTokenProposal.origin_chain_id,
    addNewTokenProposal.origin_contract_address
  );

  const wUSDCInfo: WrappedTokenInfo = {
    token_info: tokenInfo,
    origin: tokenOrigin
  };
  const wUSDCInfoLeo = js2leo.getWrappedTokenInfoLeo(wUSDCInfo);
  const wUSDCInfoLeoString = js2leoCommon.json(wUSDCInfoLeo);
  const wUSDC = hash("bhp256", wUSDCInfoLeoString, "address")

  // Enable new token
  proposalId = await council.settings(TOTAL_PROPOSALS_INDEX);
  const enableTokenProposal: EnableToken = {
    id: proposalId,
    token_id: wUSDC,
    minimum_transfer: BigInt(100),
    outgoing_percentage: 100_00,
    time: 1
  };
  const enableTokenProposalHash = hashStruct(js2leo.getEnableTokenLeo(enableTokenProposal));
  await council.propose(proposalId, enableTokenProposalHash);

  await council.exec_enable_new_token(
    enableTokenProposal.id,
    enableTokenProposal.token_id,
    enableTokenProposal.minimum_transfer,
    enableTokenProposal.outgoing_percentage,
    enableTokenProposal.time,
  );

  // TODO: token_service.address()
  proposalId = await council.settings(TOTAL_PROPOSALS_INDEX);
  const enableServiceProposal: EnableServiceProposal = {
    id: proposalId,
    service: aleoTsContract
  };
  const enableServiceProposalHash = hashStruct(js2leo.getEnableServiceProposalLeo(enableServiceProposal));
  tx = await council.propose(proposalId, enableServiceProposalHash);
  await tx.wait()

  await council.exec_enable_service(
    enableServiceProposal.id,
    enableServiceProposal.service,
  );

  // Approve Ethereum Chain
  proposalId = await council.settings(TOTAL_PROPOSALS_INDEX);
  const approveChainProposal: ApproveChainBridgeProposal = {
    id: proposalId,
    chain_id: ethChainId
  };
  const approveChainProposalHash = hashStruct(js2leo.getApproveChainBridgeProposalLeo(approveChainProposal));
  tx = await council.propose(proposalId, approveChainProposalHash);
  await tx.wait()

  await council.exec_approve_chain_bridge(
    approveChainProposal.id,
    approveChainProposal.chain_id,
  )

  // Add Ethereum Token Service
  const tsEthereum = "0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"
  proposalId = await council.settings(TOTAL_PROPOSALS_INDEX);
  const supportChainTSProposal: SupportChainTS = {
    id: proposalId,
    chain_id: ethChainId,
    token_service: evm2AleoArr(tsEthereum)
  };
  const supportChainTsProposalHash = hashStruct(js2leo.getSupportChainTSLeo(supportChainTSProposal));
  await council.propose(proposalId, supportChainTsProposalHash);

  tx = await council.exec_support_chain_ts(
    supportChainTSProposal.id,
    supportChainTSProposal.chain_id,
    supportChainTSProposal.token_service,
  )
  await tx.wait()

};

setup();
