import { Transform } from 'readable-stream';

type ErrorEvent = 'error';
type ErrorListener = (err: Error) => void;
type onErrorListener = (event: ErrorEvent, listener: ErrorListener) => void;

type DataEvent = 'data';
type DataListener = (chunk: Buffer) => void;
type onDataListener = (event: DataEvent, listener: DataListener) => void;

type EndEvent = 'end';
type EndListener = (err?: Error) => void;
type onEndListener = (event: EndEvent, listener: EndListener) => void;

type StreamEvent = ErrorEvent | DataEvent | EndEvent;
type StreamListener = ErrorListener & DataListener & EndListener;
type onListener = onDataListener & onEndListener & onErrorListener;

export class FunnelStream {
  public limit: number;

  private internalBuffer: Buffer;
  private internalBufferOffset = 0;
  private target: Transform;

  private listeners: Map<StreamEvent, StreamListener[]> = new Map<StreamEvent, StreamListener[]>();

  constructor(limit = 1) {
    this.internalBuffer = Buffer.alloc(limit);

    this.listeners.set('end', []);
    this.listeners.set('data', []);
    this.listeners.set('error', []);
  }

  on: onListener = (event, listener) => {
    this.listeners.get(event).push(listener);
  }

  pipe(target: Transform): Transform {
    this.target = target;

    return this.target;
  }

  emit(event: StreamEvent, content: any): void {
    this.listeners.get(event).forEach((fn) => { fn(content) });
  }

  push(data: Buffer): void {
    if (!data) { return; }

    if (!this.target) {
      this.listeners.get('error').forEach((fn) => {
        fn(Error('Target not set, call pipe() before push()'));
      });
    }

    let remainingBytes = data.length;

    while (remainingBytes > this.internalBuffer.length - this.internalBufferOffset) {
      data.copy(this.internalBuffer, this.internalBufferOffset, 0, this.internalBuffer.length - this.internalBufferOffset);
      data = data.slice(this.internalBuffer.length - this.internalBufferOffset);

      this.target.push(this.internalBuffer)

      this.listeners.get('data').forEach((fn) => { fn(this.internalBuffer) });

      remainingBytes -= this.internalBuffer.length - this.internalBufferOffset;
      this.internalBufferOffset = 0;
    }

    data.copy(this.internalBuffer, this.internalBufferOffset);
    this.internalBufferOffset += data.length;
  }

  end(): void {
    if (!this.target) {
      this.listeners.get('error').forEach((fn) => {
        fn(Error('Target not set, call pipe() before end()'));
      });
    }
    if (this.internalBufferOffset > 0) {
      this.push(this.internalBuffer.slice(0, this.internalBufferOffset));
    }
    this.target.push(null);
  }
}