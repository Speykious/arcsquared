import Parser from "./Parser";
/** Puts the data of the parser as a result, unless there is an error. */
export const getData = new Parser(s =>
  s.error
    ? s
    : s.resultify(s.data)
);

/** Sets the data of the parser, even if there is a parameter. */
export const setData = <D>(d: D) =>
  new Parser(s => s.dataify(d));


/*
export function coroutine<T, D, R>(g: Generator<Parser<T, D, unknown>, R, unknown>): Parser<T, D, R> {
  return new Parser(s => {
    if (s.error) return s;
    
  });
}
*/