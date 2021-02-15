import { $nextOf, $nextsOf, PStream } from "../src/index";

class IntPStream implements PStream<number> {
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

interface Token {
  type: string;
  value: string;
}

class TokenPStream implements PStream<Token> {
  index: number;
  readonly tokens: Token[];

  constructor(numbers: Token[]) {
    this.index = 0;
    this.tokens = numbers;
  }

  get length(): number {
    return this.tokens.length;
  }

  elementAt(i: number): Token | null {
    return this.tokens[i] ?? null;
  }

  clone(): TokenPStream {
    const stream = new TokenPStream(this.tokens);
    stream.index = this.index;
    return stream;
  }
}

describe("PStream", () => {
  describe("IntPStream", () => {
    const array: number[] = [1, 2, 3, 4];
    const stream = new IntPStream(array);
    
    it("has the right length", () => {
      expect(stream.length).toEqual(array.length);
    });

    it("gives the correct elements", () => {
      expect(stream.elementAt(0)).toEqual(1);
      expect(stream.elementAt(2)).toEqual(3);
      expect(stream.elementAt(4)).toBeNull();
    });

    const streamClone = stream.clone();
    it("properly clones itself", () => {
      expect(streamClone.numbers).toBe(stream.numbers);
      expect(streamClone.index).toEqual(stream.index);
    });

    it("gives the next element properly", () => {
      const firstElement = $nextOf(stream);
      expect(firstElement).toEqual(1);
      expect(stream.index).toEqual(1);
    });

    it("gives next elements properly", () => {
      const elements = $nextsOf(stream, 5);
      expect(elements).toEqual([2, 3, 4]);
      expect(stream.index).toEqual(4);
    });

    it("gives nothing when no elements are left", () => {
      const nothing = $nextOf(stream);
      expect(nothing).toBeNull();
      expect(stream.index).toEqual(4);
    });
  });

  describe("TokenPStream", () => {
    const array: Token[] = [
      { type: "string", value: "hello" },
      { type: "string", value: "world" },
      { type: "char", value: "!" },
      { type: "integer", value: "42" },
    ];
    const stream = new TokenPStream(array);
    
    it("has the right length", () => {
      expect(stream.length).toEqual(array.length);
    });

    it("gives the correct elements", () => {
      expect(stream.elementAt(0)).toEqual(array[0]);
      expect(stream.elementAt(2)).toEqual(array[2]);
      expect(stream.elementAt(4)).toBeNull();
    });

    const streamClone = stream.clone();
    it("properly clones itself", () => {
      expect(streamClone.tokens).toBe(stream.tokens);
      expect(streamClone.index).toEqual(stream.index);
    });

    it("gives the next element properly", () => {
      const firstElement = $nextOf(stream);
      expect(firstElement).toEqual(array[0]);
      expect(stream.index).toEqual(1);
    });

    it("gives next elements properly", () => {
      const elements = $nextsOf(stream, 5);
      expect(elements).toEqual(array.slice(1, 4));
      expect(stream.index).toEqual(4);
    });
    
    it("gives nothing when no elements are left", () => {
      const nothing = $nextOf(stream);
      expect(nothing).toBeNull();
      expect(stream.index).toEqual(4);
    });
  });
});