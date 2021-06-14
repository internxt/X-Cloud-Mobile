import React, { useEffect, useState } from 'react'
import { Text, View, StyleSheet, Image, Platform, BackHandler } from 'react-native'
import AppMenu from '../../components/AppMenu'
import { fileActions } from '../../redux/actions';
import { connect } from 'react-redux';
import FileList from '../../components/FileList';
import SettingsModal from '../../modals/SettingsModal';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { getIcon } from '../../helpers/getIcon';
import FileDetailsModal from '../../modals/FileDetailsModal';
import SortModal from '../../modals/SortModal';
import DeleteItemModal from '../../modals/DeleteItemModal';
import MoveFilesModal from '../../modals/MoveFilesModal';
import ShareFilesModal from '../../modals/ShareFilesModal';
import { Reducers } from '../../redux/reducers/reducers';
import { WaveIndicator } from 'react-native-indicators'
import FreeForYouModal from '../../modals/FreeForYouModal';
import strings from '../../../assets/lang/strings';
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';
import * as fileExplorerService from '../../services/fileExplorer';
interface FileExplorerProps extends Reducers {
  navigation?: StackNavigationProp
  filesState: any
  dispatch?: any
  layoutState: any
  authenticationState: any
}

function FileExplorer(props: FileExplorerProps): JSX.Element {
  const [selectedKeyId, setSelectedKeyId] = useState(0)
  const { filesState } = props
  const parentFolderId = (() => {
    if (filesState.folderContent) {
      return filesState.folderContent.parentId || null
    } else {
      return null
    }
  })()
  const count = 0

  useEffect(() => {
    fileExplorerService.refreshLimitStorage().then(limitValue =>
      fileExplorerService.loadValuesStorage(limitValue.limit, props.dispatch));
  }, [])

  // useEffect to trigger uploadFile while app on background
  useEffect(() => {
    fileExplorerService.uploadFileOnBackground(filesState, props.dispatch);
  }, [filesState.uri])

  // seEffect to trigger uploadFile while app closed
  useEffect(() => {
    fileExplorerService.uploadFileWhileAppClosed(filesState, props.dispatch);

    // Set rootfoldercontent for MoveFilesModal
    fileExplorerService.setParentFolderId(filesState, parentFolderId, props.dispatch);
    const actionBack = fileExplorerService.backAction(filesState, count, props.dispatch);
    const backHandler = BackHandler.addEventListener('hardwareBackPress', actionBack);

    return () => backHandler.remove()
  }, [filesState.folderContent])

  useEffect(() => {
    const keyId = filesState.selectedItems.length > 0 && filesState.selectedItems[0].id

    setSelectedKeyId(keyId)
  }, [filesState])

  if (!props.authenticationState.loggedIn && props.navigation) {
    props.navigation.replace('Login')
  }

  return <View style={styles.container}>
    <FileDetailsModal key={selectedKeyId} />
    <SettingsModal navigation={props.navigation} />
    <SortModal />
    <DeleteItemModal />
    <MoveFilesModal />
    <ShareFilesModal />
    <FreeForYouModal navigation={props.navigation} />

    <View style={styles.platformSpecificHeight}></View>

    <AppMenu navigation={props.navigation} />

    <View style={styles.breadcrumbs}>
      <Text style={styles.breadcrumbsTitle}>
        {filesState.folderContent && filesState.folderContent.parentId
          ? filesState.folderContent.name
          : strings.screens.file_explorer.title}
      </Text>

      <TouchableOpacity
        onPress={() => {
          props.dispatch(fileActions.getFolderContent(parentFolderId))
        }}>
        <View style={parentFolderId ? styles.backButtonWrapper : styles.backHidden}>
          <Image style={styles.backIcon} source={getIcon('back')} />

          <Text style={styles.backLabel}>{strings.components.buttons.back}</Text>
        </View>
      </TouchableOpacity>
    </View>

    {
      props.filesState.loading && !props.filesState.isUploading ?
        <View style={styles.activityIndicator}>
          <WaveIndicator color="#5291ff" size={80} />
        </View>
        :
        <FileList />
    }
  </View>
}

const mapStateToProps = (state: any) => {
  return { ...state };
};

export default connect(mapStateToProps)(FileExplorer)

const styles = StyleSheet.create({
  activityIndicator: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0
  },
  backButtonWrapper: {
    alignItems: 'center',
    display: 'flex',
    flexDirection: 'row',
    height: '100%',
    marginRight: 20,
    width: '100%'
  },
  backHidden: {
    display: 'none'
  },
  backIcon: {
    height: 12,
    marginRight: 5,
    width: 8
  },
  backLabel: {
    color: '#000000',
    fontFamily: 'CircularStd-Medium',
    fontSize: 19,
    letterSpacing: -0.2
  },
  breadcrumbs: {
    alignItems: 'center',
    borderBottomColor: '#e6e6e6',
    borderBottomWidth: 1,
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    height: 40,
    justifyContent: 'space-between',
    marginTop: 15
  },
  breadcrumbsTitle: {
    color: '#000000',
    fontFamily: 'CircularStd-Bold',
    fontSize: 21,
    letterSpacing: -0.2,
    paddingLeft: 20
  },
  container: {
    backgroundColor: '#fff',
    flex: 1,
    justifyContent: 'flex-start'
  },
  platformSpecificHeight: {
    height: Platform.OS === 'ios' ? '5%' : '0%'
  }
});
