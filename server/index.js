import cors from '@koa/cors'
import Router from '@koa/router'
import { createReadStream, createWriteStream } from 'fs'
import fs from 'fs-extra'
import Koa from 'koa'
import { koaBody } from 'koa-body'
import serve from 'koa-static'
import { fileURLToPath, URL } from 'url'

const app = new Koa()
const router = new Router()

const UPLOAD_DIR = './public/upload'
const UPLOAD_CACHE = './public/cache'

const initPath = (dir, file) => {
  const fileDir = file ? `/${file}` : ''
  return fileURLToPath(new URL(`${dir}${fileDir}`, import.meta.url))
}

app.use(cors())
app.use(
  koaBody({
    multipart: true,
    formidable: {
      uploadDir: initPath(UPLOAD_CACHE)
    }
  })
)
app.use(router.routes())

// 开启鼎静态服务文件
app.use(serve(initPath(UPLOAD_DIR)))

// 初始化上传文件夹
fs.ensureDirSync(initPath(UPLOAD_DIR))
fs.ensureDirSync(initPath(UPLOAD_CACHE))

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
    const writer = createWriteStream(initPath(UPLOAD_DIR, key))
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

// 上传
router.post('/upload', async ctx => {
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

// 删除
router.post('/delete', ctx => {
  const { name } = JSON.parse(ctx.request.body)
  fs.removeSync(initPath(UPLOAD_DIR, name))
  fs.removeSync(initPath(UPLOAD_CACHE, 'cache'))
  ctx.body = {
    code: 200,
    msg: '删除成功'
  }
})

// 预览
router.post('/preview', ctx => {
  const { name } = JSON.parse(ctx.request.body)
  ctx.body = {
    code: 200,
    data: {
      url: `http://localhost:3000/${name}`
    }
  }
})

// 中断请求后可以通过这个接口获取 最后上传的chunk
router.post('/getLastUpload', ctx => {
  const { name } = JSON.parse(ctx.request.body)
  const file = store.get(name)
  const hash = Object.keys(file.chunk).at(-1)
  ctx.body = {
    code: 200,
    data: {
      hash
    }
  }
})

app.listen(3000)
