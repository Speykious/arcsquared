import { expect, use as chaiUse } from "chai";
import matchObject from "./helpers/matchObject.model";
chaiUse(matchObject);

import { insp } from "../src/helpers";
import Parser, {
  char,
  getData,
  ParsingError,
  pipe,
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
      expect(state).to.matchObject({
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
      expect(state2).to.matchObject({
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
      expect(state3).to.matchObject({
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
      expect(state).to.matchObject({
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
      expect(state2).to.matchObject({
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
      expect(state).to.matchObject({
        target: {
          index: 5
        },
        data: "kowa",
        error: null,
        result: "Where"
      });
    });

    it("should still have the data when unsuccessful", () => {
      const state = strparse(parser)("You're going to have a bad time.");
      expect(state).to.matchObject({
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

  describe("pipe", () => {
    const parser = pipe<StringPStream, null, string[]>([str("bruh"), char(","), str("respectfully")]);
    it("should return the result of the last parser", () => {
      const state = strparse(parser)("bruh,respectfully");
      expect(state).to.matchObject({
        target: {
          index: "bruh,respectfully".length
        },
        data: null,
        error: null,
        result: "respectfully"
      });
    });

    it("should return the error of the failing parser", () => {
      const state = strparse(parser)("bruh,wat");
      expect(state).to.matchObject({
        target: {
          index: 5
        },
        data: null,
        error: {
          expected: '"respectfully"',
          actual: '"wat"'
        },
        result: null
      });
    });
  });
});
