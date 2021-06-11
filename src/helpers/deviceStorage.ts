import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserDeviceStorage {
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

export interface UserPhotosDeviceStorage {
  createdAt: Date
  updatedAt: Date
  deleteFolderId: null
  id: number
  rootAlbumId: string
  rootPreviewId: string
  userId: number
}

export const deviceStorage = {
  async saveItem(key: string, value: any): Promise<void> {
    try {
      return await AsyncStorage.setItem(key, value);
    } catch (error) {
      return error;
    }
  },
  async getItem(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      return null
    }
  },
  async deleteItem(key: string): Promise<void> {
    try {
      return await AsyncStorage.removeItem(key);
    } catch (error) {
      return error;
    }
  },
  async existsItem(key: string): Promise<boolean> {
    return !!this.getItem(key);
  },
  async getUserStorage(): Promise<UserDeviceStorage | null> {
    try {
      const user = await this.getItem('xUser');

      if (user !== null) {
        return JSON.parse(user || '{}');
      }
      return null;
    } catch (error) {
      return error;
    }
  },
  async getTokenStorage(): Promise<string | null> {
    return this.getItem('xToken');
  },
  async getUserPhotosStorage(): Promise<UserPhotosDeviceStorage | null> {
    try {
      const userPhotos = await this.getItem('xPhotos');

      if (userPhotos !== null) {
        return JSON.parse(userPhotos || '{}');
      }
      return null;
    } catch (error) {
      return error;
    }
  }
};
