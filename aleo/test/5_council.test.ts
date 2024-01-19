import {
  AddMember,
  InPacketFull,
  ProposalSign,
  RemoveMember,
  TbAddAttestor,
  TbDisableChain,
  TbDisableService,
  TbEnableChain,
  TbEnableService,
  TbRemoveAttestor,
  TbUpdateThreshold,
  TsRemoveChain,
  TsRemoveToken,
  TsSupportChain,
  TsSupportToken,
  TsUpdateMinimumTransfer,
  TsUpdateOutgoingPercentage,
  UpdateThreshold,
} from "../artifacts/js/types";
import {
  THRESHOLD_INDEX,
  TOTAL_ATTESTORS_INDEX,
  TOTAL_MEMBERS_INDEX,
  TOTAL_PROPOSALS_INDEX,
  aleoTsProgramAddr,
  aleoUser1,
  aleoUser2,
  aleoUser3,
  aleoUser4,
  aleoUser5,
  aleoUser6,
  councilProgramAddr,
  ethChainId,
  ethTsContract,
  highThreshold,
  lowThreshold,
  newThreshold,
  normalThreshold,
  nullError,
  nullError2,
  nullError3,
  outgoing_percentage_in_time,
  wusdcConnectorAddr,
  wusdcTokenAddr,
} from "./mockData";

import { evm2AleoArr } from "../utils/utils";

import * as js2leo from "../artifacts/js/js2leo";
import * as js2leoCommon from "../artifacts/js/js2leo/common";
import * as leo2jsCommon from "../artifacts/js/leo2js/common";

import { hash } from "aleo-hasher";
import { Token_bridge_v0001Contract } from "../artifacts/js/token_bridge_v0001";
import { Token_service_v0001Contract } from "../artifacts/js/token_service_v0001";
import { Wusdc_connector_v0001Contract } from "../artifacts/js/wusdc_connector_v0001";
import { Wusdc_holding_v0001Contract } from "../artifacts/js/wusdc_holding_v0001";
import { Wusdc_token_v0001Contract } from "../artifacts/js/wusdc_token_v0001";
import { Council_v0001Contract } from "../artifacts/js/council_v0001";

const council = new Council_v0001Contract({ mode: "execute" });
const council_fromNonMember = new Council_v0001Contract({
  mode: "execute",
  networkName: "testnet3",
  privateKey: "APrivateKey1zkpEhkVqeyXJuVLhfpwM1fmHZzHBAz8q1fqoC7ihD89QdGR",
});
const council_fromAnotherMember = new Council_v0001Contract({
  mode: "execute",
  networkName: "testnet3",
  privateKey: "APrivateKey1zkp2RWGDcde3efb89rjhME1VYA8QMxcxep5DShNBR6n8Yjh",
});
const bridge = new Token_bridge_v0001Contract({ mode: "execute" });
const token_service = new Token_service_v0001Contract({ mode: "execute" });
const wudc_connector = new Wusdc_connector_v0001Contract({ mode: "execute" });
const wudc_holding = new Wusdc_holding_v0001Contract({ mode: "execute" });
const wudc_token = new Wusdc_token_v0001Contract({ mode: "execute" });

const hashStruct = (struct: any): bigint => {
  const structString = js2leoCommon.json(struct);
  const structHash = hash("bhp256", structString, "field");
  const hashBigInt = leo2jsCommon.field(structHash);
  return hashBigInt;
};

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
        normalThreshold,
        [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
        admin
      );
      // @ts-ignore
      await initializeTx.wait();
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
      console.log("threshold", threshold);
    } catch (err) {
      isCouncilInitialized = false;
      console.log(err);
    }
    console.log(isCouncilInitialized);
    if (!isCouncilInitialized) {
      const initializeTx = await council.initialize(
        [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
        normalThreshold
      );
      // @ts-ignore
      await initializeTx.wait();
      expect(await council.settings(THRESHOLD_INDEX)).toBe(normalThreshold);
      expect(await council.settings(TOTAL_MEMBERS_INDEX)).toBe(5);
      expect(await council.proposals(TOTAL_PROPOSALS_INDEX)).toBe(BigInt(0));
    }
  }, 20000_000);

  // run this also

  test.skip(// TODO: this must fail - only throws error but the actual task passes
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
      await initializeTx.wait();
    }
  }, 10000_000);
});


describe("Transfer Ownership to Council", () => {
  test.todo("Token Program");
  test.todo("Holding Program");

  test("trasnfer ownership of token bridge program to council", async () => {
    tx = await bridge.transfer_ownership_tb(councilProgramAddr);
    await tx.wait();
    expect(await bridge.owner_TB(true)).toBe(councilProgramAddr);
  }, 20000_000);

  test("trasnfer ownership of token service program to council", async () => {
    tx = await token_service.transfer_ownership_ts(councilProgramAddr);
    await tx.wait();
    expect(await token_service.owner_TS(true)).toBe(councilProgramAddr);
  }, 20000_000);
});

describe("Propose", () => {
  test.skip("should not propose from other members", async () => {
    proposalId =
      parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const addNewMemeberProposal: AddMember = {
      id: proposalId,
      new_member: aleoUser6,
      new_threshold: normalThreshold,
    };
    const addNewProposalHash = hashStruct(
      js2leo.getAddMemberLeo(addNewMemeberProposal)
    );
    console.log("addNewProposalHash", addNewProposalHash);
    tx = await council_fromNonMember.propose(proposalId, addNewProposalHash);
    console.log(tx.result);
    const receipt = await tx.wait();
    console.log(receipt);
    expect(receipt.error).toBeTruthy();
  }, 20000_000);

  test("proposal id must be correct", async () => {
    proposalId = parseInt(
      (await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()
    );
    const addNewMemeberProposal: AddMember = {
      id: proposalId,
      new_member: admin,
      new_threshold: normalThreshold,
    };
    const addNewProposalHash = hashStruct(
      js2leo.getAddMemberLeo(addNewMemeberProposal)
    );
    tx = await council.propose(proposalId, addNewProposalHash);
    const receipt = await tx.wait();
    expect(receipt.error).toBeTruthy();
  }, 20000_000);

  test("should add a proposal", async () => {
    proposalId =
      parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) + 1;
    const addNewMemeberProposal: AddMember = {
      id: proposalId,
      new_member: aleoUser6,
      new_threshold: normalThreshold,
    };
    const addNewProposalHash = hashStruct(
      js2leo.getAddMemberLeo(addNewMemeberProposal)
    );
    const addNewProposalSign: ProposalSign = {
      proposal: addNewProposalHash,
      member: aleoUser1,
    };
    const addNewProposalSignHash = hashStruct(
      js2leo.getProposalSignLeo(addNewProposalSign)
    );
    tx = await council.propose(proposalId, addNewProposalHash);
    await tx.wait();

    expect(await council.proposals(TOTAL_PROPOSALS_INDEX)).toBe(
      BigInt(addNewMemeberProposal.id)
    );
    expect(await council.proposals(addNewMemeberProposal.id)).toBe(
      addNewProposalHash
    );
    expect(await council.proposal_vote_signs(addNewProposalSignHash)).toBe(
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
      js2leo.getAddMemberLeo(addNewMemeberProposal)
    );
    tx = await council.add_member(proposalId, aleoUser6, normalThreshold);
    await tx.wait();

    expect(await council.proposal_executed(addNewProposalHash)).toBe(true);
    expect(await council.members(aleoUser6)).toBe(true);
    expect(await council.settings(THRESHOLD_INDEX)).toBe(normalThreshold);
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
        js2leo.getRemoveMemberLeo(removeMemeberProposal)
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
      try {
        await council.members(aleoUser6);
      } catch (err) {
        errMsg = err.message;
      }
      expect(errMsg).toStrictEqual(nullError);
      expect(await council.proposal_executed(removeProposalHash)).toBe(true);
      expect(await council.settings(THRESHOLD_INDEX)).toBe(newThreshold);
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
        js2leo.getUpdateThresholdLeo(updateThreshold)
      );
      const updateThresholdSign: ProposalSign = {
        proposal: updateThresholdHash,
        member: aleoUser2,
      };
      const updateThresholdSignHash = hashStruct(
        js2leo.getProposalSignLeo(updateThresholdSign)
      );
      // propse to update threshold
      tx = await council.propose(proposalId, updateThresholdHash);
      await tx.wait();
      // vote to update threshold
      tx = await council_fromAnotherMember.vote(
        updateThresholdHash,
        normalThreshold
      );
      await tx.wait();
      expect(
        await council.proposal_vote_signs(updateThresholdSignHash)
      ).toBeTruthy();
      expect(await council.proposal_vote_counts(updateThresholdHash)).toBe(2);
      // execute update threshold
      tx = await council.update_threshold(
        updateThreshold.id,
        updateThreshold.new_threshold
      );
      await tx.wait();
      expect(await council.proposal_executed(updateThresholdHash)).toBe(true);
      expect(await council.settings(THRESHOLD_INDEX)).toBe(normalThreshold);
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
        new_attestor: councilProgramAddr,
        new_threshold: normalThreshold,
      };
      const addAttestorHash = hashStruct(
        js2leo.getTbAddAttestorLeo(addAttestor)
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
      expect(await bridge.attestors(councilProgramAddr)).toBe(true);
      expect(await bridge.attestor_settings(THRESHOLD_INDEX)).toBe(
        normalThreshold
      );
      expect(await bridge.attestor_settings(TOTAL_ATTESTORS_INDEX)).toBe(6);
    }, 20000_000);

    test("should remove attestor", async () => {
      proposalId =
        parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
        1;
      const removeAttestor: TbRemoveAttestor = {
        id: proposalId,
        existing_attestor: councilProgramAddr,
        new_threshold: normalThreshold,
      };
      const removeAttestorHash = hashStruct(
        js2leo.getTbRemoveAttestorLeo(removeAttestor)
      );
      //propose to remove attestor
      tx = await council.propose(proposalId, removeAttestorHash);
      await tx.wait();

      // execute to remove attestor
      tx = await council.tb_remove_attestor(
        proposalId,
        councilProgramAddr,
        normalThreshold
      );
      await tx.wait();

      expect(await council.proposal_executed(removeAttestorHash)).toBe(true);
      let errorMsgCouncil = `Cannot read properties of null (reading 'replace')`;
      let errorMsg = "";
      try {
        await bridge.attestors(councilProgramAddr);
      } catch (err) {
        errorMsg = err.message;
      }
      expect(errorMsg).toContain(errorMsgCouncil);
      expect(await bridge.attestor_settings(THRESHOLD_INDEX)).toBe(
        normalThreshold
      );
      expect(await bridge.attestor_settings(TOTAL_ATTESTORS_INDEX)).toBe(5);
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
        js2leo.getTbUpdateThresholdLeo(tokenBridge_threshold)
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
      expect(await bridge.attestor_settings(true)).toBe(2);
    }, 20000_000);

    test("should enable chain bridge", async () => {
      proposalId =
        parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
        1;
      const approveChainProposal: TbEnableChain = {
        id: proposalId,
        chain_id: ethChainId,
      };
      const approveChainProposalHash = hashStruct(
        js2leo.getTbEnableChainLeo(approveChainProposal)
      );
      tx = await council.propose(proposalId, approveChainProposalHash);
      await tx.wait();

      tx = await council.tb_enable_chain(
        approveChainProposal.id,
        approveChainProposal.chain_id
      );
      await tx.wait();
      proposalId = parseInt(
        (await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()
      );
      const approveChainProposals: TbEnableChain = {
        id: proposalId,
        chain_id: ethChainId,
      };
      const approveChainProposalsHash = hashStruct(
        js2leo.getTbEnableChainLeo(approveChainProposals)
      );
      expect(await council.proposal_executed(approveChainProposalsHash)).toBe(
        true
      );
      expect(await bridge.supported_chains(ethChainId)).toBe(true);
    }, 20000_000);

    test("should disable chain bridge", async () => {
      proposalId =
        parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
        1;
      const disapproveChainProposal: TbDisableChain = {
        id: proposalId,
        chain_id: ethChainId,
      };
      const disapproveChainProposalHash = hashStruct(
        js2leo.getTbDisableChainLeo(disapproveChainProposal)
      );
      tx = await council.propose(proposalId, disapproveChainProposalHash);
      await tx.wait();

      proposalId = parseInt(
        (await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()
      );
      const disapproveChainsProposal: TbDisableChain = {
        id: proposalId,
        chain_id: ethChainId,
      };
      const disapproveChainProposalsHash = hashStruct(
        js2leo.getTbDisableChainLeo(disapproveChainsProposal)
      );
      tx = await council.disapprove_chain_bridge(
        disapproveChainProposal.id,
        disapproveChainProposal.chain_id
      );
      await tx.wait();
      expect(
        await council.proposal_executed(disapproveChainProposalsHash)
      ).toBe(true);
      let errorMsg = "";
      try {
        await bridge.supported_chains(ethChainId);
      } catch (err) {
        errorMsg = err.message;
      }
      expect(errorMsg).toContain(nullError);
    }, 20000_000);

    test("should enable token_service program", async () => {
      proposalId =
        parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
        1;
      const enableServiceProposal: TbEnableService = {
        id: proposalId,
        service: aleoTsProgramAddr,
      };
      const enableServiceProposalHash = hashStruct(
        js2leo.getTbEnableServiceLeo(enableServiceProposal)
      );
      tx = await council.propose(proposalId, enableServiceProposalHash);
      await tx.wait();

      tx = await council.tb_enable_service(
        enableServiceProposal.id,
        enableServiceProposal.service
      );
      await tx.wait();
      proposalId = parseInt(
        (await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()
      );
      const enableServicesProposal: TbEnableService = {
        id: proposalId,
        service: aleoTsProgramAddr,
      };
      const enableServiceProposalsHash = hashStruct(
        js2leo.getTbEnableServiceLeo(enableServicesProposal)
      );
      expect(await council.proposal_executed(enableServiceProposalsHash)).toBe(
        true
      );
      expect(await bridge.supported_services(aleoTsProgramAddr)).toBe(true);
    }, 20000_000);

    test("should disable token_service program", async () => {
      proposalId =
        parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
        1;
      const disableServiceProposal: TbDisableService = {
        id: proposalId,
        service: aleoTsProgramAddr,
      };
      const disableServiceProposalHash = hashStruct(
        js2leo.getTbDisableServiceLeo(disableServiceProposal)
      );
      tx = await council.propose(proposalId, disableServiceProposalHash);
      await tx.wait();

      tx = await council.tb_disable_service(
        disableServiceProposal.id,
        disableServiceProposal.service
      );
      await tx.wait();
      expect(await council.proposal_executed(disableServiceProposalHash)).toBe(
        true
      );
      let errorMsg = "";
      try {
        await bridge.supported_services(aleoTsProgramAddr);
      } catch (err) {
        errorMsg = err.message;
      }
      expect(errorMsg).toBe(nullError);
    }, 20000_000);
  });

  describe("Token Service", () => {
    //     test.todo("Update Governance")
    test("should support chain token service", async () => {
      proposalId =
        parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
        1;
      const approveChainProposal: TsSupportChain = {
        id: proposalId,
        chain_id: ethChainId,
        token_service: evm2AleoArr(ethTsContract),
      };
      const approveChainProposalHash = hashStruct(
        js2leo.getTsSupportChainLeo(approveChainProposal)
      );
      tx = await council.propose(proposalId, approveChainProposalHash);
      await tx.wait();

      tx = await council.ts_support_chain(
        approveChainProposal.id,
        approveChainProposal.chain_id,
        approveChainProposal.token_service
      );
      await tx.wait();
      expect(await council.proposal_executed(approveChainProposalHash)).toBe(
        true
      );
      expect(
        await token_service.token_service_contracts(ethChainId)
      ).toStrictEqual(approveChainProposal.token_service);
    }, 20000_000);

    test("should support chain token service", async () => {
      proposalId =
        parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
        1;
      const disapproveChainProposal: TsRemoveChain = {
        id: proposalId,
        chain_id: ethChainId,
      };
      const disapproveChainProposalHash = hashStruct(
        js2leo.getTsRemoveChainLeo(disapproveChainProposal)
      );
      tx = await council.propose(proposalId, disapproveChainProposalHash);
      await tx.wait();

      tx = await council.ts_remove_chain(
        disapproveChainProposal.id,
        disapproveChainProposal.chain_id
      );
      await tx.wait();
      expect(await council.proposal_executed(disapproveChainProposalHash)).toBe(
        true
      );
      let errorMsg = "";
      try {
        await token_service.token_service_contracts(ethChainId);
      } catch (err) {
        errorMsg = err.message;
      }
      expect(errorMsg).toContain(nullError2);
    }, 20000_000);

    test("should support new token", async () => {
      proposalId =
        parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
        1;
      const tsSupportToken: TsSupportToken = {
        id: proposalId,
        token_id: wusdcTokenAddr,
        connector: wusdcConnectorAddr,
        minimum_transfer: BigInt(100),
        outgoing_percentage: 100_00,
        time: 1,
      };
      const enableTokenProposalHash = hashStruct(
        js2leo.getTsSupportTokenLeo(tsSupportToken)
      );
      tx = await council.propose(proposalId, enableTokenProposalHash);
      await tx.wait();

      tx = await council.ts_support_token(
        tsSupportToken.id,
        tsSupportToken.token_id,
        tsSupportToken.connector,
        tsSupportToken.minimum_transfer,
        tsSupportToken.outgoing_percentage,
        tsSupportToken.time
      );
      await tx.wait();
      expect(await council.proposal_executed(enableTokenProposalHash)).toBe(
        true
      );
      expect(
        await token_service.max_outgoing_percentage(wusdcTokenAddr)
      ).toStrictEqual(outgoing_percentage_in_time);
      expect(await token_service.minimum_transfers(wusdcTokenAddr)).toBe(
        tsSupportToken.minimum_transfer
      );
      expect(await token_service.token_connectors(wusdcTokenAddr)).toBe(
        wusdcConnectorAddr
      );
    }, 20000_000);

    test("should update minimum transfer", async () => {
      proposalId =
        parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
        1;
      const TsUpdateMinimumTransfer: TsUpdateMinimumTransfer = {
        id: proposalId,
        token_id: wusdcTokenAddr,
        minimum_transfer: BigInt(200),
      };
      const TsUpdateMinimumTransferHash = hashStruct(
        js2leo.getTsUpdateMinimumTransferLeo(TsUpdateMinimumTransfer)
      );
      tx = await council.propose(proposalId, TsUpdateMinimumTransferHash);
      await tx.wait();
      tx = await council.ts_update_minimum_transfer(
        TsUpdateMinimumTransfer.id,
        TsUpdateMinimumTransfer.token_id,
        TsUpdateMinimumTransfer.minimum_transfer,
        200,
        1
      );
      await tx.wait();
      expect(
        await council.proposal_executed(TsUpdateMinimumTransferHash)
      ).toBeTruthy();
      expect(await token_service.minimum_transfers(wusdcTokenAddr)).toBe(
        BigInt(200)
      );
    }, 20000_000);

    test("should update Outgoing Percentage", async () => {
      proposalId =
        parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
        1;
      const TsUpdateOutgoing: TsUpdateOutgoingPercentage = {
        id: proposalId,
        token_id: wusdcTokenAddr,
        outgoing_percentage: 200,
        timeframe: 1,
      };
      const TsUpdateOutgoingHash = hashStruct(
        js2leo.getTsUpdateOutgoingPercentageLeo(TsUpdateOutgoing)
      );
      tx = await council.propose(proposalId, TsUpdateOutgoingHash);
      await tx.wait();
      tx = await council.ts_update_outgoing_percentage(
        TsUpdateOutgoing.id,
        TsUpdateOutgoing.token_id,
        TsUpdateOutgoing.outgoing_percentage,
        TsUpdateOutgoing.timeframe
      );
      await tx.wait();
      expect(
        await council.proposal_executed(TsUpdateOutgoingHash)
      ).toBeTruthy();
      const new_outgoing_percentage = {
        outgoing_percentage: 200,
        timeframe: 1,
      };
      expect(
        await token_service.max_outgoing_percentage(wusdcTokenAddr)
      ).toStrictEqual(new_outgoing_percentage);
    }, 20000_000);

    test("should remove a token", async () => {
      proposalId =
        parseInt((await council.proposals(TOTAL_PROPOSALS_INDEX)).toString()) +
        1;
      const RemoveToken: TsRemoveToken = {
        id: proposalId,
        token_id: wusdcTokenAddr,
      };
      const RemoveTokenHash = hashStruct(
        js2leo.getTsRemoveTokenLeo(RemoveToken)
      );
      tx = await council.propose(proposalId, RemoveTokenHash);
      await tx.wait();
      tx = await council.ts_remove_token(RemoveToken.id, RemoveToken.token_id);
      await tx.wait();
      expect(await council.proposal_executed(RemoveTokenHash)).toBeTruthy();
      try {
        await token_service.token_connectors(wusdcTokenAddr);
      } catch (err) {
        errMsg = err.message;
      }
      expect(errMsg).toBe(nullError);
      try {
        await token_service.max_outgoing_percentage(wusdcTokenAddr);
      } catch (err) {
        errMsg = err.message;
      }
      expect(errMsg).toBe(nullError3);
      try {
        await token_service.minimum_transfers(wusdcTokenAddr);
      } catch (err) {
        errMsg = err.message;
      }
      expect(errMsg).toBe(nullError);
    }, 20000_000);

    //     test.todo("Update Connector")
  });
});
});