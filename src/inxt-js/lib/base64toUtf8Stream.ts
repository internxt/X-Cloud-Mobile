import { Transform } from 'readable-stream';

export class Base64ToUtf8Transform extends Transform {
  private lastChunk: Buffer;
  private highWatermark: number;

  constructor(highWatermark: number) {
    super();
    this.highWatermark = highWatermark;
  }

  _transform(chunk: Buffer, enc: string, cb: (err: Error | null, data: Buffer) => void): void {
    // chunk is encoded in base64
    const lastChunkToUtf8 = Buffer.from(chunk.toString('utf8'), 'utf8');

    this.lastChunk = lastChunkToUtf8.slice(this.highWatermark);
    cb(null, Buffer.from(lastChunkToUtf8.slice(0, this.highWatermark)));
  }

  _flush(cb: (err: Error | null, data: Buffer) => void): void {
    if (this.lastChunk.length > 0) {
      this.push(this.lastChunk, 'utf8');
    }
    cb(null, null);
  }
}
