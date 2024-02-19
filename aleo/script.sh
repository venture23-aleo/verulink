source .env

# snarkos developer execute credits.aleo transfer_public_to_private aleo1s567xd2j2ale8t008gf8cx82pn0784l2c22c7uemxtqcuf973cyqc6cz6t 100_000_000u64 \
# --private-key "${ALEO_TESTNET3_PRIVATE_KEY}" \
# --query "https://api.explorer.aleo.org/v1" \
# --broadcast "https://api.explorer.aleo.org/v1/testnet3/transaction/broadcast" \
# --priority-fee 10000

snarkos developer execute wusdc_connector_v0003.aleo wusdc_send "[0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,0u8,243u8,159u8,214u8,229u8,26u8,173u8,136u8,246u8,244u8,206u8,106u8,184u8,130u8,114u8,121u8,207u8,255u8,185u8,34u8,102u8]" "101u128" \
--private-key "${ALEO_TESTNET3_PRIVATE_KEY}" \
--query "https://api.explorer.aleo.org/v1" \
--broadcast "https://api.explorer.aleo.org/v1/testnet3/transaction/broadcast" \
--priority-fee 10000