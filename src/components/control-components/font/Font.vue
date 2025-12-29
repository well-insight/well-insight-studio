<script lang='ts' setup>
import type { CSSProperties } from 'vue'
import { ref, watch } from 'vue'

const modelValue = defineModel<CSSProperties>({
  default: {
    fontSize: '14px',
    fontWeight: '500',
    fontStyle: 'normal',
  },
  required: true,
})

const modelForm = ref({
  fontSize: '14px',
  fontWeight: '500',
  fontStyle: 'normal',
})

const fontStyleOptions = [{ label: '正常', value: 'normal' }, { label: '斜体', value: 'italic' }]

async function changeValue() {
  modelValue.value = modelForm.value
}

watch(modelValue, (n) => {
  modelForm.value = { ...modelForm.value, ...n } as typeof modelForm.value
}, {
  immediate: true,
  deep: true,
})
</script>

<template>
  <div class="wfull flex flex-col">
    <el-form class="w-full" label-position="top" label-width="auto" :model="modelForm">
      <el-form-item label="字体大小" prop="fontSize">
        <InputNumber v-model="modelForm.fontSize" @change="changeValue" />
      </el-form-item>
      <el-form-item label="字体粗细" prop="fontWeight">
        <InputNumber v-model="modelForm.fontWeight" @change="changeValue" />
      </el-form-item>
      <el-form-item label="字体样式" prop="fontSize">
        <el-select-v2 v-model="modelForm.fontStyle" :options="fontStyleOptions" @change="changeValue" />
      </el-form-item>
    </el-form>
  </div>
</template>

<style lang='scss' module></style>
