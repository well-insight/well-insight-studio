<script lang='ts' setup>
import type { UploadFile, UploadRequestOptions } from 'element-plus'
import { nextTick, ref } from 'vue'
import { uploadPic } from '@/api'

const emits = defineEmits(['change'])

const fileUrl = defineModel<string>({ required: true, default: '' })
const fileList = ref([])

async function uploadSuccess(result: any) {
  fileUrl.value = result?.links?.url || ''
  await nextTick()
  emits('change', fileUrl.value)
  // if (file.status !== 'ready')
  //   return
  // if (file) {
  //   const reader = new FileReader()
  //   reader.readAsDataURL(file.raw!)
  //   reader.onload = async (e) => {
  //     fileUrl.value = e.target?.result as string
  //     await nextTick()
  //     emits('change', fileUrl.value)
  //   }
  // }
}

function deleteBg() {
  fileUrl.value = ''
  fileList.value = []
  emits('change', fileUrl.value)
}

function customHttpRequest(options: UploadRequestOptions) {
  const data = new FormData()
  data.set('file', options.file)
  data.set('permission', '0')
  return uploadPic(data)
}
</script>

<template>
  <div :class="$style['custom-upload']">
    <el-upload
      v-model:file-list="fileList" drag action="#" :multiple="false"
      class="w-full h-full"
      :http-request="customHttpRequest"
      :show-file-list="false" :on-success="uploadSuccess"
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
  </div>
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
