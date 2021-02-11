import Parser, { PairedParsers, PairedResults, ParserMonad, ParserTuple } from "./Parser";
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
export const setData = <T, D, R>(d: D) =>
  new Parser(s =>
    s.error ? s : s.dataify(d)
  ) as Parser<T, D, R>;

/** Takes a *provided parser*, and returns a function waiting for some *state data* to be set, and then returns a new parser. That parser, when run, ensures that the *state data* is set as the *internal state data* before the *provided parser* runs. */
export const withData = <T, D, R>(parser: Parser<T, D, R>) => (d: D) =>
  setData<T, D, R>(d).chain(() => parser);

/** Takes a generator function, in which parsers are `yield`ed. `coroutine` allows you to write parsers in a more imperative and sequential way - in much the same way `async/await` allows you to write code with promises in a more sequential way.
 * 
 * Inside of the generator function, you can use all regular JavaScript language features, like loops, variable assignments, and conditional statements. This makes it easy to write very powerful parsers using `coroutine`, but on the other side it can lead to less readable, more complex code.
 * 
 * Debugging is also much easier, as breakpoints can be easily added, and values logged to the console after they have been parsed.
 */
export function coroutine<T, D, R>(g: () => ParserMonad<T, D, R>): Parser<T, D, R> {
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
export const sequenceOf = <T, D, R extends any[]>(parsers: ParserTuple<T, D, R>) =>
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
export const namedSequenceOf = <T, D, R extends any[]>(pairedParsers: PairedParsers<T, D, R>) =>
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
