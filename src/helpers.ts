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