import { char, anyChar, strparse, EOS, peek } from "../src/index";


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
    
    it("works when succesful", () => {
      const state = strparse(peek)("a");
      console.log(state);
    })

  });
});
