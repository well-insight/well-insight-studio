<script lang='ts' setup>
import type { CSSProperties } from 'vue'
import { ref } from 'vue'
import { ColorPicker } from '../color-picker'
import BackgroundRepeat from './BackgroundRepeat.vue'

const modelForm = ref({
  backgroundColor: '#ffffff',
  backgroundImage: '',
  backgroundPosition: 'center center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '100% 100%',
})
</script>

<template>
  <div class="wfull flex flex-col">
    <el-form
      class="w-full"
      label-position="top"
      label-width="auto"
    >
      <el-form-item label="背景颜色">
        <ColorPicker v-model="modelForm.backgroundColor" />
      </el-form-item>
      <el-form-item label="背景图片">
        <el-input v-model="modelForm.backgroundImage" />
      </el-form-item>
      <el-form-item label="背景位置">
        <el-input v-model="modelForm.backgroundPosition" />
      </el-form-item>
      <el-form-item label="背景重复">
        <BackgroundRepeat v-model="modelForm.backgroundRepeat" />
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang='scss' module></style>
