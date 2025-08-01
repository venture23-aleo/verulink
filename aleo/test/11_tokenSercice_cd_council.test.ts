import { Vlink_council_v2Contract } from "../artifacts/js/vlink_council_v2";
import {
  ALEO_ZERO_ADDRESS,
  COUNCIL_TOTAL_PROPOSALS_INDEX,
  OWNER_INDEX,
  TOKEN_PAUSED_VALUE,
  TOKEN_UNPAUSED_VALUE,
  ethChainId,
  ethTsContractAddr,
  usdcContractAddr,
} from "../utils/constants";
import { hashStruct } from "../utils/hash";
import { ExecutionMode } from "@doko-js/core";
import {evm2AleoArrWithoutPadding } from "../utils/ethAddress";
import { baseChainId, baseTsContractAddr, COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_MEMBERS_INDEX } from "../utils/testdata.data";
import { ExternalProposal} from "../artifacts/js/types/vlink_council_v2";
import { getExternalProposalLeo } from "../artifacts/js/js2leo/vlink_council_v2";
import { Vlink_token_service_cd_v2Contract } from "../artifacts/js/vlink_token_service_cd_v2";
import { Vlink_token_service_cd_cuncl_v2Contract } from "../artifacts/js/vlink_token_service_cd_cuncl_v2";
import { AddChainExistingToken, RemoveOtherChainAddresses, TsAddTokenInfo, TsPauseToken, TsTransferOwnership, TsUnpauseToken, TsUpdateMaxMinTransfer, UpdateFees } from "../artifacts/js/types/vlink_token_service_cd_cuncl_v2";
import { getAddChainExistingTokenLeo, getRemoveOtherChainAddressesLeo, getTsAddTokenInfoLeo, getTsPauseTokenLeo, getTsTransferOwnershipLeo, getTsUnpauseTokenLeo, getTsUpdateMaxMinTransferLeo, getUpdateFeesLeo } from "../artifacts/js/js2leo/vlink_token_service_cd_cuncl_v2";
import { ChainToken } from "../artifacts/js/types/vlink_token_service_cd_v2";
import { Vlink_token_bridge_v2Contract } from "../artifacts/js/vlink_token_bridge_v2";
import { Vlink_holding_cd_v2Contract } from "../artifacts/js/vlink_holding_cd_v2";
import { Token_registryContract } from "../artifacts/js/token_registry";


const mode = ExecutionMode.SnarkExecute;
// npm run test -- --runInBand ./test/8_tokenServiceCouncil.test.ts

const council = new Vlink_council_v2Contract({ mode });
const tokenService = new Vlink_token_service_cd_v2Contract({ mode });
const tokenServiceCouncil = new Vlink_token_service_cd_cuncl_v2Contract({ mode });
const bridge = new Vlink_token_bridge_v2Contract({ mode });
const holding = new Vlink_holding_cd_v2Contract({ mode });
const tokenRegistry = new Token_registryContract({ mode })




    const TAG_TS2_TRANSFER_OWNERSHIP= 1;
    const TAG_TS2_ADD_TOKEN = 2;
    const TAG_TS2_UPDATE_MAX_MIN_TRANSFER = 3;
    const TAG_TS2_PAUSE_TOKEN = 4;
    const TAG_TS2_UNPAUSE_TOKEN = 5; 
    const TAG_HOLDING2_RELEASE = 6;
    const TAG_HOLDING2_OWNERSHIP_TRANSFER = 7;
    const TAG_TS2_UP_TS_SETTING = 8;
    const TAG_TS2_ADD_CHAIN_TO_ET = 9;
    const TAG_TS2_REMOVE_OTHER_CHAIN_ADD = 10;
    const TAG_TS2_UPDATE_FEES = 11;
    const NATIVE_TOKEN_ID = BigInt("3443843282313283355522573239085696902919850365217539366784739393210722344986"); // The native token address of the Aleo network
    const STATUS_INDEX = true;


(BigInt.prototype as any).toJSON = function () {
  return this.toString() + "field";
};

const TIMEOUT = 300000_000;

const [councilMember1, councilMember2, councilMember3, aleoUser4] = council.getAccounts();
const admin = tokenServiceCouncil.address();

describe("Token Service Council", () => {

  const public_platform_fee = 5000;
  const public_relayer_fee = BigInt(10000);

  const sleepTimer = ms => new Promise(resolve => setTimeout(resolve, ms));


  describe("deployment", () => {

    test("Deploy Token registery",
      async () => {
        const deployTx = await tokenRegistry.deploy();
        await deployTx.wait()
      },
      TIMEOUT
    );

      test("Deploy Holding",
      async () => {
        const deployTx = await holding.deploy();
        await deployTx.wait()
      },
      TIMEOUT
    );

      test("Deploy Bridge",
      async () => {
        const deployTx = await bridge.deploy();
        await deployTx.wait()
      },
      TIMEOUT
    );


    test("Deploy Token Service",
      async () => {
        const deployTx = await tokenService.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );

    test("Deploy Council",
      async () => {
        const deployTx = await council.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );

    test("Deploy tokenservice Council",
      async () => {
        const deployTx = await tokenServiceCouncil.deploy();
        await deployTx.wait();
      },
      TIMEOUT
    );
  })

  describe("Initialization", () => {
    test("Initialize Token Service", async () => {
      const isTokenServiceInitialized = (await tokenService.owner_TS(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      if (!isTokenServiceInitialized) {
        const initializeTx = await tokenService.initialize_ts(
          admin
        );
        await initializeTx.wait();
      }
      expect(await tokenService.owner_TS(OWNER_INDEX)).toBe(tokenServiceCouncil.address());
    },
      TIMEOUT
    );


    test("Initialize Council",
      async () => {
        const initialThreshold = 1;
        let isCouncilInitialized = (await council.settings(COUNCIL_THRESHOLD_INDEX, 0)) != 0;
        if (!isCouncilInitialized) {
          const initializeTx = await council.initialize(
            [councilMember1, councilMember2, councilMember3, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS], initialThreshold
          );
          await initializeTx.wait();
          expect(await council.members(councilMember1)).toBe(true);
          expect(await council.members(councilMember2)).toBe(true);
          expect(await council.members(councilMember3)).toBe(true);
          expect(await council.members(ALEO_ZERO_ADDRESS)).toBe(true);
          expect(await council.members(aleoUser4, false)).toBe(false);
          expect(await council.settings(COUNCIL_THRESHOLD_INDEX)).toBe(initialThreshold);
          expect(await council.settings(COUNCIL_TOTAL_MEMBERS_INDEX)).toBe(3);
          expect(await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toBe(BigInt(0));
        }
      },
      TIMEOUT
    );

    test("Ensure proper setup", async () => {
      expect(await tokenService.owner_TS(OWNER_INDEX)).toBe(tokenServiceCouncil.address());
    }, TIMEOUT);
  })

  describe("Add Token", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    const minTransfer = BigInt(100)
    const maxTransfer = BigInt(100)
    const public_platform_fee = 5;
    const public_relayer_fee = BigInt(10000);


    beforeEach(async () => {
      council.connect(proposer);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tsSupportToken: TsAddTokenInfo = {
        tag: TAG_TS2_ADD_TOKEN,
        id: proposalId,
        min_transfer: minTransfer,
        max_transfer: maxTransfer,
        token_address: evm2AleoArrWithoutPadding(usdcContractAddr),
        token_service: evm2AleoArrWithoutPadding(ethTsContractAddr),
        chain_id: ethChainId,
        fee_platform: public_platform_fee,
        fee_relayer: public_relayer_fee,
      };
      const addTokenProposalHash = hashStruct(getTsAddTokenInfoLeo(tsSupportToken));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: addTokenProposalHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_add_token_info(
        proposalId,
        minTransfer,
        maxTransfer,
        signers,
        evm2AleoArrWithoutPadding(usdcContractAddr),
        evm2AleoArrWithoutPadding(ethTsContractAddr),
        ethChainId,
        public_platform_fee,
        public_relayer_fee,
      );
      await tx.wait();

      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.status(STATUS_INDEX)).toBe(TOKEN_PAUSED_VALUE);
    }, TIMEOUT);

  });

  describe("Update minimum maximum transfer", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);
    const newMinTransfer = BigInt(10)
    const newMaxTransfer = BigInt(100_000)

    beforeEach(async () => {
      council.connect(proposer);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const TsUpdateMinimumMaximumTransfer: TsUpdateMaxMinTransfer = {
        tag: TAG_TS2_UPDATE_MAX_MIN_TRANSFER,
        id: proposalId,
        min_transfer: newMinTransfer,
        max_transfer: newMaxTransfer
      };
      const TsUpdateMinmaxTransferHash = hashStruct(getTsUpdateMaxMinTransferLeo(TsUpdateMinimumMaximumTransfer));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: TsUpdateMinmaxTransferHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_update_max_min_transfer(
        proposalId,
        newMinTransfer,
        newMaxTransfer,
        signers,
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.min_transfers(NATIVE_TOKEN_ID)).toBe(newMinTransfer);
      expect(await tokenService.max_transfers(NATIVE_TOKEN_ID)).toBe(newMaxTransfer);
    }, TIMEOUT);

  });

  describe("Unpause", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await tokenService.status(STATUS_INDEX, false)).toBe(TOKEN_PAUSED_VALUE);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const unpauseTokenProposal: TsUnpauseToken = {
        tag: TAG_TS2_UNPAUSE_TOKEN,
        id: proposalId,
      };
      const unpauseTokenProposalHash = hashStruct(getTsUnpauseTokenLeo(unpauseTokenProposal));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: unpauseTokenProposalHash
      }
      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));
      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_unpause_token(
        proposalId,
        signers
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.status(STATUS_INDEX)).toBe(TOKEN_UNPAUSED_VALUE);
    }, TIMEOUT);

  });

  describe("Pause", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await tokenService.status(STATUS_INDEX)).toBe(TOKEN_UNPAUSED_VALUE);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const pauseTokenProposal: TsPauseToken = {
        tag: TAG_TS2_PAUSE_TOKEN,
        id: proposalId,
      };
      const pauseTokenProposalHash = hashStruct(getTsPauseTokenLeo(pauseTokenProposal));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: pauseTokenProposalHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_pause_token(
        proposalId,
        signers
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.status(STATUS_INDEX)).toBe(TOKEN_PAUSED_VALUE);
    }, TIMEOUT);

  });

  describe("Add chain to existing token", () => { //ts_add_chain_to_existing_token
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);
    const signers = [councilMember1, councilMember2, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
    console.log(council.address(), "council address", tokenServiceCouncil.address());

    test("Propose", async () => {

      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tsAddChainToExistingToken: AddChainExistingToken = {
        tag: TAG_TS2_ADD_CHAIN_TO_ET,
        id: proposalId,
        chain_id: baseChainId,
        token_address: evm2AleoArrWithoutPadding(usdcContractAddr),
        token_service_address: evm2AleoArrWithoutPadding(baseTsContractAddr),
        fee_platform: public_platform_fee,
        fee_relayer: public_relayer_fee,
      };
      const TsAddChainToExistingTokenHash = hashStruct(getAddChainExistingTokenLeo(tsAddChainToExistingToken));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: TsAddChainToExistingTokenHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);
    }, TIMEOUT)


    test("Vote", async () => {
      const initialVotes = await council.proposal_vote_counts(ExternalProposalHash);
      council.connect(councilMember2)
      const voteTx = await council.vote(ExternalProposalHash, true);
      await voteTx.wait();

      const finalVotes = await council.proposal_vote_counts(ExternalProposalHash);
      expect(finalVotes).toBe(initialVotes + 1);
    }, TIMEOUT)

    test("Execute", async () => {
      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_add_chain_to_existing_token(
        proposalId,
        baseChainId,
        evm2AleoArrWithoutPadding(baseTsContractAddr),
        evm2AleoArrWithoutPadding(usdcContractAddr),
        public_platform_fee,
        public_relayer_fee,
        signers
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
    }, TIMEOUT);

  });

  describe("Remove  chain to existing token", () => { //ts_remove_chain_to_existing_token
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);
    const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

    test("Propose", async () => {
      council.connect(councilMember1)
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const RemoveOtherChainAddresses: RemoveOtherChainAddresses = {
        tag: TAG_TS2_REMOVE_OTHER_CHAIN_ADD,
        id: proposalId,
        chain_id: baseChainId,
      };

      const TsRemoveChainToExistingTokenHash = hashStruct(getRemoveOtherChainAddressesLeo(RemoveOtherChainAddresses));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: TsRemoveChainToExistingTokenHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      sleepTimer(5000);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);
    }, TIMEOUT)

    test("Execute", async () => {
      tokenServiceCouncil.connect(councilMember1);
      const tokenServiceOwner = await tokenService.owner_TS(OWNER_INDEX);
      console.log(tokenServiceOwner, tokenServiceCouncil.address(), "we are here");
      sleepTimer(5000);
      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_remove_other_chain_addresses(
        proposalId,
        baseChainId,
        signers
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
    }, TIMEOUT);

  });

  describe("Update fees", () => { //ts_update_fees

    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);
    const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
    const new_public_platform_fee = 6000;
    const new_public_relayer_fee = BigInt(20000);
    const tokenInfo: ChainToken = {
      native_token_id: NATIVE_TOKEN_ID,
      chain_id: ethChainId
    }

    test("Propose", async () => {

      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;

      const UpdateFeesPayload: UpdateFees = {
        tag: TAG_TS2_UPDATE_FEES,
        id: proposalId,
        chain_id: ethChainId,
        fee_relayer: new_public_relayer_fee,
        fee_platform: new_public_platform_fee,
      };

      const TsUpdateFeesHash = hashStruct(getUpdateFeesLeo(UpdateFeesPayload));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: TsUpdateFeesHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      council.connect(councilMember1);
      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);
    }, TIMEOUT)

    test("Execute", async () => {
      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_update_fees(
        proposalId,
        ethChainId,
        new_public_relayer_fee,
        new_public_platform_fee,
        signers
      );
      await tx.wait();


      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.platform_fee(tokenInfo)).toBe(new_public_platform_fee);
      expect(await tokenService.relayer_fee(tokenInfo)).toBe(new_public_relayer_fee);
    }, TIMEOUT);

  });


  describe("Transfer ownership", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tsTransferOwnership: TsTransferOwnership = {
        tag: TAG_TS2_TRANSFER_OWNERSHIP,
        id: proposalId,
        new_owner: councilMember3,
      };
      const transferOwnershipProposalHash = hashStruct(getTsTransferOwnershipLeo(tsTransferOwnership));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: transferOwnershipProposalHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      council.connect(councilMember1);
      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_transfer_ownership(
        proposalId,
        councilMember3,
        signers
      );
      await tx.wait();

      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.owner_TS(OWNER_INDEX)).toBe(councilMember3);
    }, TIMEOUT);

  });

});