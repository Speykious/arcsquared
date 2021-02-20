import PStream from "../src/PStream";

export interface Token {
  type: string;
  value: string;
}

export default class TokenPStream implements PStream<Token> {
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
