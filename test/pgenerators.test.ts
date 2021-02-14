import { char, encoder, StringPStream } from "../src/index";

describe("Parser generators", () => {
  describe("char", () => {
    const s = new Uint8Array(
      encoder.encode("Surprise, motherfucker 😎").buffer
    );
    const stream = new StringPStream(s);
    
    const parser = char("c");
    const state = parser.parse(stream);
    console.log(state);

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
  });
});
