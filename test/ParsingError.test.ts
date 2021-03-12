import { expect } from "chai";
import { UEOS, ParsingError } from "../src/index";
import { bold, green, red } from "ansi-colors-ts";

describe("ParsingError", () => {
  it("correctly displays expected-actual messages", () => {
    const perr = new ParsingError({
      index: 0,
      from: "someParserCombinator",
      expected: "1",
      actual: "42",
      colored: true
    });

    expect(perr.toString()).to.equal(
      `${red(
        `${bold("ParsingError")} 'someParserCombinator' (position 0): `
      )}Expected ${green("1")}, got ${red("42")}`
    );

    perr.colored = false;
    expect(perr.toString()).to.equal(
      `ParsingError 'someParserCombinator' (position 0): Expected 1, got 42`
    );
  });
  
  it("correctly displays single messages", () => {
    const perr2 = new ParsingError({
      index: 69,
      from: "someOtherParserCombinator",
      message: UEOS,
      colored: true
    });

    expect(perr2.toString()).to.equal(
      `${red(
        `${bold("ParsingError")} 'someOtherParserCombinator' (position 69): `
      )}${UEOS}`
    );

    perr2.colored = false;
    expect(perr2.toString()).to.equal(
      `ParsingError 'someOtherParserCombinator' (position 69): ${UEOS}`
    );
  });
});
