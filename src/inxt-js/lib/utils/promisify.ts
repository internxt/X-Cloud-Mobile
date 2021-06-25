import { Readable } from 'readable-stream';

export function promisifyStream(stream: Readable): Promise<void> {
  return new Promise((res, rej) => {
    stream.on('error', rej);
    stream.on('end', res);
  })
}