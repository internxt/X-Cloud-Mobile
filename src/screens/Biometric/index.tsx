import React, { useEffect } from 'react'
import { View, StyleSheet, ActivityIndicator, AppState, AppStateStatus } from 'react-native'
import { useState } from 'react';
import { connect } from 'react-redux';
import { checkDeviceForHardware, checkForBiometric, checkDeviceStorageShowConf, checkDeviceStorageBiometric, scanBiometrics, getBiometricConfiguration } from './BiometricUtils'
import { ConfirmDialog } from 'react-native-simple-dialogs';
import { authenticateAsync } from 'expo-local-authentication';
import { deviceStorage } from '../../helpers';

async function showBiometrics() {
  // SCAN 1
  const result = await authenticateAsync()

  return result
}

async function shouldShowConfig() {
  const checkHardware = await checkDeviceForHardware();
  const checkBiometrics = await checkForBiometric();
  const xBiometricValue = await getBiometricConfiguration();

  return checkHardware && checkBiometrics && xBiometricValue === null
}

function Biometric(props: any) {
  const rootFolderId = props.authenticationState.user.root_folder_id;
  const [showConf, setShowConf] = useState(false)
  const [appState, setAppState] = useState(AppState.currentState);

  const authOk = () => {
    props.navigation.replace('FileExplorer', { rootFolderId });
  }

  const start = async (setShowConf: React.Dispatch<React.SetStateAction<boolean>>) => {
    const showConfig = await shouldShowConfig()

    if (showConfig) {
      setShowConf(true)
    } else if (!showConfig && await getBiometricConfiguration()) {
      // SCAN 2
      const result = await showBiometrics();

      if (!result.success && AppState.currentState === 'active') {
        start(setShowConf);
      }
      if (result.success) {
        authOk()
      }
    }
  }

  const handleStateChange = (e: AppStateStatus) => {
    setAppState(e)
  }

  useEffect(() => {
    start(setShowConf)
    AppState.addEventListener('change', handleStateChange)
    return () => {
      AppState.removeEventListener('change', handleStateChange)
    }
  }, [])

  useEffect(() => {
    if (AppState.currentState === 'active') {
      start(setShowConf)
    }
  }, [appState])

  return (
    <View style={styles.container}>
      <ConfirmDialog
        title="Biometric Configuration"
        message="Do you want to config Biometric?"
        visible={showConf}
        positiveButton={{
          title: 'YES',
          onPress: () => {
            setShowConf(false)
            showBiometrics().then(result => {
              if (result.success) {
                deviceStorage.saveItem('xBiometric', 'true')
              }
              if (!result.success && result.error === 'user_cancel') {
                setShowConf(true)
              }
            })
          }
        }}
        negativeButton={{
          title: 'NO',
          onPress: () => {
            setShowConf(false)
          }
        }}
      />
      <ActivityIndicator color={'#00f'} />
    </View>
  );
}
const mapStateToProps = (state: any) => {
  return { ...state };
};

export default connect(mapStateToProps)(Biometric)

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  }
});
