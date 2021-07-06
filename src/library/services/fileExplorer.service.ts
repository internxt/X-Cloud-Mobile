import { queue } from 'async'
import { uploadFile } from '../apis/fileExplorer'
import { IFileToUpload } from '../interfaces/drive'

export const createChunks = (maxUploadableSize: number, files: IFileToUpload[], dispatch: any): [() => Promise<void>][] => {
  const filesChunk: Promise<void>[] = []
  const chunks: Promise<void>[][] = []
  const iterables = files.length
  let currentTotalSize = 0
  let count = 0

  const chunkQueue = queue(async (task: () => Promise<void>, callBack) => {
    await task()
    callBack()
  }, 5)

  const reset = () => {
    count = 0
    currentTotalSize = 0
    filesChunk.length = 0
    loop()
  }
  const loop = () => {
    for (const asset of files) {
      count++

      if (asset.size >= maxUploadableSize) {
        chunkQueue.push(() => uploadFile(asset, dispatch))
        files = files.filter(file => file !== asset)
        if (count === iterables && files.length > 0) {
          reset()
          break
        }
        continue
      }

      currentTotalSize += asset.size
      if (currentTotalSize >= maxUploadableSize) {
        if (count === iterables && files.length > 0) {
          chunks.push(filesChunk)
          reset()
          break
        }
        continue
      }

      filesChunk.push(() => uploadFile(asset, dispatch))
      files = files.filter(file => file !== asset)

      if (count === iterables && files.length > 0) {
        chunks.push(filesChunk)
        reset()
        break
      }
    }
  }

  loop()

  images.forEach(image => photoQueue.push(() => uploadPhoto(image, dispatch)))
  return photoQueue.drain()

  return chunks
}