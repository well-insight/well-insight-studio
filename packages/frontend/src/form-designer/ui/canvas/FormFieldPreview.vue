<script lang="ts" setup>
/**
 * 画布内字段真实控件示意（只读预览，不抢交互）
 */
import type { FormField } from '../../types'
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useThemeStore } from '@/stores/themeStore'

const props = defineProps<{
  field: FormField
  /** 组件尺寸（从表单设计器传递，覆盖全局主题） */
  size?: string
}>()

const { config: themeConfig } = storeToRefs(useThemeStore())

/** 合并尺寸：prop > 字段级 > 全局主题 */
const resolvedSize = computed(() => props.size || props.field.size || themeConfig.value.size)

const previewValue = computed(() => {
  const field = props.field
  if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== '')
    return field.defaultValue
  switch (field.componentKey) {
    case 'switch':
      return field.props?.activeValue ?? true
    case 'checkbox':
      return []
    case 'rate':
      return 3
    case 'slider':
      return field.props?.range ? [20, 60] : 40
    case 'select':
      return field.props?.multiple ? [] : undefined
    case 'colorPicker':
      return '#2b73af'
    default:
      return undefined
  }
})

const options = computed(() => props.field.options || [])

const cascaderOptions = computed(() => {
  if (options.value.length)
    return options.value.map(o => ({ label: o.label, value: o.value }))
  return [
    {
      label: '选项一',
      value: '1',
      children: [{ label: '子项', value: '1-1' }],
    },
  ]
})

const treeData = computed(() => [
  {
    label: '节点一',
    value: '1',
    children: [{ label: '子节点', value: '1-1' }],
  },
  { label: '节点二', value: '2' },
])

const transferData = computed(() =>
  (options.value.length
    ? options.value
    : [
        { label: '选项 A', value: 'a' },
        { label: '选项 B', value: 'b' },
        { label: '选项 C', value: 'c' },
      ]
  ).map(o => ({ key: o.value, label: o.label })),
)
</script>

<template>
  <div class="form-field-preview" :class="[`is-${field.componentKey}`]">
    <el-input
      v-if="field.componentKey === 'input'"
      :model-value="previewValue"
      :placeholder="field.placeholder || '请输入'"
      :disabled="field.disabled"
      :readonly="true"
      :size="resolvedSize"
      :clearable="false"
    />

    <el-input
      v-else-if="field.componentKey === 'password'"
      type="password"
      :model-value="previewValue || '******'"
      :placeholder="field.placeholder || '请输入密码'"
      :disabled="field.disabled"
      :readonly="true"
      :show-password="false"
      :size="resolvedSize"
    />

    <el-input
      v-else-if="field.componentKey === 'textarea'"
      type="textarea"
      :model-value="previewValue"
      :placeholder="field.placeholder || '请输入'"
      :disabled="field.disabled"
      :readonly="true"
      :rows="2"
      :size="resolvedSize"
      resize="none"
    />

    <el-input-number
      v-else-if="field.componentKey === 'number'"
      :model-value="typeof previewValue === 'number' ? previewValue : undefined"
      :placeholder="field.placeholder"
      :disabled="field.disabled"
      :min="field.props?.min"
      :max="field.props?.max"
      :step="field.props?.step ?? 1"
      :controls="field.props?.controls !== false"
      :size="resolvedSize"
      class="w-full!"
    />

    <el-select
      v-else-if="field.componentKey === 'select'"
      :model-value="previewValue"
      :placeholder="field.placeholder || '请选择'"
      :disabled="field.disabled"
      :multiple="field.props?.multiple"
      :size="resolvedSize"
      class="w-full"
    >
      <el-option
        v-for="opt in options"
        :key="opt.value"
        :label="opt.label"
        :value="opt.value"
      />
    </el-select>

    <el-radio-group
      v-else-if="field.componentKey === 'radio'"
      :model-value="previewValue ?? options[0]?.value"
      :disabled="field.disabled"
      :size="resolvedSize"
    >
      <el-radio
        v-for="opt in options"
        :key="opt.value"
        :value="opt.value"
        :border="field.props?.border"
      >
        {{ opt.label }}
      </el-radio>
    </el-radio-group>

    <el-checkbox-group
      v-else-if="field.componentKey === 'checkbox'"
      :model-value="Array.isArray(previewValue) ? previewValue : []"
      :disabled="field.disabled"
      :size="resolvedSize"
    >
      <el-checkbox
        v-for="opt in options"
        :key="opt.value"
        :label="opt.value"
        :border="field.props?.border"
      >
        {{ opt.label }}
      </el-checkbox>
    </el-checkbox-group>

    <el-switch
      v-else-if="field.componentKey === 'switch'"
      :model-value="previewValue"
      :disabled="field.disabled"
      :active-text="field.props?.activeText"
      :inactive-text="field.props?.inactiveText"
      :active-value="field.props?.activeValue ?? true"
      :inactive-value="field.props?.inactiveValue ?? false"
      :size="resolvedSize"
    />

    <el-rate
      v-else-if="field.componentKey === 'rate'"
      :model-value="Number(previewValue) || 0"
      :disabled="true"
      :max="field.props?.max ?? 5"
      :allow-half="field.props?.allowHalf"
    />

    <el-slider
      v-else-if="field.componentKey === 'slider'"
      :model-value="previewValue as any"
      :disabled="true"
      :min="field.props?.min ?? 0"
      :max="field.props?.max ?? 100"
      :step="field.props?.step ?? 1"
      :range="field.props?.range"
      :show-input="false"
    />

    <el-date-picker
      v-else-if="field.componentKey === 'datePicker'"
      :model-value="previewValue"
      :type="field.props?.type || 'date'"
      :placeholder="field.placeholder || '选择日期'"
      :disabled="field.disabled"
      :size="resolvedSize"
      class="w-full!"
    />

    <el-time-picker
      v-else-if="field.componentKey === 'timePicker'"
      :model-value="previewValue"
      :placeholder="field.placeholder || '选择时间'"
      :disabled="field.disabled"
      :size="resolvedSize"
      class="w-full!"
    />

    <el-date-picker
      v-else-if="field.componentKey === 'datetimePicker'"
      :model-value="previewValue"
      type="datetime"
      :placeholder="field.placeholder || '选择日期时间'"
      :disabled="field.disabled"
      :size="resolvedSize"
      class="w-full!"
    />

    <el-cascader
      v-else-if="field.componentKey === 'cascader'"
      :model-value="previewValue"
      :options="cascaderOptions"
      :placeholder="field.placeholder || '请选择'"
      :disabled="field.disabled"
      :size="resolvedSize"
      class="w-full"
    />

    <el-tree-select
      v-else-if="field.componentKey === 'treeSelect'"
      :model-value="previewValue"
      :data="treeData"
      :placeholder="field.placeholder || '请选择'"
      :disabled="field.disabled"
      :size="resolvedSize"
      check-strictly
      class="w-full"
    />

    <el-color-picker
      v-else-if="field.componentKey === 'colorPicker'"
      :model-value="previewValue || '#2b73af'"
      :disabled="true"
      :size="resolvedSize"
    />

    <el-upload
      v-else-if="field.componentKey === 'upload'"
      action="#"
      :disabled="true"
      :auto-upload="false"
      :show-file-list="false"
    >
      <el-button :size="resolvedSize" disabled>
        {{ field.props?.buttonText || '点击上传' }}
      </el-button>
    </el-upload>

    <el-transfer
      v-else-if="field.componentKey === 'transfer'"
      :model-value="[]"
      :data="transferData"
      :titles="['可选', '已选']"
      class="form-field-preview__transfer"
    />

    <el-input
      v-else
      :model-value="previewValue"
      :placeholder="field.placeholder || field.componentKey"
      :size="resolvedSize"
      readonly
    />
  </div>
</template>

<style scoped>
.form-field-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  min-width: 0;
  pointer-events: none;
}

.form-field-preview > :deep(*) {
  width: 100%;
  max-width: 100%;
}

.form-field-preview.is-switch,
.form-field-preview.is-rate,
.form-field-preview.is-colorPicker,
.form-field-preview.is-upload {
  justify-content: flex-start;
}

.form-field-preview.is-switch > :deep(*),
.form-field-preview.is-rate > :deep(*),
.form-field-preview.is-colorPicker > :deep(*),
.form-field-preview.is-upload > :deep(*) {
  width: auto;
}

.form-field-preview.is-radio,
.form-field-preview.is-checkbox {
  justify-content: flex-start;
}

.form-field-preview.is-radio > :deep(*),
.form-field-preview.is-checkbox > :deep(*) {
  width: auto;
  flex-wrap: wrap;
}

.form-field-preview__transfer {
  --el-transfer-panel-width: 120px;
  --el-transfer-panel-body-height: 100px;
}

.form-field-preview.is-transfer {
  overflow: hidden;
}

.form-field-preview :deep(.el-input-number) {
  width: 100%;
}

.form-field-preview :deep(.el-date-editor),
.form-field-preview :deep(.el-select),
.form-field-preview :deep(.el-cascader),
.form-field-preview :deep(.el-tree-select),
.form-field-preview :deep(.el-slider) {
  width: 100%;
}
</style>
