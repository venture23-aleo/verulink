package relay

import (
	common "github.com/venture23-aleo/aleo-bridge/validators/common/wallet"
)

type ChainConfig struct {
	Name           string `json:"name"`
	ChainID        uint32 `json:"chain_id"`
	BridgeContract string `json:"bridge_contract"`
	NodeUrl        string `json:"node_url"`
	StartHeight    uint64 `json:"start_height"`
	WalletPath     string `json:"wallet_path"`
} 

// no need to put the destination address in the config because each chains will create its own receiver and sender
// and calling the senders will be done by using the destination address in packet

type AppConfig struct {
	Chains []*ChainConfig `json:"chains"`
	DBPath string         `json:"db_path"`
}

func (c *ChainConfig) Wallet() (common.Wallet, error) {
	return nil, nil
}

// each chains will have their respective wallet loaders and they will return a common interface for signing a message
// getting public keys, getting public key hash etc.
