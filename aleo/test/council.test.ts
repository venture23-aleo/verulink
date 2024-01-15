import { CouncilContract } from "../artifacts/js/council";
import { aleoUser1, aleoUser2, aleoUser3, aleoUser4, aleoUser5 } from "./mockData";

const council = new CouncilContract();

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
