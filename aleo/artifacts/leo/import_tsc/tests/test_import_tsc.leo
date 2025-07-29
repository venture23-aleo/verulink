// The 'test_import_tsc' test program.
import import_tsc.aleo;
program test_import_tsc.aleo {
    @test
    script test_it() {
        let result: u32 = import_tsc.aleo/main(1u32, 2u32);
        assert_eq(result, 3u32);
    }

    @test
    @should_fail
    transition do_nothing() {
        let result: u32 = import_tsc.aleo/main(2u32, 3u32);
        assert_eq(result, 3u32);
    }
}
