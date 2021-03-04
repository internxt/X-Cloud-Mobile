import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { FlatList, TouchableHighlight } from 'react-native-gesture-handler';
import Modal from 'react-native-modalbox'
import { connect } from 'react-redux';
import PhotoItem from '../../components/PhotoItem';
import { layoutActions, PhotoActions } from '../../redux/actions';
import { IPhoto } from '../../components/PhotoList';

interface SelectPhotoProps {
  layoutState?: any
  photosState?: any
  dispatch?: any
}

function SelectPhotoModal(props: SelectPhotoProps) {
  const keyExtractor = (item: any, index: any) => index.toString();

  const renderItem = ({ item }: { item: IPhoto }) => (
    <Pressable
      onPress={() => {
        props.dispatch(PhotoActions.selectPhoto(item))
      }}
    >
      <PhotoItem item={item} isLoading={false} />
    </Pressable>
  );
  /*const selectedItems = useSelector(state => state.pic.selectedPics)
  const showModal = useSelector(state => state.layout.showPicModal) && selectedItems.length > 0
  const pic = selectedItems[0]
  const isAlbum = pic && !selectedItems[0].id
  const album = isAlbum && pic*/

  return (
    <Modal
      position={'bottom'}
      swipeToClose={true}
      style={styles.modal}
      isOpen={props.layoutState.showSelectPhotoModal}
      onClosed={async () => {
        const metadata: any = {}

        //props.dispatch(PhotoActions.setIsLoading(!props.photosState.loading))
        /*if (pic.filename !== inputPhotoName) {
            metadata.itemName = inputPhotoName
            //await updateFileMetadata(metadata, file.fileId)
            //props.dispatch(getFolderContent(props.picState.folderContent.currentFolder))
            //const userData = await getLyticsData()
            /*analytics.track('file-rename', {
                userId: userData.uuid,
                email: userData.email,
                platform: 'mobile',
                device: Platform.OS,
                folder_id: file.id
            }).catch(() => { })
        }*/
      }}
      backButtonClose={true}
      backdropPressToClose={true}
      animationDuration={200}
      backdropOpacity={0.5}
    >

      <View style={styles.headerContainer}>
        <Text
          style={{
            fontFamily: 'Averta-Bold',
            fontSize: 18,
            color: 'black'
          }}
        >
          Select Photos
        </Text>

        <TouchableHighlight
          underlayColor="#FFF"
          style={styles.upgradeBtn}
          onPress={() => {
            props.dispatch(layoutActions.closeSelectPhotoModal())

          }}>
          <Text style={styles.propText}>
            Done
          </Text>
        </TouchableHighlight>
      </View>

      <FlatList
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        data={props.photosState.photos}
        horizontal={false}
        numColumns={3}
        showsHorizontalScrollIndicator={false}
      ></FlatList>

    </Modal>
  );
}

const mapStateToProps = (state: any) => {
  return { ...state };
};

export default connect(mapStateToProps)(SelectPhotoModal)

const styles = StyleSheet.create({
  modal: {
    top: '10%',
    alignContent: 'center',
    paddingLeft: 0,
    paddingTop: 5,
    borderRadius: 8
  },
  headerContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 40,
    paddingBottom: 5,
    paddingHorizontal: 19
  },
  upgradeBtn: {
    paddingVertical: 5,
    paddingHorizontal: 18,
    backgroundColor: '#0084ff',
    borderRadius: 23.8
  },
  propText: {
    color: 'white',
    fontFamily: 'Averta-Semibold',
    fontSize: 16,
    lineHeight: 26.1
  }
})