import PStream from "./PStream";
import ParsingError from "./ParsingError";

/** Necessary props to instantiate a new `ParserState`. */
export interface ParserStateProps<T, D, R> {
  target: PStream<T>;
  data?: D | null;
  error?: ParsingError | null;
  result?: R | null;
}

/**
 * Class representing a parser state.
 * It is composed of a target parser stream, some associated data, an error and some parsed result.
 */
export default class ParserState<T, D, R> {
  readonly target: PStream<T>;
  readonly data: D | null;
  readonly error: ParsingError | null;
  readonly result: R | null;

  constructor(props: ParserStateProps<T, D, R>) {
    this.target = props.target;
    this.data = props.data ?? null;
    this.error = props.error ?? null;
    this.result = props.result ?? null;
  }

  /** Index that keeps track of the current element of the target stream. */
  get index(): number {
    return this.target.index;
  }

  /**
   * Returns the props of the parser state.
   * Useful when creating a new parser state based on another one by only changing some properties.
   * It also keeps the code functional and immutable.
   */
  get props(): ParserStateProps<T, D, R> {
    return {
      target: this.target.clone(),
      data: this.data,
      error: this.error,
      result: this.result
    };
  }

  /** Returns a new `ParserState` based on the current one while changing the result property. */
  resultify<S>(result: S): ParserState<T, D, S> {
    return new ParserState({
      ...this.props,
      error: null,
      result
    });
  }
  
  /** Returns a new `ParserState` based on the current one while changing the error property. */
  errorify(error: ParsingError | null): ParserState<T, D, null> {
    return new ParserState({
      ...this.props,
      error,
      result: null
    });
  }
  
  /** Returns a new `ParserState` based on the current one while changing the data property. */
  dataify<E>(data: E): ParserState<T, E, R> {
    return new ParserState({
      ...this.props,
      data
    });
  }
}
