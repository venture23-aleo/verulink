import { Address, PrivateKey } from "@aleohq/sdk";
import { Token_bridge_v0002Contract } from "../artifacts/js/token_bridge_v0002";
import { Token_service_v0002Contract } from "../artifacts/js/token_service_v0002";
import { Council_v0003Contract } from "../artifacts/js/council_v0003";
import { ALEO_ZERO_ADDRESS, BRIDGE_THRESHOLD_INDEX, COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_PROPOSALS_INDEX, OWNER_INDEX } from "../utils/constants";
import { TbAddChain } from "../artifacts/js/types/council_v0002";
import { ethChainId } from "./mockData";
import { hashStruct } from "../utils/hash";
import { getTbAddChainLeo } from "../artifacts/js/js2leo/council_v0003";
import { signPacket, signProposal } from "../utils/sign";

const council = new Council_v0003Contract({ mode: "execute" });
const bridge = new Token_bridge_v0002Contract({ mode: "execute" });
const tokenService = new Token_service_v0002Contract({ mode: "execute" });

const TIMEOUT = 300_000

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
        let isCouncilInitialized = (await council.settings(COUNCIL_THRESHOLD_INDEX, 0)) != 0;

        if (!isCouncilInitialized) {
          const [initializeTx] = await council.initialize(
            [aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5], 1
          );
          await council.wait(initializeTx);
        }
      },
      TIMEOUT
    );


  })

  describe("Bridge", () => {
    test(
      "Initialize Bridge",
      async () => {
        const threshold = 1
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

    describe("Remove Chain", () => {})

  })

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
  