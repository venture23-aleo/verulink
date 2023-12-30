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
        const destinationChainId = 2;
        // unknownChainId = 3;
        // const destinationChainId1 = 3;

        ERC20TokenbridgeImpl = await ethers.getContractFactory("ERC20TokenBridge", {
            libraries: {
                PacketLibrary: libInstance.target,
            },
        });

        bridgeImpl = await ERC20TokenbridgeImpl.deploy();

        Proxy = await ethers.getContractFactory('ProxyContract');
        initializeData = new ethers.Interface(ERC20TokenbridgeImpl.interface.formatJson()).encodeFunctionData("initialize", [owner.address]);
        const proxy = await Proxy.deploy(bridgeImpl.target, initializeData);
        proxiedV1 = ERC20TokenbridgeImpl.attach(proxy.target);
        await proxiedV1.addAttestor(attestor1.address, destinationChainId, 2);
        await proxiedV1.addAttestor(attestor2.address, destinationChainId, 2);
        await proxiedV1.addTokenService(tokenService.address,destinationChainId);
        await proxiedV1.addChain(destinationChainId, "aleo.bridge");
        // await proxiedV1.addChain(unknownChainId, "aleo.bridge");
        // console.log("bool = ", await proxiedV1.isSupportedChain(unknownChainId));

    });

    it('should have the correct owner', async () => {
        const actualOwner = await proxiedV1.owner();
        expect(actualOwner).to.equal(owner.address);
    });

    it('should receive an incoming packet when receivePacket is called', async () => {
        const packet = [
            1,
            1,
            [2, "aleo.bridge"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo.bridge", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        await proxiedV1.connect(attestor1).receivePacket(packet);
        await proxiedV1.connect(attestor2).receivePacket(packet);
    });

    it('should revert when an unknown attester tries to receive a packet with receivePacket', async () => {
        // Use a different address that is not an attester    
        const packet = [
            1,
            1,
            [2, "aleo.bridge"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo.bridge", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Use 'unknownAddress' as the caller, which is not an attester
        expect(proxiedV1.connect(unknownAttestor).receivePacket(packet))
            .to.be.revertedWith("Unknown Attestor");
    });

    it('should receive an incoming packets in a batch when receivePacketBatch is called', async () => {
        // Create Packet 
        const packet1 = [
            1,
            1,
            [2, "aleo.bridge"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo.bridge", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Create Packet 2
        const packet2 = [
            1,
            2,
            [2, "aleo.bridge"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo.bridge", ethers.Wallet.createRandom().address, 20, ethers.Wallet.createRandom().address],
            150
        ];

        // Organize both packets into an array
        const packetsArray = [packet1, packet2];
        await proxiedV1.connect(attestor1).receivePacketBatch(packetsArray);
        await proxiedV1.connect(attestor2).receivePacketBatch(packetsArray);
    });
    it('should revert when an unknown attester tries to receive a packet with receivePacketBatch', async () => {
        // Create Packet 1
        const packet1 = [
            1,
            1,
            [2, "aleo.bridge"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo.bridge", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Create Packet 2
        const packet2 = [
            1,
            2,
            [2, "aleo.bridge"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo.bridge", ethers.Wallet.createRandom().address, 20, ethers.Wallet.createRandom().address],
            150
        ];
        const packetsArray = [packet1, packet2];

        // Use 'unknownAddress' as the caller, which is not an attester
        expect(proxiedV1.connect(unknownAttestor).receivePacketBatch(packetsArray))
            .to.be.revertedWith("Unknown Attestor");
    });

    it('should return true when the attestor has voted', async () => {
        // Create an OutPacket 
        const outPacket = [
            1,
            1,
            [2, "aleo.bridge"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo.bridge", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Vote on the packet
        await proxiedV1.connect(attestor1).receivePacket(outPacket);
        await proxiedV1.connect(attestor2).receivePacket(outPacket);

        const result = await proxiedV1["hasVoted(uint256,uint256,address)"](outPacket[2][0], outPacket[1], attestor1.address);

        expect(result).to.be.true;
    });

    it('should return false when the voter has not voted', async () => {
        // Create an OutPacket 
        const outPacket = [
            1,
            1,
            [2, "aleo.bridge"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo.bridge", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Vote on the packet
        await proxiedV1.connect(attestor1).receivePacket(outPacket);

        const result = await proxiedV1["hasVoted(uint256,uint256,address)"](outPacket[2][0], outPacket[1], attestor2.address);

        expect(result).to.be.false;
    });

    it('should return true when quorum is reached', async () => {
        // Create an OutPacket 
        const outPacket = [
            1,
            1,
            [2, "aleo.bridge"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo.bridge", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Vote on the packet
        await proxiedV1.connect(attestor1).receivePacket(outPacket);
        await proxiedV1.connect(attestor2).receivePacket(outPacket);
        const result = await proxiedV1["hasQuorumReached(uint256,uint256)"](outPacket[2][0], outPacket[1]);
        expect(result).to.be.true;
    });

    it('should return false when quorum is not reached', async () => {
        // Create an OutPacket 
        const outPacket = [
            1,
            1,
            [2, "aleo.bridge"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo.bridge", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Vote on the packet
        await proxiedV1.connect(attestor1).receivePacket(outPacket);
        const result = await proxiedV1["hasQuorumReached(uint256,uint256)"](outPacket[2][0], outPacket[1]);
        expect(result).to.be.false;
    });

    it('should consume an incoming packet when consume is called', async () => {
        // Create an incoming packet
        const inPacket = [
            1,
            1,
            [2, "aleo.bridge"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo.bridge", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Receive the incoming packet
        await proxiedV1.connect(attestor1).receivePacket(inPacket);
        await proxiedV1.connect(attestor2).receivePacket(inPacket);

        // Consume the packet
        await proxiedV1.connect(tokenService).consume(inPacket);
    });

    it('only allow a registered token service to call the consume', async () => {
        // Create an incoming packet
        const inPacket = [
            1,
            1,
            [2, "aleo.bridge"],
            [1, ethers.Wallet.createRandom().address],
            ["aleo.bridge", ethers.Wallet.createRandom().address, 10, ethers.Wallet.createRandom().address],
            100
        ];

        // Receive the incoming packet
        await proxiedV1.connect(attestor1).receivePacket(inPacket);
        await proxiedV1.connect(attestor2).receivePacket(inPacket);

        // Consume the packet
        expect(proxiedV1.connect(other).consume(inPacket)).to.be.revertedWith("Unknown Token Service");
    });

    it('should dispatch an outgoing packet when sendMessage is called', async () => {
        const outPacket = [
            1,
            1,
            [1, ethers.Wallet.createRandom().address],
            [2, "aleo.bridge"], [ethers.Wallet.createRandom().address, "aleo.bridge", 10, "aleo.bridge"],
            100
        ];
        await proxiedV1.connect(tokenService).sendMessage(outPacket);
    });

    it('should revert when calling sendMessage with unknown token service', async () => {
        const outPacket = [
            1,
            1,
            [1, ethers.Wallet.createRandom().address],
            [2, "aleo.bridge"], [ethers.Wallet.createRandom().address, "aleo.bridge", 10, "aleo.bridge"],
            100
        ];
        expect(proxiedV1.connect(other).sendMessage(outPacket)).to.be.revertedWith("Unknown Token Service");
    });

    it('should revert when calling sendMessage with unknown chainId', async () => {
        const outPacket = [
            1,
            1,
            [1, ethers.Wallet.createRandom().address],
            [3, "aleo.bridge"], [ethers.Wallet.createRandom().address, "aleo.bridge", 10, "aleo.bridge"],
            100
        ];
        expect (proxiedV1.connect(tokenService).sendMessage(outPacket)).to.be.revertedWith("Unknown destination chain");
    });
});

// Define the test suite for ERC20TokenBridgeV2
describe('Upgradeabilty: ERC20TokenBridgeV2', () => {
    let ERC20TokenBridgeV1Impl, initializeData, proxied, tokenService, ERC20TokenBridgeV1, upgradeData;
    let lib;
    let owner;
    let signer;
    let other;
    let ERC20TokenBridgeV2Impl;
    let ERC20TokenBridgeV2;
    let ERC20TokenBridgeProxy;

    // Deploy a new HoldingV2 contract before each test
    beforeEach(async () => {
            [owner, tokenService, signer, other] = await ethers.getSigners();

            // Deploy ERC20TokenBridge
            lib = await ethers.getContractFactory("PacketLibrary", { from: signer.address });
            const libInstance = await lib.deploy();

            ERC20TokenBridgeV1 = await ethers.getContractFactory("ERC20TokenBridge", {
                    libraries: {
                            PacketLibrary: libInstance.target,
                    },
            });

            // ERC20TokenBridgeV1 = await ethers.getContractFactory("ERC20TokenBridge");
            ERC20TokenBridgeV1Impl = await ERC20TokenBridgeV1.deploy();
            let ERC20TokenBridgeABI = ERC20TokenBridgeV1.interface.formatJson();

            ERC20TokenBridgeProxy = await ethers.getContractFactory('ProxyContract');
            initializeData = new ethers.Interface(ERC20TokenBridgeABI).encodeFunctionData("initialize(address)", [owner.address]);
            const proxy = await ERC20TokenBridgeProxy.deploy(ERC20TokenBridgeV1Impl.target, initializeData);
            proxied = ERC20TokenBridgeV1.attach(proxy.target);

            ERC20TokenBridgeV2 = await ethers.getContractFactory("ERC20TokenBridgeV2", {
                    libraries: {
                            PacketLibrary: libInstance.target,
                    },
            });

            ERC20TokenBridgeV2Impl = await ERC20TokenBridgeV2.deploy();
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

    // it('should prevent re-initializing the contract', async () => {
    //     expect(await proxied.initializev2(5)).to.be.reverted;
// });
});
