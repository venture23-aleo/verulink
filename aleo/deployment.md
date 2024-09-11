# Programs deployment

## Order of programs deployment
1. Deploy MTSP program (for local devnet setup)
2. Deploy Holding program
3. Deploy Bridge program
4. Deploy TokenService program
5. Deploy three council programs and initialize bridge, tokenservice and holding program with their respective owners.
6. Deploy WUSDC (register_token function call in MTSP) or other tokens.


## Deploy programs and setup the programs from scripts
1. Create an .env file by copying key value pairs from .env.example file. Replace the first key with the deployers private key
2. Change the files constants.ts and testnet.data.ts accordingly.
    - For the file constants.ts, it requires you to update the usdcContractAddr obtained from the ethereum side. 
    - For the file testnet.data.ts, it requires you to update the initialAttestors and threshold you want to assign while initializing the programs. You can change these later from council.
3. Run the file ./scripts/setup.ts. `npx tsx ./scripts/setup.ts` This file first deploys various programs, initializes the state of those programs, gives the minter and burner role of the tokens to the token_service, adds the chain to the bridge, adds the token_service to the bridge, adds the token to the token_service and finally unpauses bridge and the token.