import PStream from "./PStream";
import StringPStream from "./StringPStream";
import { TypedArray } from "./helpers";
import Parser, { PairedParsers, PairedResults, ParserMonad, ParserTuple } from "./Parser";
import ParserState, { ErrorState } from "./ParserState";
import ParsingError from "./ParsingError";

/**
 * A parser that will always return what is contained in the *internal state data*, without consuming any input.
 *
 * If dealing with any complex level of state ─ such as an object where individual keys will be updated or required ─ then it can be useful to create utility parsers to assist.
 */
export const getData = new Parser(s =>
  s.error ? s : s.resultify(s.data)
);

/**
 * Takes anything that should be set as the *internal state data*, and returns a parser that will perform that side effect when the parser is run. This does not consume any input. If parsing is currently in an errored state, then the data **will not** be set.
 * 
 * If dealing with any complex level of state - such as an object where individual keys will be updated or required, then it can be useful to create utility parsers to assist with updating the *internal state data*.
 */
export const setData = <T extends PStream<any>, D, R>(d: D) =>
  new Parser(s =>
    s.error ? s : s.dataify(d)
  ) as Parser<T, D, R>;

/** Takes a *provided parser*, and returns a function waiting for some *state data* to be set, and then returns a new parser. That parser, when run, ensures that the *state data* is set as the *internal state data* before the *provided parser* runs. */
export const withData = <T extends PStream<any>, D, R>(parser: Parser<T, D, R>) => (d: D) =>
  setData<T, D, R>(d).chain(() => parser);

/** Takes an array of parsers and composes them left to right, so each parser's return value is passed into the next one in the chain. The result is a new parser that, when run, yields the result of the final parser in the chain. */
export const pipe = <T extends PStream<any>, D, R extends any[]>(parsers: ParserTuple<T, D, R>) =>
  new Parser(s => {
    for (const parser of parsers) {
      if (s.error) return s;
      s = parser.pf(s as ParserState<T, unknown, unknown>);
    }
    return s;
  }) as Parser<T, D, R[typeof parsers.length]>;

/** Takes an array of parsers and composes them right to left, so each parsers return value is passed into the next one in the chain. The result is a new parser that, when run, yields the result of the final parser in the chain. */
export const compose = <T extends PStream<any>, D, R extends any[]>(parsers: ParserTuple<T, D, R>) =>
  pipe([...parsers].reverse() as ParserTuple<T, D, R>) as Parser<T, D, R[0]>;

/** Takes an array of parsers, and pipes the **result** of the previous one as the **target** of the next one. As a consequence, every parser except the last one has to have a return type extending the `PStream` class. */
export const pipeResult = <K extends PStream<any>, T extends K[], D, R>(
  parsers: ParserTuple<T[number], D, (T[number] | R)[]>
) =>
  new Parser(s => {
    if (s.error) return s;
    for (const parser of parsers) {
      if (s.error) break;
      s = parser.parse(s.result as T[number]);
    }
    return s;
  }) as Parser<T[0], D, R>;

/** Takes a function and returns a parser that does nothing and consumes no input, but runs the provided function on the last parsed value. This is intended as a debugging tool to see the state of parsing at any point in a sequential operation like `sequence` or `pipe`. */
export const tap = <T extends PStream<any>, D, R>(f: (state: ParserState<T, D, R>) => void) =>
  new Parser(s => {
    f(s as ParserState<T, D, R>);
    return s;
  }) as Parser<T, D, R>;

/**
 * Functional wrapper around the `.parse()` method of `Parser`.
 * 
 * Takes a parser, and returns a function that takes some `PStream` input to parse it using that parser.
 * @returns the parser state resulting from that parsing.
 */
export const parse = <T extends PStream<any>, D, R>(parser: Parser<T, D, R>) => (input: T) =>
  parser.parse(input);

/**
 * Does the same thing as the `parse` functional wrapper, but more specifically for `StringPStream` by taking a string, dataview, array buffer, or typed array as an input.
 * 
 * In fact, it would have been quite annoying, having to write
 * ```ts
 * myParser.parse(new StringPStream("some random string here"))
 * ```
 * everytime for simple things like that.
 */
export const strparse = <D, R>(parser: Parser<StringPStream, D, R>) =>
  (input: string | DataView | ArrayBuffer | TypedArray) =>
  parser.parse(new StringPStream(input));

/** Takes a function that receives the last matched value and returns a new parser. It's important that the function **always** returns a parser. If a valid one cannot be selected, you can always use `fail`. */
export const decide = <T extends PStream<any>, D, R, S>(f: (result: R) => Parser<T, D, S>) =>
  new Parser(s =>
    s.error ? s : f(s.result as R).pf(s)
  ) as Parser<T, D, S>;

/** Takes a parsing error and returns a parser that always fails with the provided parsing error. */
export const fail = <T extends PStream<any>, D, R>(error: ParsingError) =>
  new Parser(s =>
    s.error ? s : s.errorify(error)
  ) as Parser<T, D, R>;

/**
 * Takes a value and returns a parser that always matches that value without consuming any input.
 * 
 * Essentially, the same thing as `Parser.of`, as you can observe if you go to the definition.
 */
export const succeedWith = Parser.of;

/** Takes a parser and returns a version of that parser that will always succeed, but the captured value will either be a success or a failure. */
export const either = <T extends PStream<any>, D, R>(parser: Parser<T, D, R>) =>
  new Parser(s => {
    if (s.error) return s;
    const state = parser.pf(s);
    return state.resultify(state.result ?? state.error);
  }) as Parser<T, D, R>;

/**
 * Takes a generator function, in which parsers are `yield`ed. `coroutine` allows you to write parsers in a more imperative and sequential way ─ in much the same way `async/await` allows you to write code with promises in a more sequential way.
 * 
 * Inside of the generator function, you can use all regular Javascript and Typescript language features, like loops, variable assignments, and conditional statements. This makes it easy to write very powerful parsers using `coroutine`, but on the other side it can lead to less readable, more complex code.
 * 
 * Debugging is also much easier, as breakpoints can be easily added, and values logged to the console after they have been parsed.
 */
export const coroutine = <T extends PStream<any>, D, R>(g: () => ParserMonad<T, D, R>) =>
  new Parser(s => {
    if (s.error) return s;
    const generator = g();
    
    let nextValue = undefined;
    let nextState = s;
    while (true) {
      const result = generator.next(nextValue);
      const value = result.value;
      const done = result.done;
      
      if (done) return nextState.resultify(value);

      if (!(value && value instanceof Parser))
        throw new Error(`[coroutine] yielded values must be Parsers, got ${result.value}.`);

      nextState = value.pf(nextState);
      if (nextState.error) return nextState;

      nextValue = nextState.result;
    }
  }) as Parser<T, D, R>;

/**
 * Takes a positive number and returns a function. That function takes a parser and returns a new parser which matches the given parser **exactly** the specified number of times.
 * 
 * If that number is set to 0, then it will literally do nothing; however, the error will still be mapped.
 */
export const exactly = (n: number) => {
  if (n < 0)
    throw new TypeError(`[exactly] expected a positive number, got ${n}.`);
  return <T extends PStream<any>, D, R>(parser: Parser<T, D, R>) =>
    (new Parser(s => {
      if (s.error) return s;
      const results: R[] = [];
      let i = 0;
      for (; i < n; i++) {
        s = parser.pf(s);
        if (s.error) return s;
        results.push(s.result as R);
      }
      const data = s.data as D ?? {};
      return new ParserState({
        ...s.props,
        error: null,
        result: results,
        data: { ...data, exactlyTimes: i }
      });
    }) as Parser<T, D & { exactlyTimes: number }, R[]>)
    .errorMap(error =>
      new ParsingError({
        ...error.props,
        from: `exactly ${n}${error.from ? ` (${error.from})` : ""}`
      })
    );
};

/** Takes a parser and returns a new parser which matches it **zero or more** times. Because it will match zero or more values, this parser will always match, resulting in an empty array in the zero case. */
export const many = <T extends PStream<any>, D, R>(parser: Parser<T, D, R>) =>
  new Parser(s => {
    if (s.error) return s;
    const results: R[] = [];
    while (true) {
      s = parser.pf(s);
      const { length, index } = s.target;
      if (s.error) break;
      results.push(s.result as R);
      if (length && index >= length) break;
    }
    const data = s.data as D ?? {};
      return new ParserState({
        ...s.props,
        error: null,
        result: results,
        data: { ...data, manyTimes: results.length }
      });
  }) as Parser<T, D & { manyTimes: number }, R[]>;

/**
 * Very similarly to the `many` combinator, it first takes a number `n` and returns a function.
 * That function takes a parser and returns a new parser which matches it **`n` or more** times.
 */
export const atLeast = (n: number) => <T extends PStream<any>, D, R>(parser: Parser<T, D, R>) =>
  new Parser(s => {
    if (s.error) return s;
    const state = many(parser).pf(s);
    const times = state.data?.manyTimes ?? 0;
    return times >= n
      ? s
      : s.errorify(new ParsingError({
          from: `atLeast ${n}`,
          expected: `to match at least ${n} value${times === 1 ? "" : "s"}`,
          actual: `${times}`
        }));
  }) as Parser<T, D, R[]>;

/** Takes a parser and returns a new parser which matches it **one or more** times. */
export const atLeast1 = atLeast(1);

/** Takes a function and returns a parser does not consume input, but instead runs the provided function on the last matched value, and set that as the new last matched value. This function can be used to apply structure or transform the values as they are being parsed. */
export const mapTo = <T extends PStream<any>, D, R, S>(f: (result: R) => S) =>
  new Parser(s =>
    s.error ? s : s.resultify(f(s.result as R))
  ) as Parser<T, D, S>;

/** Like `mapTo` but it transforms the error value. */
export const errorMapTo = <T extends PStream<any>, D, R>(f: (error: ParsingError) => ParsingError) =>
  new Parser(s =>
    s.error ? s.errorify(f(s.error)) : s
  ) as Parser<T, D, R>;

/** Takes an array of parsers, and returns a new parser that matches each of them sequentially, collecting up the results into an array. */
export const sequence = <T extends PStream<any>, D, R extends any[]>(parsers: ParserTuple<T, D, R>) =>
  new Parser(s => {
    if (s.error) return s;
    const results = [];
    let nextState = s;

    for (const parser of parsers) {
      const out = parser.pf(nextState);
      if (out.error) return out;
      nextState = out;
      results.push(out.result);
    }

    return nextState.resultify(results);
  }) as Parser<T, D, R>;

/**
 * Takes an array of string/parser pairs, and returns a new parser that matches each of them sequentially, collecting up the results into an object where the key is the string in the pair.
 * 
 * A pair is just an array in the form: `[string, parser]`
 */
export const namedSequence = <T extends PStream<any>, D, R extends any[]>(pairedParsers: PairedParsers<T, D, R>) =>
  new Parser(s => {
    if (s.error) return s;
    const results: PairedResults<R> = {};
    let nextState = s;

    for (const [key, parser] of pairedParsers) {
      const out = parser.pf(nextState);
      if (out.error) return out;
      nextState = out;
      results[key] = out.result;
    }

    return nextState.resultify(results);
  }) as Parser<T, D, PairedResults<R>>;

/**
 * Takes a separating parser then a sequence of parsers, and constructs a new parser that will match that sequence **interspersed** with the separating parser.
 * 
 * However, the resulting array will not contain the results matched by the separator parser.
 */
export const intersperse = <T extends PStream<any>, D, R extends any[], S>(separator: Parser<T, D, S>) =>
  (parsers: ParserTuple<T, D, R>) =>
  new Parser(s => {
    if (s.error) return s;
    const results: R[] = [];
    let start = true;
    for (const parser of parsers) {
      if (!start) {
        s = separator.pf(s);
        if (s.error) return s;
      }
      s = parser.pf(s);
      if (s.error) return s;
      results.push(s.result as R[number]);
      start = false;
    }
    return s.resultify(results);
  }) as Parser<T, D, R>;

/**
 * Takes a separating parser then a value parser, and returns a new parser that will match the value parser **zero or more** times, **separated** by the separating parser.
 * 
 * However, the resulting array will not contain the results matched by the separator parser.
 */
export const sep = <T extends PStream<any>, D, R, S>(separator: Parser<T, D, S>) =>
  (parser: Parser<T, D, R>) =>
  new Parser(s => {
    if (s.error) return s;
    const results: R[] = [];
    while (true) {
      s = parser.pf(s);
      if (s.error)
        return results.length === 0 ? s.resultify(results) : s;
      results.push(s.result as R);
      s = separator.pf(s);
      if (s.error) break;
    }
    return s.resultify(results);
  }) as Parser<T, D, R[]>;

/**
 * Takes a separating parser then a value parser, and returns a new parser that will match the value parser **one or more** times, **separated** by the separating parser.
 * 
 * However, the resulting array will not contain the results matched by the separator parser.
 */
export const sep1 = <T extends PStream<any>, D, R, S>(separator: Parser<T, D, S>) =>
  (parser: Parser<T, D, R>) =>
  new Parser(s => {
    if (s.error) return s;
    const out = sep(separator)(parser).pf(s);
    if (out.error) return out;
    const length = out.result?.length ?? 0;
    return length > 0
      ? out
      : s.errorify(new ParsingError({
          from: "sep1",
          expected: "to match at least one separated value"
        }));
  }) as Parser<T, D, R[]>;

/** Takes an array of parsers, and returns a new parser that tries to match each one of them sequentially, and returns the first match. If `choice` fails, then it returns the error message of the parser that matched the most from the string. */
export const choice = <T extends PStream<any>, D, R extends any[]>(parsers: ParserTuple<T, D, R>) =>
  new Parser(s => {
    if (s.error) return s;
    let errorState = null;
    const originalIndex = s.index;
    for (const parser of parsers) {
      const out = parser.pf(s);
      if (!out.error) return out;
      s.target.index = originalIndex;
      if (!errorState || (errorState && out.index > errorState.index))
        errorState = out;
    }
    return errorState as ErrorState<T, D>;
  }) as Parser<T, D, R[number]>;

/** Takes 3 parsers, a *left* parser, a *right* parser, and a *value* parser, returning a new parser that matches a value matched by the *value* parser, between values matched by the *left* parser and the *right* parser. */
export const between = <T extends PStream<any>, D, R>(leftp: Parser<T, D, any>) =>
  (rightp: Parser<T, D, any>) =>
  (parser: Parser<T, D, R>) =>
  sequence<T, D, [any, R, any]>([leftp, parser, rightp]).map(([_, x]) => x);
