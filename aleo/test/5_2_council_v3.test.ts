import { Address, PrivateKey } from "@aleohq/sdk";
import { Token_bridge_v0002Contract } from "../artifacts/js/token_bridge_v0002";
import { Token_service_v0002Contract } from "../artifacts/js/token_service_v0002";
import { Council_v0003Contract } from "../artifacts/js/council_v0003";
import { ALEO_ZERO_ADDRESS, BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE, BRIDGE_THRESHOLD_INDEX, BRIDGE_TOTAL_ATTESTORS_INDEX, BRIDGE_UNPAUSED_VALUE, COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_PROPOSALS_INDEX, OWNER_INDEX } from "../utils/constants";
import { PAUSABILITY_INDEX, THRESHOLD_INDEX, TOTAL_MEMBERS_INDEX, TOTAL_PROPOSALS_INDEX, ethChainId, newThreshold, new_chainId, normalThreshold } from "./mockData";
import { hashStruct } from "../utils/hash";
import { getAddMemberLeo, getRemoveMemberLeo, getTbAddAttestorLeo, getTbAddChainLeo, getTbAddServiceLeo, getTbPauseLeo, getTbRemoveAttestorLeo, getTbRemoveChainLeo, getTbRemoveServiceLeo, getTbUnpauseLeo, getUpdateThresholdLeo } from "../artifacts/js/js2leo/council_v0003";
import { signPacket, signProposal } from "../utils/sign";
import { AddMember, RemoveMember, TbAddAttestor, TbAddAttestorLeo, TbAddChain, TbAddService, TbPause, TbRemoveAttestor, TbRemoveChain, TbRemoveService, TbUnpause, UpdateThreshold } from "../artifacts/js/types/council_v0003";
import { getTbPause, getTbRemoveAttestor } from "../artifacts/js/leo2js/council_v0003";


const council = new Council_v0003Contract({ mode: "execute" });
const bridge = new Token_bridge_v0002Contract({ mode: "execute" });
const tokenService = new Token_service_v0002Contract({ mode: "execute" });

const TIMEOUT = 300000_000;

describe("Council", () => {
  const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = council.getAccounts();
  const aleoUser5 = new PrivateKey().to_address().to_string();
  const admin = council.address();

  describe("Deployment and Setup", () => {
    test(
      "Deploy Bridge",
      async () => {
        const deployTx = await bridge.deploy();
        await bridge.wait(deployTx);
      },
      TIMEOUT
    );

    test(
      "Deploy Token Service",
      async () => {
        const deployTx = await tokenService.deploy();
        await tokenService.wait(deployTx);
      },
      TIMEOUT
    );

    test(
      "Deploy Council",
      async () => {
        const deployTx = await council.deploy();
        await council.wait(deployTx);
      },
      TIMEOUT
    );

    test(
      "Initialize Council",
      async () => {
          council.connect(aleoUser1);
          let isCouncilInitialized = (await council.settings(COUNCIL_THRESHOLD_INDEX, 0)) != 0;
          console.log("isCouncilInitialized: ", isCouncilInitialized);
          console.log("isinit", await council.settings(true, 0));

          if (!isCouncilInitialized) {
            const [initializeTx] = await council.initialize(
              [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5], 1
            );
            await council.wait(initializeTx);
            expect(await council.members(aleoUser1)).toBe(true);
            expect(await council.members(aleoUser2)).toBe(true);
            expect(await council.members(aleoUser3)).toBe(true);
            expect(await council.members(aleoUser4)).toBe(true);
          expect(await council.members(aleoUser5)).toBe(true);
          expect(await council.settings(true)).toBe(normalThreshold);
          expect(await council.settings(TOTAL_MEMBERS_INDEX)).toBe(5);
          expect(await council.proposals(TOTAL_PROPOSALS_INDEX)).toBe(BigInt(0));
        }
      },
      TIMEOUT
    );

    test.failing(
      "should not Initialize Council twice",
      async () => {
        council.connect(aleoUser1);
          const [initializeTx] = await council.initialize(
            [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5], 1
          );
          await council.wait(initializeTx);
          // expect value here
        },
      TIMEOUT
    );


  })


  describe("council internal",() => {
    test("should remove a member", async() => {
      const isMember = await council.members(aleoUser4, false);

      if(isMember){
        // creating a proposal to remove a council member
        const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const removeMemeberProposal: RemoveMember = {
          id: proposalId,
          existing_member: aleoUser4,
          new_threshold: normalThreshold,
        };
        const removeProposalHash = hashStruct(getRemoveMemberLeo(removeMemeberProposal));
        const [removeMemberTx] = await council.propose(proposalId, removeProposalHash);
        await council.wait(removeMemberTx);
        const upcomingProposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        expect(upcomingProposalId).toBe(proposalId + 1);
        expect(await council.proposals(proposalId)).toBe(removeProposalHash);


        // exectuing to remove member
        const signature = signProposal(removeProposalHash, council.config.privateKey);
        const signers = [ aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS ];
        const signs = [signature, signature, signature, signature, signature];
        
        expect(await council.proposal_executed(removeProposalHash, false)).toBe(false);
        const [removeMemebeExecTx] = await council.remove_member(proposalId, aleoUser4, normalThreshold, signers, signs);
        await council.wait(removeMemebeExecTx);

        expect(await council.proposal_executed(removeProposalHash)).toBe(true);
        expect(await council.members(aleoUser4, false)).toBe(false);
        expect(await council.settings(COUNCIL_THRESHOLD_INDEX)).toBe(normalThreshold);
        expect(await council.settings(TOTAL_MEMBERS_INDEX)).toBe(4);
      }

    }, TIMEOUT)

    test("should add a member", async() => {
      const isMember = await council.members(aleoUser4, false);

      if(!isMember){
        // creating a proposal to add a council member
        const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const addMemeberProposal: AddMember = {
          id: proposalId,
          new_member: aleoUser4,
          new_threshold: normalThreshold,
        };
        const addProposalHash = hashStruct(getAddMemberLeo(addMemeberProposal));
        const [addMemberTx] = await council.propose(proposalId, addProposalHash);
        await council.wait(addMemberTx);
        const upcomingProposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        expect(upcomingProposalId).toBe(proposalId + 1);
        expect(await council.proposals(proposalId)).toBe(addProposalHash);


        // exectuing to add member
        const signature = signProposal(addProposalHash, council.config.privateKey);
        const signers = [ aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS ];
        const signs = [signature, signature, signature, signature, signature];
        
        expect(await council.proposal_executed(addProposalHash, false)).toBe(false);
        const [addMemeberExecTx] = await council.add_member(proposalId, aleoUser4, normalThreshold, signers, signs);
        await council.wait(addMemeberExecTx);

        expect(await council.proposal_executed(addProposalHash)).toBe(true);
        expect(await council.members(aleoUser4, false)).toBe(true);
        expect(await council.settings(COUNCIL_THRESHOLD_INDEX)).toBe(normalThreshold);
        expect(await council.settings(TOTAL_MEMBERS_INDEX)).toBe(5);
      }

    }, TIMEOUT)

    test("should update threshold", async() => {

        // creating a proposal to update Threhold
        const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const updateThresholdProposal: UpdateThreshold = {
          id: proposalId,
          new_threshold: newThreshold,
        };
        const updateThresholdProposalHash = hashStruct(getUpdateThresholdLeo(updateThresholdProposal));
        const [updateThresholdTx] = await council.propose(proposalId, updateThresholdProposalHash);
        await council.wait(updateThresholdTx);
        const upcomingProposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        expect(upcomingProposalId).toBe(proposalId + 1);
        expect(await council.proposals(proposalId)).toBe(updateThresholdProposalHash);


        // exectuing to update threshold
        const signature = signProposal(updateThresholdProposalHash, council.config.privateKey);
        const signers = [ aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS ];
        const signs = [signature, signature, signature, signature, signature];
        
        expect(await council.proposal_executed(updateThresholdProposalHash, false)).toBe(false);
        const [updateThresholExecTx] = await council.update_threshold(proposalId, newThreshold, signers, signs);
        await council.wait(updateThresholExecTx);

        expect(await council.proposal_executed(updateThresholdProposalHash)).toBe(true);
        expect(await council.settings(COUNCIL_THRESHOLD_INDEX)).toBe(newThreshold);
    }, TIMEOUT);

    test("should update threshold with multiple signatures", async() => {

      // creating a proposal to update Threhold
      const proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
      const updateThresholdProposal: UpdateThreshold = {
        id: proposalId,
        new_threshold: normalThreshold,
      };
      const updateThresholdProposalHash = hashStruct(getUpdateThresholdLeo(updateThresholdProposal));
      const [updateThresholdTx] = await council.propose(proposalId, updateThresholdProposalHash);
      await council.wait(updateThresholdTx);
      const upcomingProposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
      expect(upcomingProposalId).toBe(proposalId + 1);
      expect(await council.proposals(proposalId)).toBe(updateThresholdProposalHash);


      // exectuing to update threshold with multiple signature
      const signature = signProposal(updateThresholdProposalHash, council.config.privateKey);
      council.connect(aleoUser2);
      const signature2 = signProposal(updateThresholdProposalHash, council.config.privateKey);
      const signers = [ aleoUser1, aleoUser2, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS ];
      const signs = [signature, signature2, signature, signature, signature];
      
      expect(await council.proposal_executed(updateThresholdProposalHash, false)).toBe(false);
      const [updateThresholExecTx] = await council.update_threshold(proposalId, normalThreshold, signers, signs);
      await council.wait(updateThresholExecTx);

      expect(await council.proposal_executed(updateThresholdProposalHash)).toBe(true);
      expect(await council.settings(COUNCIL_THRESHOLD_INDEX)).toBe(normalThreshold);
  }, TIMEOUT);
  })

  describe("Bridge", () => {
    const threshold = 1;

    test(
      "Initialize Bridge",
      async () => {
        const isBridgeInitialized = (await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX, 0)) != 0;
        if (!isBridgeInitialized) {
          const [initializeTx] = await bridge.initialize_tb(
            [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5],
            threshold,
            admin
          );
          await bridge.wait(initializeTx);
        }
      },
      TIMEOUT
    );

    test("Ensure proper setup", async () => {
      expect(await bridge.owner_TB(OWNER_INDEX)).toBe(council.address());
    }, TIMEOUT);

    describe("Add Chain", () => {
      const newChainId = ethChainId;
      const proposer = aleoUser1;
      let proposalId = 0;
      let tbAddChainProposalHash = BigInt(0);

      beforeEach( async () => {
        council.connect(proposer);
        expect(await bridge.supported_chains(newChainId, false)).toBe(false);
        expect(await council.members(aleoUser1)).toBe(true);
      }, TIMEOUT)

      test("Propose", async () => {
        proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const tbAddChain: TbAddChain = {
          id: proposalId,
          chain_id: newChainId
        };
        tbAddChainProposalHash = hashStruct(getTbAddChainLeo(tbAddChain)); 
        const [tx] = await council.propose(proposalId, tbAddChainProposalHash);
        await council.wait(tx);

        const upcomingProposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        expect(upcomingProposalId).toBe(proposalId + 1);
        expect(await council.proposals(proposalId)).toBe(tbAddChainProposalHash);

      }, TIMEOUT)

      test("Execute", async () => {
        const signature = signProposal(tbAddChainProposalHash, council.config.privateKey);
        const signers = [ aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS ];
        const signs = [signature, signature, signature, signature, signature];

        expect(await council.proposal_executed(tbAddChainProposalHash, false)).toBe(false);
        const [tx] = await council.tb_add_chain(proposalId, newChainId, signers, signs);
        await council.wait(tx);

        expect(await bridge.supported_chains(newChainId)).toBe(true);
        expect(await council.proposal_executed(tbAddChainProposalHash)).toBe(true);
      }, TIMEOUT)

    })

    describe("Remove Chain", () => {
      const newChainId = ethChainId;
      const proposer = aleoUser1;
      let proposalId = 0;
      let tbRemoveChainProposalHash = BigInt(0);

      beforeEach( async () => {
        council.connect(proposer);
        expect(await bridge.supported_chains(newChainId, false)).toBe(true);
        expect(await council.members(aleoUser1)).toBe(true);
      }, TIMEOUT)

      test("Propose", async () => {
        proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const tbRemoveChain: TbRemoveChain = {
          id: proposalId,
          chain_id: newChainId
        };
        tbRemoveChainProposalHash = hashStruct(getTbRemoveChainLeo(tbRemoveChain)); 
        const [tx] = await council.propose(proposalId, tbRemoveChainProposalHash);
        await council.wait(tx);

        const upcomingProposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        expect(upcomingProposalId).toBe(proposalId + 1);
        expect(await council.proposals(proposalId)).toBe(tbRemoveChainProposalHash);

      }, TIMEOUT)

      test("Execute", async () => {
        const signature = signProposal(tbRemoveChainProposalHash, council.config.privateKey);
        const signers = [ aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS ];
        const signs = [signature, signature, signature, signature, signature];

        expect(await council.proposal_executed(tbRemoveChainProposalHash, false)).toBe(false);
        const [tx] = await council.tb_remove_chain(proposalId, newChainId, signers, signs);
        await council.wait(tx);

        const isSupportedChain = await bridge.supported_chains(ethChainId, false);
        expect(isSupportedChain).toBe(false);
        expect(await council.proposal_executed(tbRemoveChainProposalHash)).toBe(true);
      }, TIMEOUT);

    });

    describe("Add Attesor", () => {
      const proposer = aleoUser1;
      let proposalId = 0;
      let addAttestorHash = BigInt(0);

      beforeEach( async () => {
        council.connect(proposer);
        console.log("is", await bridge.attestors(council.address(), false));
        expect(await bridge.attestors(council.address(), false)).toBe(false);
        expect(await council.members(aleoUser1)).toBe(true);
      }, TIMEOUT)

      test("Propose", async () => {
        proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const addAttestor: TbAddAttestor = {
          id: proposalId,
          new_attestor: council.address(),
          new_threshold: normalThreshold,
        };
        addAttestorHash = hashStruct(
          getTbAddAttestorLeo(addAttestor)
        );
        const [tx] = await council.propose(proposalId, addAttestorHash);
        await council.wait(tx);

        const upcomingProposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        expect(upcomingProposalId).toBe(proposalId + 1);
        expect(await council.proposals(proposalId)).toBe(addAttestorHash);

      }, TIMEOUT)

      test("Execute", async () => {
        const signature = signProposal(addAttestorHash, council.config.privateKey);
        const signers = [ aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS ];
        const signs = [signature, signature, signature, signature, signature];

        expect(await council.proposal_executed(addAttestorHash, false)).toBe(false);
        const [tx] = await council.tb_add_attestor(proposalId, council.address(), threshold , signers, signs);
        await council.wait(tx);

        expect(await council.proposal_executed(addAttestorHash)).toBe(true);
        expect(await bridge.attestors(council.address())).toBe(true);
        expect(await bridge.bridge_settings(THRESHOLD_INDEX)).toBe(
          normalThreshold
        );
        expect(await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX)).toBe(6);
      }, TIMEOUT);

    });

    describe("Remove Attesor", () => {
      const proposer = aleoUser1;
      let proposalId = 0;
      let removeAttestorHash = BigInt(0);

      beforeEach( async () => {
        council.connect(proposer);
        expect(await bridge.attestors(council.address(), false)).toBe(true);
        expect(await council.members(aleoUser1)).toBe(true);
      }, TIMEOUT)

      test("Propose", async () => {
        proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const removeAttestor: TbRemoveAttestor = {
          id: proposalId,
          existing_attestor: council.address(),
          new_threshold: normalThreshold,
        };
        removeAttestorHash = hashStruct(
          getTbRemoveAttestorLeo(removeAttestor)
        );
        const [tx] = await council.propose(proposalId, removeAttestorHash);
        await council.wait(tx);

        const upcomingProposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        expect(upcomingProposalId).toBe(proposalId + 1);
        expect(await council.proposals(proposalId)).toBe(removeAttestorHash);

      }, TIMEOUT)

      test("Execute", async () => {
        const signature = signProposal(removeAttestorHash, council.config.privateKey);
        const signers = [ aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS ];
        const signs = [signature, signature, signature, signature, signature];

        expect(await council.proposal_executed(removeAttestorHash, false)).toBe(false);
        const [tx] = await council.tb_remove_attestor(proposalId, council.address(), normalThreshold, signers, signs);
        await council.wait(tx);

        expect(await council.proposal_executed(removeAttestorHash)).toBe(true);
        expect(await bridge.attestors(council.address(), false)).toBe(false);
        expect(await bridge.bridge_settings(THRESHOLD_INDEX)).toBe(
          normalThreshold
        );
        expect(await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX)).toBe(5);
      }, TIMEOUT);

    });


    describe("Add Service", () => {
      const proposer = aleoUser1;
      let proposalId = 0;
      let addServiceProposalHash = BigInt(0);

      beforeEach( async () => {
        council.connect(proposer);
        expect(await bridge.supported_services(tokenService.address(), false)).toBe(false);
        expect(await council.members(aleoUser1)).toBe(true);
      }, TIMEOUT)

      test("Propose", async () => {
        proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const addServiceProposal: TbAddService = {
          id: proposalId,
          service: tokenService.address(),
        };
        addServiceProposalHash = hashStruct(getTbAddServiceLeo(addServiceProposal));
        const [tx] = await council.propose(proposalId, addServiceProposalHash);
        await council.wait(tx);

        const upcomingProposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        expect(upcomingProposalId).toBe(proposalId + 1);
        expect(await council.proposals(proposalId)).toBe(addServiceProposalHash);

      }, TIMEOUT)

      test("Execute", async () => {
        const signature = signProposal(addServiceProposalHash, council.config.privateKey);
        const signers = [ aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS ];
        const signs = [signature, signature, signature, signature, signature];

        expect(await council.proposal_executed(addServiceProposalHash, false)).toBe(false);
        const [tx] = await council.tb_add_service(proposalId, tokenService.address(), signers, signs);
        await council.wait(tx);

        expect(await council.proposal_executed(addServiceProposalHash)).toBe(true);
        expect(await bridge.supported_services(tokenService.address())).toBe(true);
      }, TIMEOUT);

    });


    describe("Remove Service", () => {
      const proposer = aleoUser1;
      let proposalId = 0;
      let removeServiceProposalHash = BigInt(0);

      beforeEach( async () => {
        council.connect(proposer);
        expect(await bridge.supported_services(tokenService.address(), false)).toBe(true);
        expect(await council.members(aleoUser1)).toBe(true);
      }, TIMEOUT)

      test("Propose", async () => {
        proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const reoveServiceProposal: TbRemoveService = {
          id: proposalId,
          service: tokenService.address(),
        };
        removeServiceProposalHash = hashStruct(getTbRemoveServiceLeo(reoveServiceProposal));
        const [tx] = await council.propose(proposalId, removeServiceProposalHash);
        await council.wait(tx);

        const upcomingProposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        expect(upcomingProposalId).toBe(proposalId + 1);
        expect(await council.proposals(proposalId)).toBe(removeServiceProposalHash);

      }, TIMEOUT)

      test("Execute", async () => {
        const signature = signProposal(removeServiceProposalHash, council.config.privateKey);
        const signers = [ aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS ];
        const signs = [signature, signature, signature, signature, signature];

        expect(await council.proposal_executed(removeServiceProposalHash, false)).toBe(false);
        const [tx] = await council.tb_remove_service(proposalId, tokenService.address(), signers, signs);
        await council.wait(tx);

        expect(await council.proposal_executed(removeServiceProposalHash)).toBe(true);
        expect(await bridge.supported_services(tokenService.address(), false)).toBe(false);
      }, TIMEOUT);

    });

    describe("UnPause", () => {
      const proposer = aleoUser1;
      let proposalId = 0;
      let tbPauseProposalHash = BigInt(0);

      beforeEach( async () => {
        council.connect(proposer);
        expect(await bridge.bridge_settings(PAUSABILITY_INDEX, 0)).toBe(0);
        expect(await council.members(aleoUser1)).toBe(true);
      }, TIMEOUT)

      test("Propose", async () => {
        proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const tbPause: TbUnpause = {
          id: proposalId,
        };
        tbPauseProposalHash = hashStruct(getTbUnpauseLeo(tbPause)); 
        const [tx] = await council.propose(proposalId, tbPauseProposalHash);
        await council.wait(tx);

        const upcomingProposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        expect(upcomingProposalId).toBe(proposalId + 1);
        expect(await council.proposals(proposalId)).toBe(tbPauseProposalHash);

      }, TIMEOUT)

      test("Execute", async () => {
        const signature = signProposal(tbPauseProposalHash, council.config.privateKey);
        const signers = [ aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS ];
        const signs = [signature, signature, signature, signature, signature];

        expect(await council.proposal_executed(tbPauseProposalHash, false)).toBe(false);
        const [tx] = await council.tb_unpause(proposalId, signers, signs);
        await council.wait(tx);

        expect(await council.proposal_executed(tbPauseProposalHash)).toBe(true);
        
        expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, 0)).toBe(BRIDGE_UNPAUSED_VALUE);
      }, TIMEOUT);

    });


    describe("Pause", () => {
      const proposer = aleoUser1;
      let proposalId = 0;
      let tbPauseProposalHash = BigInt(0);

      beforeEach( async () => {
        council.connect(proposer);
        expect(await bridge.bridge_settings(PAUSABILITY_INDEX, 0)).toBe(1);
        expect(await council.members(aleoUser1)).toBe(true);
      }, TIMEOUT)

      test("Propose", async () => {
        proposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        const tbPause: TbPause = {
          id: proposalId,
        };
        tbPauseProposalHash = hashStruct(getTbPauseLeo(tbPause)); 
        const [tx] = await council.propose(proposalId, tbPauseProposalHash);
        await council.wait(tx);

        const upcomingProposalId = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString()) + 1;
        expect(upcomingProposalId).toBe(proposalId + 1);
        expect(await council.proposals(proposalId)).toBe(tbPauseProposalHash);

      }, TIMEOUT)

      test("Execute", async () => {
        const signature = signProposal(tbPauseProposalHash, council.config.privateKey);
        const signers = [ aleoUser1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS ];
        const signs = [signature, signature, signature, signature, signature];

        expect(await council.proposal_executed(tbPauseProposalHash, false)).toBe(false);
        const [tx] = await council.tb_pause(proposalId, signers, signs);
        await council.wait(tx);

        expect(await council.proposal_executed(tbPauseProposalHash)).toBe(true);
        
        expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, 0)).toBe(BRIDGE_PAUSED_VALUE);
      }, TIMEOUT);

    });

  });

    

  describe.skip("Token Service", () => {
    test(
      "Initialize Token Service",
      async () => {
        const isTokenServiceInitialized = (await tokenService.owner_TS(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
        if (!isTokenServiceInitialized) {
          const [initializeTx] = await tokenService.initialize_ts(
            admin
          );
          await tokenService.wait(initializeTx);
        }
      },
      TIMEOUT
    );

    test("Ensure proper setup", async () => {
      expect(await tokenService.owner_TS(OWNER_INDEX)).toBe(council.address());
    }, TIMEOUT);



  });

});
  