import { Platform, Alert } from 'react-native'
import RNFetchBlob from 'rn-fetch-blob'
import { deviceStorage } from '../helpers'
import { IUser } from '../helpers/interfaces'
import { fileActions, userActions } from '../redux/actions'
import PackageJson from '../../package.json'
import * as tracksServices from '../services/tracks';

export async function uploadFile(result: any, currentFolder: number | undefined, dispatch: any) {
  dispatch(fileActions.uploadFileStart())

  await tracksServices.trackUploadFileStart();
  try {
    // Set name for pics/photos
    if (!result.name) {
      result.name = result.uri.split('/').pop()
    }
    //result.type = 'application/octet-stream';
    const user: IUser = await deviceStorage.getUserStorage();

    const token = await deviceStorage.getTokenStorage();

    const mnemonic = user.mnemonic

    const headers = {
      'Authorization': `Bearer ${token}`,
      'internxt-mnemonic': mnemonic,
      'Content-Type': 'multipart/form-data',
      'internxt-version': PackageJson.version,
      'internxt-client': 'drive-mobile'
    };

    const regex = /^(.*:\/{0,2})\/?(.*)$/gm
    const file = result.uri.replace(regex, '$2')

    const finalUri = Platform.OS === 'ios' ? RNFetchBlob.wrap(decodeURIComponent(file)) : RNFetchBlob.wrap(result.uri)

    RNFetchBlob.fetch('POST', `${process.env.REACT_NATIVE_API_URL}/api/storage/folder/${currentFolder}/upload`, headers,
      [
        { name: 'xfile', filename: result.name, data: finalUri }
      ])
      .uploadProgress({ count: 10 }, async (sent, total) => {
        dispatch(fileActions.uploadFileSetProgress(sent / total, result.id))

        if (sent / total >= 1) { // Once upload is finished (on small files it almost never reaches 100% as it uploads really fast)
          dispatch(fileActions.uploadFileSetUri(result.uri)) // Set the uri of the file so FileItem can get it as props
        }
      })
      .then((res) => {
        dispatch(fileActions.removeUploadingFile(result.id))
        dispatch(fileActions.updateUploadingFile(result.id))
        dispatch(fileActions.uploadFileSetUri(undefined))
        if (res.respInfo.status === 401) {
          throw res;

        } else if (res.respInfo.status === 402) {
          // setHasSpace

        } else if (res.respInfo.status === 201) {
          // CHECK THIS METHOD ONCE LOCAL UPLOAD
          //props.dispatch(fileActions.fetchIfSameFolder(result.currentFolder))
          tracksServices.trackUploadFileFinished();

        } else if (res.respInfo.status !== 502) {
          Alert.alert('Error', 'Cannot upload file');
        }

        // CHECK ONCE LOCAL UPLOAD
        dispatch(fileActions.uploadFileFinished(result.name))
      })
      .catch((err) => {
        if (err.status === 401) {
          dispatch(userActions.signout())

        } else {
          Alert.alert('Error', 'Cannot upload file\n' + err)
        }

        dispatch(fileActions.uploadFileFailed(result.id))
        dispatch(fileActions.uploadFileFinished(result.name))
      })

  } catch (error) {
    dispatch(fileActions.uploadFileFailed(result.id));
    dispatch(fileActions.uploadFileFinished(result.name))
    tracksServices.trackErrorFileUpload();
  }
}