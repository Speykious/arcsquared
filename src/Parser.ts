import ParserState from "./ParserState";
import ParsingError from "./ParsingError";
import PStream from "./PStream";

export type ParsingFunction<T, D, E, R, S> = (state: ParserState<T, D, R>) => ParserState<T, E, S>;

export default class Parser<T, D, E, R, S> {
  /** The state transformer of the parser. */
  private pf: ParsingFunction<T, D, E, R, S>;

  constructor(pf: ParsingFunction<T, D, E, R, S>) {
    this.pf = pf;
  }

  /** Parses a `PStream` target. */
  parse(target: PStream<T>): ParserState<T, E, S> {
    return this.pf(new ParserState({ target }));
  }

  /**
   * Parses a target.
   * If the parsed state is an error, it will call the error function on the state.
   * Otherwise, it will call the success function.
   */
  fork<A, B>(
    target: PStream<T>,
    errf: (errorState: ParserState<T, E, null>) => A,
    succf: (successState: ParserState<T, E, S>) => B
  ): A | B {
    const state = this.parse(target);
    return state.error
      ? errf(state as unknown as ParserState<T, E, null>)
      : succf(state as ParserState<T, E, S>);
  }

  /** Applies a function to the result when the parsed state is not an error. */
  map<U>(f: (result: S) => U): Parser<T, D, E, R, U> {
    const pf = this.pf;
    return new Parser(s => {
      const state = pf(s);
      return (
        state.error
        ? state
        : state.resultify(f(state.result as S))
      ) as ParserState<T, E, U>;
    });
  }

  /** Filters results using a predicate, and produces an error when that predicate returns false. */
  filter(
    p: (result: S) => boolean,
    emap?: (errorState: ParserState<T, E, S>) => ParsingError
  ): Parser<T, D, E, R, S> {
    const pf = this.pf;
    return new Parser(s => {
      const state = pf(s);
      if (state.error || p(state.result as S))
        return state;
      else if (emap)
        return state.errorify(emap(state));
      else
        return state.errorify(new ParsingError({
          index: state.index,
          message: `Result '${state.result}' did not validate the predicate`
        }));
    }) as Parser<T, D, E, R, S>;
  }
}