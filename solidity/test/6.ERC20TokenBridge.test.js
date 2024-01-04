import { expect } from 'chai';
import hardhat from 'hardhat';
const { ethers } = hardhat;

describe('ERC20TokenBridge', () => {
    let ERC20TokenbridgeImpl;
    let unknownAttestor;
    let Proxy;
    let bridgeImpl;
    let lib;
    let owner;
    let signer;
    let attestor1;
    let attestor2;
    let initializeData;
    let proxiedV1;
    let tokenService;
    let other;
    let unknownChainId;

    beforeEach(async () => {
        [owner, attestor1, attestor2, signer, unknownAttestor, tokenService, other] = await ethers.getSigners();

        // Deploy ERC20TokenBridge
        lib = await ethers.getContractFactory("PacketLibrary", { from: signer.address });
        const libInstance = await lib.deploy();
        await libInstance.waitForDeployment();
        const destinationChainId = 2;

        ERC20TokenbridgeImpl = await ethers.getContractFactory("ERC20TokenBridge", {
            libraries: {
                PacketLibrary: libInstance.target,
            },
        });

        bridgeImpl = await ERC20TokenbridgeImpl.deploy();
        await bridgeImpl.waitForDeployment();

        Proxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.Interface(ERC20TokenbridgeImpl.interface.formatJson()).encodeFunctionData("initialize", [owner.address]);
        const proxy = await Proxy.deploy(bridgeImpl.target, initializeData);
        await proxy.waitForDeployment();
        proxiedV1 = ERC20TokenbridgeImpl.attach(proxy.target);
        await (await proxiedV1.addAttestor(attestor1.address, destinationChainId, 2)).wait();
        await (await proxiedV1.addAttestor(attestor2.address, destinationChainId, 2)).wait();
        await (await proxiedV1.addTokenService(tokenService.address, destinationChainId)).wait();
        await (await proxiedV1.addChain(destinationChainId, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27")).wait();
    });

    it('should have the correct owner', async () => {
        const actualOwner = await proxiedV1.owner();
        expect(actualOwner).to.equal(owner.address);
    });

    it('reverts if the contract is already initialized', async function () {
        // console.log("initializeData = ", initializeData);
        expect(proxiedV1.initialize(owner.address)).to.be.revertedWith('Initializable: contract is already initialized');
    });

    it('should receive an incoming packet when receivePacket is called', async () => {
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        await (await proxiedV1.connect(attestor1).receivePacket(inPacket)).wait();
        await (await proxiedV1.connect(attestor2).receivePacket(inPacket)).wait();
        const incomingPacketHash_ = await proxiedV1.incomingPackets(inPacket[2][0], inPacket[1]);
        const getIncomingPacketHash_ = await proxiedV1.getIncomingPacketHash(inPacket[2][0], inPacket[1]);
        expect(incomingPacketHash_).to.equal(getIncomingPacketHash_);
    });

    it('should revert when receiving the same packet twice', async () => {
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Receive the incoming packet for the first time
        await (await proxiedV1.connect(attestor1).receivePacket(inPacket)).wait();
        await (await proxiedV1.connect(attestor2).receivePacket(inPacket)).wait();
        await (await proxiedV1.connect(tokenService).consume(inPacket)).wait();
        expect(proxiedV1.connect(attestor1).receivePacket(inPacket)).to.be.revertedWith("Packet already consumed");
    });


    it('should revert when an unknown attester tries to receive a packet with receivePacket', async () => {
        // Use a different address that is not an attester    
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Use 'unknownAddress' as the caller, which is not an attester
        expect(proxiedV1.connect(unknownAttestor).receivePacket(inPacket))
            .to.be.revertedWith("Unknown Attestor");
    });

    it('should receive an incoming packets in a batch when receivePacketBatch is called', async () => {
        // Create Packet 
        const inPacket1 = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Create Packet 2
        const inPacket2 = [
            1,
            2,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 20, ethers.Wallet.createRandom().address],
            150
        ];

        // Organize both packets into an array
        const packetsArray = [inPacket1, inPacket2];
        await (await proxiedV1.connect(attestor1).receivePacketBatch(packetsArray)).wait();
        await (await proxiedV1.connect(attestor2).receivePacketBatch(packetsArray)).wait();
        await (await proxiedV1.connect(tokenService).consume(packetsArray[0])).wait();
        expect(await proxiedV1.isPacketConsumed(packetsArray[0][2][0], packetsArray[0][1])).to.be.true;
    });
    it('should revert when an unknown attester tries to receive a packet with receivePacketBatch', async () => {
        // Create Packet 1
        const inPacket1 = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Create Packet 2
        const inPacket2 = [
            1,
            2,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 20, ethers.Wallet.createRandom().address],
            150
        ];
        const packetsArray = [inPacket1, inPacket2];

        // Use 'unknownAddress' as the caller, which is not an attester
        expect(proxiedV1.connect(unknownAttestor).receivePacketBatch(packetsArray))
            .to.be.revertedWith("Unknown Attestor");
    });

    it('should return true when the attestor has voted', async () => {
        // Create an OutPacket 
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Vote on the packet
        await (await proxiedV1.connect(attestor1).receivePacket(inPacket)).wait();
        await (await proxiedV1.connect(attestor2).receivePacket(inPacket)).wait();

        const result = await proxiedV1["hasVoted(uint256,uint256,address)"](inPacket[2][0], inPacket[1], attestor1.address);

        expect(result).to.be.true;
    });

    it('should return false when the voter has not voted', async () => {
        // Create an OutPacket 
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Vote on the packet
        await (await proxiedV1.connect(attestor1).receivePacket(inPacket)).wait();

        const result = await proxiedV1["hasVoted(uint256,uint256,address)"](inPacket[2][0], inPacket[1], attestor2.address);

        expect(result).to.be.false;
    });

    it('should emit Voted event with correct parameters', async () => {
        // Create an inPacket 
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];
        const tx = await (await proxiedV1.connect(attestor1).receivePacket(inPacket)).wait();
        const { eventName } = tx.logs[0];
        expect(eventName).to.equal('Voted');
    });

    it('should emit AlreadyVoted event when the attestor has already voted', async () => {
        // Create an OutPacket 
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];
        await (await proxiedV1.connect(attestor1).receivePacket(inPacket)).wait();
        const tx = await (await proxiedV1.connect(attestor1).receivePacket(inPacket)).wait();
        const { eventName } = tx.logs[0];
        expect(eventName).to.equal('AlreadyVoted');
    });

    it('should return true when quorum is reached for hasQuorumReached(uint256 chainId, uint256 sequence)', async () => {
        // Create an inPacket 
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Vote on the packet
        await (await proxiedV1.connect(attestor1).receivePacket(inPacket)).wait();
        await (await proxiedV1.connect(attestor2).receivePacket(inPacket)).wait();
        const result = await proxiedV1["hasQuorumReached(uint256,uint256)"](inPacket[2][0], inPacket[1]);
        expect(result).to.be.true;
    });

    it('should return true when quorum is reached for hasQuorumReached(bytes32 packetHash, uint256 chainId)', async () => {
        // Create an inPacket 
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Calculate the packet hash
        const initialPacketHash = await proxiedV1.getIncomingPacketHash(inPacket[2][0], inPacket[1]);

        // Ensure that the initial quorum is not reached
        const initialQuorumReached = await proxiedV1["hasQuorumReached(bytes32,uint256)"](initialPacketHash, inPacket[2][0]);
        expect(initialQuorumReached).to.be.false;

        // Vote on the packet
        await (await proxiedV1.connect(attestor1).receivePacket(inPacket)).wait();

        // Check if quorum has reached after one vote
        const quorumAfterOneVote = await proxiedV1["hasQuorumReached(bytes32,uint256)"](initialPacketHash, inPacket[2][0]);
        expect(quorumAfterOneVote).to.be.false;

        // Vote again to reach the quorum
        await (await proxiedV1.connect(attestor2).receivePacket(inPacket)).wait();
        const packetHashAfterVoting = await proxiedV1.getIncomingPacketHash(inPacket[2][0], inPacket[1]);
        // Check if quorum has reached after two votes
        const quorumAfterTwoVotes = await proxiedV1["hasQuorumReached(bytes32,uint256)"](packetHashAfterVoting, inPacket[2][0]);
        expect(quorumAfterTwoVotes).to.be.true;
    });


    it('should return false when quorum is not reached', async () => {
        // Create an inPacket 
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Vote on the packet
        await (await proxiedV1.connect(attestor1).receivePacket(inPacket)).wait();
        const result = await proxiedV1["hasQuorumReached(uint256,uint256)"](inPacket[2][0], inPacket[1]);
        expect(result).to.be.false;
    });

    it('should consume an incoming packet when consume is called', async () => {
        // Create an inPacket
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Receive the incoming packet
        await (await proxiedV1.connect(attestor1).receivePacket(inPacket)).wait();
        await (await proxiedV1.connect(attestor2).receivePacket(inPacket)).wait();

        // Consume the packet
        await (await proxiedV1.connect(tokenService).consume(inPacket)).wait();
    });

    it('should revert on consuming an incoming packet that is not stored in incomming map', async () => {
        // Create an inPacket
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Consume the packet
        expect(proxiedV1.connect(tokenService).consume(inPacket)).to.be.revertedWith("Unknown Packet Hash");
    });

    it('should revert on consuming an incoming packet that is already consumed', async () => {
        // Create an inPacket
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Receive the incoming packet
        await (await proxiedV1.connect(attestor1).receivePacket(inPacket)).wait();
        await (await proxiedV1.connect(attestor2).receivePacket(inPacket)).wait();

        // Consume the packet
        await (await proxiedV1.connect(tokenService).consume(inPacket)).wait();
        expect(proxiedV1.connect(tokenService).consume(inPacket)).to.be.revertedWith("Packet already consumed");
    });

    it('only allow a registered token service to call the consume', async () => {
        // Create an inPacket
        const inPacket = [
            1,
            1,
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Receive the incoming packet
        await (await proxiedV1.connect(attestor1).receivePacket(inPacket)).wait();
        await (await proxiedV1.connect(attestor2).receivePacket(inPacket)).wait();

        // Consume the packet
        expect(proxiedV1.connect(other).consume(inPacket)).to.be.revertedWith("Unknown Token Service");
    });

    it('should dispatch an outgoing packet when sendMessage is called', async () => {
        const outPacket = [
            1,
            1,
            [1, ethers.Wallet.createRandom().address],
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"], [ethers.Wallet.createRandom().address, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", 10, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            100
        ];
        await (await proxiedV1.connect(tokenService).sendMessage(outPacket)).wait();
    });

    it('should revert when calling sendMessage with unknown token service', async () => {
        const outPacket = [
            1,
            1,
            [1, ethers.Wallet.createRandom().address],
            [2, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"], [ethers.Wallet.createRandom().address, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", 10, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            100
        ];
        expect(proxiedV1.connect(other).sendMessage(outPacket)).to.be.revertedWith("Unknown Token Service");
    });

    it('should revert when calling sendMessage with unknown destination chainId', async () => {
        const unknowndestChainId = 3;
        const outPacket = [
            1,
            1,
            [1, ethers.Wallet.createRandom().address],
            [unknowndestChainId, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"], [ethers.Wallet.createRandom().address, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27", 10, "aleo1fg8y0ax9g0yhahrknngzwxkpcf7ejy3mm6cent4mmtwew5ueps8s6jzl27"],
            100
        ];
        expect(proxiedV1.connect(tokenService).sendMessage(outPacket)).to.be.revertedWith("Unknown destination chain");
    });
});

// Define the test suite for ERC20TokenBridgeV2
describe('Upgradeabilty: ERC20TokenBridgeV2', () => {
    let ERC20TokenBridgeV1Impl, initializeData, proxied, ERC20TokenBridgeV1, upgradeData;
    let lib;
    let owner;
    let signer;
    let other;
    let ERC20TokenBridgeV2Impl;
    let ERC20TokenBridgeV2;
    let ERC20TokenBridgeProxy;
    let tokenService;

    // Deploy a new HoldingV2 contract before each test
    beforeEach(async () => {
        [owner, tokenService, signer, other] = await ethers.getSigners();

        // Deploy ERC20TokenBridge
        lib = await ethers.getContractFactory("PacketLibrary", { from: signer.address });
        const libInstance = await lib.deploy();
        await libInstance.waitForDeployment();

        ERC20TokenBridgeV1 = await ethers.getContractFactory("ERC20TokenBridge", {
            libraries: {
                PacketLibrary: libInstance.target,
            },
        });

        // ERC20TokenBridgeV1 = await ethers.getContractFactory("ERC20TokenBridge");
        ERC20TokenBridgeV1Impl = await ERC20TokenBridgeV1.deploy();
        await ERC20TokenBridgeV1Impl.waitForDeployment();
        let ERC20TokenBridgeABI = ERC20TokenBridgeV1.interface.formatJson();

        ERC20TokenBridgeProxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.Interface(ERC20TokenBridgeABI).encodeFunctionData("initialize(address)", [owner.address]);
        const proxy = await ERC20TokenBridgeProxy.deploy(ERC20TokenBridgeV1Impl.target, initializeData);
        await proxy.waitForDeployment();
        proxied = ERC20TokenBridgeV1.attach(proxy.target);

        ERC20TokenBridgeV2 = await ethers.getContractFactory("ERC20TokenBridgeV2", {
            libraries: {
                PacketLibrary: libInstance.target,
            },
        });

        ERC20TokenBridgeV2Impl = await ERC20TokenBridgeV2.deploy();
        await ERC20TokenBridgeV2Impl.waitForDeployment();
        let ERC20TokenBridgeV2ABI = ERC20TokenBridgeV2.interface.formatJson();

        upgradeData = new ethers.Interface(ERC20TokenBridgeV2ABI).encodeFunctionData("initializev2", [5]);
        await proxied.upgradeToAndCall(ERC20TokenBridgeV2Impl.target, upgradeData);
        proxied = ERC20TokenBridgeV2.attach(proxy.target);
    });

    // Test deployment and initialization
    it('should give the correct owner', async () => {
        const contractOwner = await proxied.owner();
        expect(contractOwner).to.equal(owner.address);
    });

    // Test the value set by the multiply function
    it('should set the correct value', async () => {
        const val = await proxied.val();
        expect(val).to.equal(5);
    });

    it('only owner should be able to upgrade', async () => {
        expect(proxied.connect(other).upgradeToAndCall(ERC20TokenBridgeV2Impl.target, upgradeData)).to.be.revertedWith("Only owner can upgrade");
    });

    it('reverts if the contract is initialized twice', async function () {
        expect(proxied.initializev2(100)).to.be.revertedWith('Initializable: contract is already initialized');
    });
});
