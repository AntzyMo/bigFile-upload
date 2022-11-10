import type { UploadRequestOptions } from 'element-plus'
import { reactive } from 'vue'

interface chunk {
  hash: number
  chunk: Blob
}

interface file {
  propress: number
  total: number
  name: string
  isStop: boolean
  controller: AbortController
}
type fileMap = Record<string, file>

// 生成每3个一组 chunks
const generateChunks = (file: File, size: number) => {
  const totalChunks: chunk[][] = []
  const fileChunks: chunk[] = []

  for (let [cur, index] = [0, 0]; cur < file.size; cur += size) {
    fileChunks.push({ hash: index++, chunk: file.slice(cur, cur + size) })
  }
  console.log('fileChunks', fileChunks)

  // 分成3组发一次请求
  for (let i = 0; i < fileChunks.length; i += 3) {
    totalChunks.push(fileChunks.slice(i, i + 3))
  }

  return { totalChunks, total: fileChunks.length }
}

export default () => {
  const fileMap = reactive<fileMap>({})

  // 缓存 切片用于续传
  const chunksCache = new Map()

  // 重写上传
  const rewriteRequest = async (options: UploadRequestOptions) => {
    const { file } = options
    const size = 1024 * 50 // 50kB
    const { totalChunks, total } = generateChunks(file, size)

    chunksCache.set(file.name, { totalChunks, total })

    fileMap[file.name] = {
      total,
      propress: 0,
      name: file.name,
      isStop: false,
      controller: new AbortController()
    }
    chunkRequest(totalChunks, file.name, total)
  }

  // 发送请求
  const chunkRequest = async (map: chunk[][], name: string, total: number) => {
    const [firstArr, ...rest] = map

    if (!firstArr) return

    const requestMap = firstArr.map(item => {
      const formData = new FormData()
      formData.append('filename', name)
      formData.append('hash', String(item.hash))
      formData.append('chunk', item.chunk)
      formData.append('total', String(total))
      return fetch('http://localhost:3000/upload', {
        method: 'POST',
        signal: fileMap[name].controller.signal,
        body: formData
      })
    })

    try {
      await Promise.all(requestMap)
      const hash = firstArr.at(-1)!.hash + 1
      fileMap[name].propress = Math.floor((100 * hash) / total)
      chunkRequest(rest, name, total)
    } catch (err) {
      console.log(err, 'er')
    }
  }

  const delFile = async ({ name }: file) => {
    await fetch('http://localhost:3000/delete', {
      method: 'POST',
      body: JSON.stringify({ name })
    })
    delete fileMap[name]
  }

  // 点击开始暂停
  const handleStartAndStop = async (data: file) => {
    const { name } = data
    data.isStop = !data.isStop

    if (data.isStop) {
      data.controller.abort()
      data.controller = new AbortController()
      return
    }
    reloadUpload(name)
  }

  // 断点续传
  const reloadUpload = async (name: string) => {
    const res = await fetch('http://localhost:3000/getLastUpload', {
      method: 'POST',
      body: JSON.stringify({ name })
    })
    const {
      data: { hash }
    } = await res.json()
    const { totalChunks, total } = chunksCache.get(name)
    for (const key in totalChunks) {
      const arr = totalChunks[key]
      const hashStart = arr.some(item => item.hash == hash)
      if (hashStart) {
        const list = totalChunks.slice(key)
        chunkRequest(list, name, total)
        return
      }
    }
  }

  const openFile = async (name: string) => {
    const res = await fetch('http://localhost:3000/preview', {
      method: 'POST',
      body: JSON.stringify({ name })
    })
    const {
      data: { url }
    } = await res.json()
    window.open(url)
  }

  return {
    rewriteRequest,
    fileMap,
    delFile,
    handleStartAndStop,
    openFile
  }
}
