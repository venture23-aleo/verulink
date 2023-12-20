package relay

import (
	"context"
	"time"
)

func (r *relay) pollBalance(ctx context.Context, curBal uint64) {
	if err := r.notifyDelegator(ctx, insufficientBalance); err != nil {
		r.logger.Error(err.Error())
	}

	ticker := time.NewTicker(time.Minute) // take from config
	defer ticker.Stop()
	for range ticker.C {
		select {
		case <-ctx.Done():
			return
		default:
		}
		balance, err := r.destChain.GetWalletBalance(ctx)
		if err != nil {
			r.logger.Error(err.Error())
			continue
		}

		if balance > curBal && balance > r.destChain.GetMinReqBalForMakingTxn() {
			break
		}
	}
}
