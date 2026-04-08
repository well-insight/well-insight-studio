<script lang="ts" setup>
import { UploadFilled } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '@/store/workspaceStore/workspaceStore'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'

const { currentPage } = useVisualData()

const pageConfig = currentPage.value.config

const workspaceStore = useWorkspaceStore()

const { currentApp } = storeToRefs(workspaceStore)

const currentImage = defineModel<string>({ required: false, default: '' })

function beforeUpload(file: File) {
  console.log(file, '要上传的文件')
  const fileReader = new FileReader()
  fileReader.onload = event => {
    currentImage.value = event.target?.result as string
  }
  fileReader.readAsDataURL(file)
}
</script>

<template>
  <div class="w-full flex flex-col" :class="$style['image-upload']">
    <ElUpload drag action="" :before-upload="beforeUpload" :class="$style.upload">
      <div class="w-full h-[120px] flex flex-col items-center justify-center">
        <el-image v-if="currentImage" style="width: 100%" fit="fill" :src="currentImage" />
        <template v-else>
          <el-icon class="el-icon--upload">
            <UploadFilled />
          </el-icon>
          <div class="el-upload__text">拖拽文件或 <em>点击上传</em></div>
        </template>
      </div>
    </ElUpload>
    <ElInput v-model="currentImage" placeholder="图片地址" clearable />
  </div>
</template>

<style lang="scss" module>
.image-upload {
  // display: block;
}
.upload {
  :global {
    .el-upload {
      position: relative;
      overflow: hidden;
      cursor: pointer;
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      width: 100%;
    }

    // .uploader-icon {
    //   width: 178px;
    //   height: 178px;
    //   font-size: 28px;
    //   line-height: 178px;
    //   color: #8c939d;
    //   text-align: center;
    // }
  }
}
</style>
