PRIVATE_KEY=APrivateKey1zkpJcSwp6yTqPcsDcsHeoZhhLcm9CTVdZMUVL1LdtNoNvaG
QUERY_API=https://api.explorer.aleo.org/v1
BROADCAST_ENDPOINT=https://api.explorer.aleo.org/v1/testnet3/transaction/broadcast
snarkos developer execute credits.aleo transfer_public_to_private aleo1zyt7ldc0t3ung0h5sg4k65wjtnmsa6hatagjccxr7s84h93tpuxqf9zse9 10000000u64 \
--private-key $PRIVATE_KEY \
--query $QUERY_API \
--broadcast $BROADCAST_ENDPOINT \
--priority-fee 10000

# PRIVATE_KEY=APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH
# QUERY_API=http://localhost:3030
# BROADCAST_ENDPOINT=http://localhost:3030/testnet3/transaction/broadcast
# snarkos developer execute credits.aleo transfer_public aleo1s567xd2j2ale8t008gf8cx82pn0784l2c22c7uemxtqcuf973cyqc6cz6t 1000000000u64 \
# --private-key $PRIVATE_KEY \
# --query $QUERY_API \
# --broadcast $BROADCAST_ENDPOINT \
# --priority-fee 10000
