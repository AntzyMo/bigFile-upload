import Router from '@koa/router'
import { createReadStream, createWriteStream } from 'fs'
import fs from 'fs-extra'
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

const store = new Map()

const addStore = (key, cb) => {
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
    const writer = createWriteStream(initPah(key))
    streamWrite(key, list, writer)
  }
}

const streamWrite = (key, list, writer) => {
  const [path, ...rest] = list
  if (!path) return store.delete(key)

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
  addStore(filename, obj => {
    obj.total = total
    obj.chunk[hash] = filepath
  })
})

router.post('/delete', koaBody(), ctx => {
  const { name } = JSON.parse(ctx.request.body)
  fs.removeSync(initPah(name))
  ctx.body = {
    code: 200,
    msg: '删除成功'
  }
})

// 中断请求后可以通过这个接口获取 最后上传的chunk
router.post('/getLastUpload', koaBody(), ctx => {
  const { name } = JSON.parse(ctx.request.body)
  const file = store.get(name)
  const hash = Object.keys(file.chunk).pop()
  ctx.body = {
    code: 200,
    data: {
      hash
    }
  }
})

app.listen(3000)
