import { Environment } from '../inxt-js';
import { createHash } from 'react-native-crypto';
import { Readable } from 'readable-stream';

import { getUser } from '../database/DBUtils.ts/utils';
import RNFetchBlob from 'rn-fetch-blob';
import { Base64ToUtf8Transform } from '../inxt-js/lib/base64toUtf8Stream';

type ProgressCallback = (progress: number, uploadedBytes: number | null, totalBytes: number | null) => void;

interface IUploadParams {
  filesize: number,
  filepath: string,
  filecontent: Readable,
  progressCallback: ProgressCallback;
}

interface IMobileUploadParams {
  fileUri: string;
  progressCallback: ProgressCallback;
}

interface IDownloadParams {
  progressCallback: ProgressCallback;
}

interface EnvironmentConfig {
  bridgeUser: string,
  bridgePass: string,
  encryptionKey: string,
  bucketId: string
}

/**
 * TODO: Change typing in inxt-js and remove this interface
 */
interface CreateEntryFromFrameResponse {
  id: string;
  index: string;
  frame: string;
  bucket: string;
  mimetype: string;
  name: string;
  renewal: string;
  created: string;
  hmac: {
    value: string;
    type: string;
  };
  erasure: {
    type: string;
  };
  size: number;
}

export class Network {
    private environment: Environment;
    private bridgeUrl = 'https://api.internxt.com';

    constructor(bridgeUser: string, bridgePass: string, encryptionKey: string) {
      if (!bridgeUser) {
        throw new Error('Bridge user not provided');
      }

      if (!bridgePass) {
        throw new Error('Bridge pass not provided');
      }

      if (!encryptionKey) {
        throw new Error('Mnemonic not provided');
      }

      this.environment = new Environment({ bridgePass, bridgeUser, encryptionKey, bridgeUrl: this.bridgeUrl });
    }

    async uploadFile(bucketId: string, params: IMobileUploadParams): Promise<string> {
      const fileStream = await RNFetchBlob.fs.readStream(params.fileUri, 'base64', 4095);
      const base64toUtf8Transformer = new Base64ToUtf8Transform(4095);

      fileStream.onError((err) => {
        console.log('STREAM ERR', err);
        base64toUtf8Transformer.emit('error', err);
      });

      fileStream.onData((chunk) => { base64toUtf8Transformer.push(chunk) });
      fileStream.onEnd(() => { base64toUtf8Transformer.push(null) });
      fileStream.open();

      const stat = await RNFetchBlob.fs.stat(params.fileUri);

      return this._uploadFile(bucketId, {
        filepath: '',
        filecontent: base64toUtf8Transformer,
        filesize: parseInt(stat.size),
        progressCallback: params.progressCallback
      });
    }

    /**
     * Uploads a file to the Internxt Network
     * @param bucketId Bucket where file is going to be uploaded
     * @param params Required params for uploading a file
     * @returns Id of the created file
     */
    private _uploadFile(bucketId: string, params: IUploadParams): Promise<string> {
      if (!bucketId) {
        throw new Error('Bucket id not provided');
      }

      const hashName = createHash('ripemd160').update(params.filepath).digest('hex');

      return new Promise((resolve: (entry: CreateEntryFromFrameResponse) => void, reject) => {
        this.environment.uploadFile(bucketId, {
          filename: hashName,
          fileSize: params.filesize,
          fileContent: params.filecontent,
          progressCallback: params.progressCallback,
          finishedCallback: (err, response) => {
            if (err) {
              return reject(err);
            }

            resolve(response);
          }
        });
      }).then((uploadRes) => {
        return uploadRes.id;
      });
    }

    /**
     * Downloads a file from the Internxt Network
     * @param bucketId Bucket where file is uploaded
     * @param fileId Id of the file to be downloaded
     * @param params Required params for downloading a file
     * @returns
     */
    downloadFile(bucketId: string, fileId: string, params: IDownloadParams): void {
    //   if (!bucketId) {
    //     throw new Error('Bucket id not provided');
    //   }

      //   if (!fileId) {
      //     throw new Error('File id not provided');
      //   }

      //   return new Promise((resolve, reject) => {
      //     this.environment.downloadFile(bucketId, fileId, {
      //       progressCallback: params.progressCallback,
      //       finishedCallback: (err: Error | null, filecontent: Blob | null) => {
      //         if (err) {
      //           return reject(err);
      //         }

      //         if (!filecontent) {
      //           return reject(Error('Downloaded file is empty'));
      //         }

    //         resolve(filecontent);
    //       }
    //     });
    //   });
    }
}

/**
 * Returns required config to upload files to the Internxt Network
 * @returns
 */
export function getEnvironmentConfig(): Promise<EnvironmentConfig> {
  return getUser().then((user) => ({
    bridgeUser: user.email,
    bridgePass: user.userId,
    encryptionKey: user.mnemonic,
    bucketId: user.bucket
  }));
}