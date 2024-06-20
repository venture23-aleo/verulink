import { Token_service_v0003Contract } from "../artifacts/js/token_service_v0003";
import { CouncilContract } from "../artifacts/js/council";
import { Wusdc_connector_v0003_0Contract } from "../artifacts/js/wusdc_connector_v0003_0";
import { Wusdc_token_v0003Contract } from "../artifacts/js/wusdc_token_v0003";
import { Token_service_councilContract } from "../artifacts/js/token_service_council";

import {
  ALEO_ZERO_ADDRESS,
  COUNCIL_TOTAL_PROPOSALS_INDEX,
  OWNER_INDEX,
  TOKEN_PAUSED_VALUE,
  TOKEN_UNPAUSED_VALUE,

} from "../utils/constants";


import { WithdrawalLimit } from "../artifacts/js/types/token_service_v0003";

import { hashStruct } from "../utils/hash";
import { ExecutionMode} from "@doko-js/core";


import {   
  TsAddToken,
  TsRemoveToken,
  TsUpdateMaxTransfer,
  TsUpdateMinTransfer,
  TsUpdateWithdrawalLimit,
  TsPauseToken,
  TsUnpauseToken
} from "../artifacts/js/types/token_service_council";
import { 
  getTsAddTokenLeo,
  getTsRemoveTokenLeo,
  getTsUpdateMaxTransferLeo,
  getTsUpdateMinTransferLeo,
  getTsUpdateWithdrawalLimitLeo,
  getTsPauseTokenLeo,
  getTsUnpauseTokenLeo,
} from "../artifacts/js/js2leo/token_service_council";


const mode = ExecutionMode.SnarkExecute;


const council = new CouncilContract({ mode });
const tokenServiceCouncil = new Token_service_councilContract({ mode });
const tokenService = new Token_service_v0003Contract({ mode });
const wusdcConnector = new Wusdc_connector_v0003_0Contract({ mode });
const wusdcToken = new Wusdc_token_v0003Contract({ mode });


const TIMEOUT = 300000_000;

const [councilMember1, councilMember2, councilMember3, aleoUser4] = council.getAccounts();
const admin = council.address();

describe("Token Service", () => {

    test("Initialize Token Service", async () => {
      const isTokenServiceInitialized = (await tokenService.owner_TS(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      if (!isTokenServiceInitialized) {
        const [initializeTx] = await tokenService.initialize_ts(
          admin
        );
        await initializeTx.wait();
      }
      expect(await tokenService.owner_TS(OWNER_INDEX)).toBe(council.address());
    },
      TIMEOUT
    );

    describe("Add Token", () => {
      const proposer = councilMember1;
      let proposalId = 0;
      let addTokenProposalHash = BigInt(0);

      const minTransfer = BigInt(100)
      const maxTransfer = BigInt(100)
      const thresholdNoLimit = BigInt(100)
      const outgoingPercentage = 10_00
      const time = 1

      beforeEach(async () => {
        council.connect(proposer);
        expect(await tokenService.token_connectors(wusdcToken.address(), ALEO_ZERO_ADDRESS)).toBe(ALEO_ZERO_ADDRESS);
        expect(await council.members(councilMember1)).toBe(true);
      }, TIMEOUT)

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;
        const tsSupportToken: TsAddToken = {
          id: proposalId,
          token_address: wusdcToken.address(),
          connector: wusdcConnector.address(),
          min_transfer: minTransfer,
          max_transfer: maxTransfer,
          outgoing_percentage: outgoingPercentage,
          time,
          max_no_cap: thresholdNoLimit
        };
        addTokenProposalHash = hashStruct(getTsAddTokenLeo(tsSupportToken));
        const [tx] = await council.propose(proposalId, addTokenProposalHash);
        await tx.wait();

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(addTokenProposalHash);

      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(addTokenProposalHash, false)).toBe(false);
        const [tx] = await tokenServiceCouncil.ts_add_token(
          proposalId,
          wusdcToken.address(),
          wusdcConnector.address(),
          minTransfer,
          maxTransfer,
          outgoingPercentage,
          time,
          thresholdNoLimit,
          signers,
        );
        await tx.wait();

        expect(await council.proposal_executed(addTokenProposalHash)).toBe(true);
        expect(await tokenService.token_connectors(wusdcToken.address())).toBe(wusdcConnector.address());
      }, TIMEOUT);

    });

    describe("Update minimum transfer", () => {
      const proposer = councilMember1;
      let proposalId = 0;
      let TsUpdateMinimumTransferHash = BigInt(0);
      const newMinTransfer = BigInt(1000)

      beforeEach(async () => {
        council.connect(proposer);
      }, TIMEOUT)

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;
        const TsUpdateMinimumTransfer: TsUpdateMinTransfer = {
          id: proposalId,
          token_address: wusdcToken.address(),
          min_transfer: newMinTransfer,
        };
        TsUpdateMinimumTransferHash = hashStruct(getTsUpdateMinTransferLeo(TsUpdateMinimumTransfer));
        const [tx] = await council.propose(proposalId, TsUpdateMinimumTransferHash);
        await tx.wait();

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(TsUpdateMinimumTransferHash);
      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(TsUpdateMinimumTransferHash, false)).toBe(false);
        const [tx] = await tokenServiceCouncil.ts_update_min_transfer(
          proposalId,
          wusdcToken.address(),
          newMinTransfer,
          signers,
        );
        await tx.wait();
        expect(await council.proposal_executed(TsUpdateMinimumTransferHash)).toBe(true);
        expect(await tokenService.min_transfers(wusdcToken.address())).toBe(newMinTransfer);
      }, TIMEOUT);

    });

    describe("Update maximum transfer", () => {
      let proposalId = 0;
      let TsUpdateMaximumTransferHash = BigInt(0);
      const newMaxTransfer = BigInt(100_000)

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;
        const TsUpdateMaximumTransfer: TsUpdateMaxTransfer = {
          id: proposalId,
          token_address: wusdcToken.address(),
          max_transfer: newMaxTransfer,
        };
        TsUpdateMaximumTransferHash = hashStruct(
          getTsUpdateMaxTransferLeo(TsUpdateMaximumTransfer)
        );
        const [tx] = await council.propose(proposalId, TsUpdateMaximumTransferHash);
        await tx.wait();

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(TsUpdateMaximumTransferHash);
      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(TsUpdateMaximumTransferHash, false)).toBe(false);
        const [tx] = await tokenServiceCouncil.ts_update_max_transfer(
          proposalId,
          wusdcToken.address(),
          newMaxTransfer,
          signers,
        );
        await tx.wait();
        expect(await council.proposal_executed(TsUpdateMaximumTransferHash)).toBe(true);
        expect(await tokenService.max_transfers(wusdcToken.address())).toBe(newMaxTransfer);
      }, TIMEOUT);

    });

    describe("Update withdrawal limit", () => {
      let proposalId = 0;
      let TsUpdateOutgoingHash = BigInt(0);

      const newLimit: WithdrawalLimit = {
        percentage: 90_00, // 90%
        duration: 2, // per block
        threshold_no_limit: BigInt(200)
      };

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;
        const TsUpdateOutgoing: TsUpdateWithdrawalLimit = {
          id: proposalId,
          token_address: wusdcToken.address(),
          percentage: newLimit.percentage,
          duration: newLimit.duration,
          threshold_no_limit: newLimit.threshold_no_limit
        };
        TsUpdateOutgoingHash = hashStruct(getTsUpdateWithdrawalLimitLeo(TsUpdateOutgoing));
        const [tx] = await council.propose(proposalId, TsUpdateOutgoingHash);
        await tx.wait();

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(TsUpdateOutgoingHash);
      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(TsUpdateOutgoingHash, false)).toBe(false);
        const [tx] = await tokenServiceCouncil.ts_update_outgoing_percentage(
          proposalId,
          wusdcToken.address(),
          newLimit.percentage,
          newLimit.duration,
          newLimit.threshold_no_limit,
          signers,
        );
        await tx.wait();
        expect(await council.proposal_executed(TsUpdateOutgoingHash)).toBe(true);
        expect(await tokenService.token_withdrawal_limits(wusdcToken.address())).toStrictEqual(newLimit);
      }, TIMEOUT);

    });

    describe("Unpause", () => {
      const proposer = councilMember1;
      let proposalId = 0;
      let unpauseTokenProposalHash = BigInt(0);

      beforeEach(async () => {
        council.connect(proposer);
        expect(await tokenService.token_status(wusdcToken.address())).toBe(TOKEN_PAUSED_VALUE);
      }, TIMEOUT)

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;
        const unpauseTokenProposal: TsUnpauseToken = {
          id: proposalId,
          token_address: wusdcToken.address(),
        };
        unpauseTokenProposalHash = hashStruct(getTsUnpauseTokenLeo(unpauseTokenProposal));
        const [tx] = await council.propose(proposalId, unpauseTokenProposalHash);
        await tx.wait();

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(unpauseTokenProposalHash);
      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(unpauseTokenProposalHash, false)).toBe(false);
        const [tx] = await tokenServiceCouncil.ts_unpause_token(
          proposalId,
          wusdcToken.address(),
          signers
        );
        await tx.wait();
        expect(await council.proposal_executed(unpauseTokenProposalHash)).toBe(true);
        expect(await tokenService.token_status(wusdcToken.address())).toBe(TOKEN_UNPAUSED_VALUE);
      }, TIMEOUT);

    });

    describe("Pause", () => {
      const proposer = councilMember1;
      let proposalId = 0;
      let pauseTokenProposalHash = BigInt(0);

      beforeEach(async () => {
        council.connect(proposer);
        expect(await tokenService.token_status(wusdcToken.address())).toBe(TOKEN_UNPAUSED_VALUE);
      }, TIMEOUT)

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;
        const pauseTokenProposal: TsPauseToken = {
          id: proposalId,
          token_address: wusdcToken.address(),
        };
        pauseTokenProposalHash = hashStruct(getTsPauseTokenLeo(pauseTokenProposal));
        const [tx] = await council.propose(proposalId, pauseTokenProposalHash);
        await tx.wait();

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(pauseTokenProposalHash);
      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(pauseTokenProposalHash, false)).toBe(false);
        const [tx] = await tokenServiceCouncil.ts_pause_token(
          proposalId,
          wusdcToken.address(),
          signers
        );
        await tx.wait();
        expect(await council.proposal_executed(pauseTokenProposalHash)).toBe(true);
        expect(await tokenService.token_status(wusdcToken.address())).toBe(TOKEN_PAUSED_VALUE);
      }, TIMEOUT);

    });

    describe("Remove Token", () => {
      let proposalId = 0;
      let RemoveTokenHash = BigInt(0);

      test("Propose", async () => {
        const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        proposalId = totalProposals + 1;
        const RemoveToken: TsRemoveToken = {
          id: proposalId,
          token_address: wusdcToken.address(),
        };
        RemoveTokenHash = hashStruct(getTsRemoveTokenLeo(RemoveToken));
        const [tx] = await council.propose(proposalId, RemoveTokenHash);
        await tx.wait();

        const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
        expect(totalProposalsAfter).toBe(totalProposals + 1);
        expect(await council.proposals(proposalId)).toBe(RemoveTokenHash);
      }, TIMEOUT)

      test("Execute", async () => {
        const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

        expect(await council.proposal_executed(RemoveTokenHash, false)).toBe(false);
        const [tx] = await tokenServiceCouncil.ts_remove_token(
          proposalId,
          wusdcToken.address(),
          signers,
        );
        await tx.wait();
        expect(await council.proposal_executed(RemoveTokenHash)).toBe(true);
        expect(await tokenService.token_connectors(wusdcToken.address(), ALEO_ZERO_ADDRESS)).toBe(ALEO_ZERO_ADDRESS)
        expect(await tokenService.min_transfers(wusdcToken.address(), BigInt(-1))).toBe(BigInt(-1))
        expect(await tokenService.max_transfers(wusdcToken.address(), BigInt(-1))).toBe(BigInt(-1))
      }, TIMEOUT);
    });

  });