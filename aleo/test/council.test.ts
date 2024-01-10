import { CouncilContract } from "../artifacts/js/council";
import { councilMember } from "./mockData";

const council = new CouncilContract();

describe("Council", () => {

  test("Initialize", async () => {
    const threshold = 1;
    await council.initialize(
      councilMember,
      councilMember,
      councilMember,
      councilMember,
      councilMember,
      threshold
    );

  });

});
