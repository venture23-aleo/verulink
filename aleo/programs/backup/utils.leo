// utils program has been created separately to test some logic that is used in the program
// since transitions do not update the state (has finalize) statements, there can be multiple tests that can run in parallel for this program

program utils.aleo {

    struct InPacketWithScreening {
        // Hash of the InPacket
        packet_hash: field,
        // Screening result of the packet sender/receiver
        // If the screening_passed is false, it means that the fund of the packet must go to the holding program
        screening_passed: bool
    }
    
    const ZERO_ADDRESS: address = aleo1qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq3ljyzc;
    const SUPPORTED_THRESHOLD: u8 = 5u8;

    transition get_majority_count(packet_hash: field, signers: [address; 5], signs: [signature; 5]) -> (bool, u8) {
        let unique_signers: u8 = get_valid_unique_address_count(signers);
        let yay_count: u8 = 0u8;
        let nay_count: u8 = 0u8;

        let packet_hash_with_yay: field = BHP256::hash_to_field(InPacketWithScreening {
            packet_hash,
            screening_passed: true
        });

        let packet_hash_with_nay: field = BHP256::hash_to_field(InPacketWithScreening {
            packet_hash,
            screening_passed: false
        });

        for i: u8 in 0u8..SUPPORTED_THRESHOLD {
            if (signers[i] != ZERO_ADDRESS) {
                let yay: bool = signature::verify(signs[i], signers[i], packet_hash_with_yay);
                let nay: bool = signature::verify(signs[i], signers[i], packet_hash_with_nay);
                assert(yay | nay);
                if (yay) { yay_count = yay_count + 1u8; }
                if (nay) { nay_count = nay_count + 1u8; }
            }
        }

        assert(yay_count != nay_count);

        assert_eq(unique_signers, yay_count + nay_count);

        if (yay_count > nay_count) {
            return (true, yay_count);
        } else {
            return (false, nay_count);
        }
    }
    
    // Validates that the addresses are unique except for ZERO_ADDRESS
    // Returns the count of the unique addresses
    function get_valid_unique_address_count(addresses: [address; 5]) -> u8 {
        let unique_addresses: u8 = 0u8;
        if (addresses[0u8] != ZERO_ADDRESS) {
            assert_neq(addresses[0u8], addresses[1u8]);
            assert_neq(addresses[0u8], addresses[2u8]);
            assert_neq(addresses[0u8], addresses[3u8]);
            assert_neq(addresses[0u8], addresses[4u8]);
            unique_addresses += 1u8;
        }

        if (addresses[1u8] != ZERO_ADDRESS) {
            assert_neq(addresses[1u8], addresses[2u8]);
            assert_neq(addresses[1u8], addresses[3u8]);
            assert_neq(addresses[1u8], addresses[4u8]);
            unique_addresses += 1u8;
        }

        if (addresses[2u8] != ZERO_ADDRESS) {
            assert_neq(addresses[2u8], addresses[3u8]);
            assert_neq(addresses[2u8], addresses[4u8]);
            unique_addresses += 1u8;
        }

        if (addresses[3u8] != ZERO_ADDRESS) {
            assert_neq(addresses[3u8], addresses[4u8]);
            unique_addresses += 1u8;
        }

        if (addresses[4u8] != ZERO_ADDRESS) {
            unique_addresses += 1u8;
        }
        return unique_addresses;
    }

    // Exactly the same logic as the transition but is the one that is used in the internal call
    // This is done to check this function separately
    transition get_valid_unique_address_countT(addresses: [address; 5]) -> u8 {
        let unique_addresses: u8 = 0u8;
        if (addresses[0u8] != ZERO_ADDRESS) {
            assert_neq(addresses[0u8], addresses[1u8]);
            assert_neq(addresses[0u8], addresses[2u8]);
            assert_neq(addresses[0u8], addresses[3u8]);
            assert_neq(addresses[0u8], addresses[4u8]);
            unique_addresses += 1u8;
        }

        if (addresses[1u8] != ZERO_ADDRESS) {
            assert_neq(addresses[1u8], addresses[2u8]);
            assert_neq(addresses[1u8], addresses[3u8]);
            assert_neq(addresses[1u8], addresses[4u8]);
            unique_addresses += 1u8;
        }

        if (addresses[2u8] != ZERO_ADDRESS) {
            assert_neq(addresses[2u8], addresses[3u8]);
            assert_neq(addresses[2u8], addresses[4u8]);
            unique_addresses += 1u8;
        }

        if (addresses[3u8] != ZERO_ADDRESS) {
            assert_neq(addresses[3u8], addresses[4u8]);
            unique_addresses += 1u8;
        }

        if (addresses[4u8] != ZERO_ADDRESS) {
            unique_addresses += 1u8;
        }
        return unique_addresses;
    }


}