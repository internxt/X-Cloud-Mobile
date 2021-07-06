import { Transform, Duplex } from 'readable-stream';

type BufferEncoding = 'ascii' | 'utf8' | 'utf-8' | 'utf16le' | 'ucs2' | 'ucs-2' | 'base64' | 'latin1' | 'binary' | 'hex';

export class Base64ToUtf8Transform extends Transform {
  push(chunk: Buffer, encoding?: BufferEncoding): boolean {
    if (chunk) {
      return Duplex.prototype.push.call(this, chunk, encoding);
    }

    return Duplex.prototype.push.call(this, null, encoding);
  }
}