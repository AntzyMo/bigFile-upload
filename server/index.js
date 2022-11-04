import Router from '@koa/router'
import { createReadStream, createWriteStream } from 'fs'
import Koa from 'koa'
import { koaBody } from 'koa-body'
import cors from 'koa-cors'
import { fileURLToPath, URL } from 'url'

const app = new Koa()
const router = new Router()
app.use(cors())
app.use(router.routes())

const UPLOAD_DIR = './public/upload'

const initPah = file =>
  fileURLToPath(new URL(`${UPLOAD_DIR}/${file}`, import.meta.url))

class Store {
  constructor() {
    this.store = {}
  }

  async on(key, cb) {
    if (!(key in this.store)) {
      this.store[key] = {
        total: 0,
        chunk: {}
      }
    }
    cb(this.store[key])

    const { chunk, total } = this.store[key]
    const list = Object.values(chunk)

    if (list.length == total) {
      const writer = createWriteStream(initPah(key))
      streamWrite(key, list, writer)
    }
  }
}

const chunksMap = new Store()

const streamWrite = (key, list, writer) => {
  const [path, ...rest] = list
  if (!path) return delete chunksMap.store[key]

  const reader = createReadStream(path)
  reader.pipe(writer, { end: false })
  reader.on('end', () => {
    streamWrite(key, rest, writer)
  })
}

router.post('/upload', koaBody({ multipart: true }), ctx => {
  const { filename, hash, total, cur } = ctx.request.body
  const filepath = ctx.request.files.chunk.filepath
  ctx.body = {
    code: 200,
    filename,
    total,
    cur,
    msg: '上传成功'
  }
  chunksMap.on(filename, obj => {
    obj.total = total
    obj.chunk[hash] = filepath
  })
})

app.listen(3000)
