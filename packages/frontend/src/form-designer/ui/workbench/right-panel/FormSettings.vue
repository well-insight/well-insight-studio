<script lang="ts" setup>
/**
 * 表单全局设置面板
 * 配置表单的标签位置、栅格、按钮等全局属性（组件尺寸跟随系统主题）
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

watch(
  () => props.config,
  (val) => {
    local.value = JSON.parse(JSON.stringify(val))
  },
  { deep: true },
)

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
    <el-scrollbar class="flex-1">
      <div class="p-3">
        <el-form label-position="top">
          <div class="form-section-title mb-2">
            标签设置
          </div>

          <el-form-item label="标签位置">
            <el-select :model-value="local.labelPosition" @change="sync('labelPosition', $event)">
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

          <el-form-item label="标签后缀">
            <el-input
              :model-value="local.labelSuffix"
              placeholder="如：冒号 :"
              @input="sync('labelSuffix', $event)"
            />
          </el-form-item>

          <el-form-item label="尺寸">
            <el-select :model-value="local.size" @change="sync('size', $event)">
              <el-option
                v-for="opt in sizeOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>

          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs text-[var(--el-text-color-regular)]">显示必填星号</span>
            <el-switch
              :model-value="local.requiredAsterisk"
              @change="sync('requiredAsterisk', $event)"
            />
          </div>

          <div class="form-section-title mb-2 mt-4">
            布局设置
          </div>

          <el-form-item label="栅格列数">
            <el-select :model-value="local.gridColumns" @change="sync('gridColumns', $event)">
              <el-option
                v-for="opt in gridColOptions"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </el-select>
          </el-form-item>

          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs text-[var(--el-text-color-regular)]">行内模式</span>
            <el-switch
              :model-value="local.inline"
              @change="sync('inline', $event)"
            />
          </div>

          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs text-[var(--el-text-color-regular)]">全局禁用</span>
            <el-switch
              :model-value="local.disabled"
              @change="sync('disabled', $event)"
            />
          </div>

          <div class="form-section-title mb-2 mt-4">
            校验与反馈
          </div>

          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs text-[var(--el-text-color-regular)]">显示校验错误信息</span>
            <el-switch
              :model-value="local.showMessage"
              @change="sync('showMessage', $event)"
            />
          </div>

          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs text-[var(--el-text-color-regular)]">内联校验信息</span>
            <el-switch
              :model-value="local.inlineMessage"
              @change="sync('inlineMessage', $event)"
            />
          </div>

          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs text-[var(--el-text-color-regular)]">校验状态图标</span>
            <el-switch
              :model-value="local.statusIcon"
              @change="sync('statusIcon', $event)"
            />
          </div>

          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs text-[var(--el-text-color-regular)]">校验失败滚动到错误</span>
            <el-switch
              :model-value="local.scrollToError"
              @change="sync('scrollToError', $event)"
            />
          </div>

          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs text-[var(--el-text-color-regular)]">规则变更时重新校验</span>
            <el-switch
              :model-value="local.validateOnRuleChange"
              @change="sync('validateOnRuleChange', $event)"
            />
          </div>

          <div class="form-section-title mb-2 mt-4">
            提交按钮
          </div>

          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs text-[var(--el-text-color-regular)]">显示提交按钮</span>
            <el-switch
              :model-value="local.submitBtn.show"
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

          <div class="form-section-title mb-2 mt-4">
            重置按钮
          </div>

          <div class="mb-3 flex items-center justify-between">
            <span class="text-xs text-[var(--el-text-color-regular)]">显示重置按钮</span>
            <el-switch
              :model-value="local.resetBtn.show"
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
  height: 100%;
}
</style>
