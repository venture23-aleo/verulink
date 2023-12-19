package relay

import (
	"context"
	"time"
)

func (r *relay) pollBalance(ctx context.Context, curBal uint64) {
	if err := r.notifyDelegator(ctx, insufficientBalance); err != nil {
		// log error
	}

	ticker := time.NewTicker(time.Minute) // take from config
	defer ticker.Stop()
	for range ticker.C {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
		}
		balance, err := r.destChain.GetWalletBalance(ctx)
		if err != nil {
			// log error
			continue
		}

		if balance > curBal && balance > r.destChain.GetMinReqBalForMakingTxn() {
			break
		}
	}
}
