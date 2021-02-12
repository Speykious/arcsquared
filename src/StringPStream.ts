import PStream from "./PStream";
import { TypedArray } from "./helpers";
import { TextEncoder, TextDecoder } from "util";

/** Used to encode text. */
export const encoder = new TextEncoder();
/** Used to decode text. */
export const decoder = new TextDecoder();

/**
 * Special PStream for string streams, which are very common.
 * The characters are encoded as numbers.
 */
export default class StringPStream extends PStream<number> {
  /** Dataview, as it is a more convenient way to take a string as a stream. */
  readonly dataView: DataView;

  constructor(target: string | DataView | ArrayBuffer | TypedArray) {
    super();
    
    if (typeof target === "string")
      this.dataView = new DataView(encoder.encode(target).buffer);
    else if (target instanceof ArrayBuffer)
      this.dataView = new DataView(target);
    else if (target instanceof DataView)
      this.dataView = target;
    else
      this.dataView = new DataView(target.buffer);
  }

  /** Length of the dataview. */
  get length(): number {
    return this.dataView.byteLength;
  }
  
  elementAt(i: number): number | null {
    try {
      return this.dataView.getUint8(i);
    } catch (e) {
      return null;
    }
  }

  clone(): StringPStream {
    const stream = new StringPStream(this.dataView);
    stream._index = this._index;
    return stream;
  }

  /**
   * Decodes a utf8 character from the dataView.
   * @param index The index of the character.
   * @param length The length of the character in bytes.
   */
  getUtf8Char(index: number, length: number): string {
    const dataView = this.dataView;
    const bytes = Uint8Array.from(
      { length },
      (_, i) => dataView.getUint8(index + i)
    );
    return decoder.decode(bytes);
  }
  
  /**
   * Determines the width of a character.
   * @param index The index of the character.
   */
  getCharWidth(index: number): number {
    const byte = this.elementAt(index);
    if (byte === null) return 0;
    if ((byte & 0x80) >> 7 === 0) return 1;
    if ((byte & 0xe0) >> 5 === 0b110) return 2;
    if ((byte & 0xf0) >> 4 === 0b1110) return 3;
    if ((byte & 0xf0) >> 4 === 0b1111) return 4;
    return 1;
  }
  
  /**
   * Gets a character with the correct size.
   * @param index The index of the caracter.
   */
  getChar(index: number): string {
    return this.getUtf8Char(index, this.getCharWidth(index));
  }

  /** Gets the next character in the stream. */
  nextChar(): string {
    const index = this._index;
    const charWidth = this.getCharWidth(index);
    this._index += charWidth;
    return this.getUtf8Char(index, charWidth);
  }
}