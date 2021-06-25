import { Transform } from 'readable-stream';

export class FunnelStream extends Transform {
    private limit: number;

    private buffer: Buffer;
    private bufferOffset = 0;
    private lastChunkLength = 0;

    constructor(limit = 1) {
      super();
      this.limit = limit;
      this.buffer = Buffer.alloc(limit);
    }

    private bufferStillHasData(): boolean {
      return this.bufferOffset !== 0;
    }

    private bufferIsEmpty(): boolean {
      return this.bufferOffset === 0;
    }

    private pushToReadable(b: Buffer): void {
      this.push(b);
    }

    private pushBuffer(): void {
      this.pushToReadable(this.buffer);
    }

    _transform(chunk: Buffer, enc: string, done: (err: Error | null) => void): void {
      if (this.bufferStillHasData()) {
        const bytesToPush = (this.limit - this.bufferOffset);

        const enoughToFillBuffer = () => chunk.length >= bytesToPush;
        const completeBuffer = () => chunk.copy(this.buffer, this.bufferOffset, 0, bytesToPush);
        const addToBuffer = () => chunk.copy(this.buffer, this.bufferOffset);
        const resetOffset = () => this.bufferOffset = 0;
        const incrementOffset = (increment: number) => this.bufferOffset += increment;

        if (enoughToFillBuffer()) {
          completeBuffer();

          this.pushBuffer();

          resetOffset();
          chunk = chunk.slice(0, chunk.length - bytesToPush);
        } else {
          addToBuffer();
          incrementOffset(chunk.length);
        }
      }

      const pushChunks = (chunk: Buffer): Buffer => {
        let offset = 0;
        let chunkSize = chunk.length;

        const notIteratedEntireBuffer = () => chunkSize >= this.limit;

        while (notIteratedEntireBuffer()) {
          this.pushToReadable(chunk.slice(offset, offset + this.limit));

          offset += this.limit;
          chunkSize -= this.limit;
        }

        return chunk.slice(offset, offset + chunkSize);
      };

      if (this.bufferIsEmpty()) {
        const remainingChunk = pushChunks(chunk);

        if (remainingChunk.length) {
          // save remaining chunk for the next event
          remainingChunk.copy(this.buffer);

          this.lastChunkLength = remainingChunk.byteLength;
          this.bufferOffset += remainingChunk.length;
        }
      }

      done(null);
    }

    _flush(done: () => void): void {
      if (this.bufferStillHasData()) {
        this.pushToReadable(this.buffer.slice(0, this.lastChunkLength));
      }
      done();
    }
}
