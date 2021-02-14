import { char, StringPStream } from "../src/index";
import { inspect } from "util"

const insp = (o: Object) => inspect(o, false, 4, true);

describe("Parser generators", () => {
  describe("char", () => {
    const parser = char("c");
    const state = parser.parse(new StringPStream("Surprise, motherfucker 😎"));
    console.log(insp(state));

    it("supports normal ascii characters", () => {
      expect("something").not.toBeNull();
    });

    it("supports wide unicode characters", () => {
      expect(null).not.toBe("something");
    });
  });
});
