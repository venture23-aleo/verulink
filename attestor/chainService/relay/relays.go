package relay

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
	common "github.com/venture23-aleo/aleo-bridge/attestor/chainService/common"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/config"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/logger"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/metrics"
	addressscreener "github.com/venture23-aleo/aleo-bridge/attestor/chainService/relay/address_screener"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/relay/collector"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/relay/signer"
	"go.uber.org/zap"
)

// Each chain registers required instance into these maps in its init() function.
// Gateway to chain specific logic.
var (
	// RegisteredClients stores function that returns instace which satisfies chain.IClient interface
	// This function panics if any error occurs while initialization
	RegisteredClients = map[string]chain.ClientFunc{}
	// RegisteredRetryChannels stores channels for each chain to receive and handle packets that needs to be
	// retried.
	RegisteredRetryChannels = map[string]chan *chain.Packet{}
	// RegisteredCompleteChannels stores channel for each chain to receive and handle packets that has successfully
	// been stored in db-service.
	RegisteredCompleteChannels = map[string]chan<- *chain.Packet{}
)

var (
	chainIDToChain = map[string]chain.IClient{}
)

// relay collects db-service, signer and wallet-screener interface to interact with these services
// after it pulls the packet.
// Collecting fields makes it possible to write unit-tests by injecting custom dependency.
type relay struct {
	collector collector.CollectorI
	signer    signer.SignI
	screener  addressscreener.ScreenI
	metrics   *metrics.PrometheusMetrics
}

// StartRelay setups all the necessary environment for running the relay and starts it.
func StartRelay(ctx context.Context, cfg *config.Config, metrics *metrics.PrometheusMetrics) {
	err := signer.SetupSigner(&cfg.SigningServiceConfig)
	if err != nil {
		panic(err)
	}

	err = addressscreener.SetupScreenService()
	if err != nil {
		panic(err)
	}

	chainIdToAddress := make(map[string]string)
	for _, v := range cfg.ChainConfigs {
		chainIdToAddress[v.ChainID.String()] = v.WalletAddress
	}

	err = collector.SetupCollector(
		cfg.CollectorServiceConfig,
		chainIdToAddress,
		cfg.CollectorServiceConfig.CollectorWaitDur,
	)
	if err != nil {
		panic(err)
	}

	r := relay{
		collector: collector.GetCollector(),
		signer:    signer.GetSigner(),
		screener:  addressscreener.GetScreener(),
		metrics:   metrics,
	}

	// pktCh will receive all the packets from multiple sources and processes each packet.
	pktCh := make(chan *chain.Packet)
	go func() {
		<-ctx.Done()
		close(pktCh) // todo: verify graceful killing
	}()

	// missedPktCh will receive all the missed-packet from db-source. It will then be queried in source
	// chain for the truth and if valid then this packet will be send to pktCh
	missedPktCh := make(chan *chain.MissedPacket)

	go initPacketFeeder(ctx, cfg.ChainConfigs, pktCh, metrics)
	go r.checkHealthServices(ctx, &cfg.SigningServiceConfig, cfg.CheckHealthServiceDur)
	go r.collector.ReceivePktsFromCollector(ctx, missedPktCh)
	go consumeMissedPackets(ctx, missedPktCh, pktCh)
	r.consumePackets(ctx, pktCh)
}

// checks the connection with signing service and collector service at
// regular interval
func (r *relay) checkHealthServices(ctx context.Context, signingServiceConfig *config.SigningServiceConfig, duration time.Duration) {
	ticker := time.NewTicker(duration)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return

		case <-ticker.C:
			coll := collector.GetCollector()
			err := coll.CheckCollectorHealth(ctx)
			if err != nil {
				logger.GetLogger().Error("Bad Connection to collector service")
				r.metrics.SetDBServiceHeatlh(logger.AttestorName, 0)
			} else {
				logger.GetLogger().Info("Lively connection to collector service")
				r.metrics.SetDBServiceHeatlh(logger.AttestorName, 1)
			}

			// checking the health of signing service
			signingService := signer.GetSigner()
			err = signingService.CheckSigningServiceHealth(ctx, signingServiceConfig)

			if err != nil {
				logger.GetLogger().Error("Connection to signing service failed", zap.Any("error", err.Error()))
				r.metrics.SetSigningServiceHealth(logger.AttestorName, 0)
			} else {
				logger.GetLogger().Info("Connection to signing service established")
				r.metrics.SetSigningServiceHealth(logger.AttestorName, 1)
			}
		}
	}

}

// initPacketFeeder starts the routine to fetch and manage the packets of all the registered chains
func initPacketFeeder(ctx context.Context, cfgs []*config.ChainConfig, pktCh chan<- *chain.Packet, m *metrics.PrometheusMetrics) {
	ch := make(chan chain.IClient, len(cfgs))

	for _, chainCfg := range cfgs {
		if _, ok := RegisteredClients[chainCfg.Name]; !ok {
			panic(fmt.Sprintf("module undefined for chain %s", chainCfg.Name))
		}

		chain := RegisteredClients[chainCfg.Name](chainCfg)
		chain.SetMetrics(m)
		chainIDToChain[chainCfg.ChainID.String()] = chain
		ch <- chain
	}

	for chain := range ch {
		chain := chain
		go func() {
			ctx, cncl := context.WithCancel(ctx)
			defer cncl()
			defer func() {
				if r := recover(); r != nil {
					cncl()
					ch <- chain
				}
			}()
			chain.FeedPacket(ctx, pktCh)
		}()
	}
}

// consumePackets spawns the goroutine to process the packets i.e. wallet-screen, sign and send the hash and signature
// to the db-service.
func (r *relay) consumePackets(ctx context.Context, pktCh <-chan *chain.Packet) {
	// guideCh will make sure that only given number of routines can be spawned simultaneously.
	guideCh := make(chan struct{}, config.GetConfig().ConsumePacketWorker)
	for {
		select {
		case <-ctx.Done():
			return
		case guideCh <- struct{}{}:
		}

		pkt, ok := <-pktCh
		if !ok {
			return
		}
		go func() {
			defer func() {
				<-guideCh
			}()
			r.processPacket(ctx, pkt)
		}()
	}
}

// processPacket verifies if the addresses(receiver and sender) in the packet are flagged by querying their
// validity in the screening services and according to the result, send the screened packets to signing
// service to retrieve the hash and signature and finally send it to the db-service aka collector
func (r *relay) processPacket(ctx context.Context, pkt *chain.Packet) {
	srcChainName := chainIDToChain[pkt.Source.ChainID.String()].Name()
	var (
		err     error
		isWhite bool
	)

	defer func() {
		if pkt.IsMissed() { // Skip post processing for packets delivered from collector(db-service)
			return
		}
		if err != nil {
			RegisteredRetryChannels[srcChainName] <- pkt
			// todo: check if it is valid to store clean-status of a packet,
			// storing these statuses will save chain-analysis cost
			err := r.screener.StoreWhiteStatus(pkt, isWhite)
			if err != nil {
				logger.GetLogger().Error("Error while storing white status", zap.Error(err))
			}
			return
		}
		RegisteredCompleteChannels[srcChainName] <- pkt
	}()

	isWhite = r.screener.Screen(pkt)
	sp := &chain.ScreenedPacket{
		Packet:  pkt,
		IsWhite: isWhite,
	}
	hash, signature, err := r.signer.HashAndSignScreenedPacket(ctx, sp)
	if err != nil {
		logger.GetLogger().Error(
			"Error while signing packet", zap.Error(err), zap.Any("packet", pkt))
		return
	}

	logger.GetLogger().Debug("packet hashed and signed",
		zap.String("source_chain", pkt.Source.ChainID.String()),
		zap.Uint64("seq_num", pkt.Sequence),
		zap.String("hash", hash), zap.String("signature", signature))

	r.metrics.HashedAndSignedPacket(logger.AttestorName, pkt.Source.ChainID.String(), pkt.Destination.ChainID.String())

	err = r.collector.SendToCollector(ctx, sp, hash, signature)
	if err != nil {
		if errors.Is(err, common.AlreadyRelayedPacket{}) {
			logger.GetLogger().Info("Duplicate packet detected",
				zap.String("source_chain", pkt.Source.ChainID.String()),
				zap.Uint64("seq_num", pkt.Sequence))
			err = nil // non-nil error will put packet in retry namespace
			return
		}
		logger.GetLogger().Error("Error while putting signature", zap.Error(err))
		return
	}

	logger.GetLogger().Info("Packet successfully sent",
		zap.String("source_chain", pkt.Source.ChainID.String()),
		zap.Uint64("seq_num", pkt.Sequence))
	r.metrics.DeliveredPackets(logger.AttestorName, pkt.Source.ChainID.String(), pkt.Destination.ChainID.String())
}

// consumeMissedPackets receives missed-packet info from collector-service into missedPktCh channel,
// fetches corresponding packet from source chain and feeds it to pktCh
func consumeMissedPackets(
	ctx context.Context, missedPktCh <-chan *chain.MissedPacket,
	pktCh chan<- *chain.Packet) { // refetchCh Channel to signal collector

	for {
		select {
		case <-ctx.Done():
			return
		default:
		}

		missedPkt := <-missedPktCh
		srcChain := chainIDToChain[missedPkt.SourceChainID.String()]
		pkt, err := srcChain.GetMissedPacket(ctx, missedPkt)
		if err != nil {
			logger.GetLogger().Error("Error while getting missed packet",
				zap.Any("missed_packet", missedPkt), zap.Error(err))
			continue
		}

		pkt.SetMissed(true)
		pktCh <- pkt
	}
}
