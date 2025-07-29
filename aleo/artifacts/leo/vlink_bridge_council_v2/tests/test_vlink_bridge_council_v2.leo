// The 'test_vlink_bridge_council_v2' test program.
import vlink_bridge_council_v2.aleo;
program test_vlink_bridge_council_v2.aleo {
    @test
    script test_it() {
        let result: u32 = vlink_bridge_council_v2.aleo/main(1u32, 2u32);
        assert_eq(result, 3u32);
    }

    @test
    @should_fail
    transition do_nothing() {
        let result: u32 = vlink_bridge_council_v2.aleo/main(2u32, 3u32);
        assert_eq(result, 3u32);
    }
}
