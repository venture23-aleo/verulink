package ethereum

import testsuite "github.com/venture23-aleo/attestor/e2etest/testSuite"


func init() {
	testsuite.RegisteredChains["ethereum"] = NewClient
}