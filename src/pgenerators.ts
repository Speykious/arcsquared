import { charLength, reDigit, reDigits, reLetter, reLetters, reWhitespaces } from "./helpers";
import { EOS, UEOS } from "./constants";
import Parser from "./Parser";
import ParsingError from "./ParsingError";
import StringPStream, { encoder } from "./StringPStream";
import { between } from "./pcombinators";

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
};

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
    console.log("string got:", sai);
    return cs === sai
      ? s.resultify(target.nextString(es.byteLength))
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

/** Matches **exactly one** digit from the input.  */
export const digit = regex(reDigit).errorMap(error =>
  new ParsingError({
    ...error.props,
    from: "digit",
    expected: "a digit"
  }));

/** Matches **one or more** digit from the input. */
export const digits = regex(reDigits).errorMap(error =>
  new ParsingError({
    ...error.props,
    from: "digits",
    expected: "digits"
  }));

/** Matches **exactly one** letter from the input. */
export const letter = regex(reLetter).errorMap(error =>
  new ParsingError({
    ...error.props,
    from: "letter",
    expected: "a letter"
  }));

/** Matches **one or more** letters from the input. */
export const letters = regex(reLetters).errorMap(error =>
  new ParsingError({
    ...error.props,
    from: "letters",
    expected: "letters"
  }));

/** Takes a string as parameter and matches **one of its characters** from the input. */
export const anyOfString = (cs: string) => {
  if (!(typeof cs == "string"))
    throw new TypeError(`[anyOfString] must be called with a string, got '${cs}'`);
  
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
        return cs.includes(char)
          ? s.resultify(target.nextChar())
          : s.errorify(new ParsingError({
              from: "char",
              index,
              expected: `character in "${cs}"`,
              actual: `'${char}'`
            }));
      }
    }
    return s.errorify(new ParsingError({
      from: "char",
      index,
      expected: `character in "${cs}"`,
      actual: EOS
    }));
  }) as Parser<StringPStream, null, string>;
};

/** Is only a success if it has reached the end of stream. */
export const endOfStream = new Parser(s => {
  if (s.error) return s;
  const { target, index } = s;
  return index == target.length
    ? s.resultify(null)
    : s.errorify(new ParsingError({
      index,
      expected: EOS,
      actual: `'${target.elementAt(index)}'`
    }));
});

/** Matches **one or more** of any kind of whitespace (like `\s` from regexs). */
export const whitespace = regex(reWhitespaces).errorMap(error =>
  new ParsingError({
    ...error.props,
    from: "whitespace",
    expected: "whitespace"
  }));

/**
 * Takes a left and right bracket character and matches a sequence of characters in-between those brackets.
 * 
 * It will take care of matching escaped bracket characters with `\` and will unescape them before putting the final string in the result.
 */

export const bracketed = (bleft: string, bright: string) => {
  if (charLength(bleft) !== 1)
    throw new TypeError(`[bracketed] must be called with a single character, got '${bleft}'`);
  if (charLength(bright) !== 1)
    throw new TypeError(`[bracketed] must be called with a single character, got '${bright}'`);
  
  // Characters that have to be escaped.
  // There are probably more which will be revealed by future bugs I guess.
  if ("\\[](){}|+*.".includes(bleft)) bleft = "\\" + bleft;
  if ("\\[](){}|+*.".includes(bright)) bright = "\\" + bright;
  const innerParser = regex(new RegExp(`(\\\\\\\\|\\\\${bleft}|\\\\${bright}|[^${bleft}${bright}])+`))
    .map(s => s
      .replace("\\\\", "\\")
      .replace(`\\${bleft}`, bleft)
      .replace(`\\${bright}`, bright)
    );
  return between(char(bleft))(char(bright))(innerParser);
}

/**
 * Takes a quote character and matches a sequence of characters in-between those quotes.
 * 
 * It will take care of matching escaped quote characters with `\` and will unescape them before putting the final string in the result.
 */
export const quoted = (q: string) => {
  if (charLength(q) !== 1)
    throw new TypeError(`[quoted] must be called with a single character, got '${q}'`);
  return bracketed(q, q);
};