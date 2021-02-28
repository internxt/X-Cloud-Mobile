import React, { useEffect, useState } from 'react'
import { Text, View, StyleSheet, Platform, SafeAreaView } from 'react-native'
import { connect } from 'react-redux';
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import SortModal from '../../modals/SortModal';
import { Reducers } from '../../redux/reducers/reducers';
import PhotoList from '../../components/PhotoList';
import CreateAlbumCard from '../../components/AlbumCard/CreateAlbumCard';
import AppMenuPhotos from '../../components/AppMenu/AppMenuPhotos';
import { widthPercentageToDP as wp } from 'react-native-responsive-screen';
import SettingsModal from '../../modals/SettingsModal';
import { Dispatch } from 'redux';
import { getLocalImages, getUploadedPhotos, syncPhotos, getPreviews } from './init'
import { PhotosState } from '../../redux/reducers/photos.reducer';
import { AuthenticationState } from '../../redux/reducers/authentication.reducer';
import { WaveIndicator } from 'react-native-indicators';
import ComingSoonModal from '../../modals/ComingSoonModal';

export interface IHomeProps extends Reducers {
  navigation?: any
  dispatch: Dispatch
  photosState: PhotosState
  authenticationState: AuthenticationState
}

function Home(props: IHomeProps): JSX.Element {
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const init = async () => {
    await Promise.all([
      getLocalImages(props.dispatch),
      getUploadedPhotos(props.authenticationState, props.dispatch)
    ]).then(() => {
      setIsLoading(false)
    })
  }

  useEffect(() => {
    init()
    getPreviews(props)
  }, []);

  useEffect(() => {
    if (props.photosState.localPhotos) {
      syncPhotos(props.photosState.localPhotos, props)
    }
  }, [props.photosState.localPhotos]);

  return (
    <SafeAreaView style={styles.container}>
      <SettingsModal navigation={props.navigation} />
      <SortModal />
      <ComingSoonModal />

      <AppMenuPhotos navigation={props.navigation} />

      <View style={styles.albumsContainer}>
        <View style={styles.albumsHeader}>
          <Text style={styles.title}>
          Albums
          </Text>

        </View>

        <View style={{ marginTop: 40 }}>
          <CreateAlbumCard navigation={props.navigation} dispatch={props.dispatch} />
        </View>

        {/* {props.photosState.albums.length > 0 ?
          <View style={styles.titleButton}>
            <FlatList
              keyExtractor={keyExtractor}
              renderItem={renderAlbumItem}
              data={props.photosState.albums}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            ></FlatList>
          </View>
          :
          <View style={{ marginTop: 40 }}>
            <CreateAlbumCard navigation={props.navigation} />
          </View>
        } */}
      </View>

      <View style={styles.albumsContainer}>
        <TouchableOpacity style={styles.titleButton}
          onPress={() => {
            props.navigation.navigate('PhotoGallery', { title: 'All Photos' })
          }}
          disabled={isLoading}>
          <Text style={styles.title}>All photos</Text>
        </TouchableOpacity>

        {
          !isLoading ?
            <View>
              {
                props.photosState.localPhotos.length > 0 ?
                  <PhotoList
                    title={'All Photos'}
                    photos={props.photosState.localPhotos}
                    navigation={props.navigation}
                  />
                  :
                  <View style={styles.emptyContainer}>
                    <Text style={styles.heading}>We didn&apos;t detect any local photos on your phone.</Text>
                    <Text style={styles.subheading}>Get some images to get started!</Text>
                  </View>
              }
            </View>
            :
            <WaveIndicator color="#5291ff" size={50} />
        }
      </View>

      {/* <View style={styles.albumsContainer}>
        <View style={styles.albumHeader}>
          <Text style={styles.title}>
          Uploaded photos
          </Text>

          <Pressable
            onPress={() => {
            }}
          >
            <Text style={styles.albumsSort}>
              {props.photosState.sortType}
            </Text>
          </Pressable>
        </View>

        <TouchableHighlight
          style={styles.titleButton}
          underlayColor="#FFF"
          onPress={() => { props.navigation.navigate('PhotoGallery', { title: 'Uploaded photos' }) }}
        >
          { props.photosState.previews ?
            <PhotoList
              title={'Uploaded photos'}
              photos={props.photosState.previews}
              navigation={props.navigation}
            />
            :
            <WaveIndicator color="#5291ff" size={50} />
          }
        </TouchableHighlight>
      </View> */}
    </SafeAreaView>
  )
}

const mapStateToProps = (state: any) => {
  return { ...state };
};

export default connect(mapStateToProps)(Home)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    backgroundColor: '#fff'
  },
  titleButton: {
    flexDirection: 'row',
    paddingHorizontal: wp('1'),
    marginBottom: wp('1')
  },
  albumsContainer: {
    paddingVertical: wp('3.5'),
    paddingHorizontal: wp('1')
  },
  albumsHeader: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  title: {
    fontFamily: 'Averta-Bold',
    fontSize: 18,
    letterSpacing: -0.13,
    color: 'black',
    alignSelf: 'flex-start',
    height: 30,
    marginLeft: 7
  },
  emptyContainer: {
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  heading: {
    fontFamily: 'Averta-Regular',
    fontSize: wp('4.5'),
    letterSpacing: -0.8,
    color: '#000000',
    marginTop: 10
  },
  subheading: {
    fontFamily: 'CircularStd-Book',
    fontSize: wp('4.1'),
    marginTop: 10,
    opacity: 0.84,
    letterSpacing: -0.1,
    color: '#404040'
  }
});