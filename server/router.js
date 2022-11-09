import Router from '@koa/router'
import fs from 'fs-extra'

import { initPath, UPLOAD_CACHE, UPLOAD_DIR } from './utils/index.js'
import { addStore, store } from './utils/store.js'

const router = new Router()

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

export default router
