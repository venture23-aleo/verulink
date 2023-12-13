package relay

import "context"

type notification string

const (
	insufficientBalance notification = "insufficient balance"
)

func (r *relay) notifyDelegator(ctx context.Context) {

}
