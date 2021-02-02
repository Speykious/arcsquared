import ParsingError from "../src/ParsingError";

describe("ParsingError", () => {
  it("shows me something", () => {
    const perr = new ParsingError({
      index: 0,
      from: "someParserCombinator",
      expected: "1",
      actual: "42",
      colored: true
    });
    console.log(perr.toString());
    perr.colored = false;
    console.log(perr.toString());
    
    const perr2 = new ParsingError({
      index: 69,
      from: "someOtherParserCombinator",
      message: "Unexpected end of input",
      colored: true
    });
    console.log(perr2.toString());
    perr2.colored = false;
    console.log(perr2.toString());

    expect(perr.toString()).not.toBeNull();
  });
});
