<script lang='ts' setup>
import type { CSSProperties } from 'vue'
import { ref, watch } from 'vue'
import { ColorPicker } from '../color-picker'
import { ImageUploader } from '../uploader'
import BackgroundRepeat from './BackgroundRepeat.vue'
import { composeBackground, parseBackground } from './utils'

const backgroundValue = defineModel<string>({ default: '', required: true })

const modelForm = ref({
  backgroundColor: '#ffffff',
  backgroundImage: '',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '100% 100%',
})

watch(backgroundValue, (n) => {
  debugger
  const $dom = document.createElement('div')
  $dom.style.background = n

  const backgroundImage = $dom.style.backgroundImage?.startsWith('url') ? $dom.style.backgroundImage : ''

  modelForm.value = {
    ...modelForm.value,
    backgroundColor: $dom.style.backgroundColor,
    backgroundImage,
    backgroundPosition: $dom.style.backgroundPosition,
    backgroundRepeat: $dom.style.backgroundRepeat,
    backgroundSize: $dom.style.backgroundSize,
  }
})

function changeBackground() {
  backgroundValue.value = composeBackground(modelForm.value)
  debugger
}

function changeImage(v: string) {
  debugger
  backgroundValue.value = composeBackground({ ...modelForm.value, backgroundImage: v ? `url(${v})` : '' })
}
</script>

<template>
  <div class="wfull flex flex-col">
    <el-form
      class="w-full"
      label-position="top"
      label-width="auto"
      :model="modelForm"
    >
      <el-form-item label="背景颜色" prop="backgroundColor">
        <ColorPicker v-model="modelForm.backgroundColor" @change="changeBackground" />
      </el-form-item>
      <el-form-item label="背景图片" prop="backgroundImage">
        <ImageUploader v-model="modelForm.backgroundImage" @change="changeImage" />
      </el-form-item>
      <el-form-item label="背景位置" prop="backgroundPosition">
        <el-input v-model="modelForm.backgroundPosition" @change="changeBackground" />
      </el-form-item>
      <el-form-item label="背景大小" prop="backgroundSize">
        <el-input v-model="modelForm.backgroundSize" @change="changeBackground" />
      </el-form-item>
      <el-form-item label="背景重复" prop="backgroundRepeat">
        <BackgroundRepeat v-model="modelForm.backgroundRepeat" @change="changeBackground" />
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang='scss' module></style>
