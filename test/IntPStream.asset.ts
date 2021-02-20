import PStream from "../src/PStream";

export default class IntPStream implements PStream<number> {
  index: number;
  readonly numbers: number[];

  constructor(numbers: number[]) {
    this.index = 0;
    this.numbers = numbers;
  }

  get length(): number {
    return this.numbers.length;
  }

  elementAt(i: number): number {
    return this.numbers[i] ?? null;
  }

  clone(): IntPStream {
    const stream = new IntPStream(this.numbers);
    stream.index = this.index;
    return stream;
  }
}
