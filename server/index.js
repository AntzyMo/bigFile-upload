import cors from '@koa/cors'
import fs from 'fs-extra'
import Koa from 'koa'
import { koaBody } from 'koa-body'
import serve from 'koa-static'

import router from './router.js'
import { initPath, UPLOAD_CACHE, UPLOAD_DIR } from './utils/index.js'
const app = new Koa()

// 初始化上传文件夹
fs.ensureDirSync(initPath(UPLOAD_DIR))
fs.ensureDirSync(initPath(UPLOAD_CACHE))

// 开启静态服务文件
app.use(serve(initPath(UPLOAD_DIR)))

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

app.listen(3000)
