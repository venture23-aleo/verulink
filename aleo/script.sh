source .env

snarkos developer execute credits.aleo transfer_public_to_private aleo1s567xd2j2ale8t008gf8cx82pn0784l2c22c7uemxtqcuf973cyqc6cz6t 100_000_000u64 \
--private-key "${ALEO_TESTNET3_PRIVATE_KEY}" \
--query "https://api.explorer.aleo.org/v1" \
--broadcast "https://api.explorer.aleo.org/v1/testnet3/transaction/broadcast" \
--priority-fee 10000