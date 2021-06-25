import { randomBytes } from 'react-native-crypto';
import { Readable } from 'readable-stream';
import { doUntil, eachLimit, retry } from 'async';

import DecryptStream from '../lib/decryptstream';
import FileMuxer from '../lib/filemuxer';
import { GenerateFileKey } from '../lib/crypto';

import { ShardObject } from './ShardObject';
import { FileInfo, GetFileInfo, GetFileMirrors, GetFileMirror, ReplacePointer } from './fileinfo';
import { EnvironmentConfig } from '..';
import { Shard } from './shard';
import { ExchangeReport } from './reports';
import { DECRYPT, DOWNLOAD, FILEMUXER } from '../lib/events';
import { utils } from 'rs-wrapper';
import { logger } from '../lib/utils/logger';
import { bufferToStream } from '../lib/utils/buffer';
import { DEFAULT_INXT_MIRRORS, DOWNLOAD_CANCELLED, DOWNLOAD_CANCELLED_ERROR } from './constants';
import EventEmitter from 'EventEmitter';

const MultiStream = require('multistream');

interface DownloadStream {
  content: Readable;
  index: number;
}

export class FileObject {
  shards: ShardObject[] = [];
  rawShards: Shard[] = [];
  fileInfo: FileInfo | undefined;
  config: EnvironmentConfig;

  length = -1;
  final_length = -1;

  bucketId: string;
  fileId: string;

  fileKey: Buffer;

  totalSizeWithECs = 0;

  decipher: DecryptStream;

  private stopped = false;

  ev: EventEmitter;

  constructor(config: EnvironmentConfig, bucketId: string, fileId: string) {
    // super();
    this.config = config;
    this.bucketId = bucketId;
    this.fileId = fileId;
    this.fileKey = Buffer.alloc(0);
    this.decipher = new DecryptStream(randomBytes(32), randomBytes(16));
    this.ev = new EventEmitter();

    // DOWNLOAD_CANCELLED attach one listener per concurrent download
    // this.setMaxListeners(100);
  }

  async GetFileInfo(): Promise<FileInfo | undefined> {
    if (this.stopped) {
      return;
    }

    logger.info('Retrieving file info...');

    if (!this.fileInfo) {
      this.fileInfo = await GetFileInfo(this.config, this.bucketId, this.fileId);
      if (this.config.encryptionKey) {
        this.fileKey = await GenerateFileKey(this.config.encryptionKey, this.bucketId, Buffer.from(this.fileInfo.index, 'hex'));
      }
    }

    return this.fileInfo;
  }

  async GetFileMirrors(): Promise<void> {
    if (this.stopped) {
      return;
    }

    logger.info('Retrieving file mirrors...');

    this.rawShards = await GetFileMirrors(this.config, this.bucketId, this.fileId);

    await eachLimit(this.rawShards, 1, (shard: Shard, nextShard) => {
      let attempts = 0;

      if (!shard.farmer || !shard.farmer.nodeID || !shard.farmer.port || !shard.farmer.address) {
        logger.warn('Pointer for shard %s failed, retrieving a new one', shard.index);

        // try download from 10 mirrors
        doUntil((next: (err: Error | null, result: Shard | null) => void) => {
          ReplacePointer(this.config, this.bucketId, this.fileId, shard.index, []).then((newShard) => {
            next(null, newShard[0]);
          }).catch((err) => {
            next(err, null);
          }).finally(() => {
            attempts++;
          });
        }, (result: Shard | null, next: any) => {
          const validPointer = result && result.farmer && result.farmer.nodeID && result.farmer.port && result.farmer.address;

          return next(null, validPointer || attempts >= DEFAULT_INXT_MIRRORS);
        }).then((result: any) => {
          logger.info('Pointer replaced for shard %s', shard.index);

          result.farmer.address = result.farmer.address.trim();

          this.rawShards[shard.index] = result;
        }).catch(() => {
          logger.error('Pointer not found for shard %s, marking it as unhealthy', shard.index);

          shard.healthy = false;
        }).finally(() => {
          nextShard(null);
        });
      } else {
        shard.farmer.address = shard.farmer.address.trim();

        nextShard(null);
      }
    });

    this.length = this.rawShards.reduce((a, b) => { return { size: a.size + b.size }; }, { size: 0 }).size;
    this.final_length = this.rawShards.filter(x => x.parity === false).reduce((a, b) => { return { size: a.size + b.size }; }, { size: 0 }).size;
  }

  StartDownloadShard(index: number): FileMuxer {
    if (!this.fileInfo) {
      throw new Error('Undefined fileInfo');
    }

    const shardIndex = this.rawShards.map(x => x.index).indexOf(index);
    const shard = this.rawShards[shardIndex];

    const fileMuxer = new FileMuxer({ shards: 1, length: shard.size });

    const shardObject = new ShardObject(this.config, shard, this.bucketId, this.fileId);

    shardObject.StartDownloadShard().then((reqStream: Readable) => {
      fileMuxer.addInputSource(reqStream, shard.size, Buffer.from(shard.hash, 'hex'), null);
    });

    return fileMuxer;
  }

  TryDownloadShardWithFileMuxer(shard: Shard, excluded: string[] = []): Promise<Buffer> {
    const exchangeReport = new ExchangeReport(this.config);

    return new Promise((resolve, reject) => {
      retry({ times: this.config.config?.shardRetry || 3, interval: 1000 }, async (nextTry: any) => {
        exchangeReport.params.exchangeStart = new Date();
        exchangeReport.params.farmerId = shard.farmer.nodeID;
        exchangeReport.params.dataHash = shard.hash;

        let downloadHasError = false;
        let downloadError: Error | null = null;
        let downloadCancelled = false;

        const oneFileMuxer = new FileMuxer({ shards: 1, length: shard.size });
        const shardObject = new ShardObject(this.config, shard, this.bucketId, this.fileId);

        let buffs: Buffer[] = [];

        this.ev.once(DOWNLOAD_CANCELLED, () => {
          buffs = [];
          downloadCancelled = true;

          if (downloaderStream) {
            downloaderStream.destroy();
          }
        });

        oneFileMuxer.on(FILEMUXER.PROGRESS, (msg) => this.ev.emit(FILEMUXER.PROGRESS, msg));
        oneFileMuxer.on('error', (err) => {
          if (err.message === DOWNLOAD_CANCELLED_ERROR) {
            return;
          }

          downloadHasError = true;
          downloadError = err;
          this.ev.emit(FILEMUXER.ERROR, err);

          exchangeReport.DownloadError();
          exchangeReport.sendReport().catch(() => null);

          oneFileMuxer.emit('drain');
        });

        oneFileMuxer.on('data', (data: Buffer) => { buffs.push(data); });

        oneFileMuxer.once('drain', () => {
          logger.info('Drain received for shard %s', shard.index);

          if (downloadCancelled) {
            nextTry(null, Buffer.alloc(0));
            return;
          }

          if (downloadHasError) {
            nextTry(downloadError);
          } else {
            exchangeReport.DownloadOk();
            exchangeReport.sendReport().catch(() => null);

            nextTry(null, Buffer.concat(buffs));
          }
        });

        const downloaderStream: Readable = await shardObject.StartDownloadShard();

        oneFileMuxer.addInputSource(downloaderStream, shard.size, Buffer.from(shard.hash, 'hex'), null);

      }, async (err: Error | null | undefined, result: any) => {
        try {
          if (!err && result) {
            return resolve(result);
          } else {
            logger.warn('It seems that shard %s download went wrong. Retrying', shard.index);

            excluded.push(shard.farmer.nodeID);

            const newShard = await GetFileMirror(this.config, this.bucketId, this.fileId, 1, shard.index, excluded);

            if (!newShard[0].farmer) {
              return reject(Error('File missing shard error'));
            }

            const buffer = await this.TryDownloadShardWithFileMuxer(newShard[0], excluded);

            return resolve(buffer);
          }
        } catch (err) {
          return reject(err);
        }
      });
    });
  }

  async download(): Promise<Readable> {
    if (!this.fileInfo) {
      throw new Error('Undefined fileInfo');
    }

    let fileStream = Readable.from('');
    const streams: DownloadStream[] = [];

    this.ev.on(DOWNLOAD_CANCELLED, () => {
      this.handleDownloadCancel(streams.map(stream => stream.content).concat([fileStream]));
    });

    this.decipher = new DecryptStream(this.fileKey.slice(0, 32), Buffer.from(this.fileInfo.index, 'hex').slice(0, 16));

    this.decipher.on('error', (err) => this.ev.emit(DECRYPT.ERROR, err));
    this.decipher.on(DECRYPT.PROGRESS, (msg) => this.ev.emit(DECRYPT.PROGRESS, msg));

    const shardSize = utils.determineShardSize(this.final_length);

    const lastShardIndex = this.rawShards.filter(shard => !shard.parity).length - 1;
    const lastShardSize = this.rawShards[lastShardIndex].size;
    const sizeToFillToZeroes = shardSize - lastShardSize;

    logger.info('%s bytes to be added with zeroes for the last shard', sizeToFillToZeroes);

    await Promise.all(this.rawShards.map(async (shard, i) => {
      if (this.stopped) {
        return;
      }

      try {
        if (shard.healthy === false) {
          throw new Error('Bridge request pointer error');
        }

        logger.info('Downloading shard %s', shard.index);

        const shardBuffer = await this.TryDownloadShardWithFileMuxer(shard);
        let content = shardBuffer;

        logger.info('Shard %s downloaded OK', shard.index);
        this.ev.emit(DOWNLOAD.PROGRESS, shardBuffer.length);

        if (i === lastShardIndex && sizeToFillToZeroes > 0) {
          logger.info('Filling with zeroes last shard');

          content = Buffer.concat([content, Buffer.alloc(sizeToFillToZeroes).fill(0)]);

          logger.info('After filling with zeroes, shard size is %s', content.length);
        }

        streams.push({
          content: bufferToStream(content),
          index: shard.index
        });

        shard.healthy = true;
      } catch (err) {
        logger.error('Error downloading shard %s reason %s', shard.index, err.message);
        console.error(err);

        // Fake shard and continue with the next one
        streams.push({
          content: bufferToStream(Buffer.alloc(shardSize).fill(0)),
          index: shard.index
        });

        shard.healthy = false;
      }
    }));

    // Order streams by shard index
    streams.sort((sA, sB) => sA.index - sB.index);

    // Unify them
    fileStream = new MultiStream(streams.map(s => s.content));

    return fileStream;
  }

  private handleDownloadCancel(streams: Readable[] | null[]): void {
    this.stopped = true;

    streams.forEach((stream: Readable | null) => {
      if (stream) {
        stream.destroy();
      }
    });
  }
}
