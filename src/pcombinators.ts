import PStream from "./PStream";
import StringPStream from "./StringPStream";
import { TypedArray } from "./helpers";
import Parser, { PairedParsers, PairedResults, ParserMonad, ParserTuple } from "./Parser";
import ParserState from "./ParserState";
import ParsingError from "./ParsingError";
//import ParsingError from "./ParsingError";

/** A parser that will always return what is contained in the *internal state data*, without consuming any input.
 *
 * If dealing with any complex level of state ─ such as an object where individual keys will be updated or required ─ then it can be useful to create utility parsers to assist.
 */
export const getData = new Parser(s =>
  s.error ? s : s.resultify(s.data)
);

/** Takes anything that should be set as the *internal state data*, and returns a parser that will perform that side effect when the parser is run. This does not consume any input. If parsing is currently in an errored state, then the data **will not** be set.
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

/** Takes an array of parsers and composes them left to right, so each parser's return value is passed into the next one in the chain. The result is a new parser that, when run, yields the result of the final parser in the chain.
 */
export const pipe = <T extends PStream<any>, D, R extends any[]>(parsers: ParserTuple<T, D, R>) =>
  new Parser(s => {
    for (const parser of parsers)
      s = parser.pf(s as ParserState<T, unknown, unknown>);
    return s;
  }) as Parser<T, D, R[typeof parsers.length]>;

/** Takes an array of parsers and composes them right to left, so each parsers return value is passed into the next one in the chain. The result is a new parser that, when run, yields the result of the final parser in the chain.
 */
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

/** Functional wrapper around the `.parse()` method of `Parser`.
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
  new Parser(s => {
    return s.error
      ? s
      : f(s.result as R).pf(s);
  }) as Parser<T, D, S>;

/** Takes a parsing error and returns a parser that always fails with the provided parsing error. */
export const fail = <T extends PStream<any>, D, R>(error: ParsingError) =>
  new Parser(s => {
    return s.error
      ? s
      : s.errorify(error);
  }) as Parser<T, D, R>;

/**
 * Takes a value and returns a parser that always matches that value without consuming any input.
 * 
 * Essentially, the same thing as `Parser.of`, as you can observe if you go to the definition.
 */
export const succeedWith = Parser.of;

/** Takes a generator function, in which parsers are `yield`ed. `coroutine` allows you to write parsers in a more imperative and sequential way ─ in much the same way `async/await` allows you to write code with promises in a more sequential way.
 * 
 * Inside of the generator function, you can use all regular Javascript and Typescript language features, like loops, variable assignments, and conditional statements. This makes it easy to write very powerful parsers using `coroutine`, but on the other side it can lead to less readable, more complex code.
 * 
 * Debugging is also much easier, as breakpoints can be easily added, and values logged to the console after they have been parsed.
 */
export function coroutine<T extends PStream<any>, D, R>(g: () => ParserMonad<T, D, R>): Parser<T, D, R> {
  return new Parser(s => {
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
}

/** Takes an array of parsers, and returns a new parser that matches each of them sequentially, collecting up the results into an array. */
export const sequenceOf = <T extends PStream<any>, D, R extends any[]>(parsers: ParserTuple<T, D, R>) =>
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
export const namedSequenceOf = <T extends PStream<any>, D, R extends any[]>(pairedParsers: PairedParsers<T, D, R>) =>
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