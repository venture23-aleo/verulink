package relay

import (
	"github.com/venture23-aleo/attestor/chainService/chain"
	"github.com/venture23-aleo/attestor/chainService/store"
)

func screen(p *chain.Packet) (isWhite bool) {
	key := p.GetSha256Hash()
	v, err := store.GetScreenValue(walletScreeningNameSpace, key)
	if err == nil {
		return v
	}

	chain1 := p.Source.ChainID
	addr1 := p.Source.Address
	chain2 := p.Destination.ChainID
	addr2 := p.Destination.Address
	// send both addresses to chain analysis
	_, _, _, _ = chain1, chain2, addr1, addr2
	return false
}
