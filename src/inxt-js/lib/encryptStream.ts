import { Transform } from 'readable-stream';
import { createCipheriv, Cipher } from 'react-native-crypto';

interface RawShard {
  size: number;
  index: number;
}

export class EncryptStream extends Transform {
  private cipher: Cipher;
  public encrypted_bytes = 0;
  public shards: RawShard [] = [];
  private indexCounter = 0;

  constructor(key: Buffer, iv: Buffer) {
    super();
    this.cipher = createCipheriv('aes-256-ctr', key, iv);
  }

  _transform(chunk: Buffer, enc: string, cb: (err: Error | null, data: Buffer) => void): void {
    this.cipher.write(chunk);

    this.shards.push({ size: chunk.byteLength, index: this.indexCounter });
    this.indexCounter++;

    this.encrypted_bytes += Buffer.byteLength(chunk);
    cb(null, this.cipher.read());
  }

  _flush(cb: (err: Error | null, data: Buffer) => void) {
    cb(null, this.cipher.read());
  }
}

export default EncryptStream;
