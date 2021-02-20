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