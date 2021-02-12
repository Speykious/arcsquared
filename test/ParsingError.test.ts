import { EOF } from "../src/helpers";
import ParsingError from "../src/ParsingError";
import { bold, green, red } from "ansi-colors-ts";

describe("ParsingError", () => {
  it("correctly uses colors", () => {
    const perr = new ParsingError({
      index: 0,
      from: "someParserCombinator",
      expected: "1",
      actual: "42",
      colored: true
    });
    
    expect(perr.toString())
    .toBe(`${red(
      `${bold("ParsingError")} 'someParserCombinator' (position 0): `
    )}Expected ${green("1")}, got ${red("42")}`);
    
    perr.colored = false;
    expect(perr.toString())
    .toBe(`ParsingError 'someParserCombinator' (position 0): Expected 1, got 42`);
    
    const perr2 = new ParsingError({
      index: 69,
      from: "someOtherParserCombinator",
      message: `Unexpected ${EOF}`,
      colored: true
    });
    
    expect(perr2.toString())
    .toBe(`${red(
      `${bold("ParsingError")} 'someOtherParserCombinator' (position 69): `
    )}Unexpected ${EOF}`);
    
    perr2.colored = false;
    expect(perr2.toString())
    .toBe(`ParsingError 'someOtherParserCombinator' (position 69): Unexpected ${EOF}`);
  });
});
