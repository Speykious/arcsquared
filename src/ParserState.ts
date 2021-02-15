import PStream from "./PStream";
import ParsingError from "./ParsingError";

/** Necessary props to instantiate a new `ParserState`. */
export interface ParserStateProps<T extends PStream<any>, D, R> {
  target: T;
  data?: D | null;
  error?: ParsingError | null;
  result?: R | null;
}

/** Type representing a successful parser state. */
export type SuccessState<T extends PStream<any>, D, R> =
  ParserState<T, D, R> & { error: null; result: R; };
/** Type representing an unsuccessful parser state. */
export type ErrorState<T extends PStream<any>, D> =
  ParserState<T, D, null> & { error: ParsingError; };

/**
 * Class representing a parser state.
 * It is composed of a target parser stream, some associated data, an error and some parsed result.
 */
export default class ParserState<T extends PStream<any>, D, R> {
  readonly target: T;
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
      target: this.target.clone() as T,
      data: this.data,
      error: this.error,
      result: this.result
    };
  }

  /** Returns a new `ParserState` based on the current one while changing the result property. */
  resultify<S>(result: S): SuccessState<T, D, S> {
    return new ParserState({
      ...this.props,
      error: null,
      result
    }) as SuccessState<T, D, S>;
  }
  
  /**
   * Returns a new `ParserState` based on the current one while changing the error property.
   * If the `index` property of the parsing error is set to `null` or `undefined`, it will overwrite it with this parser state's index value.
   */
  errorify(error: ParsingError): ErrorState<T, D> {
    error.index = error.index ?? this.index;
    return new ParserState({
      ...this.props,
      error,
      result: null
    }) as ErrorState<T, D>;
  }
  
  /** Returns a new `ParserState` based on the current one while changing the data property. */
  dataify<E>(data: E): ParserState<T, E, R> {
    return new ParserState({
      ...this.props,
      data
    });
  }
}