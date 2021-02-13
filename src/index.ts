import PStream from "./PStream";
import StringPStream from "./StringPStream";
import ParsingError from "./ParsingError";
import ParserState from "./ParserState";
import Parser from "./Parser";

export * from "./constants";
export * from "./PStream";
export * from "./StringPStream";
export * from "./ParsingError";
export * from "./ParserState";
export * from "./Parser";
export * from "./pcombinators";
export * from "./pgenerators";

export {
  PStream,
  StringPStream,
  ParsingError,
  ParserState,
  Parser
};

/**
 * Tuple function (Typescript trick). Use it to have the correct tuple type,
 * especially when using the `sequenceOf` parser.
 * 
 * ## Example
 * 
 * Normally, the array
 * ```ts
 * ["hello", 42, true]
 * ```
 * would have the type
 * ```ts
 * (string | number | boolean)[]
 * ```
 * but if you write
 * ```ts
 * tup("hello", 42, true)
 * ```
 * instead, then it has the type
 * ```ts
 * [string, number, boolean]
 * ```
 */
export function tup<T extends any[]>(...data: T) {
  return data;
}

export default Parser;