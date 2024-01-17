import { CouncilContract } from "../artifacts/js/council";
import { Token_bridgeContract } from "../artifacts/js/token_bridge";
import { Token_serviceContract } from "../artifacts/js/token_service";
import { ExternalProposal, InPacketFull, WUsdcRelease } from "../artifacts/js/types";
import { Wrapped_tokensContract } from "../artifacts/js/wrapped_tokens";
import { Wusdc_connectorContract } from "../artifacts/js/wusdc_connector";
import { Wusdc_tokenContract } from "../artifacts/js/wusdc_token";
import { TOTAL_PROPOSALS_INDEX, aleoChainId, aleoTsContract, aleoUser1, councilProgram, ethChainId, ethTsContract, ethUser, usdcContractAddr, wusdcConnectorAddr, wusdcHoldingAddr, wusdcTokenAddr } from "./mockData";

import { evm2AleoArr, hashStruct } from "../utils/utils";

import * as js2leo from '../artifacts/js/js2leo';

const bridge = new Token_bridgeContract({ mode: "execute"});
const council = new CouncilContract({mode: "execute"});
const wusdcToken = new Wusdc_tokenContract({ mode: "execute" });
const wusdcConnecter = new Wusdc_connectorContract({mode: "execute"});

describe("Happy Path", () => {

  const incomingSequence = 102;
  const amount = BigInt(10000);
  const height = 10;

  test("Receive A Packet", async () => {
  
    // Create a packet
    const packet: InPacketFull = {
      version: 0,
      sequence: incomingSequence,
      source: {
        chain_id: ethChainId,
        addr: evm2AleoArr(ethTsContract),
      },
      destination: {
        chain_id: aleoChainId,
        addr: aleoTsContract,
      },
      message: {
        token: wusdcTokenAddr,
        sender: evm2AleoArr(ethUser),
        receiver: aleoUser1,
        amount
      },
      height,
    };

    // Attest to a packet
    let tx = await bridge.attest(packet, false);

    // @ts-ignore
    await tx.wait()
  }, 100_000)

  test("Consume A Packet", async () => {
    // Consume the packet

    const tx = await wusdcConnecter.wusdc_receive(
      evm2AleoArr(ethUser), // sender
      aleoUser1, // receiver
      wusdcHoldingAddr, // actual receiver
      amount,
      incomingSequence, 
      height
    );

    
    // @ts-ignore
    await tx.wait()

    let balance = await wusdcToken.account(wusdcHoldingAddr)
    console.log(balance)

  }, 100_000);

  test("Relase held fund", async () => {
    const wusdcHoldingBalanceBefore = await wusdcToken.account(wusdcHoldingAddr)
    const userBalanceBefore = await wusdcToken.account(aleoUser1)
    const releaseWusdcProposal: WUsdcRelease = {
      receiver: aleoUser1,
      amount
    }
    const releaseProposalHash = hashStruct(js2leo.getWUsdcReleaseLeo(releaseWusdcProposal));

    const proposalId = parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const releaseProposal: ExternalProposal = {
      id: proposalId,
      external_program: wusdcConnectorAddr,
      proposal_hash: releaseProposalHash
    }
    const releaseWusdcProposalHash = hashStruct(js2leo.getExternalProposalLeo(releaseProposal));
    const proposeTx = await council.propose(proposalId, releaseWusdcProposalHash);

    // @ts-ignore
    await proposeTx.wait()

    const executeTx = await wusdcConnecter.wusdc_release(proposalId, aleoUser1, amount);

    // @ts-ignore
    await executeTx.wait()

    const wusdcHoldingBalanceAfter = await wusdcToken.account(wusdcHoldingAddr)
    const userBalanceAfter = await wusdcToken.account(aleoUser1)
    console.log(`WUSDC Holding Program: ${wusdcHoldingBalanceBefore} -> ${wusdcHoldingBalanceAfter}`)
    console.log(`User: ${userBalanceBefore} -> ${userBalanceAfter}`)

  }, 100_000)

});
