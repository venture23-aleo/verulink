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
import { evm2AleoArrWithoutPadding } from "../utils/ethAddress";
import { Vlink_token_bridge_v2Contract } from "../artifacts/js/vlink_token_bridge_v2";
import { Vlink_holding_v2Contract } from "../artifacts/js/vlink_holding_v2";
import { baseChainId, baseTsContractAddr, COUNCIL_THRESHOLD_INDEX, COUNCIL_TOTAL_MEMBERS_INDEX } from "../utils/testdata.data";
import { RegisterToken, RemoveOtherChainAddresses, SetRoleForToken, TsTransferOwnership, UpdateTokenMetadata } from "../artifacts/js/types/vlink_token_service_council_v2";
import { getRegisterTokenLeo, getRemoveOtherChainAddressesLeo, getSetRoleForTokenLeo, getUpdateTokenMetadataLeo } from "../artifacts/js/js2leo/vlink_token_service_council_v2";
import { getTsTransferOwnershipLeo } from "../artifacts/js/js2leo/vlink_token_service_council_v2";
import { ExternalProposal } from "../artifacts/js/types/vlink_council_v2";
import { getExternalProposalLeo } from "../artifacts/js/js2leo/vlink_council_v2";


const mode = ExecutionMode.SnarkExecute;
// npm run test -- --runInBand ./test/8_tokenServiceCouncil.test.ts

const council = new Vlink_council_v2Contract({ mode });
const tokenService = new Vlink_token_service_v2Contract({ mode });
const tokenServiceCouncil = new Vlink_token_service_council_v2Contract({ mode });
const tokenRegistry = new Token_registryContract({ mode })
const bridge = new Vlink_token_bridge_v2Contract({ mode });
const holding = new Vlink_holding_v2Contract({ mode });


const TAG_TS_TRANSFER_OWNERSHIP = 1;
const TAG_TS_ADD_TOKEN = 2;
const TAG_TS_REMOVE_TOKEN = 3;
const TAG_TS_UPDATE_MAX_MIN_TRANSFER = 4;
const TAG_TS_PAUSE_TOKEN = 5;
const TAG_TS_UNPAUSE_TOKEN = 6;
const TAG_TS_UP_OUTGOING_PERCENT = 7;
const TAG_HOLDING_RELEASE = 8;
const TAG_HOLDING_RELEASE_PRIVATE = 9;
const TAG_HOLDING_OWNERSHIP_TRANSFER = 10;
const TAG_TS_REGISTER_TOKEN = 11;
const TAG_UPDATE_TOKEN_METADATA = 12;
const TAG_SET_ROLE_TOKEN = 13;
const TAG_TS_UP_TS_SETTING = 14;
const TAG_TS_ADD_CHAIN_TO_ET = 15;
const TAG_TS_REMOVE_OTHER_CHAIN_ADD = 16;
const TAG_TS_UPDATE_FEES = 17;
const TAG_REMOVE_ROLE = 18;

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
    const thresholdNoLimit = BigInt(100)
    const outgoingPercentage = 10_00
    const time = 1
    const public_platform_fee = 5;
    const private_platform_fee = 10;
    const public_relayer_fee = BigInt(10000);
    const private_relayer_fee = BigInt(20000);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await tokenService.added_tokens(tokenID, false)).toBe(false);
      expect(await council.members(councilMember1)).toBe(true);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tsSupportToken: TsAddToken = {
        tag: TAG_TS_ADD_TOKEN,
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
      const addTokenProposalHash = hashStruct(getTsAddTokenLeo(tsSupportToken));

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

      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.added_tokens(tokenID)).toBe(true);
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
        tag: TAG_TS_UPDATE_MAX_MIN_TRANSFER,
        id: proposalId,
        token_id: tokenID,
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
        tokenID,
        newMinTransfer,
        newMaxTransfer,
        signers,
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.min_transfers(tokenID)).toBe(newMinTransfer);
      expect(await tokenService.max_transfers(tokenID)).toBe(newMaxTransfer);
    }, TIMEOUT);

  });

  describe("Unpause", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await tokenService.token_status(tokenID, false)).toBe(TOKEN_PAUSED_VALUE);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const unpauseTokenProposal: TsUnpauseToken = {
        tag: TAG_TS_UNPAUSE_TOKEN,
        id: proposalId,
        token_id: tokenID,
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
        tokenID,
        signers
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.token_status(tokenID)).toBe(TOKEN_UNPAUSED_VALUE);
    }, TIMEOUT);

  });

  describe("Pause", () => {
    const proposer = councilMember1;
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    beforeEach(async () => {
      council.connect(proposer);
      expect(await tokenService.token_status(tokenID)).toBe(TOKEN_UNPAUSED_VALUE);
    }, TIMEOUT)

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const pauseTokenProposal: TsPauseToken = {
        tag: TAG_TS_PAUSE_TOKEN,
        id: proposalId,
        token_id: tokenID,
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
        tokenID,
        signers
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.token_status(tokenID)).toBe(TOKEN_PAUSED_VALUE);
    }, TIMEOUT);

  });

  describe("Update withdrawal limit(ts_update_outgoing_percentage)", () => {
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    const newLimit: WithdrawalLimit = {
      percentage: 90_00, // 90%
      duration: 2, // per block
      threshold_no_limit: BigInt(200)
    };

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const TsUpdateOutgoing: TsUpdateWithdrawalLimit = {
        tag: TAG_TS_UP_OUTGOING_PERCENT,
        id: proposalId,
        token_id: tokenID,
        percentage: newLimit.percentage,
        duration: newLimit.duration,
        threshold_no_limit: newLimit.threshold_no_limit
      };
      const TsUpdateOutgoingHash = hashStruct(getTsUpdateWithdrawalLimitLeo(TsUpdateOutgoing));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: TsUpdateOutgoingHash
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
      const tx = await tokenServiceCouncil.ts_update_outgoing_percentage(
        proposalId,
        tokenID,
        newLimit.percentage,
        newLimit.duration,
        newLimit.threshold_no_limit,
        signers,
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.token_withdrawal_limits(tokenID)).toStrictEqual(newLimit);
    }, TIMEOUT);

  });

  describe("Register token", () => {
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    test("Propose", async () => {
      console.log(tokenName, "tokenName", tokenID, "tokenID");
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tsRegisterToken: RegisterToken = {
        tag: TAG_TS_REGISTER_TOKEN,
        id: proposalId,
        token_name: tokenName,
        symbol: tokenSymbol,
        decimals: decimal,
        max_supply: maxSupply
      };
      const TsRegisterTokenHash = hashStruct(getRegisterTokenLeo(tsRegisterToken));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: TsRegisterTokenHash
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

      const tx = await tokenServiceCouncil.ts_register_token(
        proposalId,
        tokenName,
        tokenSymbol,
        decimal,
        maxSupply,
        signers,
      );


      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect((await tokenRegistry.registered_tokens(tokenID)).token_id).toBeDefined()
    }, TIMEOUT);
  });

  describe("Update token metadata", () => {
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);
    const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

    test("Propose", async () => {
      expect((await tokenRegistry.registered_tokens(tokenID)).token_id).toBeDefined()
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tsUpdateTokenMetaData: UpdateTokenMetadata = {
        tag: TAG_UPDATE_TOKEN_METADATA,
        id: proposalId,
        token_id: tokenID,
        admin: admin,
        external_authorization_party: councilMember2
      };
      const TsUpdateTokenMetaDataHash = hashStruct(getUpdateTokenMetadataLeo(tsUpdateTokenMetaData));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: TsUpdateTokenMetaDataHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);
    }, TIMEOUT)

    test("Execute", async () => {
      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.update_token_metadata(
        proposalId,
        tokenID,
        admin,
        councilMember2,
        signers,
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
    }, TIMEOUT);

  });

  describe("Set Token role", () => {
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);
    const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

    test("Propose", async () => {
      expect((await tokenRegistry.registered_tokens(tokenID)).token_id).toBeDefined()
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const tsSetRoleToken: SetRoleForToken = {
        tag: TAG_SET_ROLE_TOKEN,
        id: proposalId,
        token_id: tokenID,
        account: admin,
        role: 2
      };

      const TsSetTokenRoleHash = hashStruct(getSetRoleForTokenLeo(tsSetRoleToken));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: TsSetTokenRoleHash
      }

      ExternalProposalHash = hashStruct(getExternalProposalLeo(externalProposal));

      const tx = await council.propose(proposalId, ExternalProposalHash);
      await tx.wait();

      const totalProposalsAfter = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      expect(totalProposalsAfter).toBe(totalProposals + 1);
      expect(await council.proposals(proposalId)).toBe(ExternalProposalHash);
    }, TIMEOUT)

    test("Execute", async () => {
      expect(await council.proposal_executed(ExternalProposalHash, false)).toBe(false);
      const tx = await tokenServiceCouncil.set_role_token(
        proposalId,
        tokenID,
        admin,
        2,
        signers,
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
    }, TIMEOUT);

  });

  describe("Add chain to existing token", () => {
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);
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
        tag: TAG_TS_ADD_CHAIN_TO_ET,
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
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
    }, TIMEOUT);

  });

  describe("Remove  chain to existing token", () => {

    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);
    const signers = [councilMember1, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS, ALEO_ZERO_ADDRESS];

    test("Propose", async () => {
      council.connect(councilMember1)
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const RemoveOtherChainAddresses: RemoveOtherChainAddresses = {
        tag: TAG_TS_REMOVE_OTHER_CHAIN_ADD,
        id: proposalId,
        chain_id: baseChainId,
        token_id: tokenID
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
        tokenID,
        signers
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
    }, TIMEOUT);

  });

  describe("Update fees", () => {

    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);
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
        tag: TAG_TS_UPDATE_FEES,
        id: proposalId,
        chain_id: ethChainId,
        token_id: tokenID,
        public_relayer_fee: new_public_relayer_fee,
        private_relayer_fee: new_private_relayer_fee,
        public_platform_fee: new_public_platform_fee,
        private_platform_fee: new_private_platform_fee
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
        tokenID,
        new_public_relayer_fee,
        new_private_relayer_fee,
        new_public_platform_fee,
        new_private_platform_fee,
        signers
      );
      await tx.wait();


      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);
      expect(await tokenService.public_platform_fee(tokenInfo)).toBe(new_public_platform_fee);
      expect(await tokenService.private_platform_fee(tokenInfo)).toBe(new_private_platform_fee);
      expect(await tokenService.public_relayer_fee(tokenInfo)).toBe(new_public_relayer_fee);
      expect(await tokenService.private_relayer_fee(tokenInfo)).toBe(new_private_relayer_fee);
    }, TIMEOUT);

  });

  describe("Remove Token", () => {
    let proposalId = 0;
    let ExternalProposalHash = BigInt(0);

    test("Propose", async () => {
      const totalProposals = parseInt((await council.proposals(COUNCIL_TOTAL_PROPOSALS_INDEX)).toString());
      proposalId = totalProposals + 1;
      const RemoveToken: TsRemoveToken = {
        tag: TAG_TS_REMOVE_TOKEN,
        id: proposalId,
        chain_id: ethChainId,
        token_id: tokenID,
      };
      const RemoveTokenHash = hashStruct(getTsRemoveTokenLeo(RemoveToken));

      const externalProposal: ExternalProposal = {
        id: proposalId,
        external_program: tokenServiceCouncil.address(),
        proposal_hash: RemoveTokenHash
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
      const tx = await tokenServiceCouncil.ts_remove_token(
        proposalId,
        ethChainId,
        tokenID,
        signers,
      );
      await tx.wait();
      expect(await council.proposal_executed(ExternalProposalHash)).toBe(true);   ///TODO: CHECK HERE
      console.log("there is todo here");
      // expect(await tokenService.added_tokens(tokenID, false)).toBe(false)
      // expect(await tokenService.min_transfers(tokenID, BigInt(-1))).toBe(BigInt(-1))
      // expect(await tokenService.max_transfers(tokenID, BigInt(-1))).toBe(BigInt(-1))
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
        tag: TAG_TS_TRANSFER_OWNERSHIP,
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