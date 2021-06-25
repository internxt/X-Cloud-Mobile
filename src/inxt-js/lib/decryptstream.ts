import { createDecipheriv, Decipher } from 'react-native-crypto';
import { Transform } from 'readable-stream';
import { DECRYPT } from './events';

export class DecryptStream extends Transform {
  private decipher: Decipher;

  constructor(key: Buffer, iv: Buffer) {
    super();
    this.decipher = createDecipheriv('aes-256-ctr', key, iv);
  }

  _transform(chunk: Buffer, enc: string, cb: (err: Error | null, data: Buffer) => void): void {
    this.decipher.write(chunk);
    this.emit(DECRYPT.PROGRESS, chunk.byteLength);
    cb(null, this.decipher.read());
  }

  _flush(cb: (err: Error | null, data: Buffer) => void): void {
    cb(null, this.decipher.read());
  }
}

export default DecryptStream;
