<script lang="ts" setup>
import type { VisualEditorProps } from '@/visual-editor/visual-editor.props'
import { UploadFilled } from '@element-plus/icons-vue'

const props = withDefaults(
  defineProps<{
    propConfig: VisualEditorProps
  }>(),
  {},
)

const moduleValue = defineModel<string>({ required: false, default: '' })

function beforeUpload(file: File) {
  console.log(file, '要上传的文件')
  const fileReader = new FileReader()
  fileReader.onload = (event) => {
    moduleValue.value = event.target?.result as string
  }
  fileReader.readAsDataURL(file)
}
</script>

<template>
  <div class="w-full flex flex-col" :class="$style['image-upload']">
    <ElUpload drag action="" :before-upload="beforeUpload" :class="$style.upload">
      <div class="w-full h-[120px] flex flex-col items-center justify-center">
        <el-image v-if="moduleValue" style="width: 100%" fit="fill" :src="moduleValue" />
        <template v-else>
          <el-icon class="el-icon--upload">
            <UploadFilled />
          </el-icon>
          <div class="el-upload__text">
            拖拽文件或 <em>点击上传</em>
          </div>
        </template>
      </div>
    </ElUpload>
    <ElInput v-model="moduleValue" placeholder="图片地址" clearable />
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
