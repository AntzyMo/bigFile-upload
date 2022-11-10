import Router from '@koa/router'
import fs from 'fs-extra'

import { initPath, UPLOAD_DIR } from './utils/index.js'
import { addStore, store } from './utils/store.js'

const router = new Router()

// 删除临时上传文件
const removeCache = name => {
  const cacheMap = store.get(name)
  const pathArr = Object.values(cacheMap.chunk)
  pathArr.forEach((path, index) => {
    fs.remove(path)
    if (index === pathArr.length - 1) store.delete(name)
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
router.post('/delete', async ctx => {
  const { name } = JSON.parse(ctx.request.body)
  await fs.remove(initPath(UPLOAD_DIR, name))
  ctx.body = {
    code: 200,
    msg: '删除成功'
  }
  removeCache(name)
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
