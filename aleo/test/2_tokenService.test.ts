import { Vlink_token_bridge_v3Contract } from "../artifacts/js/vlink_token_bridge_v3";
import { InPacket } from "../artifacts/js/types/vlink_token_bridge_v3";
import { Vlink_token_service_v3Contract } from "../artifacts/js/vlink_token_service_v3";
import { Token_registryContract } from "../artifacts/js/token_registry";

import { aleoArr2Evm, evm2AleoArr, evm2AleoArrWithoutPadding, generateRandomEthAddr, prunePadding } from "../utils/ethAddress";
import { signPacket } from "../utils/sign";

import {
  ALEO_ZERO_ADDRESS,
  BRIDGE_PAUSABILITY_INDEX,
  BRIDGE_PAUSED_VALUE,
  BRIDGE_UNPAUSED_VALUE,
  OWNER_INDEX,
  VERSION_PUBLIC_NORELAYER_NOPREDICATE,
  VERSION_PRIVATE_NORELAYER_NOPREDICATE,
  TOKEN_PAUSED_VALUE,
  TOKEN_UNPAUSED_VALUE,
  aleoChainId,
  arbitrumChainId,
  arbitrumTsContractAddr,
  baseChainId,
  baseTsContractAddr,
  ethChainId,
  ethTsContractAddr,
  ethTsRandomContractAddress,
  ethTsRandomContractAddress2,
  usdcContractAddr,
  VERSION_PUBLIC_RELAYER_NOPREDICATE,
  VERSION_PRIVATE_RELAYER_NOPREDICATE,
} from "../utils/constants";
import { PrivateKey } from "@aleohq/sdk";
import { createRandomPacket } from "../utils/packet";
import { Image, WithdrawalLimit } from "../artifacts/js/types/vlink_token_service_v3";
import { ExecutionMode } from "@doko-js/core";
import { ChainToken } from "../artifacts/js/types/vlink_token_service_council_v3";
import { Vlink_holding_v3Contract } from "../artifacts/js/vlink_holding_v3";
import { TokenMetadata } from "../artifacts/js/types/vlink_holding_v3";
import { Balance, TokenOwner } from "../artifacts/js/types/token_registry";
import { hashStruct, hashStructToAddress } from "../utils/hash";
import { Vlink_token_service_council_v3Contract } from "../artifacts/js/vlink_token_service_council_v3";
import { decryptToken } from "../artifacts/js/leo2js/token_registry";
import { Vlink_council_v3Contract } from "../artifacts/js/vlink_council_v3";


const mode = ExecutionMode.SnarkExecute;


const bridge = new Vlink_token_bridge_v3Contract({ mode: mode });
const tokenService = new Vlink_token_service_v3Contract({ mode: mode });
const mtsp = new Token_registryContract({ mode: mode });
const holding = new Vlink_holding_v3Contract({ mode });
const tokenServiceCouncil = new Vlink_token_service_council_v3Contract({ mode: mode });
const council = new Vlink_council_v3Contract({ mode: mode })

let tokenID = BigInt("7190692537453907461105790569797103513515746302149567971663963167242253971983");

(BigInt.prototype as any).toJSON = function () {
  return this.toString() + "field";
};

const newTokenID = BigInt(987456123);

const eth2TokenInfo: ChainToken = {
  chain_id: ethChainId,
  token_id: newTokenID
}


const TIMEOUT = 20000_000;
const wrongTokenID = BigInt("32165478985523213549");

const ethUser = generateRandomEthAddr();
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
    tokenID,
    version,
    ethUser,
  );
};

const getPlatformFeeInAmount = async (amount: bigint, platform_fee_percentage: number) => {
  //5% is equivalent to 500
  return (BigInt(platform_fee_percentage) * amount) / BigInt(100 * 1000);
}

describe("Token Service ", () => {
  const [aleoUser1, aleoUser2, aleoUser3, aleoUser4] = bridge.getAccounts();
  const aleoUser5 = new PrivateKey().to_address().to_string();
  const token_name = BigInt('6148332821651876206')//"USD Coin" // to ascii and then each ascii to hex then to decimal by concatenating that = 85 83 68 32 67 111 105 110 each value to hex= 55 53 44 20 43 6f 69 6e then concatenate all values= 55534420436f696e convert this to decimal= 144693545833646
  const token_symbol = BigInt("1431520323") //"USDC" // to ascii for each char = 85 83 68 67 then to hex= 55 53 44 43 then concatenate all values= 55534443 convert this to decimal= 1431655763
  const token_decimals = 6
  const token_max_supply = BigInt("18446744073709551615") //u128 max value= 18446744073709551615
  tokenID = hashStruct(token_name);
  const privateKey1 = process.env.ALEO_DEVNET_PRIVATE_KEY1;
  const public_platform_fee = 5000;
  const private_platform_fee = 10000;
  const public_relayer_fee = BigInt(10000);
  const private_relayer_fee = BigInt(20000);
  const active_relayer = true;
  const non_active_relayer = false;

  const admin = aleoUser1;
  const connector = aleoUser4;

  describe("Deployment", () => {
    tokenService.connect(admin)

    test("Deploy Bridge", async () => {
      const deployTx = await bridge.deploy();
      await deployTx.wait();
    }, TIMEOUT);

    test("Deploy MTSP program", async () => {
      const deployTx = await mtsp.deploy();
      await deployTx.wait();
    }, TIMEOUT);

    test("Deploy Holding program", async () => {
      const deployTx = await holding.deploy();
      await deployTx.wait();
    }, TIMEOUT);

    test("Deploy Token Service", async () => {
      const deployTx = await tokenService.deploy();
      await deployTx.wait();
    }, TIMEOUT);
  })

  describe("Initialization", () => {
    test("Bridge: Initialize", async () => {
      const threshold = 1;
      const isBridgeInitialized = (await bridge.owner_TB(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      if (!isBridgeInitialized) {
        const tx = await bridge.initialize_tb(
          [aleoUser1, aleoUser2, ALEO_ZERO_ADDRESS, aleoUser4, ALEO_ZERO_ADDRESS],
          threshold,
          admin
        );
        await tx.wait();
      }
    }, TIMEOUT);

    test("Bridge: Add ethereum Chain", async () => {
      const isEthSupported = (await bridge.supported_chains(ethChainId, false));
      if (!isEthSupported) {
        const addEthChainTx = await bridge.add_chain_tb(ethChainId);
        await addEthChainTx.wait();
      }
      expect(await bridge.supported_chains(ethChainId, false)).toBe(true)
    }, TIMEOUT)

    test("Bridge: Add base Chain", async () => {
      const isBaseSupported = (await bridge.supported_chains(baseChainId, false));
      if (!isBaseSupported) {
        const addBaseChainTx = await bridge.add_chain_tb(baseChainId);
        await addBaseChainTx.wait();
      }
      expect(await bridge.supported_chains(baseChainId, false)).toBe(true)
    }, TIMEOUT)

    test("Bridge: Add arbitrum Chain", async () => {
      const isArbitrumSupported = (await bridge.supported_chains(arbitrumChainId, false));
      if (!isArbitrumSupported) {
        const addArbitrumChainTx = await bridge.add_chain_tb(arbitrumChainId);
        await addArbitrumChainTx.wait();
      }
      expect(await bridge.supported_chains(arbitrumChainId, false)).toBe(true)
    }, TIMEOUT)

    test("Bridge: Add Service", async () => {
      const isTokenServiceEnabled = await bridge.supported_services(tokenService.address(), false);
      if (!isTokenServiceEnabled) {
        const supportServiceTx = await bridge.add_service_tb(tokenService.address());
        await supportServiceTx.wait();
      }
      expect(await bridge.supported_services(tokenService.address())).toBe(true);
    }, TIMEOUT)

    test("Bridge: Unpause", async () => {
      const isPaused = (await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_UNPAUSED_VALUE)) == BRIDGE_PAUSED_VALUE;
      if (isPaused) {
        const unpauseTx = await bridge.unpause_tb();
        await unpauseTx.wait();
      }
      expect(await bridge.bridge_settings(BRIDGE_PAUSABILITY_INDEX, BRIDGE_PAUSED_VALUE)).toBe(BRIDGE_UNPAUSED_VALUE);
    }, TIMEOUT)

    test("Holding: Initialize", async () => {
      const tx = await holding.initialize_holding(tokenService.address());
      await tx.wait();
    }, TIMEOUT)

    test("Token Service: Initialize", async () => {
      const threshold = 1;
      const isTokenServiceInitialized = (await tokenService.owner_TS(OWNER_INDEX, ALEO_ZERO_ADDRESS)) != ALEO_ZERO_ADDRESS;
      console.log("is sevice initialized: ", isTokenServiceInitialized);
      if (!isTokenServiceInitialized) {
        const tx = await tokenService.initialize_ts(admin);
        await tx.wait();
      }
    }, TIMEOUT);

    test.skip.failing("Token Service: cannot Initialize twice", async () => {
      const tx = await tokenService.initialize_ts(admin);
      await tx.wait();
    });

    test("Token Service: Register token in Token registry", async () => {
      console.log(tokenID)
      const tx = await mtsp.register_token(tokenID, token_name, token_symbol, token_decimals, token_max_supply, false, tokenService.address());
      await tx.wait();
    }, TIMEOUT);

    test("Token Service: Set role for MINTER and BURNER", async () => {
      const token_owner: TokenOwner = {
        account: tokenService.address(),
        token_id: tokenID
      }

      const role_owner_hash = hashStruct(token_owner);

      const setSupplyManagerRoleTx = await mtsp.set_role(tokenID, tokenService.address(), 3);
      await setSupplyManagerRoleTx.wait();

      const role = await mtsp.roles(role_owner_hash);
      expect(role).toBe(3);
    }, TIMEOUT)
  })

  describe("Add token", () => {
    test("Token Service: Add Token", async () => {
      const limit: WithdrawalLimit = {
        percentage: 100_00, // 100%
        duration: 1, // per block
        threshold_no_limit: BigInt(100)
      };
      const dummyLimit: WithdrawalLimit = {
        percentage: 0, // 10%
        duration: 0, // per block
        threshold_no_limit: BigInt(0)
      };
      const minimumTransfer = BigInt(100);
      const maximumTransfer = BigInt(100_000);
      let isAdded = await tokenService.added_tokens(tokenID, false);
      const isWusdcNotSupported = (isAdded == false);
      if (isWusdcNotSupported) {
        const tx = await tokenService.add_token_ts(
          tokenID,
          minimumTransfer,
          maximumTransfer,
          limit.percentage,
          limit.duration,
          limit.threshold_no_limit,
          evm2AleoArrWithoutPadding(usdcContractAddr),
          evm2AleoArrWithoutPadding(ethTsContractAddr),
          ethChainId,
          public_platform_fee,
          private_platform_fee,
          public_relayer_fee,
          private_relayer_fee,
        );
        await tx.wait();
      }
      const ethTokenInfo: ChainToken = {
        chain_id: ethChainId,
        token_id: tokenID
      }
      expect(await tokenService.added_tokens(tokenID, false)).toBe(true);
      expect(aleoArr2Evm(await tokenService.other_chain_token_address(ethTokenInfo)).toLowerCase()).toBe(usdcContractAddr.toLowerCase());
      expect(aleoArr2Evm(await tokenService.other_chain_token_service(ethTokenInfo)).toLowerCase()).toBe(ethTsContractAddr.toLowerCase());
      expect(await tokenService.token_withdrawal_limits(tokenID, dummyLimit)).toStrictEqual(limit);
      expect(await tokenService.min_transfers(tokenID)).toBe(minimumTransfer);
      expect(await tokenService.max_transfers(tokenID)).toBe(maximumTransfer);
      expect(await tokenService.token_status(tokenID)).toBe(TOKEN_PAUSED_VALUE);
      expect(await tokenService.public_platform_fee(ethTokenInfo)).toBe(public_platform_fee);
      expect(await tokenService.private_platform_fee(ethTokenInfo)).toBe(private_platform_fee);
      expect(await tokenService.public_relayer_fee(ethTokenInfo)).toBe(public_relayer_fee);
      expect(await tokenService.private_relayer_fee(ethTokenInfo)).toBe(private_relayer_fee);
    }, TIMEOUT)

    test("add base chain to existing token", async () => {
      const addChainTx = await tokenService.add_chain_to_existing_token(
        baseChainId,
        tokenID,
        evm2AleoArrWithoutPadding(baseTsContractAddr),
        evm2AleoArrWithoutPadding(usdcContractAddr),
        public_platform_fee,
        private_platform_fee,
        public_relayer_fee,
        private_relayer_fee
      )
      await addChainTx.wait();

      const tokenInfo: ChainToken = {
        chain_id: baseChainId,
        token_id: tokenID
      }

      expect(aleoArr2Evm(await tokenService.other_chain_token_address(tokenInfo)).toLowerCase()).toBe(usdcContractAddr.toLowerCase());
      expect(aleoArr2Evm(await tokenService.other_chain_token_service(tokenInfo)).toLowerCase()).toBe(baseTsContractAddr.toLowerCase());
      expect(await tokenService.public_platform_fee(tokenInfo)).toBe(public_platform_fee);
      expect(await tokenService.private_platform_fee(tokenInfo)).toBe(private_platform_fee);
      expect(await tokenService.public_relayer_fee(tokenInfo)).toBe(public_relayer_fee);
      expect(await tokenService.private_relayer_fee(tokenInfo)).toBe(private_relayer_fee);
    }, TIMEOUT)

    test("add arbitrum chain to existing token", async () => {
      const addChainTx = await tokenService.add_chain_to_existing_token(
        arbitrumChainId,
        tokenID,
        evm2AleoArrWithoutPadding(arbitrumTsContractAddr),
        evm2AleoArrWithoutPadding(usdcContractAddr),
        public_platform_fee,
        private_platform_fee,
        public_relayer_fee,
        private_relayer_fee
      )
      await addChainTx.wait();

      const tokenInfo: ChainToken = {
        chain_id: arbitrumChainId,
        token_id: tokenID
      }

      expect(aleoArr2Evm(await tokenService.other_chain_token_address(tokenInfo)).toLowerCase()).toBe(usdcContractAddr.toLowerCase());
      expect(aleoArr2Evm(await tokenService.other_chain_token_service(tokenInfo)).toLowerCase()).toBe(arbitrumTsContractAddr.toLowerCase());
      expect(await tokenService.public_platform_fee(tokenInfo)).toBe(public_platform_fee);
      expect(await tokenService.private_platform_fee(tokenInfo)).toBe(private_platform_fee);
      expect(await tokenService.public_relayer_fee(tokenInfo)).toBe(public_relayer_fee);
      expect(await tokenService.private_relayer_fee(tokenInfo)).toBe(private_relayer_fee);
    }, TIMEOUT)

    test("Token Service: Unpause Token", async () => {
      const isPaused = (await tokenService.token_status(tokenID, TOKEN_PAUSED_VALUE)) == TOKEN_PAUSED_VALUE;
      if (isPaused) {
        const unpauseTx = await tokenService.unpause_token_ts(tokenID);
        await unpauseTx.wait();
      }
      expect(await tokenService.token_status(tokenID, TOKEN_PAUSED_VALUE)).toBe(TOKEN_UNPAUSED_VALUE);
    }, TIMEOUT)
  })

  describe("Token Receive", () => {
    test("Happy receive token(ethereum chain) public with no relayer", async () => {
      const packet = createPacket(aleoUser1, BigInt(100_000_000), tokenService.address(), ethChainId, ethTsContractAddr);
      tokenService.connect(admin);
      const signature = signPacket(packet, true, tokenService.config.privateKey);
      const signatures = [
        signature,
        signature,
        signature,
        signature,
        signature,
      ];
      const signers = [
        admin,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
      ];

      // check relayer balance
      const relayer_initial_balance = await getUserAuthorizedBalance(aleoUser2, packet.message.dest_token_id);
      const user_initial_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);

      const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
      tokenService.connect(aleoUser1);
      const tx = await tokenService.token_receive_public(
        prunePadding(packet.message.sender_address),
        packet.message.dest_token_id,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures,
        packet.source.chain_id,
        prunePadding(packet.source.addr),
        public_relayer_fee,
        packet.version
      );
      const [screeningPassed] = await tx.wait();
      console.log(screeningPassed);

      const finalTokenSupply = await tokenService.total_supply(tokenID);
      expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
      expect(screeningPassed).toBe(true);


      // if version is 1 or 3 ,relayer off. relayer balance should not increased default packet with no relayer
      const relayer_final_balance = await getUserAuthorizedBalance(aleoUser2, packet.message.dest_token_id);
      const user_final_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);
      const expected_user_balance: bigint = user_initial_balance.balance + packet.message.amount;
      expect(relayer_final_balance.balance).toEqual(relayer_initial_balance.balance);
      expect(user_final_balance.balance).toEqual(expected_user_balance);

    },
      TIMEOUT
    );

    test("Happy receive token(ethereum chain) public with active relayer", async () => {
      const packet = createPacket(aleoUser1, BigInt(100_000_000), tokenService.address(), ethChainId, ethTsContractAddr, VERSION_PUBLIC_RELAYER_NOPREDICATE);
      const signature = signPacket(packet, true, tokenService.config.privateKey);
      const signatures = [
        signature,
        signature,
        signature,
        signature,
        signature,
      ];
      const signers = [
        admin,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
      ];

      // check relayer balance
      const relayer_initial_balance = await getUserAuthorizedBalance(aleoUser2, packet.message.dest_token_id);
      const user_initial_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);

      const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
      tokenService.connect(aleoUser2);
      const tx = await tokenService.token_receive_public(
        prunePadding(packet.message.sender_address),
        packet.message.dest_token_id,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures,
        packet.source.chain_id,
        prunePadding(packet.source.addr),
        public_relayer_fee,
        packet.version
      );
      const [screeningPassed] = await tx.wait();
      console.log(screeningPassed);

      const finalTokenSupply = await tokenService.total_supply(tokenID);
      expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
      expect(screeningPassed).toBe(true);


      // if version is 2 or 4 ,relayer on. relayer balance should increased
      const relayer_final_balance = await getUserAuthorizedBalance(aleoUser2, packet.message.dest_token_id);
      const user_final_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);

      const expected_user_balance: bigint = user_initial_balance.balance + packet.message.amount;
      expect(relayer_final_balance.balance).toEqual(relayer_initial_balance.balance + public_relayer_fee);
      expect(user_final_balance.balance).toEqual(expected_user_balance - public_relayer_fee);

    },
      TIMEOUT
    );


    test("Happy receive token(base chain) public", async () => {
      const packet = createPacket(aleoUser1, BigInt(100_000_000), tokenService.address(), baseChainId, baseTsContractAddr);
      const signature = signPacket(packet, true, tokenService.config.privateKey);
      const signatures = [
        signature,
        signature,
        signature,
        signature,
        signature,
      ];
      const signers = [
        admin,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
      ];

      const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
      const user_initial_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);

      const tx = await tokenService.token_receive_public(
        prunePadding(packet.message.sender_address),
        packet.message.dest_token_id,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures,
        packet.source.chain_id,
        prunePadding(packet.source.addr),
        public_relayer_fee,
        packet.version
      );
      const [screeningPassed] = await tx.wait();
      const user_final_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);

      const finalTokenSupply = await tokenService.total_supply(tokenID);
      expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
      expect(screeningPassed).toBe(true);
      const expected_user_balance: bigint = user_initial_balance.balance + BigInt(100_000_000);
      const is_relayer_off: boolean = packet.version === 1 || packet.version === 3;

      if (is_relayer_off) {
        expect(user_final_balance.balance).toEqual(expected_user_balance);
      } else {
        expect(user_final_balance.balance).toEqual(expected_user_balance - public_relayer_fee);
      }
    },
      TIMEOUT
    );

    test("Happy receive token(arbitrum chain) public", async () => {
      const packet = createPacket(aleoUser1, BigInt(100_000_000), tokenService.address(), arbitrumChainId, arbitrumTsContractAddr);
      tokenService.connect(admin);
      const signature = signPacket(packet, true, bridge.config.privateKey);
      const signatures = [
        signature,
        signature,
        signature,
        signature,
        signature,
      ];
      const signers = [
        admin,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
      ];

      const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
      const user_initial_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);

      const tx = await tokenService.token_receive_public(
        prunePadding(packet.message.sender_address),
        packet.message.dest_token_id,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures,
        packet.source.chain_id,
        prunePadding(packet.source.addr),
        public_relayer_fee,
        packet.version
      );
      const [screeningPassed] = await tx.wait();
      const user_final_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);
      const finalTokenSupply = await tokenService.total_supply(tokenID);
      expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
      expect(screeningPassed).toBe(true);
      const expected_user_balance: bigint = user_initial_balance.balance + BigInt(100_000_000);
      const is_relayer_off: boolean = packet.version === 1 || packet.version === 3;

      if (is_relayer_off) {
        expect(user_final_balance.balance).toEqual(expected_user_balance);
      } else {
        expect(user_final_balance.balance).toEqual(expected_user_balance - public_relayer_fee);
      }
    },
      TIMEOUT
    );

    test("Happy receive token private with relayer off", async () => {
      const pre_image = BigInt(123);
      const image: Image = {
        pre_image,
        receiver: aleoUser1
      }
      const hashed_address = hashStructToAddress(image);
      const packet = createPacket(hashed_address, BigInt(100_000_000), tokenService.address(), ethChainId, ethTsContractAddr, VERSION_PRIVATE_NORELAYER_NOPREDICATE);
      tokenService.connect(admin);
      const signature = signPacket(packet, true, bridge.config.privateKey);
      const signatures = [
        signature,
        signature,
        signature,
        signature,
        signature,
      ];
      const signers = [
        admin,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
      ];

      const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
      const user_initial_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);
      const admin_initial_balance = await getUserAuthorizedBalance(admin, packet.message.dest_token_id);


      const tx = await tokenService.token_receive_private(
        prunePadding(packet.message.sender_address),
        packet.message.dest_token_id,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures,
        packet.source.chain_id,
        prunePadding(packet.source.addr),
        pre_image,
        aleoUser1,
        packet.version,
        private_relayer_fee
      );
      const [screeningPassed] = await tx.wait();

      const finalTokenSupply = await tokenService.total_supply(tokenID);
      const user_final_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);
      const admin_final_balance = await getUserAuthorizedBalance(admin, packet.message.dest_token_id);

      expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
      expect(screeningPassed).toBe(true);
      const expected_user_balance: bigint = user_initial_balance.balance //+ BigInt(100_000_000); TODO: since balance is minted privately it will not add up in public balance, need to index the record minted to find out actual balance
      const is_relayer_off: boolean = [11, 13].includes(packet.version);

      // if (is_relayer_off) {
      expect(admin_final_balance.balance).toEqual(admin_initial_balance.balance);
      // expect(user_final_balance.balance).toEqual(expected_user_balance);
      // } else {
      //   expect(user_final_balance.balance).toEqual(expected_user_balance - private_relayer_fee);
      // expect(admin_final_balance.balance).toEqual(admin_initial_balance.balance + private_relayer_fee);
      // }
    },
      TIMEOUT
    );

    test("Happy receive token private with active relayer", async () => {
      const pre_image = BigInt(123);
      const image: Image = {
        pre_image,
        receiver: aleoUser1
      }
      const hashed_address = hashStructToAddress(image);
      const packet = createPacket(hashed_address, BigInt(100_000_000), tokenService.address(), ethChainId, ethTsContractAddr, VERSION_PRIVATE_RELAYER_NOPREDICATE);
      // tokenService.connect(admin);
      const signature = signPacket(packet, true, bridge.config.privateKey);
      const signatures = [
        signature,
        signature,
        signature,
        signature,
        signature,
      ];
      const signers = [
        admin,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
      ];

      const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
      const user_initial_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);
      const aleoUser2_initial_balance = await getUserAuthorizedBalance(aleoUser2, packet.message.dest_token_id);

      tokenService.connect(aleoUser2);
      const tx = await tokenService.token_receive_private(
        prunePadding(packet.message.sender_address),
        packet.message.dest_token_id,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures,
        packet.source.chain_id,
        prunePadding(packet.source.addr),
        pre_image,
        aleoUser1,
        packet.version,
        private_relayer_fee
      );
      const [screeningPassed] = await tx.wait();

      const finalTokenSupply = await tokenService.total_supply(tokenID);
      const user_final_balance = await getUserAuthorizedBalance(aleoUser1, packet.message.dest_token_id);
      const aleoUser2_final_balance = await getUserAuthorizedBalance(aleoUser2, packet.message.dest_token_id);
      expect(aleoUser2_final_balance.balance).toEqual(aleoUser2_initial_balance.balance + private_relayer_fee);
      expect(finalTokenSupply).toBe(initialTokenSupply + packet.message.amount);
      expect(screeningPassed).toBe(true);
      const expected_user_balance: bigint = user_initial_balance.balance;
      // expect(user_final_balance.balance).toEqual(expected_user_balance - private_relayer_fee);
    },
      TIMEOUT
    );

    test.skip.failing("Wrong token service cannot receive the token, transaction is expected to fail", async () => {
      const packet = createPacket(aleoUser1, BigInt(100_000_000), tokenService.address(), ethChainId, ethTsContractAddr);
      tokenService.connect(admin);
      const signature = signPacket(packet, true, tokenService.config.privateKey);
      const signatures = [
        signature,
        signature,
        signature,
        signature,
        signature,
      ];
      const signers = [
        admin,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
        ALEO_ZERO_ADDRESS,
      ];

      tokenService.connect(admin)
      const tx = await tokenService.token_receive_public(
        prunePadding(packet.message.sender_address),
        packet.message.dest_token_id,
        packet.message.receiver_address,
        packet.message.amount,
        packet.sequence,
        packet.height,
        signers,
        signatures,
        packet.source.chain_id,
        evm2AleoArrWithoutPadding(ethTsRandomContractAddress),
        public_relayer_fee,
        packet.version
      );
      await expect(tx.wait()).rejects.toThrow()
    },
      TIMEOUT
    );
  });


  describe("Token Send", () => {
    const destChainId = ethChainId;
    const destTsAddr = ethTsContractAddr.toLowerCase();
    const destTsAddr2 = ethTsRandomContractAddress.toLowerCase();

    const destToken = usdcContractAddr.toLowerCase();
    const sender = aleoUser5
    const receiver = ethUser.toLowerCase()
    const amount = BigInt(101000000);

    let minAmount: bigint;
    let maxAmount: bigint;

    test("Get minimum and maximum amount", async () => {
      minAmount = await tokenService.min_transfers(tokenID, BigInt(0));
      maxAmount = await tokenService.max_transfers(tokenID, BigInt(0));
    }, TIMEOUT)

    test("happy token send in public version",
      async () => {
        console.log(minAmount, maxAmount);
        const initialTokenSupply = await tokenService.total_supply(tokenID, BigInt(0));
        console.log(initialTokenSupply, "initialTokenSupply");

        expect(await tokenService.min_transfers(tokenID)).toBeLessThanOrEqual(amount)
        expect(await tokenService.max_transfers(tokenID)).toBeGreaterThanOrEqual(amount)
        expect(await tokenService.total_supply(tokenID)).toBeGreaterThanOrEqual(amount)
        tokenService.connect(admin);
        mtsp.connect(admin);
        const balance: Balance = await getUserAuthorizedBalance(admin, tokenID)

        //council contract hold the platform fee[after send platform fee need to be deposited in council]
        const council_initial_balance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);

        const platformFee = await getPlatformFeeInAmount(amount, public_platform_fee);
        if (balance.balance > amount && initialTokenSupply > amount) {
          console.log("check passedd");

          const tx = await tokenService.token_send_public(
            tokenID,
            evm2AleoArrWithoutPadding(receiver),
            amount,
            destChainId,
            evm2AleoArrWithoutPadding(destTsAddr),
            evm2AleoArrWithoutPadding(destToken),
            platformFee,
            non_active_relayer
          );
          await tx.wait();
        }


        const finalTokenSupply = await tokenService.total_supply(tokenID);
        const council_final_balance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);
        expect(finalTokenSupply).toBe(initialTokenSupply - amount + platformFee);
        expect(council_final_balance.balance).toBe(council_initial_balance.balance + platformFee);
      },
      TIMEOUT
    );

    test("Token send private", async () => {
      //mint record for aleoUser1
      const total_supply = await tokenService.total_supply(tokenID);
      const authorized_until = 4294967295;
      const amount_minted = BigInt(100_000_000);
      const send_amount = BigInt(100_000);

      const mintTx = await mtsp.mint_private(tokenID, aleoUser1, amount_minted, false, authorized_until);
      const [record] = await mintTx.wait();
      console.log(record);
      const decryptedRecord = decryptToken(record, privateKey1)
      const platformFee = await getPlatformFeeInAmount(amount, private_platform_fee);
      //council contract hold the platform fee[after send platform fee need to be deposited in council]
      const council_initial_balance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);
      tokenService.connect(aleoUser1)
      const sendPrivateTx = await tokenService.token_send_private(
        tokenID,
        evm2AleoArrWithoutPadding(receiver),
        send_amount, destChainId,
        evm2AleoArrWithoutPadding(destTsAddr),
        evm2AleoArrWithoutPadding(destToken),
        decryptedRecord,
        platformFee,
        non_active_relayer
      )
      const [returnRecord] = await sendPrivateTx.wait();
      const finalTokenSupply = await tokenService.total_supply(tokenID);
      const council_final_balance: Balance = await getUserAuthorizedBalance(council.address(), tokenID);
      expect(finalTokenSupply).toBe(total_supply - send_amount);
      expect(council_final_balance.balance).toBe(council_initial_balance.balance + platformFee);
    }, TIMEOUT);

    test.skip(
      "Wrong connector for the token cannot send token",
      async () => {
        tokenService.connect(admin);
        const platformFee = await getPlatformFeeInAmount(amount, public_platform_fee);
        const tx = await tokenService.token_send_public(
          tokenID,
          evm2AleoArrWithoutPadding(receiver),
          amount,
          destChainId,
          evm2AleoArrWithoutPadding(destTsAddr2),
          evm2AleoArrWithoutPadding(destToken),
          platformFee,
          non_active_relayer
        );
        await expect(tx.wait()).rejects.toThrow()
      },
      TIMEOUT
    );

    test.skip(
      "Transferred amount must be greater than or equal to min amount",
      async () => {
        const amount = BigInt(99);
        expect(amount).toBeLessThan(minAmount);
        tokenService.connect(connector);
        const platformFee = await getPlatformFeeInAmount(amount, public_platform_fee);
        const tx = await tokenService.token_send_public(
          tokenID,
          evm2AleoArrWithoutPadding(receiver),
          amount,
          destChainId,
          evm2AleoArrWithoutPadding(destTsAddr),
          evm2AleoArrWithoutPadding(destToken),
          platformFee,
          non_active_relayer
        );
        await expect(tx.wait()).rejects.toThrow()
      },
      TIMEOUT
    );

    test.skip(
      "Transferred amount must be less than or equal to max amount",
      async () => {
        const amount = BigInt(100_000);
        expect(amount).toBeLessThanOrEqual(maxAmount);
        tokenService.connect(connector);
        const platformFee = await getPlatformFeeInAmount(amount, public_platform_fee);
        const tx = await tokenService.token_send_public(
          tokenID,
          evm2AleoArrWithoutPadding(receiver),
          amount,
          destChainId,
          evm2AleoArrWithoutPadding(destTsAddr),
          evm2AleoArrWithoutPadding(destToken),
          platformFee,
          non_active_relayer
        );
        await expect(tx.wait()).rejects.toThrow()
      },
      TIMEOUT
    );

    test.skip("Token Service: Set role for MINTER and BURNER for aleoUser1", async () => {
      const token_owner: TokenOwner = {
        account: aleoUser1,
        token_id: tokenID
      }

      const role_owner_hash = hashStruct(token_owner);

      const setSupplyManagerRoleTx = await mtsp.set_role(tokenID, aleoUser1, 3);
      await setSupplyManagerRoleTx.wait();

      const role = await mtsp.roles(role_owner_hash);
      expect(role).toBe(3);
    }, TIMEOUT)
  });

  describe.skip("Governance", () => {

    describe.skip("Pausability", () => {
      test("should not pause by non-owner", async () => {
        tokenService.connect(aleoUser3); //changing the contract caller account to non owner
        const tx = await tokenService.pause_token_ts(tokenID);
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT);

      test("should not pause if token Id is not present", async () => {
        tokenService.connect(admin); //changing the contract caller account to non owner
        const tx = await tokenService.pause_token_ts(wrongTokenID);
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT);

      test("owner can pause", async () => {
        tokenService.connect(admin);
        const tx = await tokenService.pause_token_ts(tokenID);
        await tx.wait();
        expect(await tokenService.token_status(tokenID)).toBe(TOKEN_PAUSED_VALUE);
      }, TIMEOUT);

      test("should not unpause by non-owner", async () => {
        tokenService.connect(aleoUser3);
        const tx = await tokenService.unpause_token_ts(tokenID);
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT);

      test("should not unpause if token Id is not present", async () => {
        tokenService.connect(admin); //changing the contract caller account to non owner
        const tx = await tokenService.unpause_token_ts(wrongTokenID);
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT);

      test("owner can unpause", async () => {
        expect(await tokenService.token_status(tokenID, TOKEN_UNPAUSED_VALUE)).toBe(TOKEN_PAUSED_VALUE);
        tokenService.connect(admin);
        const tx = await tokenService.unpause_token_ts(tokenID);
        await tx.wait();
        expect(await tokenService.token_status(tokenID, TOKEN_UNPAUSED_VALUE)).toBe(TOKEN_UNPAUSED_VALUE);
      },
        TIMEOUT
      );
    });

    describe("Add/Remove Token", () => {

      describe.skip("Add Token", () => {
        const limit: WithdrawalLimit = {
          percentage: 100_00, // 100%
          duration: 1, // per block
          threshold_no_limit: BigInt(100)
        };
        const dummyLimit: WithdrawalLimit = {
          percentage: 0, // 10%
          duration: 0, // per block
          threshold_no_limit: BigInt(0)
        };
        const minTransfer = BigInt(100);
        const maxTransfer = BigInt(100_000);

        test("Owner can add new token", async () => {
          tokenService.connect(admin)
          const tx = await tokenService.add_token_ts(
            newTokenID,
            minTransfer,
            maxTransfer,
            limit.percentage,
            limit.duration,
            limit.threshold_no_limit,
            evm2AleoArrWithoutPadding(usdcContractAddr),
            evm2AleoArrWithoutPadding(ethTsContractAddr),
            ethChainId,
            public_platform_fee,
            private_platform_fee,
            public_relayer_fee,
            private_relayer_fee,
          );
          await tx.wait();

          const newtokenInfo: ChainToken = {
            chain_id: ethChainId,
            token_id: newTokenID
          }
          expect(await tokenService.added_tokens(newTokenID)).toBe(true);
          expect(await tokenService.other_chain_token_address(eth2TokenInfo)).toStrictEqual(evm2AleoArr(usdcContractAddr));
          expect(await tokenService.other_chain_token_service(eth2TokenInfo)).toStrictEqual(evm2AleoArr(ethTsContractAddr));
          expect(await tokenService.token_withdrawal_limits(newTokenID, dummyLimit)).toStrictEqual(limit);
          expect(await tokenService.min_transfers(newTokenID)).toBe(minTransfer);
          expect(await tokenService.max_transfers(newTokenID)).toBe(maxTransfer);
          expect(await tokenService.token_status(newTokenID)).toBe(true);
          expect(await tokenService.public_platform_fee(newtokenInfo)).toBe(public_platform_fee);
          expect(await tokenService.private_platform_fee(newtokenInfo)).toBe(private_platform_fee);
          expect(await tokenService.public_relayer_fee(newtokenInfo)).toBe(public_relayer_fee);
          expect(await tokenService.private_relayer_fee(newtokenInfo)).toBe(private_relayer_fee);
        }, TIMEOUT);

        test("Non-owner cannot add new token", async () => {
          const newToken2Id = BigInt(784596321);
          tokenService.connect(aleoUser3);
          const tx = await tokenService.add_token_ts(
            newToken2Id,
            minTransfer,
            maxTransfer,
            limit.percentage,
            limit.duration,
            limit.threshold_no_limit,
            evm2AleoArrWithoutPadding(usdcContractAddr),
            evm2AleoArrWithoutPadding(ethTsContractAddr),
            ethChainId,
            public_platform_fee,
            private_platform_fee,
            public_relayer_fee,
            private_relayer_fee,
          );
          await expect(tx.wait()).rejects.toThrow()

        }, TIMEOUT);

        test("Existing token cannot be added again", async () => {
          let isTokenSupported = await tokenService.added_tokens(newTokenID, false);
          expect(isTokenSupported).toBe(true);

          tokenService.connect(admin);
          const tx = await tokenService.add_token_ts(
            newTokenID,
            minTransfer,
            maxTransfer,
            limit.percentage,
            limit.duration,
            limit.threshold_no_limit,
            evm2AleoArrWithoutPadding(usdcContractAddr),
            evm2AleoArrWithoutPadding(ethTsContractAddr),
            ethChainId,
            public_platform_fee,
            private_platform_fee,
            public_relayer_fee,
            private_relayer_fee,
          );
          await expect(tx.wait()).rejects.toThrow()
        }, TIMEOUT);
      });

      describe.skip("Remove Token", () => {
        test("Non owner cannot remove token", async () => {
          let isTokenSupported = await tokenService.added_tokens(newTokenID, false);
          expect(isTokenSupported).toBe(true);

          tokenService.connect(aleoUser3);
          const tx = await tokenService.remove_token_ts(newTokenID);
          await expect(tx.wait()).rejects.toThrow()
        }, TIMEOUT);

        test("Owner can remove token", async () => {
          let isTokenSupported = await tokenService.added_tokens(newTokenID, false);
          expect(isTokenSupported).toBe(true);

          tokenService.connect(admin);
          const tx = await tokenService.remove_token_ts(newTokenID);
          await tx.wait();

          isTokenSupported = await tokenService.added_tokens(newTokenID, false);
          expect(isTokenSupported).toBe(false);
        },
          TIMEOUT
        );

        test("Token must be added to be removed", async () => {
          let isTokenSupported = await tokenService.added_tokens(newTokenID, false);
          expect(isTokenSupported).toBe(false);

          tokenService.connect(admin);
          const tx = await tokenService.remove_token_ts(newTokenID);
          await expect(tx.wait()).rejects.toThrow()
        },
          TIMEOUT
        );
      });
    })

    describe.skip("Update minimum transfer", () => {
      const newMinTransfer = BigInt(200);
      test("cannot update minimum transfer if unregistered tokenID is given", async () => {
        tokenService.connect(admin);
        const tx = await tokenService.update_min_transfer_ts(
          wrongTokenID,
          newMinTransfer
        );
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT);

      test("cannot update if minimum transfer greater than maximum transfer", async () => {
        tokenService.connect(admin);
        const maxTransfer = await tokenService.max_transfers(tokenID);
        const tx = await tokenService.update_min_transfer_ts(
          tokenID,
          maxTransfer + BigInt(20)
        );
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT);


      test("non-owner cannot update minimum transfer", async () => {
        tokenService.connect(aleoUser4);
        const tx = await tokenService.update_min_transfer_ts(
          tokenID,
          newMinTransfer
        );
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT);

      test("owner can update minimum transfer", async () => {
        tokenService.connect(admin);
        const tx = await tokenService.update_min_transfer_ts(
          tokenID,
          newMinTransfer
        );
        await tx.wait();
        expect(await tokenService.min_transfers(tokenID)).toBe(newMinTransfer);
      }, TIMEOUT);

    })

    describe.skip("Update maximum transfer", () => {
      const newMaxTransfer = BigInt(200_000);
      test("non-owner cannot update maximum transfer", async () => {
        tokenService.connect(aleoUser4);
        const tx = await tokenService.update_max_transfer_ts(
          tokenID,
          newMaxTransfer
        );
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT);

      test("cannot update maximum transfer if unregistered tokenID is given", async () => {
        tokenService.connect(admin);
        const tx = await tokenService.update_max_transfer_ts(
          wrongTokenID,
          newMaxTransfer
        );
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT);

      test("cannot update if maximum transfer lesser than minimum transfer", async () => {
        tokenService.connect(admin);
        const minTransfer = await tokenService.min_transfers(tokenID);
        const tx = await tokenService.update_max_transfer_ts(
          tokenID,
          minTransfer - BigInt(20)
        );
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT);

      test("owner can update maximum transfer", async () => {
        tokenService.connect(admin);
        const tx = await tokenService.update_max_transfer_ts(
          tokenID,
          newMaxTransfer
        );
        await tx.wait();
        expect(await tokenService.max_transfers(tokenID)).toBe(newMaxTransfer);
      }, TIMEOUT);
    })

    describe.skip("Update withdrawal limit", () => {
      const newLimit: WithdrawalLimit = {
        percentage: 90_00, // 90%
        duration: 2, // per block
        threshold_no_limit: BigInt(200)
      };

      test("should update withdrawal by admin", async () => {
        tokenService.connect(admin);
        const tx = await tokenService.update_withdrawal_limit(
          tokenID,
          newLimit.percentage,
          newLimit.duration,
          newLimit.threshold_no_limit
        );
        await tx.wait();
        expect(
          await tokenService.token_withdrawal_limits(tokenID)
        ).toStrictEqual(newLimit);
      }, TIMEOUT);

      test.failing("should not update if percentage is greater than 100 percent", async () => {
        tokenService.connect(admin);
        const tx = await tokenService.update_withdrawal_limit(
          tokenID,
          110_00,
          newLimit.duration,
          newLimit.threshold_no_limit
        );
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT);

      test("should not update withdrawal by non-admin", async () => {
        tokenService.connect(aleoUser3);
        const tx = await tokenService.update_withdrawal_limit(
          tokenID,
          newLimit.percentage,
          newLimit.duration,
          newLimit.threshold_no_limit
        );
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT);

    })

    describe.skip("Update other chain token address", () => {
      const unregisteredTokenID = BigInt("9841023567956645465");
      const ethTokenInfo: ChainToken = {
        chain_id: ethChainId,
        token_id: tokenID
      }

      test.skip("should not update token address by non-owner", async () => {
        tokenService.connect(aleoUser3);
        const tx = await tokenService.update_other_chain_tokenaddress(
          ethChainId,
          tokenID,
          evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
        );
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT);

      test.skip("should not update token address if token id is not registered", async () => {
        tokenService.connect(admin);
        const tx = await tokenService.update_other_chain_tokenaddress(
          ethChainId,
          unregisteredTokenID,
          evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
        );
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT)

      test.skip("should update token service contract address by admin", async () => {
        tokenService.connect(admin);
        const tx = await tokenService.update_other_chain_tokenaddress(
          ethChainId,
          tokenID,
          evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
        );
        await tx.wait();
        expect(await tokenService.other_chain_token_address(ethTokenInfo)).toStrictEqual(evm2AleoArr(ethTsRandomContractAddress2))
      }, TIMEOUT)
    });


    describe.skip("Update other chain token service", () => {
      const unregisteredTokenID = BigInt("9841023567956645465");

      const ethTokenInfo: ChainToken = {
        chain_id: ethChainId,
        token_id: tokenID
      }

      test.skip("should not update token service by non-owner", async () => {
        tokenService.connect(aleoUser3);
        const tx = await tokenService.update_other_chain_tokenservice(
          ethChainId,
          tokenID,
          evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
        );
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT)

      test.skip("should not update token address if token id is not registered", async () => {
        tokenService.connect(admin);
        const tx = await tokenService.update_other_chain_tokenservice(
          ethChainId,
          unregisteredTokenID,
          evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
        );
        await expect(tx.wait()).rejects.toThrow()
      }, TIMEOUT)

      //todo: failed
      test("should update token address by admin", async () => {
        tokenService.connect(admin);
        console.log(await tokenService.other_chain_token_service(ethTokenInfo), "00000000000000000000");

        const tx = await tokenService.update_other_chain_tokenaddress(
          ethChainId,
          tokenID,
          evm2AleoArrWithoutPadding(ethTsRandomContractAddress2)
        );
        await tx.wait();
        console.log(await tokenService.other_chain_token_service(ethTokenInfo), "aaaaaaaaaaaaaaaaaaaaaaaaaa");
        console.log(evm2AleoArr(ethTsRandomContractAddress2), "bbbbbbbbbbbbbbbbb");


        expect(await tokenService.other_chain_token_service(ethTokenInfo)).toStrictEqual(evm2AleoArr(ethTsRandomContractAddress2))
      }, TIMEOUT)
    });

    describe.skip("Transfer Ownership", () => {
      test("should not transfer ownership by non-admin", async () => {
        tokenService.connect(aleoUser2);
        const transferOwnershipTx = await tokenService.transfer_ownership_ts(aleoUser3);
        await expect(transferOwnershipTx.wait()).rejects.toThrow()
      },
        TIMEOUT
      );

      test("Current owner can transfer ownership", async () => {
        const currentOwner = await tokenService.owner_TS(OWNER_INDEX);
        expect(currentOwner).toBe(aleoUser3);

        tokenService.connect(aleoUser3);
        const transferOwnershipTx = await tokenService.transfer_ownership_ts(admin);
        await transferOwnershipTx.wait();

        const newOwner = await tokenService.owner_TS(OWNER_INDEX);
        expect(newOwner).toBe(admin);
      },
        TIMEOUT
      );
    });
  })
});

describe.skip('Transition Failing Test cases', () => {
  const [aleoUser4] = tokenService.getAccounts();
  const public_platform_fee = 5;
  const private_platform_fee = 10;
  const public_relayer_fee = BigInt(10000);
  const private_relayer_fee = BigInt(20000);

  describe('Token Add/Remove', () => {
    test.failing('min transfer greater than max transfer should fail', async () => {
      await tokenService.add_token_ts(
        newTokenID,
        BigInt(100_000),
        BigInt(100),
        100_00,
        1,
        BigInt(100),
        evm2AleoArr(usdcContractAddr),
        evm2AleoArr(ethTsContractAddr),
        ethChainId,
        public_platform_fee,
        private_platform_fee,
        public_relayer_fee,
        private_relayer_fee,
      );
    });


    test.failing('Percentage greater than 100 should fail', async () => {
      await tokenService.add_token_ts(
        newTokenID,
        BigInt(100),
        BigInt(100_000),
        101_00,
        1,
        BigInt(100),
        evm2AleoArr(usdcContractAddr),
        evm2AleoArr(ethTsContractAddr),
        ethChainId,
        public_platform_fee,
        private_platform_fee,
        public_relayer_fee,
        private_relayer_fee,
      );
    })

    test.failing('Updating withdrawal limit with percentage greater than 100 should fail', async () => {
      await tokenService.update_withdrawal_limit(
        tokenID,
        101_00,
        1,
        BigInt(100)
      )
    })
  })


});


//function to fetch user balance
const getUserAuthorizedBalance = async (user: string, tokenId: bigint) => {
  const owner: TokenOwner = {
    account: user,
    token_id: tokenId
  }
  const hash = hashStruct(owner);
  let default_balance: Balance = {
    token_id: BigInt(0),
    account: "",
    balance: BigInt(0),
    authorized_until: 0
  }
  const balance: Balance = await mtsp.authorized_balances(hash, default_balance);
  return balance;
}


//{pre_image:123field,receiver:aleo1wfaqpfc57m0wxmr9l6r8a5g95c0cthe54shzmcyu6wf6tqvady9syt27xt}