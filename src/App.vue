<script setup lang="ts">
  import { CloseBold, UploadFilled, View } from '@element-plus/icons-vue'

  import useUpload from './hooks'

  const { rewriteRequest, fileMap, delFile, handleStartAndStop, openFile } =
    useUpload()
</script>

<template>
  <div class="container">
    <h1>大文件切片上传</h1>
    <el-upload
      class="uploadCom"
      drag
      action=""
      multiple
      :http-request="rewriteRequest"
      :show-file-list="false"
    >
      <el-icon class="el-icon--upload"><upload-filled /></el-icon>
      <div class="el-upload__text">点击<em>此处上传文件</em></div>
    </el-upload>

    <el-card
      v-if="Object.keys(fileMap).length"
      class="box-card"
    >
      <div
        v-for="item in fileMap"
        :key="item.name"
        class="file"
      >
        <div class="img">
          <img src="./assets/file.svg" />
        </div>
        <div class="r-content">
          <div class="top">
            <div class="name">{{ item.name }}</div>
            <div class="btns">
              <template v-if="item.propress != 100">
                <img
                  v-if="item.isStop"
                  class="startIcon"
                  src="./assets/start.svg"
                  @click="handleStartAndStop(item)"
                />
                <img
                  v-else
                  class="startIcon"
                  src="./assets/stop.svg"
                  @click="handleStartAndStop(item)"
                />
              </template>
              <el-icon
                v-else
                class="openView"
                @click="openFile(item.name)"
                ><View
              /></el-icon>
              <el-icon
                class="close"
                @click="delFile(item)"
                ><CloseBold
              /></el-icon>
            </div>
          </div>
          <div class="bottom">
            <el-progress
              :text-inside="true"
              :stroke-width="26"
              :percentage="item.propress"
            />
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
  .container {
    margin: 0 auto;
    padding-top: 40px;
    width: 50vw;

    h1 {
      text-align: center;
      margin-bottom: 20px;
    }

    .uploadCom {
      margin-bottom: 40px;
    }

    .box-card {
      .file {
        display: flex;
        align-items: center;
        margin-bottom: 34px;

        .img {
          width: 38px;
          height: 100%;
          margin-right: 10px;

          img {
            width: 100%;
            height: 100%;
          }
        }
        .r-content {
          flex: 1;

          .top {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
            .btns {
              display: flex;
              align-items: center;
              .startIcon {
                width: 20px;
                height: 20px;
                margin-right: 10px;
                &:hover {
                  cursor: pointer;
                }
              }

              .openView {
                margin-right: 10px;
                cursor: pointer;
              }

              .close {
                cursor: pointer;
                &:hover {
                  color: red;
                }
              }
            }
          }
        }
      }
    }
  }
</style>
