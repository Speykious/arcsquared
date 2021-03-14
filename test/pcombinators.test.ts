import { expect, use as chaiUse } from "chai";
import matchObject from "./helpers/matchObject.model";
chaiUse(matchObject);

import { insp } from "../src/helpers";
import Parser, {
  char,
  getData,
  ParsingError,
  pipe,
  compose,
  tap,
  decide,
  fail,
  succeedWith,
  either,
  parse,
  setData,
  str,
  StringPStream,
  strparse,
  withData,
  regex,
  letter,
  digit,
  tup,
} from "../src";
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

  describe("compose", () => {
    const parser = compose<StringPStream, null, string[]>([str("respectfully"), char(","), str("bruh")]);
    it("should return the result of the first parser", () => {
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

  describe("tap", () => {
    const outerRef: any = { state: null };
    const parser = pipe<StringPStream, null, string[]>([
      str("a."),
      tap(s => { outerRef.state = s; })
    ]);
    it("should set the state when the previous parser is successful", () => {
      const state = strparse(parser)("a.");
      expect(outerRef.state).to.equal(state);
    });

    it("should also set the state when the previous parser is unsuccessful", () => {
      const state = strparse(parser)("b?");
      expect(outerRef.state).to.equal(state);
    });
  });

  describe("parse", () => {
    const parser = str("thing");
    it("should be equivalent to the Parser.prototype.parse function", () => {
      const input = new StringPStream("thing here");
      expect(parser.parse(input.clone())).to.deep.equal(parse(parser)(input));
    });
  });

  describe("strparse", () => {
    const parser = str("thonk");
    it("should be equivalent to parsing a StringPStream", () => {
      const input = "thonking of something interesting";
      expect(strparse(parser)(input)).to.deep.equal(parser.parse(new StringPStream(input)));
    });
  });

  describe("decide", () => {
    const parser = pipe<StringPStream, null, [string, string | number]>([
      regex(/^(letter|digit):/),
      decide<StringPStream, null, string, string | number>(
        r => r === "letter:" ? letter : digit.map(Number)
      )
    ]);
    it("should choose the right parser (1/2)", () => {
      const state = strparse(parser)("letter:a");
      expect(state).to.matchObject({
        target: {
          index: "letter:a".length
        },
        data: null,
        error: null,
        result: "a"
      });
    });

    it("should choose the right parser (2/2)", () => {
      const state = strparse(parser)("digit:3");
      expect(state).to.matchObject({
        target: {
          index: "digit:3".length
        },
        data: null,
        error: null,
        result: 3
      });
    });

    it("shouldn't do anything if the previous state is unsuccessful", () => {
      const state = strparse(parser)("wtf:isthis");
      expect(state).to.matchObject({
        target: {
          index: 0
        },
        data: null,
        error: {
          actual: '"wtf:i..."',
          expected: "string matching /^(letter|digit):/"
        },
        result: null
      });
    });
  });

  describe("fail", () => {
    const parser = fail(new ParsingError({ message: "duh" }));
    it("should just fail, duh", () => {
      const state = parser.parse(new StringPStream("bruh"));
      expect(state).to.matchObject({
        target: {
          index: 0
        },
        data: null,
        error: {
          actual: null,
          expected: null,
          message: "duh"
        },
        result: null
      });
    });
  });

  describe("succeedWith", () => {
    const parser = succeedWith([1, 2, 3]);
    it("should just work", () => {
      const state = parser.parse(new StringPStream("it just werks"));
      expect(state).to.matchObject({
        target: {
          index: 0
        },
        data: null,
        error: null,
        result: [1, 2, 3]
      });
    });
  });

  describe("either", () => {
    const parser = either(str("oui"));
    it("should success", () => {
      const state = strparse(parser)("oui madame");
      expect(state).to.matchObject({
        target: {
          index: 3
        },
        data: null,
        error: null,
        result: "oui"
      });
    });

    it("should failn't", () => {
      const state = strparse(parser)("non monsieur");
      expect(state).to.matchObject({
        target: {
          index: 0
        },
        data: null,
        error: null,
        result: {
          expected: '"oui"',
          actual: '"non..."'
        }
      });
    });
  });
});
