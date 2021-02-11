import ParserState from "./ParserState";
import ParsingError from "./ParsingError";
import PStream from "./PStream";

/** The core of the Parser object. */
export type ParsingFunction<T, D, R> = (state: ParserState<T, unknown, unknown>) => ParserState<T, D, R>;

/** An array of different generic parsers. */
export type ParserTuple<T, D, R extends any[]> = { [K in keyof R]: Parser<T, D, R[K]> }
/** An array of parsers paired with strings. */
export type PairedParsers<T, D, R> = { [K in keyof R]: [string, Parser<T, D, R[K]>] };
/** An object of results indexed by string keys. */
export type PairedResults<R> = { [key: string]: R[keyof R] };
/** Yielder of parsers, which behaves very similarly to monads in functional programming. */
export type ParserMonad<T, D, R> = Generator<Parser<T, D, unknown>, R, unknown>;

/**
 * The most important class of this library: the parser class, which contains a parser function.
 * You will use it to parse a target input of a certain type T, and then either get back some result R or some parsing error, eventually using additional data. For example, you could store the line number and character index of the thing being parsed.
 */
export default class Parser<T, D, R> {
  /** The state transformer of the parser. */
  pf: ParsingFunction<T, D, R>;

  constructor(pf: ParsingFunction<T, D, R>) {
    this.pf = pf;
  }

  /** Parses a `PStream` target. */
  parse(target: PStream<T>): ParserState<T, D, R> {
    return this.pf(new ParserState({ target }));
  }

  /**
   * Parses a target.
   * If the parsed state is an error, it will call the error function on the state.
   * Otherwise, it will call the success function.
   */
  fork<A, B>(
    target: PStream<T>,
    errf: (errorState: ParserState<T, D, null>) => A,
    succf: (successState: ParserState<T, D, R>) => B
  ): A | B {
    const state = this.parse(target);
    return state.error
      ? errf(state as unknown as ParserState<T, D, null>)
      : succf(state as ParserState<T, D, R>);
  }

  /** Applies a function to the result when the parsed state is not an error. */
  map<S>(f: (result: R) => S): Parser<T, D, S> {
    const pf = this.pf;
    return new Parser(s => {
      if (s.error) return s;
      const state = pf(s);
      return (
        state.error
        ? state
        : state.resultify(f(state.result as R))
      ) as ParserState<T, D, S>;
    }) as Parser<T, D, S>;
  }

  /** Filters results using a predicate, and produces an error when that predicate returns false. */
  filter(
    p: (result: R) => boolean,
    emap?: (errorState: ParserState<T, D, R>) => ParsingError
  ): Parser<T, D, R> {
    const pf = this.pf;
    return new Parser(s => {
      if (s.error) return s;
      const state = pf(s);
      if (state.error || p(state.result as R))
        return state;
      else if (emap)
        return state.errorify(emap(state));
      else
        return state.errorify(new ParsingError({
          index: state.index,
          message: `Result '${state.result}' did not validate the predicate`
        }));
    }) as Parser<T, D, R>;
  }
  
  /** Chooses the next parser based on the parsed result. */
  chain<S>(f: (result: R) => Parser<T, D, S>): Parser<T, D, S> {
    const pf = this.pf;
    return new Parser(s => {
      if (s.error) return s;
      const state = pf(s);
      return state.error
        ? state as unknown as ParserState<T, D, null>
        : f(state.result as R).pf(state);
    }) as Parser<T, D, S>;
  }
  
  /** Takes a parser of function and applies its parsed function to the parsed result of the current parser. */
  ap<S>(poff: Parser<T, D, (a: R) => S>): Parser<T, D, S> {
    const pf = this.pf;
    return new Parser(s => {
      if (s.error) return s;
      const argState = pf(s);
      if (argState.error) return argState;
      const funState = poff.pf(argState);
      if (funState.error) return funState;
      return funState.resultify(
        (funState.result as (a: R) => S)(argState.result as R)
      );
    }) as Parser<T, D, S>;
  }

  /** Maps the error of the parser. */
  errorMap(f: (errorState: ParserState<T, D, null>) => ParsingError): Parser<T, D, R> {
    const pf = this.pf;
    return new Parser(s => {
      if (s.error) return s;
      const state = pf(s);
      return state.error
        ? state.errorify(f(state as unknown as ParserState<T, D, null>))
        : state;
    }) as Parser<T, D, R>;
  }
  
  /** Chooses the next parser based on the parsed error. */
  errorChain(f: (errorState: ParserState<T, D, null>) => Parser<T, D, R>): Parser<T, D, R> {
    const pf = this.pf;
    return new Parser(s => {
      if (s.error) return s;
      const state = pf(s);
      return state.error
        ? f(state as unknown as ParserState<T, D, null>).pf(state)
        : state;
    }) as Parser<T, D, R>;
  }

  /** Maps the result using the data of the parser. */
  mapFromData<S>(f: (data: D | null, result: R) => S): Parser<T, D, S> {
    const pf = this.pf;
    return new Parser(s => {
      if (s.error) return s;
      const state = pf(s);
      return state.error
        ? state as unknown as ParserState<T, D, null>
        : state.resultify(f(state.data, state.result as R));
    }) as Parser<T, D, S>;
  }
  
  /** Chooses the next parser based on the parsed result, and using the parser's data. */
  chainFromData<S>(f: (data: D | null, result: R) => Parser<T, D, S>): Parser<T, D, S> {
    const pf = this.pf;
    return new Parser(s => {
      if (s.error) return s;
      const state = pf(s);
      return state.error
        ? state as unknown as ParserState<T, D, null>
        : f(state.data, state.result as R).pf(state);
    }) as Parser<T, D, S>;
  }
  
  /** Maps the data of the parser. The data has to be of the same type. */
  mapData<E>(f: (data: D | null) => E): Parser<T, E, R> {
    const pf = this.pf;
    return new Parser(s => {
      const state = pf(s);
      return state.dataify(f(state.data));
    });
  }
  
  /** Creates a parser that returns a value right ahead. */
  static of<T, X>(x: X): Parser<T, unknown, X> {
    return new Parser(s => s.resultify(x));
  }
}