import { insp } from "../src/helpers";
import {
  char,
  anyChar,
  strparse,
  EOS,
  peek,
  StringPStream,
  UEOS,
  str,
  digit,
  digits,
  letter,
  letters,
  anyOfString,
  endOfStream,
  whitespace,
  regex,
  bracketed,
  quoted
} from "../src/index";
import IntPStream from "./IntPStream.asset";
import TokenPStream from "./TokenPStream.asset";
insp("illusion");

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
        result: 97 // TODO
        // What was that TODO for?
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

  describe("str", () => {
    it("works when successful", () => {
      const parser = str("yes");
      const state = strparse(parser)("yesn't");
      expect(state).toMatchObject({
        target: {
          index: 3
        },
        error: null,
        result: "yes"
      });
    });

    it("works when unsuccessful", () => {
      const parser = str("yes");
      const state = strparse(parser)("haha yesn't");
      expect(state).toMatchObject({
        error: {
          from: "str",
          index: 0,
          expected: '"yes"',
          actual: '"hah..."'
        },
        result: null
      });
    });

    it("supports wide unicode characters", () => {
      const parser = str("❤_❤");
      const state = strparse(parser)("❤_❤ to yall");
      expect(state).toMatchObject({
        error: null,
        result: "❤_❤"
      });
      const state2 = strparse(parser)("お前は・・・もう死んでいる。");
      expect(state2).toMatchObject({
        error: {
          from: "str",
          index: 0,
          expected: '"❤_❤"',
          actual: '"お前�..."'
          // I don't know if that unknown character should stay like this, or
          // if I should take the entire character no matter the bytelength...
        },
        result: null
      });
    });

    it("works when end of stream", () => {
      const parser = str("nothing");
      const state = strparse(parser)("");
      expect(state).toMatchObject({
        error: {
          index: 0,
          expected: '"nothing"',
          actual: EOS
        },
        result: null
      });
    });

    it("throws when argument is invalid", () => {
      expect(() => str("")).toThrowError(
        new TypeError(
          "[str] must be called with a string with strict positive length, got "
        )
      );
    });
  });

  describe("regex", () => {
    const parser = regex(/^a+/);
    
    it("works when successful", () => {
      const state = strparse(parser)("aaaa...");
      expect(state).toMatchObject({
        target: {
          index: 4
        },
        error: null,
        result: "aaaa"
      });
    });

    it("works when unsuccessful", () => {
      const state = strparse(parser)("bbbb???");
      expect(state).toMatchObject({
        target: {
          index: 0
        },
        error: {
          from: "regex",
          expected: "string matching /^a+/",
          actual: '"bbbb?..."'
        }
      });
    });

    it("works when end of stream", () => {
      const state = strparse(parser)("");
      expect(state).toMatchObject({
        target: {
          index: 0
        },
        error: {
          from: "regex",
          expected: "string matching /^a+/",
          actual: EOS
        }
      })
    })
  });

  describe("digit", () => {
    it("works when successful", () => {
      const state = strparse(digit)("1a");
      expect(state).toMatchObject({
        target: {
          index: 1
        },
        error: null,
        result: "1"
      });
    });

    it("works when unsuccessful", () => {
      const state = strparse(digit)("abc");
      expect(state).toMatchObject({
        error: {
          from: "digit",
          index: 0,
          expected: "a digit",
          actual: '"abc..."'
        },
        result: null
      });
    });

    it("works when end of stream", () => {
      const state = strparse(digit)("");
      expect(state).toMatchObject({
        result: null,
        error: {
          from: "digit",
          index: 0,
          expected: "a digit",
          actual: EOS
        }
      });
    });
  });

  describe("digits", () => {
    it("works when successful", () => {
      const state = strparse(digits)("4444J");
      expect(state).toMatchObject({
        target: {
          index: 4
        },
        error: null,
        result: "4444"
      });
    });

    it("works when unsuccessful", () => {
      const state = strparse(digits)("a1bc");
      expect(state).toMatchObject({
        error: {
          from: "digits",
          index: 0,
          expected: "digits",
          actual: '"a1bc..."'
        },
        result: null
      });
    });

    it("works when end of stream", () => {
      const state = strparse(digits)("");
      expect(state).toMatchObject({
        result: null,
        error: {
          from: "digits",
          index: 0,
          expected: "digits",
          actual: EOS
        }
      });
    });
  });

  describe("letter", () => {
    it("works when successful", () => {
      const state = strparse(letter)("abcd");
      expect(state).toMatchObject({
        target: {
          index: 1
        },
        error: null,
        result: "a"
      });
    });

    it("works when unsuccessful", () => {
      const state = strparse(letter)(" abc");
      expect(state).toMatchObject({
        error: {
          from: "letter",
          index: 0,
          expected: "a letter",
          actual: '" abc..."'
        },
        result: null
      });
    });

    it("works when end of stream", () => {
      const state = strparse(letter)("");
      expect(state).toMatchObject({
        result: null,
        error: {
          from: "letter",
          index: 0,
          expected: "a letter",
          actual: EOS
        }
      });
    });
  });

  describe("letters", () => {
    it("works when successful", () => {
      const state = strparse(letters)("Jhin4");
      expect(state).toMatchObject({
        target: {
          index: 4
        },
        error: null,
        result: "Jhin"
      });
    });

    it("works when unsuccessful", () => {
      const state = strparse(letters)("4Jhin");
      expect(state).toMatchObject({
        error: {
          from: "letters",
          index: 0,
          expected: "letters",
          actual: '"4Jhin..."'
        },
        result: null
      });
    });

    it("works when end of stream", () => {
      const state = strparse(letters)("");
      expect(state).toMatchObject({
        result: null,
        error: {
          from: "letters",
          index: 0,
          expected: "letters",
          actual: EOS
        }
      });
    });
  });

  describe("anyOfString", () => {
    it("works when successful", () => {
      const parser = anyOfString("abcdefg");
      const state = strparse(parser)("defg");
      expect(state).toMatchObject({
        target: {
          index: 1
        },
        error: null,
        result: "d"
      });
    });

    it("works when unsuccessful", () => {
      const parser = anyOfString("abcd");
      const state = strparse(parser)("Jabc");
      expect(state).toMatchObject({
        error: {
          index: 0,
          expected: 'character in "abcd"',
          actual: "'J'"
        },
        result: null
      });
    });

    it("works when end of stream", () => {
      const parser = anyOfString("abcd");
      const state = strparse(parser)("");
      expect(state).toMatchObject({
        result: null,
        error: {
          index: 0,
          expected: 'character in "abcd"',
          actual: EOS
        }
      });
    });
  });

  describe("endOfStream", () => {
    it("works when successful", () => {
      const stream = new StringPStream("");
      const state = endOfStream.parse(stream);
      expect(state).toMatchObject({
        error: null,
        result: null
      });
    });

    it("works when unsuccessful", () => {
      const stream = new StringPStream("yay");
      const state = endOfStream.parse(stream);
      expect(state).toMatchObject({
        error: {
          index: 0,
          expected: EOS,
          actual: 121 // Todo?
          // Decided to return the element itself
        },
        result: null
      });
    });
  });

  describe("whitespace", () => {
    it("works when successful", () => {
      const state = strparse(whitespace)(" \t\nS");
      expect(state).toMatchObject({
        target: {
          index: 3
        },
        error: null,
        result: " \t\n"
      });
    });

    it("works when unsuccessful", () => {
      const state = strparse(whitespace)("Jabc");
      expect(state).toMatchObject({
        error: {
          index: 0,
          expected: "whitespace",
          actual: '"Jabc..."'
        },
        result: null
      });
    });

    it("works when end of stream", () => {
      const state = strparse(whitespace)("");
      expect(state).toMatchObject({
        result: null,
        error: {
          index: 0,
          expected: "whitespace",
          actual: EOS
        }
      });
    });
  });

  describe("bracketed", () => {
    const parser = bracketed("<", ">");
    
    it("parses inner content", () => {
      const state = strparse(parser)("<something> like this");
      expect(state).toMatchObject({
        target: {
          index: 11
        },
        result: "something",
        error: null
      });
    });

    it("properly escapes brackets", () => {
      const state = strparse(parser)("<something \\<different\\>> I guess");
      expect(state).toMatchObject({
        target: {
          index: 25
        },
        result: "something <different>",
        error: null
      });
    });
    
    it("works with regex-sensible characters", () => {
      const state = strparse(parser)("<some[]thing>");
      expect(state).toMatchObject({
        target: {
          index: 13
        },
        result: "some[]thing",
        error: null
      });
    });

    it("fails when it doesn't start with the left bracket", () => {
      const state = strparse(parser)("nothing");
      expect(state).toMatchObject({
        target: {
          index: 0
        },
        result: null,
        error: {
          from: "char", // TODO: Maybe change the origin there?
          expected: "character '<'",
          actual: "character 'n'"
        }
      });
    });

    it("fails when it doesn't end with the right bracket", () => {
      const state = strparse(parser)("<PTSDs in unclosed angle bracket");
      expect(state).toMatchObject({
        target: {
          index: 32
        },
        result: null,
        error: {
          from: "char", // TODO: Maybbe change the origin there (again)?
          expected: "character '>'",
          actual: EOS
        }
      });
    });
  });

  describe("quoted", () => {
    const parser = quoted("'");
    
    it("parses inner content", () => {
      const state = strparse(parser)("'something' like this");
      expect(state).toMatchObject({
        target: {
          index: 11
        },
        result: "something",
        error: null
      });
    });

    it("properly escapes quotes", () => {
      const state = strparse(parser)("'something \\'different\\'' I guess");
      expect(state).toMatchObject({
        target: {
          index: 25
        },
        result: "something 'different'",
        error: null
      });
    });
    
    it("works with regex-sensible characters", () => {
      const state = strparse(parser)("'some[]thing'");
      expect(state).toMatchObject({
        target: {
          index: 13
        },
        result: "some[]thing",
        error: null
      });
    });

    it("fails when it doesn't start with the left quote", () => {
      const state = strparse(parser)("nothing");
      expect(state).toMatchObject({
        target: {
          index: 0
        },
        result: null,
        error: {
          from: "char", // TODO: Maybe change the origin there?
          expected: "character '''",
          actual: "character 'n'"
        }
      });
    });

    it("fails when it doesn't end with the right quote", () => {
      const state = strparse(parser)("'PTSDs in unclosed quote");
      expect(state).toMatchObject({
        target: {
          index: 24
        },
        result: null,
        error: {
          from: "char", // TODO: Maybbe change the origin there (again)?
          expected: "character '''",
          actual: EOS
        }
      });
    });
  });
});
