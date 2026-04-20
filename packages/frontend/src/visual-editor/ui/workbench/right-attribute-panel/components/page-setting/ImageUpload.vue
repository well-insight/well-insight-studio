<script lang="ts" setup>
import { UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const currentImage = defineModel<string>({ required: false, default: '' })

function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.warning('仅支持上传图片文件')
    return false
  }
  const fileReader = new FileReader()
  fileReader.onload = event => {
    currentImage.value = event.target?.result as string
  }
  fileReader.readAsDataURL(file)
  // 阻止 ElUpload 发请求，直接走本地预览+表单回填
  return false
}
</script>

<template>
  <div class="w-full flex flex-col" :class="$style['image-upload']">
    <ElUpload drag action="#" accept="image/*" :show-file-list="false" :before-upload="beforeUpload" :class="$style.upload">
      <div class="w-full h-[54px] flex flex-col items-center justify-center">
        <el-image v-if="currentImage" style="width: 100%" fit="fill" :src="currentImage" />
        <template v-else>
          <el-icon class="el-icon--upload !text-[20px]">
            <UploadFilled />
          </el-icon>
          <div class="el-upload__text !text-[12px]">拖拽文件或 <em>点击上传</em></div>
        </template>
      </div>
    </ElUpload>
    <ElInput size="default" v-model="currentImage" placeholder="图片地址" clearable />
  </div>
</template>

<style lang="scss" module>
.image-upload {
  // display: block;
}
.upload {
  margin-bottom: 6px;
  :global {
    .el-upload {
      position: relative;
      overflow: hidden;
      cursor: pointer;
      border: 1px dashed #d9d9d9;
      border-radius: 6px;
      width: 100%;
      /* min-height: 84px; */
      /* padding: 4px; */
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
