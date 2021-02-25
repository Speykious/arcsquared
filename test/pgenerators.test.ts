import {
  char,
  anyChar,
  strparse,
  EOS,
  peek,
  StringPStream,
  UEOS
  //
} from "../src/index";
import IntPStream from "./IntPStream.asset";

import TokenPStream from "./TokenPStream.asset";

describe("Parser generators", () => {
  describe("char", () => {
    it("works when successful", () => {
      const parser = char("a");
      const state = strparse(parser)("abcd");
      expect(state).toMatchObject({
        error: null,
        result: "a"
      });
    });

    it("works when unsuccessful", () => {
      const parser = char("a");
      const state = strparse(parser)("bad");
      expect(state).toMatchObject({
        error: {
          index: 0,
          expected: "character 'a'",
          actual: "character 'b'"
        },
        result: null
      });
    });

    it("supports wide unicode characters", () => {
      const parser = char("❤");
      const state = strparse(parser)("❤ to yall");
      expect(state).toMatchObject({
        error: null,
        result: "❤"
      });
      const state2 = strparse(parser)("お前は・・・もう死んでいる。");
      expect(state2).toMatchObject({
        error: {
          index: 0,
          expected: "character '❤'",
          actual: "character 'お'"
        },
        result: null
      });
    });

    it("works when end of stream", () => {
      const parser = char("a");
      const state = strparse(parser)("");
      expect(state).toMatchObject({
        error: {
          index: 0,
          expected: "character 'a'",
          actual: EOS
        },
        result: null
      });
    });

    it("throws when argument is invalid", () => {
      expect(() => char("ab")).toThrowError(
        new TypeError("[char] must be called with a single character, got 'ab'")
      );
      expect(() => char("")).toThrowError(
        new TypeError("[char] must be called with a single character, got ''")
      );
    });
  });

  describe("anyChar", () => {
    it("works when successful", () => {
      const state = strparse(anyChar)("abcd");
      expect(state).toMatchObject({
        error: null,
        result: "a"
      });
    });

    it("supports wide unicode characters", () => {
      const state = strparse(anyChar)("❤ to yall");
      expect(state).toMatchObject({
        error: null,
        result: "❤"
      });
    });

    it("works when end of stream", () => {
      const state = strparse(anyChar)("");
      expect(state).toMatchObject({
        error: {
          index: 0,
          expected: "any character",
          actual: EOS
        },
        result: null
      });
    });
  });

  describe("peek", () => {
    it("works with StringPStream", () => {
      const stream = new StringPStream("abc");
      const state = peek.parse(stream);
      expect(state).toMatchObject({
        target: {
          index: 0
        },
        error: null,
        result: 97
      });
    });

    it("works with TokenPStream", () => {
      const stream = new TokenPStream([
        { type: "hours", value: "10" },
        { type: "minutes", value: "25" }
      ]);
      const state = peek.parse(stream);
      expect(state).toMatchObject({
        target: {
          index: 0
        },
        error: null,
        result: { type: "hours", value: "10" }
      });
    });

    it("works with IntPStream", () => {
      const stream = new IntPStream([42, 69]);
      const state = peek.parse(stream);
      expect(state).toMatchObject({
        target: {
          index: 0
        },
        error: null,
        result: 42
      });
    });
    
    it("works when end of stream", () => {
      const stream = new StringPStream("");
      const state = peek.parse(stream);
      expect(state).toMatchObject({
        target: {
          index: 0
        },
        error: {
          index: 0,
          message: UEOS
        }
      });
    });
  });
});
//
/*arserState {
      target: StringPStream {
        index: 0,
        dataView: DataView { byteLength: 1, byteOffset: 0, buffer: [ArrayBuffer] },
        length: 1
      },
      data: null,
      error: null,
      result: 97
    }
  */
