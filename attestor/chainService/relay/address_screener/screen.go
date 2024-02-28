package addressscreener

import (
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/chain"
	"github.com/venture23-aleo/aleo-bridge/attestor/chainService/store"
)

type ScreenI interface {
	// todo: might need to receive error as well
	// currently we have not received any update from Aleo regarding integrating chain analysis.
	// If we receive any update then we shall update this function accordingly

	// Screen sends addresses in packets to address-screening service to analyse and
	// flag them.
	Screen(pkt *chain.Packet) (isWhite bool)
	StoreWhiteStatus(pkt *chain.Packet, isWhite bool) error
}

var sc ScreenI

const (
	namespace = "walletScreeningNS"
)

type screenService struct {
}

// Screen evaluates the validity of the packet by checking if the wallet addresses of either of receiver or sender
// in the packet is flagged by the screening services. If they are flagged, returns false and returns true otherwise
func (s screenService) Screen(pkt *chain.Packet) bool {
	key := pkt.GetSha256Hash()
	v, err := store.GetAndDeleteWhiteStatus(namespace, key)
	if err == nil {
		return v
	}

	chain1 := pkt.Source.ChainID
	addr1 := pkt.Source.Address
	chain2 := pkt.Destination.ChainID
	addr2 := pkt.Destination.Address
	// send both addresses to chain analysis
	_, _, _, _ = chain1, chain2, addr1, addr2
	return true
}

// StoreWhiteStatus stores the result of screening of the packets in the walletScreeningNS
func (s *screenService) StoreWhiteStatus(pkt *chain.Packet, isWhite bool) error {
	key := pkt.GetSha256Hash()
	return store.StoreWhiteStatus(namespace, key, isWhite)
}

func SetupScreenService() error {
	err := store.CreateNamespace(namespace)
	if err != nil {
		panic(err)
	}
	sc = &screenService{}
	return nil
}

func GetScreener() ScreenI {
	if sc == nil {
		panic("screneer not set up")
	}
	return sc
}
