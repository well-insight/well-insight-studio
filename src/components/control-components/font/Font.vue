<script lang='ts' setup>
import type { CSSProperties } from 'vue'
import { ref, watch } from 'vue'
import { ColorPicker } from '../color-picker'
import { ImageUploader } from '../uploader'
import BackgroundRepeat from './BackgroundRepeat.vue'

const backgroundValue = defineModel<CSSProperties>({
  default: {
    backgroundColor: '#ffffff',
    backgroundImage: '',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    backgroundSize: '100% 100%',
  },
  required: true,
})

const modelForm = ref({
  backgroundColor: '#ffffff',
  backgroundImage: '',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '100% 100%',
})

async function changeBackground() {
  backgroundValue.value = modelForm.value
}

watch(backgroundValue, (n) => {
  modelForm.value = { ...modelForm.value, ...n } as typeof modelForm.value
}, {
  immediate: true,
  deep: true,
})
</script>

<template>
  <div class="wfull flex flex-col">
    <el-form class="w-full" label-position="top" label-width="aut o" :model="modelForm">
      <el-form-item label="背景颜色" prop="backgroundColor">
        <ColorPicker v-model="modelForm.backgroundColor" @change="changeBackground" />
      </el-form-item>
      <el-form-item label="背景图片" prop="backgroundImage">
        <ImageUploader v-model="modelForm.backgroundImage" @change="changeBackground" />
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
