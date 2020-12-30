import React, { useEffect } from 'react'
import { Alert, AppState, AppStateStatus, ActivityIndicator, Text, View, DevSettings } from 'react-native'
import { useState } from "react";
import { deviceStorage } from '../../helpers';
import { checkDeviceForHardware, checkForBiometric, checkDeviceStorageShowConf, checkDeviceStorageBiometric, scanBiometrics } from './BiometricUtils'
import { connect } from 'react-redux';
import { authenticateAsync } from 'expo-local-authentication';

function Biometric(props: any) {
  const rootFolderId = props.authenticationState.user.root_folder_id;
  const [appState, setAppState] = useState(AppState.currentState)
  const [cancelCount, setCancelCount] = useState(0)

  const shouldShowAlert = async () => {
    const isHardwareCompatible = await checkDeviceForHardware()
    const isBiometricOnDevice = await checkForBiometric()
    const isAppConfigured = (await deviceStorage.getItem('xBiometric')) === null
    return isHardwareCompatible && isBiometricOnDevice && isAppConfigured
  }

  const shouldShowScan = async () => {
    const isDeviceStorageBiometric = (await deviceStorage.getItem('xBiometric')) === 'true'

    return isDeviceStorageBiometric
  }

  const showAlert = () => {
    Alert.alert(
      "Biometric lock",
      "Would you like to activate biometric lock on your device?",
      [
        {
          text: "No",
          onPress: () => {
            deviceStorage.saveItem('xBiometric', 'false')
            props.navigation.replace('FileExplorer', {
              folderId: rootFolderId
            })
          },
          style: "cancel"
        },
        {
          text: "Yes", onPress: () => {
            scan2()
          }
        }
      ],
      { cancelable: false }
    );
  }

  async function handleAppChange(newAppState: AppStateStatus) {
    setAppState(newAppState)
    console.log(newAppState)

    if (appState !== newAppState) {
      console.log('diferentes')
    }

  }

  const start = async () => {
    if (await shouldShowAlert()) {
      // MOSTRAR ALERTA
      showAlert()
    } else {
      const xBiometric = await deviceStorage.getItem('xBiometric')
      if (xBiometric === 'true') {
        // SCAN 1
        scan1()
      } else {
        // FILE EXPLORER
        props.navigation.replace('FileExplorer', {
          folderId: rootFolderId
        })
      }
    }

  }

  const scan1 = async () => {
    const showScan = await scanBiometrics()
    console.log('showScan', showScan)
    if (showScan.success) {
      //FILE EXPLORER
      props.navigation.replace('FileExplorer', {
        folderId: rootFolderId
      })
    } else {
      if (showScan.error === 'app_cancel') {
        // GRITOS Y PUÑETAZOS
    
        setCancelCount(cancelCount+1)
        console.log('count',cancelCount)

        //DevSettings.reload()
      } else {
        return scan1()
      }
    }
  }

  const scan2 = async () => {
    setCancelCount(cancelCount+1)

    const showScanAlert = await scanBiometrics()
    if (showScanAlert.success) {
      await deviceStorage.saveItem('xBiometric', 'true')
      //FILE EXPLORER
      props.navigation.replace('FileExplorer', {
        folderId: rootFolderId
      })
    }
  }

  useEffect(() => {
    deviceStorage.getItem('xBiometric').then((valor) => {
      console.log('valor', valor)
    }).catch(() => { })
    AppState.addEventListener('change', handleAppChange);
    start()
    return () => {
      AppState.removeEventListener('change', handleAppChange);
    }
  }, [])

  useEffect(() => {
    if (appState === 'active') {
      start()
    }
  }, [appState])

  return (
    <View>
      <Text onPress={() => {
        scan1().then(res => {

        })
      }}>Scan</Text>
    </View>
  )
}

const mapStateToProps = (state: any) => {
  return { ...state };
};

export default connect(mapStateToProps)(Biometric)
