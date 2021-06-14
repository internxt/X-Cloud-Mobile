import React from 'react'
import { Text, View } from 'react-native'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { tailwind } from '../../tailwind'
import CloudDownloadBlue from '../../../assets/icons/photos/cloud-download-blue.svg'
import CloudDownloadGray from '../../../assets/icons/photos/cloud-download-gray.svg'
import CloudUploadBlue from '../../../assets/icons/photos/cloud-upload-blue.svg'
import CloudUploadGray from '../../../assets/icons/photos/cloud-upload-gray.svg'
import FolderWithCrossBlue from '../../../assets/icons/photos/folder-with-cross-blue.svg'
import FolderWithCrossGray from '../../../assets/icons/photos/folder-with-cross-gray.svg'
import { normalize } from '../../helpers'

interface FilterButtonProps {
  width: string,
  corners: string,
  text: string,
  filter: string,
  activeFilter: string
  handleFilterSelection?: (filterName: string) => void
  onPress?: () => void
}

const FilterButton = ({ width, corners, text, filter, handleFilterSelection, onPress, activeFilter }: FilterButtonProps): JSX.Element => {

  const SelectedText = ({ text }: { text: string }) => (
    <Text style={[tailwind('text-sm text-blue-60 font-averta-light ml-2'), { fontSize: normalize(12), marginLeft: normalize(4) }]}>{text}</Text>
  )
  const NormalText = ({ text }: { text: string }) => (
    <Text style={[tailwind('text-sm text-gray-80 font-averta-light ml-2'), { fontSize: normalize(12), marginLeft: normalize(4) }]}>{text}</Text>
  )

  const ICON_SIZE = normalize(17)

  return (
    <View style={tailwind(width)}>
      <TouchableOpacity style={tailwind(`flex-row h-8 ${corners} bg-white items-center justify-center ml-px mr-px`)}
        onPress={() => onPress ? onPress() : handleFilterSelection(filter)}
      >
        {filter === 'download' ?
          activeFilter === 'download' ?
            <View style={tailwind('flex-row')}>
              <CloudDownloadBlue width={ICON_SIZE} height={ICON_SIZE} />
              <SelectedText text={text} />
            </View>
            :
            <View style={tailwind('flex-row')}>
              <CloudDownloadGray width={ICON_SIZE} height={ICON_SIZE} />
              <NormalText text={text} />
            </View>
          :
          null
        }

        {filter === 'upload' ?
          activeFilter === 'upload' ?
            <View style={tailwind('flex-row')}>
              <CloudUploadBlue width={ICON_SIZE} height={ICON_SIZE} />
              <SelectedText text={text} />
            </View>
            :
            <View style={tailwind('flex-row')}>
              <CloudUploadGray width={ICON_SIZE} height={ICON_SIZE} />
              <NormalText text={text} />
            </View>
          :
          null
        }

        {filter === 'albums' ?
          activeFilter === 'albums' ?
            <View style={tailwind('flex-row')}>
              <FolderWithCrossBlue width={ICON_SIZE} height={ICON_SIZE} />
              <SelectedText text={text} />
            </View>
            :
            <View style={tailwind('flex-row')}>
              <FolderWithCrossGray width={ICON_SIZE} height={ICON_SIZE} />
              <NormalText text={text} />
            </View>
          :
          null
        }
      </TouchableOpacity>
    </View>
  )
}

export default React.memo(FilterButton)