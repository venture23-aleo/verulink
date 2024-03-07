package testsuite

import (
	"testing"
)

type E2ETest struct {
	T *testing.T
}

func NewE2ETest() *E2ETest {
	return &E2ETest{
		T: new(testing.T),
	}
}

func (e *E2ETest) ExecuteETHFlow() {
	// transfer some usdc
	// wait for an appropriate amount of time to wait for the relayer to pick the message and put it in dbservice
	// query db service if the packet has arrived

}
