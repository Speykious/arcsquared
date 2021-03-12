import { expect } from "chai";
import { $nextOf, $nextsOf } from "../src/index";
import IntPStream from "./IntPStream.asset";
import TokenPStream, { Token } from "./TokenPStream.asset";

describe("PStream", () => {
  describe("IntPStream", () => {
    const array: number[] = [1, 2, 3, 4];
    const stream = new IntPStream(array);

    it("has the right length", () => {
      expect(stream.length).to.equal(array.length);
    });

    it("gives the correct elements", () => {
      expect(stream.elementAt(0)).to.deep.equal(1);
      expect(stream.elementAt(2)).to.deep.equal(3);
      expect(stream.elementAt(4)).to.be.null;
    });

    const streamClone = stream.clone();
    it("properly clones itself", () => {
      expect(streamClone.numbers).to.equal(stream.numbers);
      expect(streamClone.index).to.deep.equal(stream.index);
    });

    it("gives the next element properly", () => {
      const firstElement = $nextOf(stream);
      expect(firstElement).to.deep.equal(1);
      expect(stream.index).to.deep.equal(1);
    });

    it("gives next elements properly", () => {
      const elements = $nextsOf(stream, 5);
      expect(elements).to.deep.equal([2, 3, 4]);
      expect(stream.index).to.deep.equal(4);
    });

    it("gives nothing when no elements are left", () => {
      const nothing = $nextOf(stream);
      expect(nothing).to.be.null;
      expect(stream.index).to.deep.equal(4);
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
      expect(stream.length).to.deep.equal(array.length);
    });

    it("gives the correct elements", () => {
      expect(stream.elementAt(0)).to.deep.equal(array[0]);
      expect(stream.elementAt(2)).to.deep.equal(array[2]);
      expect(stream.elementAt(4)).to.be.null;
    });

    const streamClone = stream.clone();
    it("properly clones itself", () => {
      expect(streamClone.tokens).to.equal(stream.tokens);
      expect(streamClone.index).to.deep.equal(stream.index);
    });

    it("gives the next element properly", () => {
      const firstElement = $nextOf(stream);
      expect(firstElement).to.deep.equal(array[0]);
      expect(stream.index).to.deep.equal(1);
    });

    it("gives next elements properly", () => {
      const elements = $nextsOf(stream, 5);
      expect(elements).to.deep.equal(array.slice(1, 4));
      expect(stream.index).to.deep.equal(4);
    });

    it("gives nothing when no elements are left", () => {
      const nothing = $nextOf(stream);
      expect(nothing).to.be.null;
      expect(stream.index).to.deep.equal(4);
    });
  });
});
