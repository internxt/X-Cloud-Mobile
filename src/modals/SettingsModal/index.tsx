import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, Linking, ActivityIndicator, Alert, Platform } from 'react-native';
import Modal from 'react-native-modalbox'
import ProgressBar from '../../components/ProgressBar';
import { layoutActions, userActions } from '../../redux/actions';
import SettingsItem from './SettingsItem';
import prettysize from 'prettysize'
import Separator from '../../components/Separator';
import { connect } from 'react-redux';
import Bold from '../../components/Bold';
import { Dispatch } from 'redux';
import { LayoutState } from '../../redux/reducers/layout.reducer';
import strings from '../../../assets/lang/strings';
import * as userService from './../../services/user';
import { deviceStorage } from '../../helpers';
import { StackNavigationProp } from 'react-navigation-stack/lib/typescript/src/vendor/types';
import * as trackService from './../../services/tracks';
import { IUser } from '../../helpers/interfaces';
interface SettingsModalProps {
  user: IUser
  layoutState: LayoutState
  dispatch: Dispatch,
  navigation: StackNavigationProp
}
const DEFAULT_LIMIT = 1024 * 1024 * 1024 * 10;

function SettingsModal(props: SettingsModalProps) {

  const [isLoadingUsage, setIsLoadingUpdate] = useState(false);
  const [limitStorage, setLimitStorage] = useState<number>(DEFAULT_LIMIT);
  const [usageStorage, setUsageStorage] = useState<number>(0);

  const checkLimitDeviceStorage = async () => {
    try {
      const limitDeviceStorage = await deviceStorage.getItem('limitDeviceStorage');

      if (limitDeviceStorage) {
        return setLimitStorage(parseInt(limitDeviceStorage, 10))
      } else {

        const limit = await userService.loadLimit();

        return deviceStorage.setItem('limitDeviceStorage', limit.toString());
      }

    } catch (err) {
      throw err;
    }
  }

  const checkUsage = async () => {
    return userService.loadUsage().then((res) => {
      setUsageStorage(res);
      setIsLoadingUpdate(false);
    })
  }

  useEffect(() => {
    if (props.layoutState.showSettingsModal) {
      checkLimitDeviceStorage()
      checkUsage();
    }
  }, [props.layoutState.showSettingsModal])

  useEffect(()=>{
    trackService.trackIdentifyPlanName(limitStorage, usageStorage);
  }, [usageStorage, limitStorage])

  // Check current screen to change settings Photos/Drive text
  useEffect(() => {
    if (props.navigation.state.routeName === 'Photos' || props.navigation.state.routeName === 'FileExplorer') {
      props.dispatch(layoutActions.setCurrentApp(props.navigation.state.routeName))
    }
  }, [props.navigation.state])

  return (
    <Modal
      isOpen={props.layoutState.showSettingsModal}
      position={'bottom'}
      swipeArea={20}
      style={styles.modalSettings}
      onClosed={() => {
        props.dispatch(layoutActions.closeSettings())
      }}
      backButtonClose={true}
      animationDuration={200}>

      <View style={styles.drawerKnob}></View>

      <Text style={styles.nameText}>
        {props.user.name}{' '}
        {props.user.lastname}
      </Text>

      <ProgressBar
        styleProgress={styles.progressHeight}
        totalValue={limitStorage}
        usedValue={usageStorage}
      />

      {isLoadingUsage ?
        <ActivityIndicator color={'#00f'} />
        :
        <Text style={styles.usageText}>
          <Text>{strings.screens.storage.space.used.used} </Text>
          <Bold>{prettysize(usageStorage)}</Bold>
          <Text> {strings.screens.storage.space.used.of} </Text>
          <Bold>{userService.convertLimitUser(limitStorage)}</Bold>
        </Text>
      }

      <Separator />

      {<SettingsItem
        text={strings.components.app_menu.settings.storage}
        onPress={() => {
          props.dispatch(layoutActions.closeSettings())
          props.navigation.replace('Storage')
        }}
      />}

      <SettingsItem
        text={strings.components.app_menu.settings.more}
        onPress={() => Linking.openURL('https://internxt.com/drive')}
      />

      <SettingsItem
        text={props.layoutState.currentApp === 'Photos' ? strings.components.app_menu.settings.drive : strings.components.app_menu.settings.photos}
        onPress={async () => {

          props.dispatch(layoutActions.closeSettings())

          if (props.layoutState.currentApp === 'Photos') {
            props.navigation.replace('FileExplorer')
          } else {
            props.navigation.replace('Photos')
          }
        }}
      />

      <SettingsItem
        text={strings.components.app_menu.settings.contact}
        onPress={() => {
          const emailUrl = 'mailto:support@internxt.zohodesk.eu'

          Linking.canOpenURL(emailUrl).then(() => {
            Linking.openURL(emailUrl)
          }).catch(() => {
            Alert.alert('Info', 'Send us an email to: support@internxt.zohodesk.')
          })
        }}
      />

      <SettingsItem
        text={strings.components.app_menu.settings.sign}
        onPress={() => {
          props.dispatch(layoutActions.closeSettings())
          props.dispatch(userActions.signout())
        }}
      />
    </Modal>
  )
}

const styles = StyleSheet.create({
  drawerKnob: {
    alignSelf: 'center',
    backgroundColor: '#d8d8d8',
    borderRadius: 4,
    height: 7,
    marginTop: 10,
    width: 56
  },
  modalSettings: {
    height: 'auto',
    paddingBottom: Platform.OS === 'ios' ? 20 : 0
  },
  nameText: {
    fontFamily: 'CerebriSans-Bold',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 26,
    marginTop: 10
  },
  progressHeight: {
    height: 6
  },
  usageText: {
    fontFamily: 'CerebriSans-Regular',
    fontSize: 15,
    paddingBottom: 0,
    paddingLeft: 24
  }
})

const mapStateToProps = (state: any) => {
  return {
    user: state.authenticationState.user,
    layoutState: state.layoutState
  };
};

export default connect(mapStateToProps)(SettingsModal);
