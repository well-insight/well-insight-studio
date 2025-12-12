<script lang='ts' setup>
import type { UploadFile } from 'element-plus'
import { ref, watch } from 'vue'

const fileUrl = defineModel<string>({ required: true, default: '' })
const fileList = ref([])

function uploadSuccess(file: UploadFile) {
  if (file.status !== 'ready')
    return
  if (file) {
    const reader = new FileReader()
    reader.readAsDataURL(file.raw!)
    reader.onload = (e) => {
      fileUrl.value = (e.target?.result || '') as string
    }
  }
}

function deleteBg() {
  fileUrl.value = ''
  fileList.value = []
}
</script>

<template>
  <el-upload
    v-model:file-list="fileList" :class="$style['custom-upload']" drag action="#" :multiple="false"
    :show-file-list="false" :on-change="uploadSuccess"
  >
    <div class="flex items-center justify-center flex-col w-full relative h-full custom-upload-wrapper">
      <template v-if="!fileUrl">
        <el-icon class="el-icon--upload" size="60px">
          <PictureFilled />
        </el-icon>
        <div class="el-upload__text">
          背景图需小于 5M ，格式为 png/jpg/gif 的文件
        </div>
      </template>
      <template v-else>
        <img class="w-full" :src="fileUrl" alt="" fit="contain">
        <div class="flex absolute top-2 right-2 z-99">
          <el-icon :size="20" @click.stop="deleteBg">
            <Delete />
          </el-icon>
        </div>
      </template>
    </div>
  </el-upload>
</template>

<style lang='scss' module>
.custom-upload {
  height: 180px;
  width: 100%;

  :global(.el-upload) {
    height: 100%;
    width: 100%;
  }

  :global(.el-upload-dragger) {
    padding: 0;
    height: 100%;
    width: 100%;
  }
}
</style>
