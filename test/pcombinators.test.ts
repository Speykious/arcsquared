import { insp } from "../src/helpers";
import Parser, {
  getData,
  ParsingError,
  setData,
  str,
  StringPStream,
  strparse,
  withData
} from "../src/index";
insp("illusion");

describe("Parser combinators", () => {
  describe("getData", () => {
    const state = getData.parse(new StringPStream("something"));
    it("should get empty data of successful state", () => {
      expect(state).toMatchObject({
        target: {
          index: 0
        },
        data: null,
        error: null,
        result: null
      });
    });

    // Gura.
    const state2 = getData.pf(state.dataify("a"));
    it("should get data of successful state", () => {
      expect(state2).toMatchObject({
        target: {
          index: 0
        },
        data: "a",
        error: null,
        result: "a"
      });
    });

    const state3 = getData.pf(
      state.dataify("a").errorify(
        new ParsingError({
          message: "dummy"
        })
      )
    );
    it("should not get data of failing state", () => {
      expect(state3).toMatchObject({
        target: {
          index: 0
        },
        data: "a",
        error: {
          message: "dummy"
        },
        result: null
      });
    });
  });

  describe("setData", () => {
    // I played Undertale recently. I named my character AAAA.
    const parser = setData("AAAA! Stay determined...");
    const state = parser.parse(new StringPStream("Determination."));
    it("should set data to a successful state", () => {
      expect(state).toMatchObject({
        target: {
          index: 0
        },
        data: "AAAA! Stay determined...",
        error: null,
        result: null
      });
    });

    const state2 = parser.pf(
      state.dataify(null).errorify(
        new ParsingError({
          message: "dummy"
        })
      )
    );
    it("should not set data to a failing state", () => {
      expect(state2).toMatchObject({
        target: {
          index: 0
        },
        data: null,
        error: {
          message: "dummy"
        },
        result: null
      });
    });
  });

  describe("withData", () => {
    const innerParser = str("Where") as unknown as Parser<StringPStream, string, string>;
    const parser = withData(innerParser)("kowa");
    
    it("should have the data when successful", () => {
      const state = strparse(parser)("Where are the knives.");
      expect(state).toMatchObject({
        target: {
          index: 4 // Wait it's not 5???
        },
        data: "kowa",
        error: null,
        result: "Where"
      });
    });

    it("should still have the data when unsuccessful", () => {
      const state = strparse(parser)("You're going to have a bad time.");
      expect(state).toMatchObject({
        target: {
          index: 0
        },
        data: "kowa",
        error: {
          expected: '"Where"',
          actual: '"You\'r..."'
        },
        result: null
      });
    });
  });
});
