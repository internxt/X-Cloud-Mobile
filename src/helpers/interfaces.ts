/* eslint-disable camelcase */
export interface IUser {
  bucket: string
  createdAt: Date
  credit: number
  email: string
  lastname: string
  mnemonic: string
  name: string
  privateKey: string
  publicKey: string
  registerCompleted: boolean
  revocationKey: string
  rootFolderId: number
  userId: string
  uuid: string
}

export interface ICurrentPlan {
  usage: number
  limit: number
  percentage: number
}
interface IChildren {
  bucket: string
  color: string
  createdAt: Date
  encrypt_version: string
  icon: string
  iconId: any
  icon_id: any
  id: number
  name: string
  parentId: number
  parent_id: number
  updatedAt: Date
  userId: number
  user_id: number
}
export interface IContentFolder {
  bucket: string
  children: IChildren[]
  color: string
  createdAt: Date
  encrypt_version: string
  files: any[]
  icon: string
  iconId: any
  icon_id: any
  id: number
  name: string
  parentId: number
  parent_Id: number
  updatedAt: Date
  userId: number
  user_id: number
  currentFolder: number
}

export interface IUri {
  split(arg0: string): any;
  fileUri: string
  fileName: string
}
export interface IFilesState {
  filesAlreadyUploaded: any [],
  filesCurrentlyUploading: any [],
  folderContent: IContentFolder,
  isUploading: boolean,
  isUploadingFileName: string,
  items: any [],
  loading: boolean,
  progress: number,
  rootFolderContent: IContentFolder,
  searchString: string,
  selectedFile: any,
  selectedItems: any[],
  sortFunction: (() => any),
  sortType: string,
  startDownloadSelectedFile: boolean,
  uploadFileUri: string,
  uri: IUri
}