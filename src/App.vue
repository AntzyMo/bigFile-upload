<script setup lang="ts">
  import type { UploadInstance, UploadRequestOptions } from 'element-plus'
  import { ref } from 'vue'

  const uploadRef = ref<UploadInstance>()

  const rewriteRequest = async (options: UploadRequestOptions) => {
    const { file } = options
    const size = 1024 * 50 // 50kB
    const fileChunks = []
    let index = 0
    for (let cur = 0; cur < file.size; cur += size) {
      fileChunks.push({ hash: index++, chunk: file.slice(cur, cur + size) })
    }
    console.log(options, 'options')
    console.log('fileChunks', fileChunks)

    fileChunks.forEach(item => {
      const formData = new FormData()
      formData.append('filename', file.name)
      formData.append('hash', item.hash)
      formData.append('chunk', item.chunk)
      formData.append('total', fileChunks.length)
      fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData
      })
    })
  }

</script>

<template>
  <el-upload
    ref="uploadRef"
    action=""
    multiple
    :http-request="rewriteRequest"
  >
    <el-button type="primary">Click to upload</el-button>
    <el-button type="primary" >暂停</el-button>
    <el-button type="primary">开始</el-button>

    
  </el-upload>
</template>

<style scoped></style>
