import { charLength } from "./helpers";
import { EOS, UEOS } from "./constants";
import Parser from "./Parser";
import ParsingError from "./ParsingError";
import StringPStream, { encoder } from "./StringPStream";

/** Takes a character and returns a parser that matches that character **exactly once**. */
export const char = (c: string) => {
  if (!c || charLength(c) !== 1)
    throw new TypeError(`[char] must be called with a single character, got '${c}'`);
  
  return new Parser(s => {
    if (!(s.target instanceof StringPStream))
      throw new TypeError(`[char] expected a StringPStream instance as target, got '${typeof s.target}'`);
    if (s.error) return s;
    const { index, target } = s;
    const targetLength = target.length;
    if (index < targetLength) {
      const charWidth = target.getCharWidth(index);
      if (index + charWidth <= targetLength) {
        const char = target.peekChar();
        return char === c
          ? s.resultify(target.nextChar())
          : s.errorify(new ParsingError({
              from: "char",
              index,
              expected: `character '${c}'`,
              actual: `character '${char}'`
            }));
      }
    }
    return s.errorify(new ParsingError({
      from: "char",
      index,
      expected: `character '${c}'`,
      actual: EOS
    }));
  }) as Parser<StringPStream, null, string>;
}

/** Matches **exactly one** utf8 character. */
export const anyChar = new Parser(s => {
  if (!(s.target instanceof StringPStream))
    throw new TypeError(`anyChar expects a StringPStream instance as target, got ${typeof s.target}`);
  if (s.error) return s;
  const { index, target } = s;
  const targetLength = target.length;
  if (index < targetLength) {
    const charWidth = target.getCharWidth(index)
    if (index + charWidth <= targetLength)
      return s.resultify(target.nextChar());
  }
  return s.errorify(new ParsingError({
    from: "anyChar",
    index,
    expected: "any character",
    actual: EOS
  }));
}) as Parser<StringPStream, null, string>;

/** Matches **exactly one** stream element without consuming any input. */
export const peek = new Parser(s => {
  if (s.error) return s;
  const { index, target } = s;
  const length = target.length;
  return index < length
    ? s.resultify(target.elementAt(index))
    : s.errorify(new ParsingError({
        from: "peek",
        index,
        message: UEOS,
      }));
});

/** Takes a string and returns a parser that matches that string **exactly once**. */
export const str = (cs: string) => {
  if (!(cs && typeof cs === "string"))
    throw new TypeError(`[str] must be called with a string with strict positive length, got ${cs}`);
  const es = encoder.encode(cs);
  return new Parser(s => {
    if (s.error) return s;
    const { index, target } = s;
    const remainingBytes = target.length - index;
    if (remainingBytes < es.byteLength)
      return s.errorify(new ParsingError({
        from: "str",
        index,
        expected: `"${cs}"`,
        actual: EOS
      }));
    const sai = target.getString(index, es.byteLength);
    return cs === sai
      ? s.resultify(target.nextChars(es.byteLength))
      : s.errorify(new ParsingError({
          from: "str",
          index,
          expected: `"${cs}"`,
          actual: `"${sai}..."`
        }));
  }) as Parser<StringPStream, null, string>;
};

/**
 * Takes a regex and returns a parser that matches it **exactly once**.
 * 
 * Note: it has to begin with a caret `^`
 */
export const regex = (re: RegExp) => {
  if (!(re instanceof RegExp))
    throw new TypeError("[regex] must be called with a RegExp");
  if (re.source[0] !== "^")
    throw new Error("[regex] must be called with a RegExp starting with '^'");
  return new Parser(s => {
    if (s.error) return s;
    const { target, index } = s;
    const remaining = target.getString(index, target.length - index);
    if (remaining.length < 1)
      return s.errorify(new ParsingError({
        from: "regex",
        index,
        expected: `string matching '${re}'`,
        actual: EOS
      }))
    const match = remaining.match(re);
    if (match) {
      const m = match[0];
      return s.update(m, index + m.length);
    } else
      return s.errorify(new ParsingError({
        from: "regex",
        index,
        expected: `string matching '${re}'`,
        actual: `'${remaining.slice(0, 5)}...'`
      }));
  }) as Parser<StringPStream, null, string>;
}