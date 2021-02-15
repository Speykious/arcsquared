/**
 * Interface representing a parser stream.
 * Every input you parse has to implement that.
 */
export default interface PStream<T> {
  /** Keeps track of the current element of the stream. */
  index: number;
  /** Length of the entire stream. */
  length: number;
  /**
   * Gives the element at a given index inside the stream.
   * @param i The index where the element is.
   */
  elementAt: (i: number) => T | null;
  /** Safely clones the PStream. */
  clone: () => PStream<T>;
};

/** Initialises a `PStream` by setting its index to `0`. */
export const initStream: { index: number } = { index: 0 };

/**
 * Gives the current element of the stream.
 * 
 * If every element has been consumed, it will return `null`.
 */
export function $currentOf<T>(stream: PStream<T>): T | null {
  return stream.elementAt(stream.index);
}

/**
 * Gives the next element of the stream.
 * 
 * If there is no next element (a.k.a. returns `null`), it won't increment the internal index.
 */
export function $nextOf<T>(stream: PStream<T>): T | null {
  const nel = $currentOf(stream);
  if (nel) stream.index++;
  return nel;
};

/**
 * Gives the n next elements of the stream.
 * 
 * If there is no next element (a.k.a. returns an empty array), it won't increment the internal index.
 */
export function $nextsOf<T>(stream: PStream<T>, n: number): T[] {
  const nextElements: T[] = [];
  for (let i = 0; i < n; i++) {
    const nel = $currentOf(stream);
    if (!nel) break;
    stream.index++;
    nextElements.push(nel);
  }
  return nextElements;
}