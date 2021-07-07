import { launchCameraAsync, launchImageLibraryAsync, MediaTypeOptions, requestCameraPermissionsAsync, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';
import { uniqueId } from 'lodash';
import React, { Fragment, useState, useRef } from 'react'
import { View, StyleSheet, Platform, TextInput, Image, Alert } from 'react-native'
import { TouchableWithoutFeedback } from 'react-native-gesture-handler';
import { connect } from 'react-redux';
import RNFetchBlob from 'rn-fetch-blob';
import strings from '../../../assets/lang/strings';
import { getLyticsData } from '../../helpers';
import { getIcon } from '../../helpers/getIcon';
import analytics from '../../helpers/lytics';
import { fileActions, layoutActions, userActions } from '../../redux/actions';
import MenuItem from '../MenuItem';
import PackageJson from '../../../package.json'
import { NEWTORK_TIMEOUT } from '../../screens/FileExplorer/init';
import DocumentPicker from 'react-native-document-picker'
import { IFileToUpload } from '../../library/interfaces/drive';
import allSettled from 'promise.allsettled'
import SimpleToast from 'react-native-simple-toast';

interface AppMenuProps {
  navigation?: any
  filesState?: any
  dispatch?: any,
  layoutState?: any
  authenticationState?: any
}

function AppMenu(props: AppMenuProps) {
  const [activeSearchBox, setActiveSearchBox] = useState(false)
  const selectedItems = props.filesState.selectedItems;
  const textInput = useRef<TextInput>(null)
  const handleClickSearch = () => {
    if (textInput && textInput.current) {
      textInput.current.focus();
    }
  }

  const closeSearch = () => {
    if (textInput && textInput.current) {
      textInput.current.blur();
    }
  }

  const uploadFile = async (result: IFileToUpload, currentFolder: number | undefined) => {
    props.dispatch(fileActions.uploadFileStart())
    const userData = getLyticsData().then((res) => {
      analytics.track('file-upload-start', { userId: res.uuid, email: res.email, device: 'mobile' }).catch(() => { })
    })

    try {
      // Set name for pics/photos
      if (!result.name) {
        result.name = result.uri.split('/').pop()
      }
      //result.type = 'application/octet-stream';

      const token = props.authenticationState.token
      const mnemonic = props.authenticationState.user.mnemonic

      const headers = {
        'Authorization': `Bearer ${token}`,
        'internxt-mnemonic': mnemonic,
        'Content-Type': 'multipart/form-data',
        'internxt-version': PackageJson.version,
        'internxt-client': 'drive-mobile'
      };

      const regex = /^(.*:\/{0,2})/gm
      const file = result.uri.replace(regex, '')
      const finalUri = Platform.OS === 'ios' ? RNFetchBlob.wrap(decodeURIComponent(file)) : RNFetchBlob.wrap(result.uri)

      await RNFetchBlob.config({ timeout: NEWTORK_TIMEOUT }).fetch('POST', `${process.env.REACT_NATIVE_API_URL}/api/storage/folder/${currentFolder}/upload`, headers,
        [
          { name: 'xfile', filename: result.name, data: finalUri }
        ])
        .uploadProgress({ count: 10 }, async (sent, total) => {
          props.dispatch(fileActions.uploadFileSetProgress(sent / total, result.id))

          if (sent / total >= 1) { // Once upload is finished (on small files it almost never reaches 100% as it uploads really fast)
            props.dispatch(fileActions.uploadFileSetUri(result.uri)) // Set the uri of the file so FileItem can get it as props
          }
        })
        .then((res) => {
          if (res.respInfo.status !== 201) {
            throw new Error('Error uploading file, server status response: ' + res.respInfo.status)
          }
          props.dispatch(fileActions.addUploadedFile(result.id))
          props.dispatch(fileActions.removeUploadingFile(result.id))
          props.dispatch(fileActions.updateUploadingFile(result.id))
          props.dispatch(fileActions.uploadFileSetUri(undefined))
          analytics.track('file-upload-finished', { userId: userData.uuid, email: userData.email, device: 'mobile' }).catch(() => { })
          // CHECK ONCE LOCAL UPLOAD
          props.dispatch(fileActions.uploadFileFinished(result.name))
        })
        .catch((err) => {
          props.dispatch(fileActions.removeUploadingFile(result.id))
          if (err.status === 401) {
            props.dispatch(userActions.signout())
          }
          SimpleToast.show('Could not upload file ' + result.name)
          props.dispatch(fileActions.uploadFileFailed(result.id))
        })

    } catch (error) {
      analytics.track('file-upload-error', { userId: userData.uuid, email: userData.email, device: 'mobile' }).catch(() => { })
      props.dispatch(fileActions.uploadFileFailed(result.id))
      props.dispatch(fileActions.uploadFileFinished(result.name))
    }
  }

  return <View
    style={styles.container}>

    <View style={[styles.searchContainer, { display: activeSearchBox ? 'flex' : 'none' }]}>
      <Image
        style={{ marginLeft: 20, marginRight: 10 }}
        source={getIcon('search')}
      />

      <TextInput
        ref={textInput}
        style={styles.searchInput}
        placeholder={strings.components.app_menu.search_box}
        value={props.filesState.searchString}
        onChange={e => {
          props.dispatch(fileActions.setSearchString(e.nativeEvent.text))
        }}
      />

      <TouchableWithoutFeedback
        onPress={() => {
          props.dispatch(fileActions.setSearchString(''));
          props.dispatch(layoutActions.closeSearch());
          setActiveSearchBox(false)
          closeSearch()
        }}
      >
        <Image
          style={{ marginLeft: 10, marginRight: 20, height: 16, width: 16 }}
          source={getIcon('close')}
        />
      </TouchableWithoutFeedback>
    </View>

    <Fragment>
      <View style={[styles.buttonContainer, { display: activeSearchBox ? 'none' : 'flex' }]}>
        <View style={styles.commonButtons}>
          <MenuItem
            style={styles.mr10}
            name="search"
            onClickHandler={() => {
              setActiveSearchBox(true)
              props.dispatch(layoutActions.openSearch())
              handleClickSearch()

            }} />

          <MenuItem
            style={styles.mr10}
            name="list"
            onClickHandler={() => {
              props.dispatch(layoutActions.closeSearch())
              props.dispatch(layoutActions.openSortModal())
            }} />

          <MenuItem
            style={styles.mr10}
            name="upload"
            onClickHandler={() => {
              Alert.alert(strings.components.app_menu.upload.title, '', [
                {
                  text: strings.components.app_menu.upload.document,
                  onPress: async () => {
                    const assets = await DocumentPicker.pickMultiple({
                      type: [DocumentPicker.types.allFiles]
                    }).catch(() => { return })

                    if (!assets) {
                      return
                    }

                    if (assets.length > 10) {
                      Alert.alert('Attention', 'You can select up to 10 different files at a time')
                      return
                    }
                    let files: IFileToUpload[] = assets.map(asset => ({
                      ...asset,
                      progress: 0,
                      currentFolder: props.filesState.folderContent.currentFolder,
                      createdAt: new Date(),
                      id: uniqueId()
                    }))
                    const chunks: (() => Promise<void>)[][] = []

                    files.forEach(file => props.dispatch(fileActions.addUploadingFile(file)))
                    const loop = () => {
                      const MAX_FILE_SIZE_IN_MB = 10
                      const MAX_UPLOADABLE_SIZE = 1024 * 1024 * MAX_FILE_SIZE_IN_MB
                      let currentTotalSize = 0
                      let count = 0
                      const iterables = files.length
                      const filesChunk: (() => Promise<void>)[] = []

                      for (const asset of files) {
                        count++

                        if (asset.size >= MAX_UPLOADABLE_SIZE) {
                          chunks.push([() => uploadFile(asset, asset.currentFolder)])
                          files = files.filter(file => file !== asset)
                          if (count === iterables && files.length > 0) {
                            chunks.push(filesChunk)
                            loop()
                            break
                          }

                          continue
                        }

                        const hipoteticalSize = currentTotalSize + asset.size

                        if (hipoteticalSize >= MAX_UPLOADABLE_SIZE) {
                          if (count === iterables && files.length > 0) {
                            chunks.push(filesChunk)
                            loop()
                            break
                          }

                          continue
                        }
                        currentTotalSize += asset.size
                        filesChunk.push(() => uploadFile(asset, asset.currentFolder))
                        files = files.filter(file => file !== asset)
                        if (count === iterables && files.length > 0) {
                          chunks.push(filesChunk)
                          loop()
                          break
                        }
                        if (files.length === 0) {
                          chunks.push(filesChunk)
                        }
                      }
                    }

                    loop()
                    for (const chunk of chunks) {
                      await allSettled(chunk.map(task => task()))
                    }
                  }
                },
                {
                  text: strings.components.app_menu.upload.media,
                  onPress: async () => {
                    const { status } = await requestMediaLibraryPermissionsAsync()

                    if (status === 'granted') {
                      const result = await launchImageLibraryAsync({ mediaTypes: MediaTypeOptions.All })

                      if (!result.cancelled) {
                        const fileUploading: any = result

                        // Set name for pics/photos
                        if (!fileUploading.name) {
                          fileUploading.name = result.uri.split('/').pop()
                        }
                        fileUploading.progress = 0
                        fileUploading.currentFolder = props.filesState.folderContent.currentFolder
                        fileUploading.createdAt = new Date()
                        fileUploading.id = uniqueId()

                        props.dispatch(fileActions.addUploadingFile(fileUploading))
                        uploadFile(fileUploading, fileUploading.currentFolder)
                      }
                    } else {
                      Alert.alert('Camera roll permissions needed to perform this action')
                    }
                  }
                },
                {
                  text: strings.components.app_menu.upload.take_photo,
                  onPress: async () => {
                    const { status } = await requestCameraPermissionsAsync()

                    if (status === 'granted') {
                      const result = await launchCameraAsync()

                      if (!result.cancelled) {
                        const fileUploading: any = result

                        // Set name for pics/photos
                        if (!fileUploading.name) {
                          fileUploading.name = result.uri.split('/').pop()
                        }
                        fileUploading.progress = 0
                        fileUploading.currentFolder = props.filesState.folderContent.currentFolder
                        fileUploading.createdAt = new Date()
                        fileUploading.id = uniqueId()

                        props.dispatch(fileActions.addUploadingFile(fileUploading))
                        uploadFile(fileUploading, props.filesState.folderContent.currentFolder)
                      }
                    }
                  }
                },
                {
                  text: strings.components.app_menu.upload.cancel,
                  style: 'destructive'
                }
              ], {
                cancelable: Platform.OS === 'android'
              })
            }} />

          <MenuItem
            name="create"
            style={styles.mr10}
            onClickHandler={() => {
              props.navigation.replace('CreateFolder')
            }} />

          {
            selectedItems.length > 0 ?
              <MenuItem name="delete" onClickHandler={() => {
                props.dispatch(layoutActions.openDeleteModal())
              }} />
              :
              null
          }
        </View>

        <MenuItem
          name="settings"
          onClickHandler={() => {
            props.dispatch(layoutActions.openSettings());
          }} />
      </View>
    </Fragment>
  </View>
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'space-between',
    marginLeft: 17,
    marginRight: 10
  },
  commonButtons: {
    flexDirection: 'row',
    flexGrow: 1
  },
  container: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    height: 54,
    justifyContent: 'flex-start',
    marginTop: Platform.OS === 'ios' ? 30 : 0,
    paddingTop: 3
  },
  mr10: {
    marginRight: 10
  },
  searchContainer: {
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    borderRadius: 30,
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 20,
    marginRight: 20,
    position: 'relative'
  },
  searchInput: {
    flex: 1,
    fontFamily: 'CerebriSans-Medium',
    fontSize: 17,
    marginLeft: 15,
    marginRight: 15
  }
});

const mapStateToProps = (state: any) => {
  return { ...state };
};

export default connect(mapStateToProps)(AppMenu)