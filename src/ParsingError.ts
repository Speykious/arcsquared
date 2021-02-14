import { optionalTransform } from "./helpers"
import { red, green, bold } from "ansi-colors-ts";

/** Necessary props to instantiate a new `ParsingError`. */
export interface ParsingErrorProps {
  from?: string | null;
  index?: number | null;
  expected?: string | null;
  actual?: string | null;
  message?: string | null;
  colored?: boolean;
};

/**
 * Class representing a parsing error.
 * It doesn't inherit the Error class, as it's not used for that purpose.
 */
export default class ParsingError {
  /**
   * Name of the error that this class represents, generally the name of the class itself, used when displaying the error.
   * It is preferable to use this variable instead of accessing `errObj.constructor.name` in case the code gets minified.
   */
  static readonly errorName: string = "ParsingError";
  /** Change this flag if you want the default value of the `colored` property of new `ParsingError`s to be true. */
  static defaultColoring: boolean = false;

  /** The origin of the error, like the parser combinator that produced it. */
  readonly from: string | null;
  /**
   * The index in the parsing stream where the error has been found.
   * If it is set to `null` or `undefined`, then it will be overwritten by the parser state being errorified using this object.
   */
  index: number | null;
  /** The value that was expected. Optional as there could be no particular expectations. */
  readonly expected: string | null;
  /** The actual value received. */
  readonly actual: string | null;
  /** The message of the error. Only there when expected and actual are both null. */
  readonly message: string | null;
  /** Whether the string version of the error will be colored with ansi code. */
  colored: boolean;
  
  constructor(props: ParsingErrorProps) {
    this.from = props.from ?? null;
    this.index = props.index ?? null;
    this.expected = props.expected ?? null;
    this.actual = props.actual ?? null;
    this.message = props.message ?? null;
    this.colored = props.colored ?? ParsingError.defaultColoring;
  }
  
  /**
   * Returns the props of the parsing error.
   * Useful when creating a child-error keeping properties intact.
   */
  get props(): ParsingErrorProps {
    return {
      from: this.from,
      index: this.index,
      expected: this.expected,
      actual: this.actual,
      message: this.message,
      colored: this.colored
    };
  }
  
  protected get optionalColor(): <T>(f: (arg: T) => T) => (arg: T) => T {
    return optionalTransform(this.colored);
  }

  describe(): string {
    let s = "";
    if (this.expected) {
      s += `Expected ${this.optionalColor(green)(this.expected)}`;
      if (this.actual)
        s += `, got ${this.optionalColor(red)(this.actual)}`;
    } else if (this.actual)
      s += `Got ${this.optionalColor(red)(this.actual)}`;
    else if (this.message)
      s += this.message;
    else
      s += "Something happened (something happened)";
    return s;
  }
  
  toString(): string {
    const Self = this.constructor as unknown as { errorName: string };
    let s = this.optionalColor(bold)(Self.errorName);
    if (this.from) s += ` '${this.from}'`;
    s += ` (position ${this.index}): `;
    if (this.colored) s = red(s);
    s += this.describe();
    return s;
  }
}