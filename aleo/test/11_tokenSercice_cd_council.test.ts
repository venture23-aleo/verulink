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
import { evm2AleoArr, evm2AleoArrWithoutPadding, generateRandomEthAddr, prunePadding } from "../utils/ethAddress";
import { ALEO_CREDITS_TOKEN_ID, aleoChainId, baseChainId, baseTsContractAddr, BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE, BRIDGE_THRESHOLD_INDEX, BRIDGE_TOTAL_ATTESTORS_INDEX, BRIDGE_UNPAUSED_VALUE, COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_MEMBERS_INDEX, ethTsRandomContractAddress2, VERSION_PUBLIC_NORELAYER_NOPREDICATE, VERSION_PUBLIC_RELAYER_NOPREDICATE } from "../utils/testdata.data";
import { ExternalProposal } from "../artifacts/js/types/vlink_council_v2";
import { getExternalProposalLeo } from "../artifacts/js/js2leo/vlink_council_v2";
import { Vlink_token_service_cd_v2Contract } from "../artifacts/js/vlink_token_service_cd_v2";
import { Vlink_token_service_cd_cuncl_v2Contract } from "../artifacts/js/vlink_token_service_cd_cuncl_v2";
import { AddChainExistingToken, RemoveOtherChainAddresses, TsAddTokenInfo, TsPauseToken, TsTransferOwnership, TsUnpauseToken, TsUpdateMaxMinTransfer, UpdateFees, UpdateTokenServiceSetting, TransferOwnershipHolding, HoldingRelease, WithdrawalCreditsFees } from "../artifacts/js/types/vlink_token_service_cd_cuncl_v2";
import { getAddChainExistingTokenLeo, getRemoveOtherChainAddressesLeo, getTsAddTokenInfoLeo, getTsPauseTokenLeo, getTsTransferOwnershipLeo, getTsUnpauseTokenLeo, getTsUpdateMaxMinTransferLeo, getUpdateFeesLeo, getUpdateTokenServiceSettingLeo, getHoldingReleaseLeo, getWithdrawalCreditsFeesLeo } from "../artifacts/js/js2leo/vlink_token_service_cd_cuncl_v2";
import { ChainToken } from "../artifacts/js/types/vlink_token_service_cd_v2";
import { Vlink_token_bridge_v2Contract } from "../artifacts/js/vlink_token_bridge_v2";
import { Vlink_holding_cd_v2Contract } from "../artifacts/js/vlink_holding_cd_v2";
import { Token_registryContract } from "../artifacts/js/token_registry";
import { InPacket, PacketId } from "../artifacts/js/types/vlink_token_bridge_v2";
import { createRandomPacket } from "../utils/packet";
import { signPacket } from "../utils/sign";
import { CreditsContract } from "../artifacts/js/credits";


const mode = ExecutionMode.SnarkExecute;
// npm run test -- --runInBand ./test/11_tokenService_cd_council.test.ts

const council = new Vlink_council_v2Contract({ mode });
const tokenService = new Vlink_token_service_cd_v2Contract({ mode });
const tokenServiceCouncil = new Vlink_token_service_cd_cuncl_v2Contract({ mode });
const bridge = new Vlink_token_bridge_v2Contract({ mode });
const holding = new Vlink_holding_cd_v2Contract({ mode });
const credits = new CreditsContract({ mode: mode });
const tokenRegistry = new Token_registryContract({ mode })


const TAG_TS2_TRANSFER_OWNERSHIP = 1;
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

(BigInt.prototype as any).toJSON = function () {
  return this.toString() + "field";
};

const TIMEOUT = 300000_000;

const [councilMember1, councilMember2, councilMember3, aleoUser4] = council.getAccounts();
const admin = tokenServiceCouncil.address();

const getPlatformFeeInAmount = async (amount: bigint, platform_fee_percentage: number) => {
  //5% is equivalent to 500
  return (BigInt(platform_fee_percentage) * amount) / BigInt(100 * 1000);
}

describe("Token Service Council Waleo", () => {

  const public_platform_fee = 5000;
  const public_relayer_fee = BigInt(10000);

  const sleepTimer = ms => new Promise(resolve => setTimeout(resolve, ms));
  const ethChainTokenInfo: ChainToken = {
    chain_id: ethChainId,
    token_id: ALEO_CREDITS_TOKEN_ID
  }

  describe.skip("deployment", () => {
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

  describe.skip("Initialization", () => {
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

  describe.skip("Holding Setup", () => {
    test("Initialize token holding", async () => {
      const isHoldingInitialized = (await holding.owner_holding(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      expect(isHoldingInitialized).toBe(false)
      if (!isHoldingInitialized) {
        holding.connect(councilMember1);
        const tx = await holding.initialize_holding(councilMember1);
        await tx.wait();
        expect(await holding.owner_holding(OWNER_INDEX)).toBe(councilMember1);
      }
    }, TIMEOUT);

    test("should tranfer_ownership holding", async () => {
      holding.connect(councilMember1);
      const tx = await holding.transfer_ownership_holding(tokenService.address());
      await tx.wait();
      expect(await holding.owner_holding(OWNER_INDEX)).toBe(tokenService.address());
    }, TIMEOUT)

    //initialize bridge
    test("Initialize bridge to consume token", async () => {
      const threshold = 1;
      const isBridgeInitialized = (await bridge.owner_TB(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      expect(isBridgeInitialized).toBe(false);
      if (!isBridgeInitialized) {
        let tx = await bridge.initialize_tb(
          [councilMember1, councilMember2, ALEO_ZERO_ADDRESS, councilMember3, ALEO_ZERO_ADDRESS],
          threshold,
          councilMember1
        );
        await tx.wait();
      }

      expect(await bridge.bridge_settings(BRIDGE_THRESHOLD_INDEX)).toBe(threshold);
      expect(await bridge.bridge_settings(BRIDGE_TOTAL_ATTESTORS_INDEX)).toBe(3);
      expect(await bridge.attestors(councilMember1)).toBeTruthy();
      expect(await bridge.attestors(councilMember2)).toBeTruthy();
      expect(await bridge.attestors(councilMember3)).toBeTruthy();
      expect(await bridge.attestors(ALEO_ZERO_ADDRESS)).toBeTruthy();
      // TODO: checked expect bridge owner should be admin, expect bridge should be paused 
      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)).toBe(BRIDGE_PAUSED_VALUE);
      expect(await bridge.owner_TB(OWNER_INDEX)).toBe(councilMember1);
      expect(await bridge.sequences(aleoChainId)).toBe(BigInt(0))
      expect(await bridge.sequences(ethChainId)).toBe(BigInt(0))
    }, TIMEOUT);

    test("Bridge: Unpause", async () => {
      const isPaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_PAUSED_VALUE;
      if (isPaused) {
        bridge.connect(councilMember1)
        const unpauseTx = await bridge.unpause_tb();
        await unpauseTx.wait();
      }
      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE)).toBe(BRIDGE_UNPAUSED_VALUE);
    }, TIMEOUT)

    test("Add eth  chain in supported chains", async () => {
      const isEthChainAdded = (await bridge.supported_chains(ethChainId, false)) != false;
      if (!isEthChainAdded) {
        const tx = await bridge.add_chain_tb(
          ethChainId
        );
        await tx.wait();
      }
      expect(await bridge.supported_chains(ethChainId)).toBe(true);

      const isAleoChainAdded = (await bridge.supported_chains(aleoChainId, false)) != false;
      if (!isAleoChainAdded) {
        const tx = await bridge.add_chain_tb(
          aleoChainId
        );
        await tx.wait();
      }
      expect(await bridge.supported_chains(aleoChainId)).toBe(true);

    }, TIMEOUT);

    test("Bridge: Add Service", async () => {
      const isTokenServiceEnabled = await bridge.supported_services(tokenService.address(), false);
      if (!isTokenServiceEnabled) {
        const supportServiceTx = await bridge.add_service_tb(tokenService.address());
        await supportServiceTx.wait();
      }
      expect(await bridge.supported_services(tokenService.address())).toBe(true);
    }, TIMEOUT)
  })

  describe.skip("Add Token", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    const minTransfer = BigInt(100)
    const maxTransfer = BigInt(1000000000000000)
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
        fee_platform: public_platform_fee
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
        public_platform_fee
      );
      await tx.wait();

      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.status(ethChainTokenInfo)).toBe(TOKEN_PAUSED_VALUE);
    }, TIMEOUT);

  });

  describe.skip("Update minimum maximum transfer", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);
    const newMinTransfer = BigInt(10)
    const newMaxTransfer = BigInt(100_000_0000)

    beforeEach(async () => {
      council.connect(proposer);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const TsUpdateMinimumMaximumTransfer: TsUpdateMaxMinTransfer = {
        tag: TAG_TS2_UPDATE_MAX_MIN_TRANSFER,
        id: proposalId,
        chain_id: ethChainId,
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
        ethChainId,
        newMinTransfer,
        newMaxTransfer,
        signers,
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.min_transfers(ethChainTokenInfo)).toBe(newMinTransfer);
      expect(await tokenService.max_transfers(ethChainTokenInfo)).toBe(newMaxTransfer);
    }, TIMEOUT);

  });

  describe.skip("Unpause", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await tokenService.status(ethChainTokenInfo, false)).toBe(TOKEN_PAUSED_VALUE);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const unpauseTokenProposal: TsUnpauseToken = {
        tag: TAG_TS2_UNPAUSE_TOKEN,
        id: proposalId,
        chain_id: ethChainId
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
        ethChainId,
        signers
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.status(ethChainTokenInfo)).toBe(TOKEN_UNPAUSED_VALUE);
    }, TIMEOUT);

  });

  describe.skip("Update tokenService setting", () => {

    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);
    const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;

      const UpdatesettingPayload: UpdateTokenServiceSetting = {
        tag: TAG_TS2_UP_TS_SETTING,
        id: proposalId,
        chain_id: ethChainId,
        token_service_address: evm2AleoArrWithoutPadding(ethTsRandomContractAddress2),
        token_address: evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
      };

      const TsUpdateSettingHash = hashStruct(getUpdateTokenServiceSettingLeo(UpdatesettingPayload));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: TsUpdateSettingHash
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
      const tx = await tokenServiceCouncil.ts_update_token_service_setting(
        proposalId,
        ethChainId,
        evm2AleoArrWithoutPadding(ethTsRandomContractAddress2),
        evm2AleoArrWithoutPadding(ethTsRandomContractAddress2),
        signers
      );
      await tx.wait();


      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.other_chain_token_address(ethChainTokenInfo)).toStrictEqual(evm2AleoArr(ethTsRandomContractAddress2))
      expect(await tokenService.other_chain_token_service(ethChainTokenInfo)).toStrictEqual(evm2AleoArr(ethTsRandomContractAddress2))
    }, TIMEOUT);

  });

  describe.skip("Add chain to existing token", () => { //ts_add_chain_to_existing_token
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
        fee_platform: public_platform_fee
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
        signers
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
    }, TIMEOUT);

  });

  describe.skip("Remove  chain to existing token", () => { //ts_remove_chain_to_existing_token
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
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);
    const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
    const new_public_platform_fee = 6000;
    const new_public_relayer_fee = BigInt(20000);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await tokenService.status(ethChainTokenInfo)).toBe(TOKEN_UNPAUSED_VALUE);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const UpdateFeesPayload: UpdateFees = {
        tag: TAG_TS2_UPDATE_FEES,
        id: proposalId,
        chain_id: ethChainId,
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
        new_public_platform_fee,
        signers
      );
      await tx.wait();


      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.platform_fee(ethChainTokenInfo)).toBe(new_public_platform_fee);
    }, TIMEOUT);

  });

  describe.skip("Hold some fund to test release", () => {
    test("happy token send in public version with active relayer",
      async () => {
        const send_amount = BigInt(100_0000);
        const destTsAddr = ethTsContractAddr.toLowerCase();
        const ethUser = generateRandomEthAddr();
        const destToken = usdcContractAddr.toLowerCase();
        const initialTokenSupply = await tokenService.total_supply(ethChainTokenInfo, BigInt(0));

        // const aleocredit = await credits.account(aleoUser1, BigInt(0));
        expect(await tokenService.min_transfers(ethChainTokenInfo)).toBeLessThanOrEqual(send_amount)
        expect(await tokenService.max_transfers(ethChainTokenInfo)).toBeGreaterThanOrEqual(send_amount)
        tokenService.connect(councilMember1);
        tokenRegistry.connect(councilMember1);
        const other_chain_token_service = await tokenService.other_chain_token_service(ethChainTokenInfo);
        const other_chain_token_address = await tokenService.other_chain_token_address(ethChainTokenInfo);
        expect(other_chain_token_service).not.toBeNull();
        expect(other_chain_token_address).not.toBeNull();
        // const council_initial_balance = await credits.account(tokenServiceWAleoCouncil.address());
        const platformFee = await getPlatformFeeInAmount(send_amount, 5);
        tokenService.connect(councilMember1);
        const tx = await tokenService.token_send_public(
          evm2AleoArrWithoutPadding(ethUser.toLowerCase()),
          send_amount,
          ethChainId,
          evm2AleoArrWithoutPadding(destTsAddr),
          evm2AleoArrWithoutPadding(destToken),
          platformFee
        );
        await tx.wait();
      },
      TIMEOUT
    );

    test("Send some credits to holding to test holding release", async () => {
      const ethUser = generateRandomEthAddr()
      const relayer_fee = BigInt(10000);
      const createPacket = (
        receiver: string,
        amount: bigint,
        aleoTsAddr: string,
        sourcecChainId: bigint,
        tsContractAddress: string,
        version = VERSION_PUBLIC_NORELAYER_NOPREDICATE,

      ): InPacket => {
        return createRandomPacket(
          receiver,
          amount,
          sourcecChainId,
          aleoChainId,
          tsContractAddress,
          aleoTsAddr,
          ALEO_CREDITS_TOKEN_ID,
          version,
          ethUser,
        );
      };
      const receiveAmount: bigint = BigInt(100_000)
      const packet = createPacket(councilMember1, receiveAmount, tokenService.address(), ethChainId, ethTsContractAddr);
      tokenService.connect(councilMember1);
      const token_status = await tokenService.status(ethChainTokenInfo);
      expect(token_status).toBe(false); //SHOULD UNPAUSE TOKEN
      const signature = signPacket(packet, false, tokenService.config.privateKey);
      const signatures = [
        signature,
        signature,
        signature,
        signature,
        signature,
      ];
      const signers = [
        councilMember1,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
      ];

      let packetId: PacketId = {
        chain_id: packet.source.chain_id,
        sequence: packet.sequence
      }

      //check bridge pausability status
      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX)).toBe(BRIDGE_UNPAUSED_VALUE);
      const other_chain_token_service = await tokenService.other_chain_token_service(ethChainTokenInfo)
      expect(other_chain_token_service).not.toBeNull()
      expect(await bridge.in_packet_consumed(packetId, false)).toBe(false);
      const initial_held_amount = await tokenService.token_holding(ALEO_CREDITS_TOKEN_ID, BigInt(0))
      const initialTokenSupply = await tokenService.total_supply(ethChainTokenInfo, BigInt(0));
      tokenService.connect(councilMember1);
      const tx = await tokenService.token_receive_public(
        prunePadding(packet.message.sender_address),
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures,
        packet.source.chain_id,
        prunePadding(packet.source.addr)
      );
      await tx.wait();
      const finalTokenSupply = await tokenService.total_supply(ethChainTokenInfo);
      const finalHeldAmount = await tokenService.token_holding(ALEO_CREDITS_TOKEN_ID)
      expect(finalHeldAmount).toBe(initial_held_amount + receiveAmount);
    }, TIMEOUT)
  })

  describe.skip("Release fund", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await tokenService.status(ethChainTokenInfo)).toBe(TOKEN_UNPAUSED_VALUE);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const holdingReleaseProposal: HoldingRelease = {
        tag: TAG_HOLDING2_RELEASE,
        id: proposalId,
        receiver: councilMember1,
        amount: BigInt(1000)
      };
      const holdingReleaseProposalHash = hashStruct(getHoldingReleaseLeo(holdingReleaseProposal));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: holdingReleaseProposalHash
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
      const initialHeldAmount = await tokenService.token_holding(ALEO_CREDITS_TOKEN_ID, BigInt(0))
      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.holding_release(
        proposalId,
        councilMember1,
        BigInt(1000),
        signers
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      const finalHeldAmount = await tokenService.token_holding(ALEO_CREDITS_TOKEN_ID, BigInt(0))
      expect(finalHeldAmount).toBe(initialHeldAmount - BigInt(1000))
    }, TIMEOUT);
  });

  describe.skip("Pause", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await tokenService.status(ethChainTokenInfo)).toBe(TOKEN_UNPAUSED_VALUE);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const pauseTokenProposal: TsPauseToken = {
        tag: TAG_TS2_PAUSE_TOKEN,
        id: proposalId,
        chain_id: ethChainId
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
        ethChainId,
        signers
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.status(ethChainTokenInfo)).toBe(TOKEN_PAUSED_VALUE);
    }, TIMEOUT);

  });

  describe.skip("Holding Ownership transfer", () => {
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
      const tsHoldingOwnershipTransfer: TransferOwnershipHolding = {
        tag: TAG_HOLDING2_OWNERSHIP_TRANSFER,
        id: proposalId,
        new_owner: admin
      };
      const transferHoldingOwnershipProposalHash = hashStruct(getTsTransferOwnershipLeo(tsHoldingOwnershipTransfer));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: transferHoldingOwnershipProposalHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const holding_intital_owner = await holding.owner_holding(OWNER_INDEX)
      console.log(holding_intital_owner, "holding initial owner", admin);

      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.holding_ownership_transfer(
        proposalId,
        admin,
        signers
      );
      await tx.wait();

      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await holding.owner_holding(OWNER_INDEX)).toBe(admin);
    }, TIMEOUT);

  });

  describe.skip("Transfer ownership", () => {
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