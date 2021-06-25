import { Readable } from 'readable-stream';

import { Upload } from './lib/upload';
import { Download } from './lib/download';
import { EncryptFilename } from './lib/crypto';
import { logger } from './lib/utils/logger';

import { FileMeta } from './api/FileObjectUpload';
import { CreateEntryFromFrameResponse } from './services/request';

import { BUCKET_ID_NOT_PROVIDED, ENCRYPTION_KEY_NOT_PROVIDED } from './api/constants';
import { ActionState, ActionTypes } from './api/ActionState';

export type OnlyErrorCallback = (err: Error | null) => void;
export type UploadFinishCallback = (err: Error | null, response: CreateEntryFromFrameResponse | null) => void;
export type DownloadFinishedCallback = (err: Error | null, fileStream: Readable | null) => void;
export type DownloadProgressCallback = (progress: number, downloadedBytes: number | null, totalBytes: number | null) => void;
export type DecryptionProgressCallback = (progress: number, decryptedBytes: number | null, totalBytes: number | null) => void;
export type UploadProgressCallback = (progress: number, uploadedBytes: number | null, totalBytes: number | null) => void;

export interface ResolveFileOptions {
  progressCallback: DownloadProgressCallback;
  finishedCallback: OnlyErrorCallback;
  overwritte?: boolean;
}

export interface DownloadFileOptions {
  progressCallback: DownloadProgressCallback;
  decryptionProgressCallback?: DecryptionProgressCallback;
  finishedCallback: DownloadFinishedCallback;
}

interface UploadFileParams {
  filename: string;
  fileSize: number;
  fileContent: Readable;
  progressCallback: UploadProgressCallback;
  finishedCallback: UploadFinishCallback;
}

export class Environment {
  protected config: EnvironmentConfig;

  constructor(config: EnvironmentConfig) {
    this.config = config;
  }

  setEncryptionKey(newEncryptionKey: string): void {
    this.config.encryptionKey = newEncryptionKey;
  }

  downloadFile(bucketId: string, fileId: string, options: DownloadFileOptions): ActionState {
    const downloadState = new ActionState(ActionTypes.DOWNLOAD);

    if (!this.config.encryptionKey) {
      options.finishedCallback(Error(ENCRYPTION_KEY_NOT_PROVIDED), null);
      return downloadState;
    }

    if (!bucketId) {
      options.finishedCallback(Error(BUCKET_ID_NOT_PROVIDED), null);
      return downloadState;
    }

    Download(this.config, bucketId, fileId, options, downloadState);

    return downloadState;
  }

  /**
   * Uploads a file from a web browser
   * @param bucketId Bucket id where file is going to be stored
   * @param params Upload file params
   */
  uploadFile(bucketId: string, params: UploadFileParams): void {
    if (!this.config.encryptionKey) {
      params.finishedCallback(Error('Mnemonic was not provided, please, provide a mnemonic'), null);
      return;
    }

    if (!bucketId) {
      params.finishedCallback(Error('Bucket id was not provided'), null);
      return;
    }

    if (!params.filename) {
      params.finishedCallback(Error('Filename was not provided'), null);
      return;
    }

    if (params.fileContent.size === 0) {
      params.finishedCallback(Error('Can not upload a file with size 0'), null);
      return;
    }

    const { filename, fileSize: size, fileContent, progressCallback: progress, finishedCallback: finished } = params;

    EncryptFilename(this.config.encryptionKey, bucketId, filename)
      .then((name: string) => {
        logger.debug(`Filename ${filename} encrypted is ${name}`);

        const fileToUpload: FileMeta = { content: fileContent, name, size };

        Upload(this.config, bucketId, fileToUpload, progress, finished);
      })
      .catch((err: Error) => {
        logger.error(`Error encrypting filename due to ${err.message}`);
        logger.error(err);

        finished(err, null);
      });
  }

  /**
   * Cancels the download
   * @param state Download file state at the moment
   */
  resolveFileCancel(state: ActionState): void {
    state.stop();
  }
}

export interface EnvironmentConfig {
  bridgeUrl?: string;
  bridgeUser: string;
  bridgePass: string;
  encryptionKey?: string;
  logLevel?: number;
  webProxy?: string;
  config?: {
    shardRetry: number
  };
}
