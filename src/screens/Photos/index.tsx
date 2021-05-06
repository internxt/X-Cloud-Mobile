import React, { useEffect, useState } from 'react'
import { Text, View, StyleSheet, SafeAreaView } from 'react-native'
import { connect } from 'react-redux';
import { TouchableOpacity } from 'react-native-gesture-handler';
import SortModal from '../../modals/SortModal';
import { Reducers } from '../../redux/reducers/reducers';
import PhotoList from '../../components/PhotoList';
import CreateAlbumCard from '../../components/AlbumCard/CreateAlbumCard';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import SettingsModal from '../../modals/SettingsModal';
import { stopSync, initUser, getLocalImages, IHashedPhoto, syncPhotos } from './init'
import { PhotosState } from '../../redux/reducers/photos.reducer';
import { AuthenticationState } from '../../redux/reducers/authentication.reducer';
import { WaveIndicator, MaterialIndicator } from 'react-native-indicators';
import ComingSoonModal from '../../modals/ComingSoonModal';
import MenuItem from '../../components/MenuItem';
import { layoutActions, PhotoActions } from '../../redux/actions';
import strings from '../../../assets/lang/strings';
import { queue } from 'async'
import EmptyPhotoList from '../../components/PhotoList/EmptyPhotoList';

export interface IPhotosProps extends Reducers {
  navigation: any
  dispatch: any
  photosState: PhotosState
  authenticationState: AuthenticationState,
}

function Photos(props: IPhotosProps): JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [photos, setPhotos] = useState<IHashedPhoto[]>([])
  const [hasMoreLocals, setHasMoreLocals] = useState(true)

  const syncQueue = queue(async (task: () => Promise<void>, callBack) => {
    await task()
    callBack()
  }, 5)

  const getNextImages = async (after?: string | undefined) => {
    let finished = false
    let next = after
    const syncActions: Promise<unknown>[] = []

    props.dispatch(PhotoActions.startSync())

    while (!finished) {
      const res = await getLocalImages(next)

      const syncAction = () => new Promise<unknown>(resolved => {
        syncQueue.push(() => syncPhotos(res.assets), resolved)
      })

      setPhotos(currentPhotos => currentPhotos.length > 0 ? currentPhotos.concat(res.assets) : res.assets)
      syncActions.push(syncAction())

      if (res.hasNextPage) {
        next = res.endCursor
      } else {
        finished = true
        setHasMoreLocals(false)
      }
    }

    await Promise.all(syncActions).then(() => {
      props.dispatch(PhotoActions.stopSync())
    })
  }

  const reloadLocalPhotos = () => {
    initUser().finally(() => getNextImages());
  };

  useEffect(() => {
    setPhotos([])
    reloadLocalPhotos();
  }, [])

  useEffect(() => {
    if (!props.authenticationState.loggedIn) {
      stopSync()
      props.navigation.replace('Login')
    }
  }, [props.authenticationState.loggedIn])

  return (
    <SafeAreaView style={styles.container}>
      <SettingsModal navigation={props.navigation} />
      <SortModal />
      <ComingSoonModal />

      <View style={styles.albumsContainer}>
        <View style={styles.albumsHeader}>
          <Text style={styles.title}>{strings.screens.photos.screens.photos.albums}</Text>

          <MenuItem
            name="settings"
            onClickHandler={() => {
              props.dispatch(layoutActions.openSettings());
            }} />

        </View>

        <View style={styles.createAlbumCard}>
          <CreateAlbumCard navigation={props.navigation} dispatch={props.dispatch} />
        </View>

      </View>

      <View style={styles.allPhotosContainer}>
        <TouchableOpacity style={styles.titleButton}
          onPress={() => {
            props.navigation.navigate('PhotoGallery')
          }}
        >
          <Text style={styles.title}>{strings.screens.photos.screens.photos.all_photos} <Text style={styles.photosCount}>- {photos.length}</Text></Text>
          {
            props.photosState.isSyncing ?
              <View style={styles.containerSync}>
                <Text style={styles.syncText}>{strings.screens.photos.components.syncing}</Text>

                <View>
                  <MaterialIndicator style={styles.spinner} color="#5291ff" size={15} />
                </View>
              </View>
              :
              null
          }
        </TouchableOpacity>
        {
          photos.length === 0 ?
            hasMoreLocals ?
              <View style={styles.emptyContainer}>
                <Text style={styles.heading}>{strings.screens.photos.components.loading}</Text>
                <WaveIndicator color="#5291ff" size={50} />
              </View>
              :
              <EmptyPhotoList />
            :
            <View style={{ flex: 1 }}>
              <PhotoList
                title={'All Photos'}
                data={photos}
                navigation={props.navigation}
                //onRefresh={() => getNextImages()}
              />
            </View>
        }
      </View>
    </SafeAreaView>
  )
}

const mapStateToProps = (state: any) => {
  return { ...state };
};

export default connect(mapStateToProps)(Photos)

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'flex-start'
  },
  albumsContainer: {
    height: 'auto',
    paddingHorizontal: wp('1'),
    paddingVertical: wp('3.5')
  },
  albumsHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    height: 50,
    justifyContent: 'space-between'
  },
  allPhotosContainer: {
    flex: 1
  },
  containerSync: {
    flexDirection: 'row',
    marginRight: 8
  },
  createAlbumCard: {

  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  heading: {
    color: '#000000',
    fontFamily: 'Averta-Regular',
    fontSize: wp('4.5'),
    letterSpacing: -0.8,
    marginBottom: 30,
    marginTop: 10
  },
  spinner: {
  },
  syncText: {
    color: 'grey',
    fontFamily: 'Averta-Bold',
    marginRight: 8
  },
  title: {
    alignSelf: 'center',
    color: 'black',
    fontFamily: 'Averta-Bold',
    fontSize: 18,
    letterSpacing: -0.13,
    marginLeft: 7
  },
  photosCount: {
    color: 'grey',
    fontFamily: 'Averta-Bold',
    fontSize: 15
  },
  titleButton: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: wp('1'),
    paddingHorizontal: wp('1')
  }
});