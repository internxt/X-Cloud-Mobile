import { Transform, Readable } from 'readable-stream';

import { GetFileMirror } from './fileinfo';
import { ExchangeReport } from './reports';

import * as api from '../services/request';

import { HashStream } from '../lib/hashstream';
import { ripemd160 } from '../lib/crypto';

import { EnvironmentConfig } from '..';

export interface Shard {
  index: number;
  replaceCount: number;
  hash: string;
  size: number;
  parity: boolean;
  token: string;
  healthy?: boolean;
  farmer: {
    userAgent: string
    protocol: string
    address: string
    port: number
    nodeID: string
    lastSeen: Date
  };
  operation: string;
}

export function DownloadShardRequest(config: EnvironmentConfig, address: string, port: number, hash: string, token: string, nodeID: string): Promise<Readable> {
  const fetchUrl = `http://${address}:${port}/shards/${hash}?token=${token}`;

  return api.streamRequest(fetchUrl, nodeID, true, 15);
}

export async function DownloadShard(config: EnvironmentConfig, shard: Shard, bucketId: string, fileId: string, excludedNodes: string[] = []): Promise<Transform | never> {

  const hasher = new HashStream(shard.size);
  const exchangeReport = new ExchangeReport(config);
  const shardBinary = await DownloadShardRequest(config, shard.farmer.address, shard.farmer.port, shard.hash, shard.token, shard.farmer.nodeID);

  const outputStream = shardBinary.pipe<HashStream>(hasher);

  const finalShardHash: string = await new Promise((resolve) => {
    hasher.on('end', () => { resolve(ripemd160(hasher.read()).toString('hex')); });
  });

  exchangeReport.params.dataHash = finalShardHash;
  exchangeReport.params.exchangeEnd = new Date();
  exchangeReport.params.farmerId = shard.farmer.nodeID;

  if (finalShardHash === shard.hash) {
    console.log('Hash %s is OK', finalShardHash);
    exchangeReport.DownloadOk();

    // exchangeReport.sendReport()
    return outputStream;
  } else {
    console.error('Hash %s is WRONG', finalShardHash);
    exchangeReport.DownloadError();
    // exchangeReport.sendReport()
    excludedNodes.push(shard.farmer.nodeID);
    const anotherMirror: Shard[] = await GetFileMirror(config, bucketId, fileId, 1, shard.index, excludedNodes);

    if (!anotherMirror[0].farmer) {
      throw Error('File missing shard error');
    } else {
      return DownloadShard(config, anotherMirror[0], bucketId, fileId, excludedNodes);
    }
  }
}
