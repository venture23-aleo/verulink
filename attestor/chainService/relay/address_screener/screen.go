package addressscreener

import (
	"github.com/venture23-aleo/attestor/chainService/chain"
	"github.com/venture23-aleo/attestor/chainService/store"
)

type ScreenI interface {
	Screen(pkt *chain.Packet) (isWhite bool)
	StoreWhiteStatus(pkt *chain.Packet, isWhite bool) error
}

var sc ScreenI

type screenService struct {
	dbNamespace string
}

func (s screenService) Screen(pkt *chain.Packet) bool {
	key := pkt.GetSha256Hash()
	v, err := store.GetAndDeleteWhiteStatus(s.dbNamespace, key)
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

func (s *screenService) StoreWhiteStatus(pkt *chain.Packet, isWhite bool) error {
	key := pkt.GetSha256Hash()
	return store.StoreWhiteStatus(s.dbNamespace, key, isWhite)
}

func SetupScreenService() error {
	sc = &screenService{}
	return nil
}
func GetScreenService() ScreenI {
	return sc
}
