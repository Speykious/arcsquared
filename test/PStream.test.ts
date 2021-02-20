import { $nextOf, $nextsOf } from "../src/index";
import IntPStream from "./IntPStream.asset";
import TokenPStream, { Token } from "./TokenPStream.asset";

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
      { type: "integer", value: "42" }
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
