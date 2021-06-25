import { utils } from 'rs-wrapper';
import { Readable } from 'readable-stream';
import { randomBytes } from 'react-native-crypto';

import { EnvironmentConfig } from '..';
import * as api from '../services/request';

import EncryptStream from '../lib/encryptStream';
import { GenerateFileKey, sha512HmacBuffer } from '../lib/crypto';
import { FunnelStream } from '../lib/funnelStream';
import { getShardMeta, ShardMeta } from '../lib/shardMeta';
import { ContractNegotiated } from '../lib/contracts';
import { logger } from '../lib/utils/logger';

import { ExchangeReport } from './reports';
import { Shard } from './shard';

export interface FileMeta {
  size: number;
  name: string;
  content: Readable;
}

export class FileObjectUpload {
  private config: EnvironmentConfig;
  private fileMeta: FileMeta;

  bucketId: string;
  frameId: string;
  index: Buffer;

  cipher: EncryptStream;
  funnel: FunnelStream;
  fileEncryptionKey: Buffer;

  constructor(config: EnvironmentConfig, fileMeta: FileMeta, bucketId: string) {
    this.config = config;
    this.index = Buffer.alloc(0);
    this.fileMeta = fileMeta;
    this.bucketId = bucketId;
    this.frameId = '';
    this.funnel = new FunnelStream(utils.determineShardSize(fileMeta.size));
    this.cipher = new EncryptStream(randomBytes(32), randomBytes(16));
    this.fileEncryptionKey = randomBytes(32);
  }

  async init(): Promise<FileObjectUpload> {
    this.index = randomBytes(32);
    this.fileEncryptionKey = await GenerateFileKey(this.config.encryptionKey || '', this.bucketId, this.index);

    this.cipher = new EncryptStream(this.fileEncryptionKey, this.index.slice(0, 16));

    return this;
  }

  async CheckBucketExistance(): Promise<boolean> {
    // if bucket not exists, bridge returns an error
    await api.getBucketById(this.config, this.bucketId);

    logger.info('Bucket %s exists', this.bucketId);

    return true;
  }

  StageFile(): Promise<void> {
    return api.createFrame(this.config).then((frame) => {
      if (!frame || !frame.id) {
        throw new Error('Bridge frame staging error');
      }

      this.frameId = frame.id;

      logger.info('Staged a file with frame %s', this.frameId);
    });
  }

  SaveFileInNetwork(bucketEntry: api.CreateEntryFromFrameBody): Promise<void | api.CreateEntryFromFrameResponse> {
    return api.createEntryFromFrame(this.config, this.bucketId, bucketEntry);
  }

  NegotiateContract(frameId: string, shardMeta: ShardMeta): Promise<void | ContractNegotiated> {
    return api.addShardToFrame(this.config, frameId, shardMeta);
  }

  async NodeRejectedShard(encryptedShard: Buffer, shard: Shard): Promise<boolean> {
    try {
      await api.sendShardToNode(this.config, shard, encryptedShard);

      return false;
    } catch (err) {
      return Promise.reject(err);
    }
  }

  GenerateHmac(shardMetas: ShardMeta[]): string {
    const hmac = sha512HmacBuffer(this.fileEncryptionKey);

    for (const shardMeta of shardMetas) {
      hmac.update(Buffer.from(shardMeta.hash, 'hex'));
    }

    return hmac.digest().toString('hex');
  }

  async StartUploadFile(): Promise<EncryptStream> {
    logger.info('Starting file upload');

    await this.CheckBucketExistance();
    await this.StageFile();

    return this.fileMeta.content.pipe(this.funnel).pipe(this.cipher);
  }

  async UploadShard(encryptedShard: Buffer, shardSize: number, frameId: string, index: number, attemps: number, parity: boolean): Promise<ShardMeta> {
    const shardMeta: ShardMeta = getShardMeta(encryptedShard, shardSize, index, parity);

    logger.info('Uploading shard %s index %s size %s parity %s', shardMeta.hash, shardMeta.index, shardMeta.size, parity);

    let negotiatedContract: ContractNegotiated | void;
    let token = '', operation = '';
    let farmer = { userAgent: '', protocol: '', address: '', port: 0, nodeID: '', lastSeen: new Date() };

    try {
      if (negotiatedContract = await this.NegotiateContract(frameId, shardMeta)) {
        token = negotiatedContract.token;
        operation = negotiatedContract.operation;
        farmer = { ...negotiatedContract.farmer, lastSeen: new Date() };

        logger.debug('Contract for shard %s (index %s, size %s) with token %s',
          shardMeta.hash,
          shardMeta.index,
          shardMeta.size,
          token
        );
      } else {
        throw new Error('Bridge negotiating contract error');
      }

      const hash = shardMeta.hash;
      const shard: Shard = { index, replaceCount: 0, hash, size: shardSize, parity, token, farmer, operation };

      const exchangeReport = new ExchangeReport(this.config);

      exchangeReport.params.dataHash = hash;
      exchangeReport.params.farmerId = shard.farmer.nodeID;

      if (await this.NodeRejectedShard(encryptedShard, shard)) {
        exchangeReport.UploadError();
      } else {
        logger.debug('Node %s accepted shard %s', shard.farmer.nodeID, shard.hash);

        exchangeReport.UploadOk();
      }

      exchangeReport.params.exchangeEnd = new Date();
      exchangeReport.sendReport().catch(() => {
        // no op
      });
    } catch (err) {
      if (attemps > 1) {
        logger.error('Upload for shard %s failed. Reason %s. Retrying ...', shardMeta.hash, err.message);
        await this.UploadShard(encryptedShard, shardSize, frameId, index, --attemps, parity);
      } else {
        return Promise.reject(err);
      }
    }

    logger.info('Shard %s uploaded succesfully', shardMeta.hash);

    return shardMeta;
  }

}
