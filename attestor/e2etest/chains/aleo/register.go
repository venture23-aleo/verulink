package aleo

import testsuite "github.com/venture23-aleo/attestor/e2etest/testSuite"

func init() {
	testsuite.RegisteredChains["aleo"] = NewClient
}