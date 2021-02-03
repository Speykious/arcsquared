/** Abstract class representing the input stream of every parser you're gonna create. */
export default abstract class PStream<T> {
  /** Protected index that keeps track of the current element of the stream. */
  protected _index: number;

  constructor() {
    this._index = 0;
  }

  /** Index that keeps track of the current element of the stream. */
  get index(): number {
    return this._index;
  }

  /** Gives the length of the entire steam. */
  abstract get length(): number;
  /**
   * Gives the element at a given index inside the stream.
   * @param i The index where the element is.
   */
  abstract elementAt(i: number): T | null;
  
  /** Safely clones the current `PStream`. */
  abstract clone(): PStream<T>;

  /**
   * Gives the next element of the stream.
   * If there is no next element (a.k.a. null), it won't increment the internal index.
   */
  next(): T | null {
    const nextElement = this.elementAt(this._index + 1);
    if (nextElement) this._index++;
    return nextElement;
  }

  /**
   * Gives the n next elements of the stream.
   * @param n the number of maximum next elements to get.
   */
  nexts(n: number): T[] {
    const start = this._index;
    const nextElements: T[] = [];
    for (let nel = this.next(); this._index - start < n && nel; nel = this.next())
      nextElements.push(nel);
    return nextElements;
  }
}
