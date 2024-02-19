package rpc

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