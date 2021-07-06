import { DocumentPickerResponse } from 'react-native-document-picker';

export interface IFileToUpload extends DocumentPickerResponse {
  progress?: number
  currentFolder?: number
  createdAt?: Date
  id?: string
}