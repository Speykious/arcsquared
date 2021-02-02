/** Abstract class representing the input stream of every parser you're gonna create. */
export default abstract class PStream<T> {
  /** Internal index that keeps track of the current element of the stream. */
  public index: number;

  constructor() {
    this.index = 0;
  }

  /** Gives the length of the entire steam. */
  abstract get length(): number;
  /**
   * Gives the element at a given index inside the stream.
   * @param i The index where the element is.
   */
  abstract elementAt(i: number): T | null;

  /**
   * Gives the next element of the stream.
   * If there is no next element (a.k.a. null), it won't increment the internal index.
   */
  next(): T | null {
    const nextElement = this.elementAt(this.index + 1);
    if (nextElement) this.index++;
    return nextElement;
  }

  /**
   * Gives the n next elements of the stream.
   * @param n the number of maximum next elements to get.
   */
  nexts(n: number): T[] {
    const start = this.index;
    const nextElements: T[] = [];
    for (let nel = this.next(); this.index - start < n && nel; nel = this.next())
      nextElements.push(nel);
    return nextElements;
  }
}
