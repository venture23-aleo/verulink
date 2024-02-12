import {
  THRESHOLD_INDEX,
  THRESHOLD_INDEX_COUNCIL,
  TOTAL_ATTESTORS_INDEX,
  TOTAL_MEMBERS_INDEX,
  TOTAL_PROPOSALS_INDEX,
  aleoUser1,
  aleoUser2,
  aleoUser3,
  aleoUser4,
  aleoUser5,
  aleoUser6,
  ethChainId,
  ethTsContractAddr,
  highThreshold,
  lowThreshold,
  maximum_trasnfer,
  minimum_transfer,
  newThreshold,
  normalThreshold,
  nullError,
  nullError2,
  nullError3,
  outgoing_percentage_in_time,
  threshold_no_limit,
} from "./mockData";

import { aleoArr2Evm, evm2AleoArr } from "../utils/ethAddress";
import { signPacket } from "../utils/sign";
import { hashStruct } from "../utils/hash";
import { getAddMemberLeo, getHoldingReleaseLeo, getProposalVoteLeo, getRemoveMemberLeo, getTbAddAttestorLeo, getTbAddChainLeo, getTbAddServiceLeo, getTbRemoveAttestorLeo, getTbRemoveChainLeo, getTbRemoveServiceLeo, getTbUpdateThresholdLeo, getTsAddTokenLeo, getTsRemoveTokenLeo, getTsUpdateMinTransferLeo, getTsUpdateWithdrawalLimitLeo, getUpdateThresholdLeo } from "../artifacts/js/js2leo/council_v0002";
import { InPacket, PacketId } from "../artifacts/js/types/token_bridge_v0002";
import { AddMember, HoldingRelease, ProposalVote, RemoveMember, TbAddAttestor, TbAddChain, TbAddService, TbRemoveAttestor, TbRemoveChain, TbRemoveService, TbUpdateThreshold, TsAddToken, TsRemoveToken, TsUpdateMinTransfer, TsUpdateWithdrawalLimit, UpdateThreshold } from "../artifacts/js/types/council_v0002";
import { createRandomPacket } from "../utils/packet";

import { hash } from "aleo-hasher";
import { Address, PrivateKey } from "@aleohq/sdk";
import { Token_bridge_v0002Contract } from "../artifacts/js/token_bridge_v0002";
import { Token_service_v0002Contract } from "../artifacts/js/token_service_v0002";
import { Wusdc_connector_v0002Contract } from "../artifacts/js/wusdc_connector_v0002";
import { Wusdc_holding_v0002Contract } from "../artifacts/js/wusdc_holding_v0002";
import { Wusdc_token_v0002Contract } from "../artifacts/js/wusdc_token_v0002";
import { Council_v0002Contract } from "../artifacts/js/council_v0002";
import { js2leo } from "@aleojs/core";

const council = new Council_v0002Contract({ mode: "execute" });
const bridge = new Token_bridge_v0002Contract({ mode: "execute" });
const token_service = new Token_service_v0002Contract({ mode: "execute" });
const wudc_connector = new Wusdc_connector_v0002Contract({ mode: "execute" });
const wudc_holding = new Wusdc_holding_v0002Contract({ mode: "execute" });
const wudc_token = new Wusdc_token_v0002Contract({ mode: "execute" });


let tx, initializeTx, errMsg, proposalId;
const admin = aleoUser1;

describe("Council", () => {
    describe("Deployment and initialization", () => {
  
      test("Deploy and intialize bridge", async () => {
        //bridge deploy
        tx = await bridge.deploy();
        await tx.wait();
        //initialize bridge
        initializeTx = await bridge.initialize_tb(
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          normalThreshold,
          admin
        );
        // @ts-ignore
        await initializeTx.wait();
        tx = await bridge.unpause_tb();
        // @ts-ignore
        await tx.wait();
      }, 20000_000);
  
      test("Deploy and intialize token service", async () => {
        // token_service deploy
        tx = await token_service.deploy();
        await tx.wait();
        // token_service intialize
        initializeTx = await token_service.initialize_ts(admin);
        // @ts-ignore
        await initializeTx.wait();
      }, 20000_000);
  
      test("Deploy council", async () => {
        // deploy council
        const deployTx = await council.deploy();
        await deployTx.wait();
      }, 200000_000);
  
      test("Deploy wudc_token", async () => {
        // wusdc_token deploy
        tx = await wudc_token.deploy();
        await tx.wait();
      }, 20000_000);
  
      test("Deploy wudc_holding", async () => {
        // wusdc_holding deploy
        tx = await wudc_holding.deploy();
        await tx.wait();
      }, 20000_000);
  
      test("Deploy and intialize wudc_connector", async () => {
        // wusdc_connector deploy
        tx = await wudc_connector.deploy();
        await tx.wait();
        //intialize wusdc_connector
        tx = await wudc_connector.initialize_wusdc();
        await tx.wait();
      }, 200000_000);
    
  
    test.failing(
      "Initialize - Threshold too low (must fail)",
      async () => {
        tx = await council.initialize(
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          lowThreshold
        );
        await tx.wait();
      },
      10000_000
    );
  
    test.failing(
      "Initialize - Threshold too high (must fail)",
      async () => {
        tx = await council.initialize(
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          highThreshold
        );
        await tx.wait();
      },
      10000_000
    );
  
    test.failing(
      "Initialize - Repeated attestors (must fail)",
      async () => {
        tx = await council.initialize(
          [aleoUser1, aleoUser1, aleoUser3, aleoUser3, aleoUser5],
          normalThreshold
        );
        await tx.wait();
      },
      1000_000
    );
  
    test("Initialize (First try) - Expected parameters (must pass)", async () => {
      let isCouncilInitialized = true;
      try {
        const threshold = await council.settings(true);
      } catch (err) {
        isCouncilInitialized = false;
      }
      if (!isCouncilInitialized) {
        const initializeTx = await council.initialize(
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          normalThreshold
        );
        // @ts-ignore
        await initializeTx.wait();
        expect(await council.members(aleoUser1)).toBe(true);
        expect(await council.members(aleoUser2)).toBe(true);
        expect(await council.members(aleoUser3)).toBe(true);
        expect(await council.members(aleoUser4)).toBe(true);
        expect(await council.members(aleoUser5)).toBe(true);
        expect(await council.settings(true)).toBe(normalThreshold);
        expect(await council.settings(TOTAL_MEMBERS_INDEX)).toBe(5);
        expect(await council.proposals(TOTAL_PROPOSALS_INDEX)).toBe(BigInt(0));
      }
    }, 20000_000);
  
    // run this also
  
    test(// TODO: this must fail - only throws error but the actual task passes
    // throws an error but err is  taken as passed result here
    "Initialize (Second try) - Expected parameters (must fail)", async () => {
      let isBridgeInitialized = true;
      try {
        const threshold = await council.settings(true);
      } catch (err) {
        isBridgeInitialized = false;
      }
  
      if (isBridgeInitialized) {
        const initializeTx = await council.initialize(
          [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
          normalThreshold
        );
        // @ts-ignore
        const receipt = await initializeTx.wait();
        expect(receipt.error).toBeTruthy();
      }
    }, 10000_000);
  });
  
  
  describe("Transfer Ownership to Council", () => {
  
    test("trasnfer ownership of token bridge program to council", async () => {
      tx = await bridge.transfer_ownership_tb(council.address());
      await tx.wait();
      expect(await bridge.owner_TB(true)).toBe(council.address());
    }, 20000_000);
  
    test("trasnfer ownership of token service program to council", async () => {
      token_service.connect(aleoUser1);
      tx = await token_service.transfer_ownership_ts(council.address());
      await tx.wait();
      expect(await token_service.owner_TS(true)).toBe(council.address());
    }, 20000_000);
  });
  
  describe("Propose", () => {
    test.skip("should not propose from other members", async () => {
      council.connect(aleoUser3);
      let isCouncilMember = await council.members(aleoUser3);
      if(isCouncilMember){
        console.log()
      }
      proposalId =
        parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
      const addNewMemeberProposal: AddMember = {
        id: proposalId,
        new_member: aleoUser6,
        new_threshold: normalThreshold,
      };
      const addNewProposalHash = hashStruct(
        getAddMemberLeo(addNewMemeberProposal)
      );
      tx = await council.propose(proposalId, addNewProposalHash);
      const receipt = await tx.wait();
      console.log(receipt)
      expect(receipt.error).toBeTruthy();
    }, 20000_000);
  
    test("proposal id must be correct", async () => {
      council.connect(aleoUser1);
      proposalId = parseInt(
        (await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()
      );
      const addNewMemeberProposal: AddMember = {
        id: proposalId,
        new_member: admin,
        new_threshold: normalThreshold,
      };
      const addNewProposalHash = hashStruct(
        getAddMemberLeo(addNewMemeberProposal)
      );
      tx = await council.propose(proposalId, addNewProposalHash);
      const receipt = await tx.wait();
      expect(receipt.error).toBeTruthy();
    }, 20000_000);
  
    test("should add a proposal", async () => {
      council.connect(aleoUser1);
      proposalId =
        parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
      const addNewMemeberProposal: AddMember = {
        id: proposalId,
        new_member: aleoUser6,
        new_threshold: normalThreshold,
      };
      const addNewProposalHash = hashStruct(
        getAddMemberLeo(addNewMemeberProposal)
      );
      const addNewProposalSign: ProposalVote = {
        proposal: addNewProposalHash,
        member: aleoUser1,
      };
      const addNewProposalSignHash = hashStruct(
        getProposalVoteLeo(addNewProposalSign)
      );
      tx = await council.propose(proposalId, addNewProposalHash);
      await tx.wait();
  
      expect(await council.proposals(TOTAL_PROPOSALS_INDEX)).toBe(
        BigInt(addNewMemeberProposal.id)
      );
      expect(await council.proposals(addNewMemeberProposal.id)).toBe(
        addNewProposalHash
      );
      expect(await council.proposal_votes(addNewProposalSignHash)).toBe(
        true
      );
      expect(await council.proposal_vote_counts(addNewProposalHash)).toBe(1);
    }, 20000_000);
  });
  
  describe("Add New Member", () => {
    test("should execute a proposal to add new member", async () => {
      proposalId = parseInt(
        (await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()
      );
  
      const addNewMemeberProposal: AddMember = {
        id: proposalId,
        new_member: aleoUser6,
        new_threshold: normalThreshold,
      };
      const addNewProposalHash = hashStruct(
        getAddMemberLeo(addNewMemeberProposal)
      );
      tx = await council.add_member(proposalId, aleoUser6, normalThreshold);
      await tx.wait();
  
      expect(await council.proposal_executed(addNewProposalHash)).toBe(true);
      expect(await council.members(aleoUser6)).toBe(true);
      expect(await council.settings(true)).toBe(normalThreshold);
      expect(await council.settings(TOTAL_MEMBERS_INDEX)).toBe(6);
    }, 20000_000);
  });
  
  describe("update threshold", () => {
      test("should remove a member and increase threshold", async () => {
        // proposing to remove member3
        proposalId =
          parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const removeMemeberProposal: RemoveMember = {
          id: proposalId,
          existing_member: aleoUser6,
          new_threshold: newThreshold,
        };
        const removeProposalHash = hashStruct(
          getRemoveMemberLeo(removeMemeberProposal)
        );
        tx = await council.propose(proposalId, removeProposalHash);
        await tx.wait();
  
        // executing to remove member3 and checking mappings
        tx = await council.remove_member(
          removeMemeberProposal.id,
          removeMemeberProposal.existing_member,
          removeMemeberProposal.new_threshold
        );
        await tx.wait();
        const isMember = await council.members(aleoUser6, false);
        expect(isMember).toBe(false);
        expect(await council.proposal_executed(removeProposalHash)).toBe(true);
        expect(await council.settings(true)).toBe(newThreshold);
        expect(await council.settings(TOTAL_MEMBERS_INDEX)).toBe(5);
      }, 20000_000);
  
      test("should update the threshold and vote", async () => {
        proposalId =
          parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const updateThreshold: UpdateThreshold = {
          id: proposalId,
          new_threshold: normalThreshold,
        };
        const updateThresholdHash = hashStruct(
          getUpdateThresholdLeo(updateThreshold)
        );
        const updateThresholdSign: ProposalVote = {
          proposal: updateThresholdHash,
          member: aleoUser2,
        };
        const updateThresholdSignHash = hashStruct(
          getProposalVoteLeo(updateThresholdSign)
        );
        // propse to update threshold
        tx = await council.propose(proposalId, updateThresholdHash);
        await tx.wait();
        // vote to update threshold
        council.connect(aleoUser2);
        tx = await council.vote(
          updateThresholdHash
        );
        await tx.wait();
        expect(
          await council.proposal_votes(updateThresholdSignHash)
        ).toBeTruthy();
        expect(await council.proposal_vote_counts(updateThresholdHash)).toBe(2);
        // execute update threshold
        tx = await council.update_threshold(
          updateThreshold.id,
          updateThreshold.new_threshold
        );
        await tx.wait();
        expect(await council.proposal_executed(updateThresholdHash)).toBe(true);
      }, 20000_000);
  });
  
  describe("Call to external programs", () => {
    describe("Token Bridge", () => {
      // test.todo("Update Governance")
      test("should add attestor", async () => {
        proposalId =
          parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const addAttestor: TbAddAttestor = {
          id: proposalId,
          new_attestor: council.address(),
          new_threshold: normalThreshold,
        };
        const addAttestorHash = hashStruct(
          getTbAddAttestorLeo(addAttestor)
        );
        //propose to add attestor
        tx = await council.propose(proposalId, addAttestorHash);
        await tx.wait();
  
        // execute to add attestor
        tx = await council.tb_add_attestor(
          addAttestor.id,
          addAttestor.new_attestor,
          addAttestor.new_threshold
        );
        const receipt =await tx.wait();
        console.log(receipt);
        
  
        expect(await council.proposal_executed(addAttestorHash)).toBe(true);
        expect(await bridge.attestors(council.address())).toBe(true);
        expect(await bridge.bridge_settings(THRESHOLD_INDEX)).toBe(
          normalThreshold
        );
        expect(await bridge.bridge_settings(TOTAL_ATTESTORS_INDEX)).toBe(6);
      }, 20000_000);
  
      test("should remove attestor", async () => {
        proposalId =
          parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
          1;
        const removeAttestor: TbRemoveAttestor = {
          id: proposalId,
          existing_attestor: council.address(),
          new_threshold: normalThreshold,
        };
        const removeAttestorHash = hashStruct(
          getTbRemoveAttestorLeo(removeAttestor)
        );
        //propose to remove attestor
        tx = await council.propose(proposalId, removeAttestorHash);
        await tx.wait();
  
        // execute to remove attestor
        tx = await council.tb_remove_attestor(
          proposalId,
          council.address(),
          normalThreshold
        );
        await tx.wait();
  
        expect(await council.proposal_executed(removeAttestorHash)).toBe(true);
        const isAttestor = await bridge.attestors(council.address(), false);
        expect(isAttestor).toBe(false);
        expect(await bridge.bridge_settings(THRESHOLD_INDEX)).toBe(
          normalThreshold
        );
        expect(await bridge.bridge_settings(TOTAL_ATTESTORS_INDEX)).toBe(5);
      }, 20000_000);
  
      test("should update token bridge threshold", async () => {
        proposalId =
          parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
          1;
        const tokenBridge_threshold: TbUpdateThreshold = {
          id: proposalId,
          new_threshold: newThreshold,
        };
        const tokenBridge_threshold_hash = hashStruct(
          getTbUpdateThresholdLeo(tokenBridge_threshold)
        );
        tx = await council.propose(
          tokenBridge_threshold.id,
          tokenBridge_threshold_hash
        );
        await tx.wait();
        tx = await council.tb_update_threshold(
          tokenBridge_threshold.id,
          tokenBridge_threshold.new_threshold
        );
        await tx.wait();
        expect(await council.proposal_executed(tokenBridge_threshold_hash)).toBe(
          true
        );
        expect(await bridge.bridge_settings(THRESHOLD_INDEX)).toBe(2);
      }, 20000_000);
  
      test("should enable chain bridge", async () => {
        proposalId =
          parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
          1;
        const approveChainProposal: TbAddChain = {
          id: proposalId,
          chain_id: ethChainId,
        };
        const approveChainProposalHash = hashStruct(
          getTbAddChainLeo(approveChainProposal)
        );
        tx = await council.propose(proposalId, approveChainProposalHash);
        await tx.wait();
  
        tx = await council.tb_add_chain(
          approveChainProposal.id,
          approveChainProposal.chain_id
        );
        await tx.wait();
        expect(await council.proposal_executed(approveChainProposalHash)).toBe(
          true
        );
        expect(await bridge.supported_chains(ethChainId)).toBe(true);
      }, 20000_000);
  
      test("should disable chain bridge", async () => {
        proposalId =
          parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
          1;
        const disapproveChainProposal: TbRemoveChain = {
          id: proposalId,
          chain_id: ethChainId,
        };
        const disapproveChainProposalHash = hashStruct(
          getTbRemoveChainLeo(disapproveChainProposal)
        );
        tx = await council.propose(proposalId, disapproveChainProposalHash);
        await tx.wait();
  
        tx = await council.disapprove_chain_bridge(
          disapproveChainProposal.id,
          disapproveChainProposal.chain_id
        );
        await tx.wait();
        expect(
          await council.proposal_executed(disapproveChainProposalHash)
        ).toBe(true);

        const isSupportedChain = await bridge.supported_chains(ethChainId, false);
        expect(isSupportedChain).toBe(false);
      }, 20000_000);
  
      test("should enable token_service program", async () => {
        proposalId =
          parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
          1;
        const enableServiceProposal: TbAddService = {
          id: proposalId,
          service: token_service.address(),
        };
        const enableServiceProposalHash = hashStruct(
          getTbAddServiceLeo(enableServiceProposal)
        );
        tx = await council.propose(proposalId, enableServiceProposalHash);
        await tx.wait();
  
        tx = await council.tb_add_service(
          enableServiceProposal.id,
          enableServiceProposal.service
        );
        await tx.wait();
        expect(await council.proposal_executed(enableServiceProposalHash)).toBe(
          true
        );
        expect(await bridge.supported_services(token_service.address())).toBe(true);
      }, 20000_000);
  
      test("should disable token_service program", async () => {
        proposalId =
          parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
          1;
        const disableServiceProposal: TbRemoveService = {
          id: proposalId,
          service: token_service.address(),
        };
        const disableServiceProposalHash = hashStruct(
          getTbRemoveServiceLeo(disableServiceProposal)
        );
        tx = await council.propose(proposalId, disableServiceProposalHash);
        await tx.wait();
  
        tx = await council.tb_remove_service(
          disableServiceProposal.id,
          disableServiceProposal.service
        );
        await tx.wait();
        expect(await council.proposal_executed(disableServiceProposalHash)).toBe(
          true
        );
        const isSupportedService = await bridge.supported_services(token_service.address(), false);
        expect(isSupportedService).toBe(false);
      }, 20000_000);
    });
  
    describe("Token Service", () => {
          // test.todo("Update Governance")
      // test("should support chain token service", async () => {
      //   proposalId =
      //     parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
      //     1;
      //   const approveChainProposal: = {
      //     id: proposalId,
      //     chain_id: ethChainId,
      //     token_service: evm2AleoArr(ethTsContractAddr),
      //   };
      //   const approveChainProposalHash = hashStruct(
      //     getTsSupportChainLeo(approveChainProposal)
      //   );
      //   tx = await council.propose(proposalId, approveChainProposalHash);
      //   await tx.wait();
  
      //   tx = await council.ts_support_chain(
      //     approveChainProposal.id,
      //     approveChainProposal.chain_id,
      //     approveChainProposal.token_service
      //   );
      //   await tx.wait();
      //   expect(await council.proposal_executed(approveChainProposalHash)).toBe(
      //     true
      //   );
      //   expect(
      //     await token_service.token_service_contracts(ethChainId)
      //   ).toStrictEqual(approveChainProposal.token_service);
      // }, 20000_000);
  
      // test("should support chain token service", async () => {
      //   proposalId =
      //     parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
      //     1;
      //   const disapproveChainProposal: TsRemoveChain = {
      //     id: proposalId,
      //     chain_id: ethChainId,
      //   };
      //   const disapproveChainProposalHash = hashStruct(
      //     js2leo.getTsRemoveChainLeo(disapproveChainProposal)
      //   );
      //   tx = await council.propose(proposalId, disapproveChainProposalHash);
      //   await tx.wait();
  
      //   tx = await council.ts_remove_chain(
      //     disapproveChainProposal.id,
      //     disapproveChainProposal.chain_id
      //   );
      //   await tx.wait();
      //   expect(await council.proposal_executed(disapproveChainProposalHash)).toBe(
      //     true
      //   );
      //   let errorMsg = "";
      //   try {
      //     await token_service.token_service_contracts(ethChainId);
      //   } catch (err) {
      //     errorMsg = err.message;
      //   }
      //   expect(errorMsg).toContain(nullError2);
      // }, 20000_000);
  
      test("should support new token", async () => {
        proposalId =
          parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
          1;
        const tsSupportToken: TsAddToken = {
          id: proposalId,
          token_address: wudc_token.address(),
          connector: wudc_connector.address(),
          min_transfer: BigInt(100),
          max_transfer: maximum_trasnfer,
          outgoing_percentage: 100_00,
          time: 1,
          max_no_cap: threshold_no_limit
        };
        const enableTokenProposalHash = hashStruct(
          getTsAddTokenLeo(tsSupportToken)
        );
        tx = await council.propose(proposalId, enableTokenProposalHash);
        await tx.wait();
  
        tx = await council.ts_add_token(
          tsSupportToken.id,
          tsSupportToken.token_address,
          tsSupportToken.connector,
          tsSupportToken.min_transfer,
          tsSupportToken.max_transfer,
          tsSupportToken.outgoing_percentage,
          tsSupportToken.time,
          tsSupportToken.max_no_cap
        );
        await tx.wait();
        expect(await council.proposal_executed(enableTokenProposalHash)).toBe(
          true
        );
        expect(
          await token_service.token_withdrawal_limits(wudc_token.address())
        ).toStrictEqual(outgoing_percentage_in_time);
        expect(await token_service.min_transfers(wudc_token.address())).toBe(
          minimum_transfer
        );
        expect(await token_service.max_transfers(wudc_token.address())).toBe(
          maximum_trasnfer
        );
        expect(await token_service.token_connectors(wudc_token.address())).toBe(
          wudc_connector.address()
        );
      }, 20000_000);
  
      test("should update minimum transfer", async () => {
        proposalId =
          parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
          1;
        const TsUpdateMinimumTransfer: TsUpdateMinTransfer = {
          id: proposalId,
          token_address: wudc_token.address(),
          min_transfer: BigInt(200),
        };
        const TsUpdateMinimumTransferHash = hashStruct(
          getTsUpdateMinTransferLeo(TsUpdateMinimumTransfer)
        );
        tx = await council.propose(proposalId, TsUpdateMinimumTransferHash);
        await tx.wait();
        tx = await council.ts_update_min_transfer(
          TsUpdateMinimumTransfer.id,
          TsUpdateMinimumTransfer.token_address,
          TsUpdateMinimumTransfer.min_transfer
        );
        await tx.wait();
        expect(
          await council.proposal_executed(TsUpdateMinimumTransferHash)
        ).toBeTruthy();
        expect(await token_service.min_transfers(wudc_token.address())).toBe(
          BigInt(200)
        );
      }, 20000_000);
  
      test("should update Outgoing Percentage", async () => {
        proposalId =
          parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
          1;
        const TsUpdateOutgoing: TsUpdateWithdrawalLimit = {
          id: proposalId,
          token_address: wudc_token.address(),
          percentage: 200,
          duration: 1,
          threshold_no_limit: BigInt(20000000000)
        };
        const TsUpdateOutgoingHash = hashStruct(
          getTsUpdateWithdrawalLimitLeo(TsUpdateOutgoing)
        );
        tx = await council.propose(proposalId, TsUpdateOutgoingHash);
        await tx.wait();
        tx = await council.ts_update_outgoing_percentage(
          TsUpdateOutgoing.id,
          TsUpdateOutgoing.token_address,
          TsUpdateOutgoing.percentage,
          TsUpdateOutgoing.duration, 
          TsUpdateOutgoing.threshold_no_limit
        );
        await tx.wait();
        expect(
          await council.proposal_executed(TsUpdateOutgoingHash)
        ).toBeTruthy();
        const new_outgoing_percentage = {
          percentage: 200,
          duration: 1,
          threshold_no_limit: BigInt(20000000000)
        };
        expect(
          await token_service.token_withdrawal_limits(wudc_token.address())
        ).toStrictEqual(new_outgoing_percentage);
      }, 20000_000);
  
      test("should remove a token", async () => {
        proposalId =
          parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
          1;
        const RemoveToken: TsRemoveToken = {
          id: proposalId,
          token_address: wudc_token.address(),
        };
        const RemoveTokenHash = hashStruct(
          getTsRemoveTokenLeo(RemoveToken)
        );
        tx = await council.propose(proposalId, RemoveTokenHash);
        await tx.wait();
        tx = await council.ts_remove_token(RemoveToken.id, RemoveToken.token_address);
        await tx.wait();
        expect(await council.proposal_executed(RemoveTokenHash)).toBeTruthy();
        try {
          await token_service.token_connectors(wudc_token.address());
        } catch (err) {
          errMsg = false;
        }
        expect(errMsg).toBe(false);
        try {
          await token_service.token_withdrawal_limits(wudc_token.address());
        } catch (err) {
          errMsg = false;
        }
        expect(errMsg).toBe(false);
        try {
          await token_service.min_transfers(wudc_token.address());
        } catch (err) {
          errMsg = false;
        }
        expect(errMsg).toBe(false);
      }, 20000_000);
  
      //     test.todo("Update Connector")
    });
  });
  });