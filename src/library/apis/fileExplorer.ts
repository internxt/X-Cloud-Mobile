import { deviceStorage, getLyticsData } from '../../helpers'
import analytics from '../../helpers/lytics'
import { fileActions, userActions } from '../../redux/actions'
import { IFileToUpload } from '../interfaces/drive'
import PackageJson from '../../../package.json'
import RNFetchBlob from 'rn-fetch-blob'
import { NEWTORK_TIMEOUT } from '../../screens/FileExplorer/init'
import { Platform } from 'react-native'
import SimpleToast from 'react-native-simple-toast'

export const uploadFile = async (file: IFileToUpload, dispatch: any): Promise<void> => {
  dispatch(fileActions.uploadFileStart())
  const userData = getLyticsData().then((res) => {
    analytics.track('file-upload-start', { userId: res.uuid, email: res.email, device: 'mobile' }).catch(() => { })
  })

  try {
    // Set name for pics/photos
    if (!file.name) {
      file.name = file.uri.split('/').pop()
    }
    const token = await deviceStorage.getItem('xToken')
    const xUser = await deviceStorage.getItem('xUser')
    const xUserJson = JSON.parse(xUser || '{}')

    const headers = {
      'Authorization': `Bearer ${token}`,
      'internxt-mnemonic': xUserJson.mnemonic,
      'Content-Type': 'multipart/form-data',
      'internxt-version': PackageJson.version,
      'internxt-client': 'drive-mobile'
    };

    const regex = /^(.*:\/{0,2})\/?(.*)$/gm
    const fileUri = file.uri.replace(regex, '$2')

    const finalUri = Platform.OS === 'ios' ? RNFetchBlob.wrap(decodeURIComponent(fileUri)) : RNFetchBlob.wrap(file.uri)

    await RNFetchBlob.config({ timeout: NEWTORK_TIMEOUT }).fetch('POST', `${process.env.REACT_NATIVE_API_URL}/api/storage/folder/${file.currentFolder}/upload`, headers,
      [
        { name: 'xfile', filename: file.name, data: finalUri }
      ])
      .uploadProgress({ count: 10 }, async (sent, total) => {
        dispatch(fileActions.uploadFileSetProgress(sent / total, file.id))

        if (sent / total >= 1) { // Once upload is finished (on small files it almost never reaches 100% as it uploads really fast)
          dispatch(fileActions.uploadFileSetUri(file.uri)) // Set the uri of the file so FileItem can get it as props
        }
      })
      .then((res) => {
        if (res.respInfo.status !== 201) {
          dispatch(fileActions.removeUploadingFile(file.id))
          throw new Error('Error uploading file, server status response: ' + res.respInfo.status)
        }
        dispatch(fileActions.addUploadedFile(file.id))
        dispatch(fileActions.updateUploadingFile(file.id))
        dispatch(fileActions.uploadFileSetUri(undefined))
        analytics.track('file-upload-finished', { userId: userData.uuid, email: userData.email, device: 'mobile' }).catch(() => { })
        // CHECK ONCE LOCAL UPLOAD
        dispatch(fileActions.uploadFileFinished(file.name))
      })
      .catch((err) => {
        if (err.status === 401) {
          dispatch(userActions.signout())
        }
        SimpleToast.show('Could not upload file ' + file.name)
        dispatch(fileActions.uploadFileFailed(file.id))
      })

  } catch (error) {
    analytics.track('file-upload-error', { userId: userData.uuid, email: userData.email, device: 'mobile' }).catch(() => { })
    dispatch(fileActions.uploadFileFailed(file.id))
    dispatch(fileActions.uploadFileFinished(file.name))
  }
}