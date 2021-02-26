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
export default class StringPStream implements PStream<number> {
  index: number;
  /** Length of the dataview. */
  length: number;
  /** Dataview, as it is a more convenient way to take a string as a stream. */
  readonly dataView: DataView;

  /**
   * Constructor of the StringPStream class.
   * @param target The data that represents a string.
   * 
   * Note: if the target is a `DataView`, it will be passed directly by reference to the internal `dataView`.
   */
  constructor(target: string | DataView | ArrayBuffer | TypedArray) {
    this.index = 0;
    
    if (typeof target === "string")
      this.dataView = new DataView(encoder.encode(target).buffer);
    else if (target instanceof ArrayBuffer)
      this.dataView = new DataView(target);
    else if (target instanceof DataView)
      this.dataView = target;
    else
      this.dataView = new DataView(target.buffer);
    
    this.length = this.dataView.byteLength;
  }

  elementAt(i: number): number | null {
    try {
      return this.dataView.getUint8(i);
    } catch (e) {
      return null;
    }
  }

  /**
   * Safely clones the current `StringPStream`.
   * 
   * Note: the internal `dataView` is passed by reference for performance reasons, as it is meant to be immutable anyways.
   */
  clone(): StringPStream {
    const stream = new StringPStream(this.dataView);
    stream.index = this.index;
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

  /**
   * Gets a string of a certain length from the internal dataview.
   * @param index The index of the first character in the string.
   * @param length The number of characters to get.
   */
  getString(index: number, length: number): string {
    const dataView = this.dataView;
    const bytes = Uint8Array.from(
      { length },
      (_, i) => dataView.getUint8(index + i)
    );
    return decoder.decode(bytes);
  }

  /**
   * Gets the next characters in a string using a bytelength from the internal dataview.
   * @param byteLength The number of bytes to get.
   */
  nextString(byteLength: number): string {
    const dataView = this.dataView;
    const index = this.index;
    const bytes = Uint8Array.from(
      { length: byteLength },
      (_, i) => {
        this.index = index + i;
        return dataView.getUint8(this.index);
      }
    );
    return decoder.decode(bytes);
  }

  /** Gets the next character with the correct size, *without updating the index*. */
  peekChar(): string {
    return this.getChar(this.index);
  }

  /** Gets the next character in the stream. */
  nextChar(): string {
    const index = this.index;
    const charWidth = this.getCharWidth(index);
    this.index += charWidth;
    return this.getUtf8Char(index, charWidth);
  }

  /** Gets the next `n` characters in the stream. */
  nextChars(n: number): string {
    let s = "";
    let index: number, charWidth: number;
    for (let i = 0; i < n; i++) {
      index = this.index;
      charWidth = this.getCharWidth(index);
      s += this.getUtf8Char(index, charWidth);
      this.index += charWidth;
    }
    return s;
  }
}