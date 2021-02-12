import { StringPStream, encoder } from "../src/index";

describe("StringPStream", () => {
  const s = new Uint8Array(encoder.encode("Surprise, motherfucker 😎").buffer);
  const stream = new StringPStream(s);
  
  it("has the right length", () => {
    expect(stream.length).toEqual(s.byteLength);
  });

  it("gives the correct elements", () => {
    expect(stream.elementAt(0)).toEqual(s[0]);
    expect(stream.elementAt(2)).toEqual(s[2]);
    expect(stream.elementAt(69)).toBeNull();
  });

  it("gives the next element properly", () => {
    const firstElement = stream.next();
    expect(firstElement).toEqual(s[0]);
    expect(stream.index).toEqual(1);
  });

  it("gives next elements properly", () => {
    const elements = stream.nexts(20);
    expect(elements).toEqual(Array.from(s.slice(1, 21)));
    expect(stream.index).toEqual(21);
  });

  it("supports normal ascii characters", () => {
    const chars = stream.nextChars(2);
    expect(chars).toEqual("r ");
    expect(stream.index).toEqual(23);
  });

  it("supports wide unicode characters", () => {
    const cool = stream.nextChar();
    expect(cool).toEqual("😎");
    expect(stream.index).toEqual(27);
  });
  
  it("gives nothing when no elements are left", () => {
    const nothing = stream.next();
    expect(nothing).toBeNull();
    expect(stream.index).toEqual(27);
  });
});