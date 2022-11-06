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
}
type fileMap = Record<string, file>

// 生成每3个一组 chunks
const generateChunks = (file: File, size: number) => {
  const totalChunks: chunk[][] = []
  const fileChunks: chunk[] = []
  let index = 0
  for (let cur = 0; cur < file.size; cur += size) {
    fileChunks.push({ hash: index++, chunk: file.slice(cur, cur + size) })
  }

  // 分成3组发一次请求
  for (let i = 0; i < fileChunks.length; i += 3) {
    totalChunks.push(fileChunks.slice(i, i + 3))
  }

  return { totalChunks, total: fileChunks.length }
}

export default () => {
  const fileMap = reactive<fileMap>({})

  // 重写上传
  const rewriteRequest = async (options: UploadRequestOptions) => {
    const { file } = options
    const size = 1024 * 50 // 50kB
    const { totalChunks, total } = generateChunks(file, size)
    fileMap[file.name] = {
      total,
      propress: 0,
      name: file.name
    }
    chunkRequest(totalChunks, file, total)
  }

  const chunkRequest = async (map: chunk[][], file: File, total: number) => {
    const [firstArr, ...rest] = map
    console.log(firstArr, 'firstArr')

    if (!firstArr) return
    const requestMap = firstArr.map(item => {
      const formData = new FormData()
      formData.append('filename', file.name)
      formData.append('hash', String(item.hash))
      formData.append('chunk', item.chunk)
      formData.append('total', String(total))
      return fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
      })
    })

    try {
      await Promise.all(requestMap)
      const hash = firstArr.at(-1)!.hash + 1
      fileMap[file.name].propress = Math.floor((100 * hash) / total)
      chunkRequest(rest, file, total)
    } catch (err) {}
  }

  const delFile = async ({ name }: file) => {
    await fetch('http://localhost:3000/delete', {
      method: 'POST',
      body: JSON.stringify({ name })
    })
    delete fileMap[name]
  }

  return {
    rewriteRequest,
    fileMap,
    delFile
  }
}
