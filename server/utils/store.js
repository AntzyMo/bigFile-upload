import { createReadStream, createWriteStream } from 'fs'

import { initPath, UPLOAD_DIR } from './index.js'

export const store = new Map()

export const addStore = (key, cb) => {
  const hasKey = store.has(key)
  if (!hasKey) {
    store.set(key, {
      total: 0,
      chunk: {}
    })
  }
  const keyValue = store.get(key)
  cb(keyValue)

  const { chunk, total } = keyValue
  const list = Object.values(chunk)

  if (list.length === total * 1) {
    const writer = createWriteStream(initPath(UPLOAD_DIR, key))
    streamWrite(key, list, writer)
  }
}

const streamWrite = (key, list, writer) => {
  const [path, ...rest] = list
  if (!path) return writer.end()

  const reader = createReadStream(path)
  reader.pipe(writer, { end: false })
  reader.on('end', () => {
    streamWrite(key, rest, writer)
  })
}
