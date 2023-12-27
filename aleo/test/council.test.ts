import { BridgeContract } from "../artifacts/js/bridge";
import { CouncilContract } from "../artifacts/js/council";
import { Token_serviceContract } from "../artifacts/js/token_service";
import { InPacketFull, TokenOrigin, wrapped_tokenLeo } from "../artifacts/js/types";
import { Wrapped_tokenContract } from "../artifacts/js/wrapped_token";

import { evm2AleoArr, string2AleoArr } from "./utils";

const council = new CouncilContract({ networkName: "testnet3", privateKey: "APrivateKey1zkp8CZNn3yeCseEtxuVPbDCwSyhGW6yZKUYKfgXmcpoGPWH" });

describe("Council", () => {

  test("Initialize", async () => {
    await council.initialize(
        "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
        "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
        "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
        "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
        "aleo1rhgdu77hgyqd3xjj8ucu3jj9r2krwz6mnzyd80gncr5fxcwlh5rsvzp9px",
        1
    );

  });

});
