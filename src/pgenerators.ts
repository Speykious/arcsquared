import { charLength, insp } from "./helpers";
import { EOF } from "./constants";
import Parser from "./Parser";
import ParsingError from "./ParsingError";
import StringPStream from "./StringPStream";

/** Takes a character and returns a parser that matches that character **exactly once**. */
export const char = (c: string): Parser<StringPStream, null, number> => {
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
              index,
              expected: `character ${insp(c)}`,
              actual: `character ${insp(char)}`
            }));
      }
    }
    return s.errorify(new ParsingError({
      index,
      expected: `character ${insp(c)}`,
      actual: EOF
    }));
  }) as Parser<StringPStream, null, number>;
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
    index,
    expected: "any character",
    actual: EOF
  }));
}) as Parser<StringPStream, null, number>;