import { Shard, DownloadShardRequest } from './shard';
import { EnvironmentConfig } from '..';
import { HashStream } from '../lib/hashstream';
import { ExchangeReport } from './reports';
import { Readable } from 'readable-stream';

export class ShardObject {
  shardInfo: Shard;
  shardHash: Buffer | null = null;
  config: EnvironmentConfig;
  fileId: string;
  bucketId: string;

  retryCount = 3;

  hasher: HashStream;
  exchangeReport: ExchangeReport;

  private _isFinished = false;
  private _isErrored = false;

  constructor(config: EnvironmentConfig, shardInfo: Shard, bucketId: string, fileId: string) {
    this.shardInfo = shardInfo;
    this.config = config;

    this.bucketId = bucketId;
    this.fileId = fileId;

    this.hasher = new HashStream(shardInfo.size);
    this.exchangeReport = new ExchangeReport(config);
  }

  StartDownloadShard(): Promise<Readable> {
    return DownloadShardRequest(this.config, this.shardInfo.farmer.address, this.shardInfo.farmer.port, this.shardInfo.hash, this.shardInfo.token, this.shardInfo.farmer.nodeID);
  }

  isFinished(): boolean { return this._isFinished; }
}
