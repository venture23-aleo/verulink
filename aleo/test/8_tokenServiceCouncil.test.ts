import { Vlink_council_v2Contract } from "../artifacts/js/vlink_council_v2";
import { Vlink_token_service_council_v2Contract } from "../artifacts/js/vlink_token_service_council_v2";
import { Vlink_token_service_v2Contract } from "../artifacts/js/vlink_token_service_v2";
import { Token_registryContract } from "../artifacts/js/token_registry";
import {
  ALEO_ZERO_ADDRESS,
  COUNCIL_TOTAL_PROPOSALS_INDEX,
  OWNER_INDEX,
  TOKEN_PAUSED_VALUE,
  TOKEN_UNPAUSED_VALUE,
  ethChainId,
  ethTsContractAddr,
  max_supply,
  usdcContractAddr,
} from "../utils/constants";
import { ChainToken, WithdrawalLimit } from "../artifacts/js/types/vlink_token_service_v2";
import { hashStruct, hashU128Field } from "../utils/hash";
import { ExecutionMode, js2leo } from "@doko-js/core";
import {
  TsAddToken,
  TsRemoveToken,
  TsUpdateWithdrawalLimit,
  TsPauseToken,
  TsUnpauseToken,
  TsUpdateMaxMinTransfer,
  AddChainExistingToken,
  UpdateFees
} from "../artifacts/js/types/vlink_token_service_council_v2";
import {
  getTsAddTokenLeo,
  getTsRemoveTokenLeo,
  getTsUpdateWithdrawalLimitLeo,
  getTsPauseTokenLeo,
  getTsUnpauseTokenLeo,
  getTsUpdateMaxMinTransferLeo,
  getAddChainExistingTokenLeo,
  getUpdateFeesLeo,
} from "../artifacts/js/js2leo/vlink_token_service_council_v2";
import { aleoArr2Evm, evm2AleoArr, evm2AleoArrWithoutPadding } from "../utils/ethAddress";
import { Vlink_token_bridge_v2Contract } from "../artifacts/js/vlink_token_bridge_v2";
import { Vlink_holding_v2Contract } from "../artifacts/js/vlink_holding_v2";
import { baseChainId, baseTsContractAddr, COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_MEMBERS_INDEX } from "../utils/testdata.data";
import { RegisterToken, RemoveOtherChainAddresses, SetRoleForToken, TsTransferOwnership, UpdateTokenMetadata } from "../artifacts/js/types/vlink_token_service_council_v2";
import { getRegisterTokenLeo, getRemoveOtherChainAddressesLeo, getSetRoleForTokenLeo, getUpdateTokenMetadataLeo } from "../artifacts/js/js2leo/vlink_token_service_council_v2";
import { getTsTransferOwnership } from "../artifacts/js/leo2js/vlink_token_service_council_v2";
import { getTsTransferOwnershipLeo } from "../artifacts/js/js2leo/vlink_token_service_council_v2";



const mode = ExecutionMode.SnarkExecute;
// npm run test -- --runInBand ./test/8_tokenServiceCouncil.test.ts

const council = new Vlink_council_v2Contract({ mode });
const tokenService = new Vlink_token_service_v2Contract({ mode });
const tokenServiceCouncil = new Vlink_token_service_council_v2Contract({ mode });
const tokenRegistry = new Token_registryContract({ mode })
const bridge = new Vlink_token_bridge_v2Contract({ mode });
const holding = new Vlink_holding_v2Contract({ mode });

(BigInt.prototype as any).toJSON = function () {
  return this.toString() + "field";
};

const TIMEOUT = 300000_000;

const [councilMember1, councilMember2, councilMember3, aleoUser4] = council.getAccounts();
const admin = tokenServiceCouncil.address();

describe("Token Service Council", () => {
  const tokenSymbol = BigInt("1431520324539521231211");
  const decimal = 6;
  const maxSupply = BigInt("184467440737095516191");
  const tokenName = BigInt('61483328216518126945421231211')
  let tokenID = hashU128Field(js2leo.u128(tokenName));
  console.log(JSON.stringify(tokenID), "tokenID");

  const public_platform_fee = 5000;
  const private_platform_fee = 10000;
  const public_relayer_fee = BigInt(10000);
  const private_relayer_fee = BigInt(20000);

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
    let addTokenProposalHash = BigInt(0);

    const minTransfer = BigInt(100)
    const maxTransfer = BigInt(100)
    const thresholdNoLimit = BigInt(100)
    const outgoingPercentage = 10_00
    const time = 1
    const public_platform_fee = 5;
    const private_platform_fee = 10;
    const public_relayer_fee = BigInt(10000);
    const private_relayer_fee = BigInt(20000);

    beforeEach(async () => {
      council.connect(proposer);
      const data = await tokenService.added_tokens(tokenID, false);
      expect(await tokenService.added_tokens(tokenID, false)).toBe(false);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tsSupportToken: TsAddToken = {
        id: proposalId,
        token_id: tokenID,
        min_transfer: minTransfer,
        max_transfer: maxTransfer,
        outgoing_percentage: outgoingPercentage,
        time,
        max_no_cap: thresholdNoLimit,
        token_address: evm2AleoArrWithoutPadding(usdcContractAddr),
        token_service: evm2AleoArrWithoutPadding(ethTsContractAddr),
        chain_id: ethChainId,
        pub_platform_fee: public_platform_fee,
        pri_platform_fee: private_platform_fee,
        pub_relayer_fee: public_relayer_fee,
        pri_relayer_fee: private_relayer_fee
      };
      addTokenProposalHash = hashStruct(getTsAddTokenLeo(tsSupportToken));
      const tx = await council.propose(proposalId, addTokenProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(addTokenProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      expect(await council.proposal_executed(addTokenProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_add_token(
        proposalId,
        tokenID,
        minTransfer,
        maxTransfer,
        outgoingPercentage,
        time,
        thresholdNoLimit,
        signers,
        evm2AleoArrWithoutPadding(usdcContractAddr),
        evm2AleoArrWithoutPadding(ethTsContractAddr),
        ethChainId,
        public_platform_fee,
        private_platform_fee,
        public_relayer_fee,
        private_relayer_fee,
      );
      await tx.wait();

      expect(await council.proposal_executed(addTokenProposalHash)).toBe(true);
      expect(await tokenService.added_tokens(tokenID)).toBe(true);
    }, TIMEOUT);

  });

  describe("Update minimum maximum transfer", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let TsUpdateMinmaxTransferHash = BigInt(0);
    const newMinTransfer = BigInt(10)
    const newMaxTransfer = BigInt(100_000)

    beforeEach(async () => {
      council.connect(proposer);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const TsUpdateMinimumMaximumTransfer: TsUpdateMaxMinTransfer = {
        id: proposalId,
        token_id: tokenID,
        min_transfer: newMinTransfer,
        max_transfer: newMaxTransfer
      };
      TsUpdateMinmaxTransferHash = hashStruct(getTsUpdateMaxMinTransferLeo(TsUpdateMinimumMaximumTransfer));
      const tx = await council.propose(proposalId, TsUpdateMinmaxTransferHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(TsUpdateMinmaxTransferHash);
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(TsUpdateMinmaxTransferHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_update_max_min_transfer(
        proposalId,
        tokenID,
        newMinTransfer,
        newMaxTransfer,
        signers,
      );
      await tx.wait();
      expect(await council.proposal_executed(TsUpdateMinmaxTransferHash)).toBe(true);
      expect(await tokenService.min_transfers(tokenID)).toBe(newMinTransfer);
      expect(await tokenService.max_transfers(tokenID)).toBe(newMaxTransfer);
    }, TIMEOUT);

  });

  describe("Unpause", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let unpauseTokenProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await tokenService.token_status(tokenID, false)).toBe(TOKEN_PAUSED_VALUE);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const unpauseTokenProposal: TsUnpauseToken = {
        id: proposalId,
        token_id: tokenID,
      };
      unpauseTokenProposalHash = hashStruct(getTsUnpauseTokenLeo(unpauseTokenProposal));
      const tx = await council.propose(proposalId, unpauseTokenProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(unpauseTokenProposalHash);
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(unpauseTokenProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_unpause_token(
        proposalId,
        tokenID,
        signers
      );
      await tx.wait();
      expect(await council.proposal_executed(unpauseTokenProposalHash)).toBe(true);
      expect(await tokenService.token_status(tokenID)).toBe(TOKEN_UNPAUSED_VALUE);
    }, TIMEOUT);

  });

  describe("Pause", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let pauseTokenProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await tokenService.token_status(tokenID)).toBe(TOKEN_UNPAUSED_VALUE);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const pauseTokenProposal: TsPauseToken = {
        id: proposalId,
        token_id: tokenID,
      };
      pauseTokenProposalHash = hashStruct(getTsPauseTokenLeo(pauseTokenProposal));
      const tx = await council.propose(proposalId, pauseTokenProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(pauseTokenProposalHash);
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(pauseTokenProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_pause_token(
        proposalId,
        tokenID,
        signers
      );
      await tx.wait();
      expect(await council.proposal_executed(pauseTokenProposalHash)).toBe(true);
      expect(await tokenService.token_status(tokenID)).toBe(TOKEN_PAUSED_VALUE);
    }, TIMEOUT);

  });

  describe("Update withdrawal limit(ts_update_outgoing_percentage)", () => {
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
        token_id: tokenID,
        percentage: newLimit.percentage,
        duration: newLimit.duration,
        threshold_no_limit: newLimit.threshold_no_limit
      };
      TsUpdateOutgoingHash = hashStruct(getTsUpdateWithdrawalLimitLeo(TsUpdateOutgoing));
      const tx = await council.propose(proposalId, TsUpdateOutgoingHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(TsUpdateOutgoingHash);
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

      expect(await council.proposal_executed(TsUpdateOutgoingHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_update_outgoing_percentage(
        proposalId,
        tokenID,
        newLimit.percentage,
        newLimit.duration,
        newLimit.threshold_no_limit,
        signers,
      );
      await tx.wait();
      expect(await council.proposal_executed(TsUpdateOutgoingHash)).toBe(true);
      expect(await tokenService.token_withdrawal_limits(tokenID)).toStrictEqual(newLimit);
    }, TIMEOUT);

  });

  describe("Register token", () => { //ts_register_token
    let proposalId = 0;
    let TsRegisterTokenHash = BigInt(0);

    test("Propose", async () => {
      console.log(tokenName, "tokenName", tokenID, "tokenID");
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tsRegisterToken: RegisterToken = {
        id: proposalId,
        token_name: tokenName,
        symbol: tokenSymbol,
        decimals: decimal,
        max_supply: maxSupply
      };
      console.log(tsRegisterToken, "tsRegisterToken");
      TsRegisterTokenHash = hashStruct(getRegisterTokenLeo(tsRegisterToken));
      const tx = await council.propose(proposalId, TsRegisterTokenHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(TsRegisterTokenHash);
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      expect(await council.proposal_executed(TsRegisterTokenHash, false)).toBe(false);

      const tx = await tokenServiceCouncil.ts_register_token(
        proposalId,
        tokenName,
        tokenSymbol,
        decimal,
        maxSupply,
        signers,
      );


      await tx.wait();
      expect(await council.proposal_executed(TsRegisterTokenHash)).toBe(true);
      expect((await tokenRegistry.registered_tokens(tokenID)).token_id).toBeDefined()
    }, TIMEOUT);
  });

  describe("Update token metadata", () => { //update_token_metadata
    let proposalId = 0;
    let TsUpdateTokenMetaDataHash = BigInt(0);
    const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

    test("Propose", async () => {
      expect((await tokenRegistry.registered_tokens(tokenID)).token_id).toBeDefined()
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tsUpdateTokenMetaData: UpdateTokenMetadata = {
        id: proposalId,
        token_id: tokenID,
        admin: admin,
        external_authorization_party: councilMember2
      };
      TsUpdateTokenMetaDataHash = hashStruct(getUpdateTokenMetadataLeo(tsUpdateTokenMetaData));
      const tx = await council.propose(proposalId, TsUpdateTokenMetaDataHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(TsUpdateTokenMetaDataHash);
    }, TIMEOUT)

    test("Execute", async () => {
      expect(await council.proposal_executed(TsUpdateTokenMetaDataHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.update_token_metadata(
        proposalId,
        tokenID,
        admin,
        councilMember2,
        signers,
      );
      await tx.wait();
      expect(await council.proposal_executed(TsUpdateTokenMetaDataHash)).toBe(true);
    }, TIMEOUT);

  });

  describe("Set Token role", () => { //set_role_token
    let proposalId = 0;
    let TsSetTokenRoleHash = BigInt(0);
    const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

    test("Propose", async () => {
      expect((await tokenRegistry.registered_tokens(tokenID)).token_id).toBeDefined()
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tsSetRoleToken: SetRoleForToken = {
        id: proposalId,
        token_id: tokenID,
        account: admin,
        role: 2
      };

      TsSetTokenRoleHash = hashStruct(getSetRoleForTokenLeo(tsSetRoleToken));
      const tx = await council.propose(proposalId, TsSetTokenRoleHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(TsSetTokenRoleHash);
    }, TIMEOUT)

    test("Execute", async () => {
      expect(await council.proposal_executed(TsSetTokenRoleHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.set_role_token(
        proposalId,
        tokenID,
        admin,
        2,
        signers,
      );
      await tx.wait();
      expect(await council.proposal_executed(TsSetTokenRoleHash)).toBe(true);
    }, TIMEOUT);

  });

  describe("Add  chain to existing token", () => { //ts_add_chain_to_existing_token
    let proposalId = 0;
    let TsAddChainToExistingTokenHash = BigInt(0);
    const signers = [councilMember1, councilMember2, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
    console.log(council.address(), "council address", tokenServiceCouncil.address());

    test("Propose", async () => {
      const isparentTokenExist = await tokenService.added_tokens(tokenID)
      const tokenInfo: ChainToken = {
        chain_id: baseChainId,
        token_id: tokenID
      }

      console.log(isparentTokenExist, "isparentTokenExist");
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tsAddChainToExistingToken: AddChainExistingToken = {
        id: proposalId,
        chain_id: baseChainId,
        token_id: tokenID,
        token_address: evm2AleoArrWithoutPadding(usdcContractAddr),
        token_service_address: evm2AleoArrWithoutPadding(baseTsContractAddr),
        pub_platform_fee: public_platform_fee,
        pri_platform_fee: private_platform_fee,
        pub_relayer_fee: public_relayer_fee,
        pri_relayer_fee: private_relayer_fee
      };
      console.log(tsAddChainToExistingToken, "tsAddChainToExistingToken");

      TsAddChainToExistingTokenHash = hashStruct(getAddChainExistingTokenLeo(tsAddChainToExistingToken));
      const tx = await council.propose(proposalId, TsAddChainToExistingTokenHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(TsAddChainToExistingTokenHash);
      const totalVotes = await council.proposal_vote_counts(TsAddChainToExistingTokenHash)
      console.log(totalVotes);
      // const proposalVotes = await council.proposal_votes(TsAddChainToExistingTokenHash)
      // console.log(proposalVotes);
    }, TIMEOUT)


    test("Vote", async () => {
      const initialVotes = await council.proposal_vote_counts(TsAddChainToExistingTokenHash);
      council.connect(councilMember2)
      const voteTx = await council.vote(TsAddChainToExistingTokenHash, true);
      await voteTx.wait();

      const finalVotes = await council.proposal_vote_counts(TsAddChainToExistingTokenHash);
      expect(finalVotes).toBe(initialVotes + 1);
    }, TIMEOUT)

    test("Execute", async () => {
      expect(await council.proposal_executed(TsAddChainToExistingTokenHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_add_chain_to_existing_token(
        proposalId,
        baseChainId,
        tokenID,
        evm2AleoArrWithoutPadding(baseTsContractAddr),
        evm2AleoArrWithoutPadding(usdcContractAddr),
        signers,
        public_platform_fee,
        private_platform_fee,
        public_relayer_fee,
        private_relayer_fee
      );

      await tx.wait();
      sleepTimer(5000);
      expect(await council.proposal_executed(TsAddChainToExistingTokenHash)).toBe(true);
    }, TIMEOUT);

  });

  describe("Remove  chain to existing token", () => { //ts_remove_chain_to_existing_token

    let proposalId = 0;
    let TsRemoveChainToExistingTokenHash = BigInt(0);
    const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

    test("Propose", async () => {
      council.connect(councilMember1)
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const RemoveOtherChainAddresses: RemoveOtherChainAddresses = {
        id: proposalId,
        chain_id: baseChainId,
        token_id: tokenID
      };

      TsRemoveChainToExistingTokenHash = hashStruct(getRemoveOtherChainAddressesLeo(RemoveOtherChainAddresses));
      const tx = await council.propose(proposalId, TsRemoveChainToExistingTokenHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      sleepTimer(5000);
      expect(await council.proposals(proposalId)).toBe(TsRemoveChainToExistingTokenHash);
    }, TIMEOUT)

    test("Execute", async () => {
      tokenServiceCouncil.connect(councilMember1);
      const tokenServiceOwner = await tokenService.owner_TS(OWNER_INDEX);
      console.log(tokenServiceOwner, tokenServiceCouncil.address(), "we are here");
      sleepTimer(5000);
      expect(await council.proposal_executed(TsRemoveChainToExistingTokenHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_remove_other_chain_addresses(
        proposalId,
        baseChainId,
        tokenID,
        signers
      );
      await tx.wait();
      expect(await council.proposal_executed(TsRemoveChainToExistingTokenHash)).toBe(true);
    }, TIMEOUT);

  });

  describe("Update fees", () => { //ts_update_fees

    let proposalId = 0;
    let TsUpdateFeesHash = BigInt(0);
    const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
    const new_public_platform_fee = 6000;
    const new_private_platform_fee = 20000;
    const new_public_relayer_fee = BigInt(20000);
    const new_private_relayer_fee = BigInt(30000);
    const tokenInfo: ChainToken = {
      token_id: tokenID,
      chain_id: ethChainId
    }

    test("Propose", async () => {
      expect(await tokenService.added_tokens(tokenID)).toBe(true);
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;

      const UpdateFeesPayload: UpdateFees = {
        id: proposalId,
        chain_id: ethChainId,
        token_id: tokenID,
        public_relayer_fee: new_public_relayer_fee,
        private_relayer_fee: new_private_relayer_fee,
        public_platform_fee: new_public_platform_fee,
        private_platform_fee: new_private_platform_fee
      };

      TsUpdateFeesHash = hashStruct(getUpdateFeesLeo(UpdateFeesPayload));
      council.connect(councilMember1);
      const tx = await council.propose(proposalId, TsUpdateFeesHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(TsUpdateFeesHash);
    }, TIMEOUT)

    test("Execute", async () => {
      expect(await council.proposal_executed(TsUpdateFeesHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_update_fees(
        proposalId,
        ethChainId,
        tokenID,
        new_public_relayer_fee,
        new_private_relayer_fee,
        new_public_platform_fee,
        new_private_platform_fee,
        signers
      );
      await tx.wait();


      expect(await council.proposal_executed(TsUpdateFeesHash)).toBe(true);
      expect(await tokenService.public_platform_fee(tokenInfo)).toBe(new_public_platform_fee);
      expect(await tokenService.private_platform_fee(tokenInfo)).toBe(new_private_platform_fee);
      expect(await tokenService.public_relayer_fee(tokenInfo)).toBe(new_public_relayer_fee);
      expect(await tokenService.private_relayer_fee(tokenInfo)).toBe(new_private_relayer_fee);
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
        chain_id: ethChainId,
        token_id: tokenID,
      };
      RemoveTokenHash = hashStruct(getTsRemoveTokenLeo(RemoveToken));
      council.connect(councilMember1);
      const tx = await council.propose(proposalId, RemoveTokenHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(RemoveTokenHash);
    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      expect(await council.proposal_executed(RemoveTokenHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_remove_token(
        proposalId,
        ethChainId,
        tokenID,
        signers,
      );
      await tx.wait();
      expect(await council.proposal_executed(RemoveTokenHash)).toBe(true);
      expect(await tokenService.added_tokens(tokenID, false)).toBe(false)
      expect(await tokenService.min_transfers(tokenID, BigInt(-1))).toBe(BigInt(-1))
      expect(await tokenService.max_transfers(tokenID, BigInt(-1))).toBe(BigInt(-1))
    }, TIMEOUT);
  });

  describe("Transfer ownership", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let transferOwnershipProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tsTransferOwnership: TsTransferOwnership = {
        id: proposalId,
        new_owner: councilMember3,
      };
      transferOwnershipProposalHash = hashStruct(getTsTransferOwnershipLeo(tsTransferOwnership));
      council.connect(councilMember1);
      const tx = await council.propose(proposalId, transferOwnershipProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(transferOwnershipProposalHash);

    }, TIMEOUT)

    test("Execute", async () => {
      const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];
      expect(await council.proposal_executed(transferOwnershipProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.ts_transfer_ownership(
        proposalId,
        councilMember3,
        signers
      );
      await tx.wait();

      expect(await council.proposal_executed(transferOwnershipProposalHash)).toBe(true);
      expect(await tokenService.owner_TS(OWNER_INDEX)).toBe(councilMember3);
    }, TIMEOUT);

  });

});