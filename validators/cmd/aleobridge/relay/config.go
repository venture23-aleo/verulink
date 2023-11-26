package relay

type ChainConfig struct {
	Name           string   `json:"name"`
	ChainID        uint32   `json:"chain_id"`
	BridgeContract string   `json:"bridge_contract"`
	NodeUrl        string   `json:"node_url"`
	StartHeight    uint64   `json:"start_height"`
	FinalityHeight uint8    `json:"finality_height"`
	WalletPath     string   `json:"wallet_path"`
	DestChains     []string `json:"dest_chains"`
}

type Config struct {
	// ChainConfigs is set of configs of chains each required to communicate with its respective bridge contract
	ChainConfigs []*ChainConfig
	// BridgePair is pairing between bridge contracts to communicate packets back and forth
	BridgePairs map[string]string

	/*
		other fields if required
	*/
}
