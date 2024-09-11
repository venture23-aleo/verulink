# STEPS TO RUN E2ETESTS

1. Build the `chainService`
cd ../chainService
go build

2. Build the `signingService`
cd ../signingService
go build

3. Build the `proxy` service
cd ../proxy 
go build

4. Create the `ahs` command for signing packets
cd ../signingService/rust
cargo install --path .

5. Run the `e2e test` with flags
