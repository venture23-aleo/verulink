# TokenServicePaxos Integration Test - Complete Documentation

## 🎯 Executive Summary

This test validates the **end-to-end bridge flow** for transferring USDC from Ethereum to Aleo using:

- **Paxos Teller** for USDC → aleoUSD conversion
- **Predicate** for compliance validation
- **BridgeV2** for cross-chain communication

**Flow:** User deposits USDC → Paxos converts to aleoUSD → Bridge emits event → Attestors relay to Aleo

---

## 🏗️ System Architecture

### **Core Components**

```
┌─────────────────────────────────────────────────────────────────┐
│                          USER                                    │
│  • Holds USDC on Ethereum                                       │
│  • Wants to bridge to Aleo                                      │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                   TokenServicePaxos                              │
│  • Main user interface                                           │
│  • Orchestrates entire flow                                      │
│  • Manages deposits & withdrawals                                │
└────┬──────────┬──────────┬──────────┬──────────┬────────────────┘
     │          │          │          │          │
     │          │          │          │          │
     ▼          ▼          ▼          ▼          ▼
┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│Predicate│ │  Paxos  │ │ Bridge  │ │   Fee   │ │BlackList│
│ Service │ │ Teller  │ │   V2    │ │Collector│ │ Service │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
```

---

## 📦 Service Responsibilities

### **1. TokenServicePaxos** (Main Orchestrator)

**Location:** `contracts/main/paxosproxy/TokenServicePaxos.sol`

**Responsibilities:**

- ✅ Accept user deposits (USDC/USDT/ETH)
- ✅ Validate Predicate compliance
- ✅ Interact with Paxos Teller
- ✅ Calculate and collect fees
- ✅ Emit bridge events
- ✅ Handle withdrawals from Aleo

**Key Functions:**

```solidity
function transfer(
    address tokenAddress,      // Token being bridged (aleoUSD)
    uint256 amount,            // Amount to transfer
    string receiver,           // Aleo receiver address
    PredicateMessage memory,   // Compliance signatures
    bool isRelayerOn,          // Enable relayer
    bytes data,                // Additional data
    address depositAsset,      // Asset user deposits (USDC)
    uint256 minimumShares      // Slippage protection
)
```

**What it does:**

1. Pulls `depositAsset` (USDC) from user
2. Validates Predicate signatures
3. Deposits USDC into Paxos Teller
4. Receives aleoUSD shares
5. Deducts platform fees
6. Calls Bridge to emit cross-chain packet

**Token Flow:**

```
User USDC → TokenServicePaxos → Paxos Teller → aleoUSD shares → Bridge
```

---

### **2. Paxos Teller** (USDC ↔ aleoUSD Converter)

**Address:** `0xede35ea2dc28444b52b6b5d47009926910783d7b` (Mainnet)

**Responsibilities:**

- ✅ Convert USDC to aleoUSD (deposit)
- ✅ Convert aleoUSD to USDC (withdrawal)
- ✅ Maintain 1:1 peg with USDC
- ✅ Manage vault shares

**Key Functions:**

```solidity
function deposit(
    address asset,          // USDC address
    uint256 amount,         // Amount to deposit
    uint256 minimumShares   // Min shares to receive
) returns (uint256 shares)

function bulkWithdraw(
    address asset,          // USDC address
    uint256 shares,         // aleoUSD shares to burn
    uint256 minimumAssets,  // Min USDC to receive
    address receiver        // Who receives USDC
)
```

**How it works:**

1. **Deposit:** Burns USDC → Mints aleoUSD shares to caller
2. **Withdraw:** Burns aleoUSD shares → Returns USDC to receiver

**Vault Structure:**

```
Paxos Vault (0xc60a7e21...)
├── Asset: USDC
├── Shares: aleoUSD (ERC20)
└── Ratio: 1 USDC = 1 aleoUSD share
```

---

### **3. PredicateService** (Compliance Validator)

**Address:** `0x053f202A596450908CDcf99F8e24B424EEBbaeE4` (Mainnet)

**Responsibilities:**

- ✅ Validate transaction compliance
- ✅ Verify multi-signature authorization
- ✅ Check AML/KYC requirements
- ✅ Ensure policy adherence

**Key Functions:**

```solidity
function handleMessage(
    address tokenAddress,
    uint256 amount,
    string receiver,
    PredicateMessage predicateMessage,
    address msgSender,
    uint256 msgValue
) returns (bool)
```

**How it works:**

1. Receives transaction parameters
2. Encodes function signature: `_transfer(address,uint256,string)`
3. Validates signatures against encoded data
4. Checks signatures are from authorized signers
5. Verifies signatures haven't expired
6. Returns true/false for compliance

**Authorization Flow:**

```
User → Predicate API → Get Signatures → PredicateService validates → Allow/Deny
```

**Access Control:**

- Only contracts with `SERVICE_ROLE` can call
- TokenServicePaxos must be granted this role

---

### **4. BridgeV2** (Cross-Chain Packet Manager)

**Responsibilities:**

- ✅ Create cross-chain packets
- ✅ Emit PacketDispatched events
- ✅ Track packet sequences
- ✅ Manage attestor signatures (for reverse flow)

**Key Functions:**

```solidity
function dispatchPacket(
    OutPacket packet,
    bytes data
)
```

**Packet Structure:**

```javascript
OutPacket = {
  sequence: 1, // Unique ID
  version: 1, // Protocol version
  source: {
    chainId: 1, // Ethereum
    serviceAddress: "0x...TokenService",
  },
  destination: {
    chainId: 2, // Aleo
    serviceAddress: "aleo.TokenService",
  },
  message: {
    sender: "0x...user", // Ethereum sender
    tokenAddress: "aleo.TokenAddress", // Aleo token
    amount: 99000000, // Amount (after fees)
    receiver: "aleo1...", // Aleo receiver
  },
  timestamp: 1728567890,
};
```

**What it does:**

- Creates standardized packet format
- Emits event for off-chain attestors to monitor
- Attestors sign packet and submit to Aleo chain

---

### **5. FeeCollector** (Fee Management)

**Responsibilities:**

- ✅ Calculate platform fees
- ✅ Collect fees from transfers
- ✅ Manage fee distribution
- ✅ Store fee configurations per token

**Key Functions:**

```solidity
function getFees(
    address tokenAddress,
    uint256 amount,
    uint256 version
) returns (uint256 feeAmount)
```

**Fee Structure:**

- Flat fee per transfer
- Percentage-based fee
- Different rates for different tokens
- Owner can update fee rates

---

### **6. BlackListService** (AML/Sanctions Screening)

**Responsibilities:**

- ✅ Maintain blacklist of addresses
- ✅ Block sanctioned addresses
- ✅ Prevent illicit transfers
- ✅ Comply with regulations

**Key Functions:**

```solidity
function isBlackListed(
    address user
) returns (bool)
```

**Validation Points:**

- Check sender before transfer
- Check receiver before bridging
- Revert if either is blacklisted

---

### **7. Erc20VaultService** (Token Custody - Not used in Paxos flow)

**Responsibilities:**

- ✅ Hold ERC20 tokens for non-Paxos transfers
- ✅ Mint/burn vault shares
- ✅ Manage token reserves

**Note:** In Paxos flow, the **Paxos Teller** serves as the vault instead.

---

## 🔄 Complete Transaction Flow

### **Phase 1: Initialization (beforeEach)**

```javascript
// 1. Deploy infrastructure
lib = PacketLibrary.deploy();
aleolib = AleoAddressLibrary.deploy();
erc20TokenBridge = BridgeV2.deploy(libraries);
proxiedBridge = Proxy(erc20TokenBridge);

// 2. Deploy mock tokens (for testing)
usdcMock = USDCMock.deploy();
usdtMock = USDTMock.deploy();

// 3. Deploy services
blackListService = BlackListService.deploy();
erc20VaultService = Erc20VaultService.deploy(usdcMock);
ethVaultService = EthVaultService.deploy();

// 4. Deploy TokenServicePaxos
tokenServiceImpl = TokenServicePaxos.deploy();
proxiedV1 = Proxy(tokenServiceImpl);

// 5. Configure token mappings
proxiedV1.addToken(
  ALEO_USD, // Ethereum token (aleoUSD shares)
  ALEO_CHAINID, // Destination chain (2)
  vaultService, // Vault address
  "aleo.TokenAddress", // Destination token identifier
  "aleo.TokenService", // Destination service
  minAmount,
  maxAmount
);

// 6. Deploy FeeCollector
feeCollector = FeeCollector.deploy(
  tokenService,
  owner,
  usdcMock,
  usdtMock,
  flatFee,
  percentFee
);

// 7. Link contracts
proxiedV1.setFeeCollector(feeCollector);
proxiedV1.setTeller(PAXOS_TELLER);
proxiedV1.setPredicateService(PREDICATE_SERVICE);
proxiedBridge.addTokenService(proxiedV1);
proxiedBridge.addAttestor(attestor1, weight1);
```

---

### **Phase 2: User Transfer Execution**

#### **Step 1: Obtain Real USDC**

```javascript
// Mainnet fork: Get USDC from whale
const USDC_WHALE = "0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341";
await ethers.provider.send("hardhat_impersonateAccount", [USDC_WHALE]);

const whale = await ethers.getSigner(USDC_WHALE);
const usdcContract = await ethers.getContractAt("IERC20", USDC);

// Transfer 1000 USDC to test user
await usdcContract.connect(whale).transfer(other.address, 1000 * 1e6);
```

**Why?** We're forking mainnet where real USDC exists. Can't mint it.

---

#### **Step 2: User Approval**

```javascript
// User approves TokenServicePaxos to spend USDC
await usdcContract.connect(other).approve(proxiedV1.address, 100 * 1e6);
```

**Critical:** User approves TokenServicePaxos, NOT Paxos Teller!

---

#### **Step 3: Get Predicate Authorization**

```javascript
// Encode transaction data
const encodedData = packFunctionArgs("_transfer(address,uint256,string)", [
  ALEO_USD,
  100000000,
  aleoReceiver,
]);

// Call Predicate API (off-chain)
const response = await fetch("https://api.predicate.io/v1/task", {
  method: "POST",
  headers: { "x-api-key": API_KEY },
  body: JSON.stringify({
    from: other.address,
    to: PREDICATE_SERVICE,
    data: encodedData,
    chain_id: 1,
  }),
});

// Get compliance result
const predicateResponse = await response.json();
// Returns: { is_compliant, task_id, expiry_block, signers, signature }
```

**What Predicate checks:**

- Is sender address compliant?
- Is receiver address valid?
- Is amount within limits?
- Does transaction meet policy rules?

---

#### **Step 4: Grant SERVICE_ROLE (One-time)**

```javascript
const predicateService = await ethers.getContractAt(
  "PredicateService",
  PREDICATE_SERVICE
);

// Find PredicateService admin
const admin = await predicateService.owner(); // or check Etherscan

// Impersonate admin
await ethers.provider.send("hardhat_impersonateAccount", [admin]);
const adminSigner = await ethers.getSigner(admin);

// Grant role to TokenServicePaxos
const SERVICE_ROLE = keccak256("SERVICE_ROLE");
await predicateService
  .connect(adminSigner)
  .grantRole(SERVICE_ROLE, proxiedV1.address);
```

**Why?** Only contracts with SERVICE_ROLE can call PredicateService.handleMessage()

---

#### **Step 5: Execute Transfer**

```javascript
const tx = await proxiedV1.connect(other).transfer(
  ALEO_USD, // tokenAddress (aleoUSD)
  100 * 1e6, // amount
  aleoReceiver, // "aleo1..."
  {
    taskId: predicateResponse.task_id,
    expireByBlockNumber: predicateResponse.expiry_block,
    signerAddresses: predicateResponse.signers,
    signatures: predicateResponse.signature,
  },
  true, // isRelayerOn
  additionalData, // Extra data
  USDC, // depositAsset
  0 // minimumShares
);
```

---

#### **Step 6: Inside TokenServicePaxos.transfer()**

```solidity
function transfer(...) {
  // A. Validate deposit asset
  require(teller.isSupported(depositAsset), "invalidAsset")

  // B. Pull USDC from user
  IERC20(depositAsset).safeTransferFrom(msg.sender, address(this), amount)
  // User: 1000 USDC → 900 USDC
  // TokenService: 0 → 100 USDC

  // C. Validate Predicate compliance
  require(
    predicateservice.handleMessage(
      depositAsset,      // USDC
      amount,            // 100 USDC
      receiver,          // "aleo1..."
      predicateMessage,  // Signatures
      msg.sender,        // other.address
      0
    ),
    "unauthorizedFromPredicate"
  )
  // PredicateService validates signatures match encoded data

  // D. Deposit into Paxos Teller
  IERC20(depositAsset).safeIncreaseAllowance(address(teller), amount)
  uint256 shares = teller.deposit(depositAsset, amount, minimumShares)
  IERC20(depositAsset).safeApprove(address(teller), 0)
  // TokenService: 100 USDC → 0 USDC
  // Paxos Teller: burns USDC, mints 100 aleoUSD shares
  // TokenService: 0 aleoUSD → 100 aleoUSD

  // E. Calculate and deduct fees
  uint256 fees = feeCollector.getFees(tokenAddress, amount, version)
  uint256 amountAfterFees = amount - fees
  // 100 USDC - 1 USDC fee = 99 USDC to bridge

  // F. Emit bridge event
  _transfer(tokenAddress, amountAfterFees, receiver, version, data)
  // Calls bridge.dispatchPacket()
}
```

---

#### **Step 7: Bridge Emits Event**

```solidity
// Inside BridgeV2.dispatchPacket()
emit PacketDispatched(
  OutPacket({
    sequence: _nextSequence++,
    version: 1,
    source: Chain(1, address(tokenService)),
    destination: Chain(2, "aleo.TokenService"),
    message: Message(
      sender: msg.sender,              // other.address
      tokenAddress: "aleo.TokenAddress",
      amount: 99000000,                // After fees
      receiver: "aleo1..."
    ),
    timestamp: block.timestamp
  }),
  additionalData
)
```

**Event Output:**

```javascript
PacketDispatched(
  packet: [1, 1, [1, "0x..."], [2, "aleo.TokenService"],
          ["0x...other", "aleo.TokenAddress", 99000000, "aleo1..."],
          1728567890],
  data: "0x0401..."
)
```

---

#### **Step 8: Off-Chain Attestor Flow** (Not in test)

```
1. Attestors monitor PacketDispatched event
2. Validate packet data
3. Sign packet hash
4. Submit signatures to Aleo blockchain
5. Aleo TokenService verifies signatures
6. Mints 99 aleoUSD to receiver on Aleo
```

---

## 🔐 Security Mechanisms

### **1. Access Control (OpenZeppelin)**

```solidity
// Roles
DEFAULT_ADMIN_ROLE  // Can grant/revoke other roles
SERVICE_ROLE        // Can call PredicateService

// Modifiers
onlyOwner          // Only contract owner
onlyRole(role)     // Only addresses with specific role
```

### **2. Reentrancy Protection**

```solidity
nonReentrant  // Prevents recursive calls
```

### **3. Pausable**

```solidity
whenNotPaused  // Can emergency pause transfers
```

### **4. Multi-Layer Validation**

- **BlackList:** Blocks sanctioned addresses
- **Predicate:** Validates compliance
- **Teller:** Validates asset support
- **Bridge:** Validates packet format

---

## 🎯 Test Validations

```javascript
// ✅ 1. User balance decreased
expect(await usdcContract.balanceOf(other.address)).to.equal(900 * 1e6);

// ✅ 2. Predicate approved
expect(predicateResponse.is_compliant).to.be.true;

// ✅ 3. Bridge event emitted
expect(bridgeEvents.length).to.be.greaterThan(0);

// ✅ 4. Correct packet structure
const packet = event.args.packet;
expect(packet[2][0]).to.equal(1); // Source chain
expect(packet[3][0]).to.equal(2); // Dest chain
expect(packet[4][1]).to.equal("aleo.TokenAddress"); // Dest token
expect(packet[4][2]).to.be.lte(100 * 1e6); // Amount (after fees)
expect(packet[4][3]).to.equal(aleoReceiver); // Receiver

// ✅ 5. TokenService holds aleoUSD shares
const aleoUSDContract = await ethers.getContractAt("IERC20", ALEO_USD);
expect(await aleoUSDContract.balanceOf(proxiedV1.address)).to.be.gt(0);
```

---

## 📊 Gas Cost Estimates

| Operation            | Gas Cost               |
| -------------------- | ---------------------- |
| User approval        | ~46,000                |
| Predicate validation | ~150,000               |
| Paxos deposit        | ~200,000               |
| Fee calculation      | ~50,000                |
| Bridge event         | ~100,000               |
| **Total Transfer**   | **~500,000 - 600,000** |

---

## 🚨 Common Errors & Solutions

| Error                                             | Cause                            | Solution                                      |
| ------------------------------------------------- | -------------------------------- | --------------------------------------------- |
| `Predicate.validateSignatures: Invalid signature` | Wrong encoding for Predicate API | Encode: `_transfer(address,uint256,string)`   |
| `TokenService: invalidAsset`                      | Asset not in Teller              | Call `teller.addAsset(tokenAddress)` as owner |
| `Unauthorized`                                    | Missing SERVICE_ROLE             | Grant SERVICE_ROLE to TokenServicePaxos       |
| `Transaction reverted without reason`             | Vault rejected deposit           | Use real USDC, not mock                       |
| `BlackListed`                                     | Sender/receiver blacklisted      | Remove from blacklist                         |

---

## 📚 Contract Addresses (Mainnet Fork)

```javascript
// Mainnet Contracts
USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";
PAXOS_TELLER = "0xede35ea2dc28444b52b6b5d47009926910783d7b";
PAXOS_VAULT = "0xc60a7e21a6753ed4305c93034607009faec2a5f3";
PREDICATE_SERVICE = "0x053f202A596450908CDcf99F8e24B424EEBbaeE4";
USDC_WHALE = "0x37305B1cD40574E4C5Ce33f8e8306Be057fD7341";

// Test-Deployed Contracts
TokenServicePaxos = deployed in test;
BridgeV2 = deployed in test;
FeeCollector = deployed in test;
BlackListService = deployed in test;
```

---

## 🔄 Reverse Flow (Aleo → Ethereum)

```
User on Aleo initiates withdrawal
    ↓
Aleo TokenService burns aleoUSD
    ↓
Emits withdrawal event
    ↓
Attestors sign withdrawal packet
    ↓
User submits packet + signatures to Ethereum
    ↓
TokenServicePaxos.withdraw(packet, signatures, USDC, minimumAssets)
    ↓
Validates attestor signatures
    ↓
Calls teller.bulkWithdraw(USDC, shares, minimumAssets, receiver)
    ↓
Teller burns aleoUSD shares → returns USDC to user
```

---

## 🎓 Key Takeaways

1. **TokenServicePaxos** orchestrates the entire flow
2. **Paxos Teller** handles USDC ↔ aleoUSD conversion
3. **PredicateService** ensures compliance
4. **BridgeV2** emits cross-chain packets
5. **Attestors** relay packets between chains
6. **User never touches Teller directly** - always via TokenService
7. **Packet contains destination token**, not source token
8. **Fees are deducted** before bridging
9. **Multiple security layers** protect transfers
10. **Real USDC required** for mainnet fork testing

---

**End of Documentation** 🎯

**Last Updated:** October 10, 2025
**Test File:** `test/012.TokenPaxos.test.js`
**Network:** Ethereum Mainnet Fork
