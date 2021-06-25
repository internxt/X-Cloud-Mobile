import { Transform } from 'readable-stream';
import * as crypto from 'react-native-crypto';
import { sha256HashBuffer } from './crypto';

export class HashStream extends Transform {
  private hasher: crypto.Hash;
  private length: number;
  private flushed = false;
  public finalHash: Buffer | null;
  private expectedSize = 1;

  constructor(expectedSize?: number) {
    super();
    this.hasher = sha256HashBuffer();
    this.length = 0;
    this.finalHash = Buffer.alloc(0);
    this.expectedSize = expectedSize || 1;
  }

  _transform(chunk: Buffer, enc: BufferEncoding, callback: (err: Error | null, chunk: Buffer) => void): void {
    this.hasher.update(chunk);
    this.length += chunk.length;
    this.emit('progress', this.length * 100 / this.expectedSize);
    callback(null, chunk);
  }

  _flush(): void {
    this.hasher.end();
    this.emit('end');
  }

  read(): Buffer { return this.finalHash = this.hasher.read(); }

}
