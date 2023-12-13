package relay

import (
	"context"
	"time"
)

func (r *relay) pollBalance(ctx context.Context) {
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

		if balance > r.destChain.GetMinReqBalForMakingTxn() {
			break
		}
	}
}
