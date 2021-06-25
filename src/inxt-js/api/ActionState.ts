import { DOWNLOAD_CANCELLED, UPLOAD_CANCELLED } from './constants';
import EventEmitter from 'EventEmitter';

export enum ActionTypes {
  DOWNLOAD = 'DOWNLOAD',
  UPLOAD = 'UPLOAD'
}

export class ActionState {
  private type: ActionTypes;
  private ev: EventEmitter;

  constructor(type: ActionTypes) {
    this.ev = new EventEmitter();
    this.type = type;
  }

  public on(event: string, cb: any): void {
    this.ev.on(event, cb)
  }

  public stop(): void {
    if (this.type === ActionTypes.DOWNLOAD) {
      this.ev.emit(DOWNLOAD_CANCELLED);
    }

    if (this.type === ActionTypes.UPLOAD) {
      this.ev.emit(UPLOAD_CANCELLED);
    }
  }
}