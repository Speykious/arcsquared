import { expect } from "chai";
import { StringPStream, encoder, $nextOf, $nextsOf } from "../src/index";

describe("StringPStream", () => {
  const s = new Uint8Array(encoder.encode("Surprise, motherfucker 😎").buffer);
  const stream = new StringPStream(s);
  
  it("has the right length", () => {
    expect(stream.length).to.equal(s.byteLength);
  });

  it("gives the correct elements", () => {
    expect(stream.elementAt(0)).to.equal(s[0]);
    expect(stream.elementAt(2)).to.equal(s[2]);
    expect(stream.elementAt(69)).to.be.null;
  });

  it("gives the next element properly", () => {
    const firstElement = $nextOf(stream);
    expect(firstElement).to.equal(s[0]);
    expect(stream.index).to.equal(1);
  });

  it("gives next elements properly", () => {
    const elements = $nextsOf(stream, 20);
    expect(elements).to.deep.equal(Array.from(s.slice(1, 21)));
    expect(stream.index).to.equal(21);
  });

  it("supports normal ascii characters", () => {
    const chars = stream.nextChars(2);
    expect(chars).to.equal("r ");
    expect(stream.index).to.equal(23);
  });

  it("supports wide unicode characters", () => {
    const cool = stream.nextChar();
    expect(cool).to.equal("😎");
    expect(stream.index).to.equal(27);
  });
  
  it("gives nothing when no elements are left", () => {
    const nothing = $nextOf(stream);
    expect(nothing).to.be.null;
    expect(stream.index).to.equal(27);
  });
});