module github.com/venture23-aleo/aleo-bridge/attestor/signingService

go 1.21.3

require (
	github.com/ethereum/go-ethereum v1.13.15
	github.com/stretchr/testify v1.8.4
	// As long as aleo-bridge repo is private, one needs to set
	// `GOPRIVATE=github.com/venture23-aleo/aleo-bridge` before running `go mod tidy`
	// and have proper access to the private repo.
	// For example, we can provide access to some ssh key in github account and in the
	// machine user shall replace https://github.com with git@github.com in .gitconfig file
	// as follow:
	// [user]
	//    name = Laxmi Prasad Oli
	//    email = olilaxmiprasad@gmail.com
	//    signingkey = ~/.ssh/id_rsa.pub
	//[gpg]
	//    format = ssh
	//
	//[url "ssh://git@github.com/"]
	//    insteadOf = https://github.com/
	github.com/venture23-aleo/aleo-bridge/attestor/chainService v0.0.0-20240207073220-5bfebbf68114
	gopkg.in/yaml.v3 v3.0.1
)

require golang.org/x/crypto v0.17.0 // indirect

require (
	github.com/beorn7/perks v1.0.1 // indirect
	github.com/btcsuite/btcd/btcec/v2 v2.2.0 // indirect
	github.com/cespare/xxhash/v2 v2.2.0 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/decred/dcrd/dcrec/secp256k1/v4 v4.0.1 // indirect
	github.com/holiman/uint256 v1.2.4 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	github.com/prometheus/client_golang v1.19.0 // indirect
	github.com/prometheus/client_model v0.5.0 // indirect
	github.com/prometheus/common v0.48.0 // indirect
	github.com/prometheus/procfs v0.12.0 // indirect
	go.uber.org/multierr v1.10.0 // indirect
	go.uber.org/zap v1.26.0 // indirect
	golang.org/x/sys v0.17.0 // indirect
	google.golang.org/protobuf v1.32.0 // indirect
	gopkg.in/natefinch/lumberjack.v2 v2.0.0 // indirect
)

replace github.com/venture23-aleo/aleo-bridge/attestor/chainService => ../chainService
