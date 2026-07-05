<script lang="ts" setup>
/**
 * 表单全局设置面板
 * 配置表单的标签位置、尺寸、按钮等全局属性
 */
import type { FormConfig } from '../../../types'
import { ref, watch } from 'vue'

const props = defineProps<{
  config: FormConfig
}>()

const emit = defineEmits<{
  (e: 'update', patch: Partial<FormConfig>): void
}>()

const local = ref<FormConfig>(JSON.parse(JSON.stringify(props.config)))

watch(() => props.config, (val) => {
  local.value = JSON.parse(JSON.stringify(val))
}, { deep: true })

function sync(key: string, value: any) {
  emit('update', { [key]: value })
}

const labelPositionOptions = [
  { label: '左', value: 'left' },
  { label: '右', value: 'right' },
  { label: '顶部', value: 'top' },
]

const sizeOptions = [
  { label: '大', value: 'large' },
  { label: '默认', value: 'default' },
  { label: '小', value: 'small' },
]

const gridColOptions = [12, 24].map(v => ({ label: `${v} 列`, value: v }))

const btnPositionOptions = [
  { label: '左', value: 'left' },
  { label: '居中', value: 'center' },
  { label: '右', value: 'right' },
]
</script>

<template>
  <div class="form-settings flex h-full flex-col">
    <!-- 标题栏 -->
    <div class="flex items-center px-3 py-2 border-b border-[var(--el-border-color-light)]">
      <span class="text-sm font-semibold">表单设置</span>
    </div>

    <el-scrollbar class="flex-1">
      <div class="px-3 py-2">
      <el-form label-position="top" size="small">
        <!-- 标签设置 -->
        <div class="mb-2 text-xs font-semibold text-[var(--el-text-color-secondary)]">标签设置</div>

        <el-form-item label="标签位置">
          <el-select
            :model-value="local.labelPosition"
            @change="sync('labelPosition', $event)"
          >
            <el-option
              v-for="opt in labelPositionOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="标签宽度 (px)">
          <el-input-number
            :model-value="local.labelWidth"
            :min="60"
            :max="300"
            :step="20"
            @change="sync('labelWidth', $event)"
          />
        </el-form-item>

        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs text-[var(--el-text-color-regular)]">显示必填星号</span>
          <el-switch
            :model-value="local.requiredAsterisk"
            size="small"
            @change="sync('requiredAsterisk', $event)"
          />
        </div>

        <!-- 尺寸设置 -->
        <div class="mb-2 mt-4 text-xs font-semibold text-[var(--el-text-color-secondary)]">尺寸设置</div>

        <el-form-item label="组件尺寸">
          <el-select
            :model-value="local.size"
            @change="sync('size', $event)"
          >
            <el-option
              v-for="opt in sizeOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="栅格列数">
          <el-select
            :model-value="local.gridColumns"
            @change="sync('gridColumns', $event)"
          >
            <el-option
              v-for="opt in gridColOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs text-[var(--el-text-color-regular)]">全局禁用</span>
          <el-switch
            :model-value="local.disabled"
            size="small"
            @change="sync('disabled', $event)"
          />
        </div>

        <!-- 提交按钮 -->
        <div class="mb-2 mt-4 text-xs font-semibold text-[var(--el-text-color-secondary)]">提交按钮</div>

        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs text-[var(--el-text-color-regular)]">显示提交按钮</span>
          <el-switch
            :model-value="local.submitBtn.show"
            size="small"
            @change="sync('submitBtn', { ...local.submitBtn, show: $event })"
          />
        </div>

        <el-form-item v-if="local.submitBtn.show" label="按钮文案">
          <el-input
            :model-value="local.submitBtn.text"
            @input="sync('submitBtn', { ...local.submitBtn, text: $event })"
          />
        </el-form-item>

        <el-form-item v-if="local.submitBtn.show" label="按钮位置">
          <el-select
            :model-value="local.submitBtn.position"
            @change="sync('submitBtn', { ...local.submitBtn, position: $event })"
          >
            <el-option
              v-for="opt in btnPositionOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>

        <!-- 重置按钮 -->
        <div class="mb-2 mt-4 text-xs font-semibold text-[var(--el-text-color-secondary)]">重置按钮</div>

        <div class="mb-3 flex items-center justify-between">
          <span class="text-xs text-[var(--el-text-color-regular)]">显示重置按钮</span>
          <el-switch
            :model-value="local.resetBtn.show"
            size="small"
            @change="sync('resetBtn', { ...local.resetBtn, show: $event })"
          />
        </div>

        <el-form-item v-if="local.resetBtn.show" label="按钮文案">
          <el-input
            :model-value="local.resetBtn.text"
            @input="sync('resetBtn', { ...local.resetBtn, text: $event })"
          />
        </el-form-item>
      </el-form>
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.form-settings {
  min-width: 280px;
}
</style>
