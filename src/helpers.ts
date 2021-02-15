import { inspect } from "util"

export type TypedArray
  = Uint8Array
  | Int8Array
  | Uint16Array
  | Int16Array
  | Uint32Array
  | Int32Array
  | Float32Array
  | Float64Array

/** If the condition is true, it will return the application of f to arg. Otherwise, it just returns arg. */
export const optionalTransform =
  (condition: boolean) => <T>(f: (arg: T) => T) => (arg: T) =>
    condition ? f(arg) : arg;

// Caching compiled regexs for better performance
export const reDigit = /[0-9]/;
export const reDigits = /^[0-9]+/;
export const reLetter = /[a-zA-Z]/;
export const reLetters = /^[a-zA-Z]+/;
export const reWhitespaces = /^\s+/;

export function charLength(str: string): number {
  let total = 0, i = 0;
  while (i < str.length) {
    let cp = str.codePointAt(i);
    while (cp) {
      cp >>= 8;
      i++;
    }
    total++;
  }
  return total;
}

export function insp(o: Object): string {
  return inspect(o, false, 4, true);
}