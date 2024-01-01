package rpc

type Block struct {
	BlockHash    string `json:"block_hash"`
	PreviousHash string `json:"previous_hash"`
	Header       Header `json:"header"`
	Authority         Authority       `json:"authority"`
	Transactions      []Transactions  `json:"transactions"`
	Ratifications     []Ratifications `json:"ratifications"`
}

type Header struct {
	PreviousStateRoot string          `json:"previous_state_root"`
	TransactionsRoot  string          `json:"transactions_root"`
	FinalizeRoot      string          `json:"finalize_root"`
	RatificationsRoot string          `json:"ratificatins_root"`
	SolutionsRoot     string          `json:"solutions_root"`
	SubdagRoot        string          `json:"subdag_root"`
	Metadata          Metadata        `json:"metadata"`
}

type Authority struct {
}

type Metadata struct {
	Network               int64 `json:"network"`
	Round                 int64 `json:"round"`
	Height                int64 `json:"height"`
	CumulativeWeight      int64 `json:"cumulative_weight"`
	CumulativeProofTarget int64 `json:"cumulative_proof_target"`
	CoinbaseTarget        int64 `json:"coinbase_target"`
	ProofTarget           int64 `json:"proof_target"`
	LastCoinbaseTarget    int64 `json:"last_coinbase_target"`
	LastCoinbaseTimestamp int64 `json:"last_coinbase_timestamp"`
	TimeStamp             int64 `json:"timestamp"`
}

type Transactions struct {
	Status      string      `json:"accepted"`
	Type        string      `json:"type"`
	Index       int32       `json:"index"`
	Transaction Transaction `json:"transaction"`
	Finalize    []Finalize  `json:"finalize"`
}

type Transaction struct {
	Type       string        `json:"type"`
	Id         string        `json:"id"`
	Execution_ Execution     `json:"execution"`
	Fee        FeeTransition `json:"fee"`
}

type Execution struct {
	Transitions     []Transitions `json:"transitions"`
	GlobalStateRoot string        `json:"global_state_root"`
	Proof           string        `json:"proof"`
}

type FeeTransition struct {
	Transtion       Transitions `json:"transition"`
	GlobalStateRoot string      `json:"global_state_root"`
	Proof           string      `json:"proof"`
}

type Transitions struct {
	Id       string    `json:"id"`
	Program  string    `json:"program"`
	Function string    `json:"function"`
	Inputs   []Inputs  `json:"inputs"`
	Outputs  []Outputs `json:"outputs"`
	Tpk      string    `json:"tpk"`
	Tcm      string    `json:"tcm"`
}

type Inputs struct {
	Type  string `json:"type"`
	Id    string `json:"id"`
	Value string `json:"value"`
}

type Outputs struct {
	Type  string `json:"type"`
	Id    string `json:"id"`
	Value string `json:"value"`
}

type Finalize struct {
	Type      string `json:"type"`
	MappingID string `json:"mapping_id"`
	Index     int64  `json:"index"`
	KeyId     string `json:"key_id"`
	ValueID   string `json:"value_id"`
}

type Ratifications struct {
	Type   string `json:"type"`
	Amount int64  `json:"amount"`
}