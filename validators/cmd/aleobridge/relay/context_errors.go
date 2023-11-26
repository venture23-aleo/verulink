package relay

import "strings"

type ContextErrors string

func (ce ContextErrors) Error() string {
	return strings.ReplaceAll(string(ce), "_", " ")
}

const (
	Panic ContextErrors = "panic"
)

/*
1. We cannot block any blockchain
    eth-aleo, eth-solana, aleo-solana
2. Need common receiver and sender per chain. Use channels
3. Consider pausability
4. Receive only finalized packets.
5. Remove packets from db only if attest transaction is finalized
6.

*/
