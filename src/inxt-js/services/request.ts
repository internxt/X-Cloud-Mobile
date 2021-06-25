import * as url from 'url';
// import * as https from 'https';
import { Readable } from 'readable-stream';
import { ClientRequest, IncomingMessage } from 'http';
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';

import { EnvironmentConfig } from '..';
import { sha256 } from '../lib/crypto';
import { ExchangeReport } from '../api/reports';

import { ShardMeta } from '../lib/shardMeta';
import { ContractNegotiated } from '../lib/contracts';
import { Shard } from '../api/shard';
import { getProxy, ProxyManager } from './proxy';
import { logger } from '../lib/utils/logger';

const INXT_API_URL = process.env.INXT_API_URL;
const PROXY = 'https://api.internxt.com:8081';

export async function request(config: EnvironmentConfig, method: AxiosRequestConfig['method'], targetUrl: string, params: AxiosRequestConfig, useProxy = true): Promise<AxiosResponse<JSON>> {
  let reqUrl = targetUrl;
  let proxy: ProxyManager;

  if (useProxy) {
    proxy = await getProxy();
    reqUrl = `${proxy.url}/${targetUrl}`;
  }

  const DefaultOptions: AxiosRequestConfig = {
    method,
    auth: {
      username: config.bridgeUser,
      password: sha256(Buffer.from(config.bridgePass)).toString('hex')
    },
    url: reqUrl,
    maxContentLength: Infinity
  };

  const options = { ...DefaultOptions, ...params };

  return axios.request<JSON>(options).then((value: AxiosResponse<JSON>) => {
    if (useProxy && proxy) { proxy.free(); }

    return value;
  });
}

export async function streamRequest(targetUrl: string, nodeID: string, useProxy = true, timeoutSeconds?: number): Promise<Readable> {
  let proxy: ProxyManager;
  let reqUrl = targetUrl;

  if (useProxy) {
    proxy = await getProxy();
    reqUrl = `${proxy.url}/${targetUrl}`;
  }

  logger.info('Stream req (using proxy %s) to %s', useProxy, reqUrl);

  const uriParts = url.parse(reqUrl);
  let downloader: ClientRequest | null = null;

  // function _createDownloadStream(): ClientRequest {
  function _createDownloadStream(): any {
    // return https.get({
    //   protocol: uriParts.protocol,
    //   hostname: uriParts.hostname,
    //   port: uriParts.port,
    //   path: uriParts.path,
    //   headers: {
    //     'content-type': 'application/octet-stream',
    //     'x-storj-node-id': nodeID
    //   }
    // });
  }

  return new Readable({
    read() {
      if (!downloader) {
        downloader = _createDownloadStream();

        if (timeoutSeconds) {
          downloader.setTimeout(timeoutSeconds * 1000, () => {
            downloader?.destroy(Error(`Request timeouted after ${timeoutSeconds} seconds`));
          })
        }

        if (useProxy && proxy) { proxy.free(); }

        downloader.on('response', (res: IncomingMessage) => {
          res
            .on('data', this.push.bind(this))
            .on('error', this.emit.bind(this, 'error'))
            .on('end', () => {
              this.push.bind(this, null);
              this.emit('end');
            }).on('close', this.emit.bind(this, 'close'));
        })
          .on('error', this.emit.bind(this, 'error'))
          .on('timeout', () => this.emit('error', Error('Request timeout')));
      }
    }
  });
}

interface getBucketByIdResponse {
  user: string;
  encryptionKey: string;
  publicPermissions: string[];
  created: string;
  name: string;
  pubkeys: string[];
  status: 'Active' | 'Inactive';
  transfer: number;
  storage: number;
  id: string;
}

/**
 * Checks if a bucket exists given its id
 * @param config App config
 * @param bucketId
 * @param token
 * @param jwt JSON Web Token
 * @param params
 */
export function getBucketById(config: EnvironmentConfig, bucketId: string, params?: AxiosRequestConfig): Promise<getBucketByIdResponse | void> {
  const URL = config.bridgeUrl ? config.bridgeUrl : INXT_API_URL;
  const targetUrl = `${URL}/buckets/${bucketId}`;
  const defParams: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/octet-stream'
    }
  };

  const finalParams = { ...defParams, ...params };

  return request(config, 'get', targetUrl, finalParams, false)
    .then<getBucketByIdResponse>((res: AxiosResponse) => res.data);
}

interface getFileByIdResponse {
  /* file-id */
  id: string;
}

/**
 * Checks if a file exists given its id and a bucketId
 * @param config App config
 * @param bucketId
 * @param fileId
 * @param jwt JSON Web Token
 * @param params
 */
export function getFileById(config: EnvironmentConfig, bucketId: string, fileId: string, params?: AxiosRequestConfig): Promise<getFileByIdResponse | void> {
  const URL = config.bridgeUrl ? config.bridgeUrl : INXT_API_URL;
  const targetUrl = `${URL}/buckets/${bucketId}/file-ids/${fileId}`;
  const defParams: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/octet-stream'
    }
  };

  const finalParams = { ...defParams, ...params };

  return request(config, 'get', targetUrl, finalParams, false)
    .then<getFileByIdResponse>((res: AxiosResponse) => res.data);
}

export interface FrameStaging {
  /* frame id */
  id: string;
  /* user email */
  user: string;
  shards: [];
  storageSize: number;
  /* frame size */
  size: number;
  locked: boolean;
  /* created timestamp stringified */
  created: string;
}

/**
 * Creates a file staging frame
 * @param config App config
 * @param params
 */
export function createFrame(config: EnvironmentConfig, params?: AxiosRequestConfig): Promise <FrameStaging> {
  const URL = config.bridgeUrl ? config.bridgeUrl : INXT_API_URL;
  const targetUrl = `${URL}/frames`;
  const defParams: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/octet-stream'
    }
  };

  const finalParams = { ...defParams, ...params };

  return request(config, 'post', targetUrl, finalParams, false)
    .then<FrameStaging>((res: AxiosResponse) => res.data);
}

export interface CreateEntryFromFrameBody {
  frame: string;
  filename: string;
  index: string;
  hmac: {
    type: string,
    value: string
  };
  erasure?: {
    type: string
  };
}

export interface CreateEntryFromFrameResponse {
  /* bucket entry id */
  id: string;
  index: string;
  /* frame id */
  frame: string;
  /* bucket id */
  bucket: string;
  mimetype: string;
  name: string;
  renewal: string;
  created: string;
  hmac: {
    value: string,
    type: string
  };
  erasure: {
    type: string
  };
  size: number;
}

/**
 * Creates a bucket entry from the given frame object
 * @param {EnvironmentConfig} config App config
 * @param {string} bucketId
 * @param {CreateEntryFromFrameBody} body
 * @param {string} jwt JSON Web Token
 * @param {AxiosRequestConfig} params
 */
export function createEntryFromFrame(config: EnvironmentConfig, bucketId: string, body: CreateEntryFromFrameBody, params?: AxiosRequestConfig): Promise <CreateEntryFromFrameResponse | void> {
  const URL = config.bridgeUrl ? config.bridgeUrl : INXT_API_URL;
  const targetUrl = `${URL}/buckets/${bucketId}/files`;
  const defParams: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/octet-stream'
    },
    data: body
  };

  const finalParams = { ...defParams, ...params };

  return request(config, 'post', targetUrl, finalParams, false)
    .then<CreateEntryFromFrameResponse>((res: AxiosResponse) => res.data);
}

interface AddShardToFrameBody {
  /* shard hash */
  hash: string;
  /* shard size */
  size: number;
  /* shard index */
  index: number;
  /* if exists a shard parity for this shard */
  parity: boolean;
  /* shard challenges */
  challenges: string[];
  tree: string[];
  /* nodes excluded from being the shard's node */
  exclude: string[];
}

/**
 * Negotiates a storage contract and adds the shard to the frame
 * @param {EnvironmentConfig} config App config
 * @param {string} frameId
 * @param {AddShardToFrameBody} body
 * @param {string} jwt JSON Web Token
 * @param {AxiosRequestConfig} params
 */
export function addShardToFrame(config: EnvironmentConfig, frameId: string, body: ShardMeta, params?: AxiosRequestConfig): Promise <ContractNegotiated | void> {
  const URL = config.bridgeUrl ? config.bridgeUrl : INXT_API_URL;
  const targetUrl = `${URL}/frames/${frameId}`;
  const defParams: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/octet-stream'
    },
    data: { ...body, challenges: body.challenges_as_str }
  };

  const finalParams = { ...defParams, ...params };

  return request(config, 'put', targetUrl, finalParams, false)
    .then<ContractNegotiated>((res: AxiosResponse) => res.data);
}

/**
 * Sends an upload exchange report
 * @param config App config
 * @param body
 */
export function sendUploadExchangeReport(config: EnvironmentConfig, exchangeReport: ExchangeReport): Promise<AxiosResponse<JSON>> {
  return exchangeReport.sendReport();
}

interface SendShardToNodeResponse {
  result: string;
}

/**
 * Stores a shard in a node
 * @param config App config
 * @param shard Interface that has the contact info
 * @param content Buffer with shard content
 */
export function sendShardToNode(config: EnvironmentConfig, shard: Shard, content: Buffer): Promise<SendShardToNodeResponse | void> {
  const targetUrl = `http://${shard.farmer.address}:${shard.farmer.port}/shards/${shard.hash}?token=${shard.token}`;

  const defParams: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/octet-stream',
      'x-storj-node-id': shard.farmer.nodeID
    },
    data: content
  };

  return request(config, 'post', targetUrl, defParams)
    .then<SendShardToNodeResponse>((res: AxiosResponse) => res.data);
}
