import { Council_v0001Contract } from "../artifacts/js/council_v0001";
import { aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5 } from "./mockData";

const council = new Council_v0001Contract();

describe("Council", () => {

  test("Initialize", async () => {
    const threshold = 1;
    await council.initialize(
      [
        aleoUser1,
        aleoUser2,
        aleoUser3,
        aleoUser4,
        aleoUser5
      ],
      threshold
    );

  });

});
