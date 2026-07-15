<script lang="ts" setup>
import type { FormInstance } from 'element-plus'
import type { FormField, FormOption, FormSchema } from '../../types'
/**
 * 表单渲染器
 * 将 FormSchema 渲染为真实的 Element Plus 表单
 * 用于预览模式
 */
import { ref, watch } from 'vue'

const props = defineProps<{
  schema: FormSchema
}>()

const emit = defineEmits<{
  (e: 'submit', data: Record<string, any>): void
  (e: 'reset'): void
}>()

const formRef = ref<FormInstance>()
const formData = ref<Record<string, any>>({})

watch(
  () => props.schema,
  (schema) => {
    const data: Record<string, any> = {}
    for (const field of schema.fields) {
      if (!field.hidden) {
        data[field.field] = field.defaultValue ?? getDefaultForField(field)
      }
    }
    formData.value = data
  },
  { immediate: true, deep: true },
)

function getDefaultForField(field: FormField): any {
  switch (field.componentKey) {
    case 'switch':
      return false
    case 'checkbox':
      return []
    case 'number':
      return undefined
    case 'rate':
      return 0
    case 'slider':
      return field.props?.range ? [0, 100] : 0
    case 'select':
      return field.props?.multiple ? [] : ''
    default:
      return ''
  }
}

function buildRules(field: FormField): any[] {
  const rules: any[] = []
  if (field.required && !field.rules?.some(rule => rule.type === 'required')) {
    rules.push({ required: true, message: `请填写${field.label}`, trigger: 'blur' })
  }

  for (const rule of field.rules ?? []) {
    const elRule: any = {
      message: rule.message,
      trigger: rule.trigger || 'blur',
    }
    switch (rule.type) {
      case 'required':
        elRule.required = true
        break
      case 'min':
        elRule.min = Number(rule.value)
        elRule.type = 'number'
        break
      case 'max':
        elRule.max = Number(rule.value)
        elRule.type = 'number'
        break
      case 'minLength':
        elRule.min = Number(rule.value)
        break
      case 'maxLength':
        elRule.max = Number(rule.value)
        break
      case 'pattern':
        try {
          elRule.pattern = new RegExp(String(rule.value ?? ''))
        }
        catch {
          continue
        }
        break
      case 'email':
        elRule.type = 'email'
        break
      case 'url':
        elRule.type = 'url'
        break
      case 'integer':
        elRule.pattern = /^\d+$/
        elRule.message = rule.message || '请输入整数'
        break
      case 'float':
        elRule.pattern = /^-?\d+(\.\d+)?$/
        elRule.message = rule.message || '请输入数字'
        break
    }
    rules.push(elRule)
  }
  return rules
}

function fieldStyle(field: FormField): Record<string, string> {
  const cols = props.schema.config?.gridColumns || 24
  const span = Math.max(1, Math.min(cols, field.colSpan || 12))
  return { width: `${(span / cols) * 100}%` }
}

function fieldLabel(field: FormField): string {
  return field.datasetBinding ? `${field.label} [link]` : field.label
}

/** 构建 el-form-item 的 v-bind 对象（ElFormItem 扩展属性） */
function getItemBindings(field: FormField) {
  return {
    labelWidth: field.labelWidth ? `${field.labelWidth}px` : undefined,
    showMessage: field.showMessage,
    inlineMessage: field.inlineMessage,
    size: field.size,
    error: field.error,
  }
}

type CascaderLikeOption = FormOption & {
  children?: CascaderLikeOption[]
  [key: string]: unknown
}

function normalizeCascaderOptions(options: FormOption[] = []): CascaderLikeOption[] {
  return options.map((option): CascaderLikeOption => ({
    ...option,
    children: (option as FormOption & { children?: FormOption[] }).children
      ? normalizeCascaderOptions((option as FormOption & { children?: FormOption[] }).children)
      : undefined,
  }))
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (valid === false) {
    return
  }
  emit('submit', { ...formData.value })
}

function handleReset() {
  const data: Record<string, any> = {}
  for (const field of props.schema.fields) {
    if (!field.hidden) {
      data[field.field] = field.defaultValue ?? getDefaultForField(field)
    }
  }
  formData.value = data
  emit('reset')
}
</script>

<template>
  <div class="form-renderer mx-auto max-w-[860px] p-8">
    <el-form
      ref="formRef"
      :model="formData"
      :label-width="`${schema.config.labelWidth}px`"
      :label-position="schema.config.labelPosition"
      :size="schema.config.size"
      :disabled="schema.config.disabled"
      :hide-required-asterisk="!schema.config.requiredAsterisk"
      :label-suffix="schema.config.labelSuffix"
      :show-message="schema.config.showMessage"
      :inline-message="schema.config.inlineMessage"
      :status-icon="schema.config.statusIcon"
      :scroll-to-error="schema.config.scrollToError"
      :inline="schema.config.inline"
      :validate-on-rule-change="schema.config.validateOnRuleChange"
    >
      <div class="flex flex-wrap items-start">
        <template v-for="field in schema.fields" :key="field._vid">
          <div v-if="!field.hidden" class="mb-4 px-2" :style="fieldStyle(field)">
            <template v-if="field.componentKey === 'input'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-input
                  v-model="formData[field.field]"
                  :placeholder="field.placeholder"
                  :disabled="field.disabled"
                  :readonly="field.readonly"
                  :type="field.props?.type || 'text'"
                  :maxlength="field.props?.maxlength"
                  :show-word-limit="field.props?.showWordLimit"
                  :clearable="field.props?.clearable"
                />
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'password'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-input
                  v-model="formData[field.field]"
                  type="password"
                  :placeholder="field.placeholder"
                  :disabled="field.disabled"
                  :readonly="field.readonly"
                  :show-password="field.props?.showPassword !== false"
                  :clearable="field.props?.clearable"
                />
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'textarea'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-input
                  v-model="formData[field.field]"
                  type="textarea"
                  :placeholder="field.placeholder"
                  :disabled="field.disabled"
                  :readonly="field.readonly"
                  :rows="field.props?.rows || 3"
                  :autosize="field.props?.autosize"
                  :maxlength="field.props?.maxlength"
                  :show-word-limit="field.props?.showWordLimit"
                />
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'number'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-input-number
                  v-model="formData[field.field]"
                  :placeholder="field.placeholder"
                  :disabled="field.disabled"
                  :readonly="field.readonly"
                  :min="field.props?.min"
                  :max="field.props?.max"
                  :step="field.props?.step ?? 1"
                  :precision="field.props?.precision"
                  :controls="field.props?.controls !== false"
                  :controls-position="field.props?.controlsPosition"
                  style="width: 100%"
                />
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'select'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-select
                  v-model="formData[field.field]"
                  :placeholder="field.placeholder"
                  :disabled="field.disabled"
                  :multiple="field.props?.multiple"
                  :filterable="field.props?.filterable"
                  :clearable="field.props?.clearable !== false"
                  :allow-create="field.props?.allowCreate"
                  :collapse-tags="field.props?.collapseTags"
                  style="width: 100%"
                >
                  <el-option
                    v-for="opt in field.options || []"
                    :key="opt.value"
                    :label="opt.label"
                    :value="opt.value"
                    :disabled="opt.disabled"
                  />
                </el-select>
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'radio'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-radio-group
                  v-model="formData[field.field]"
                  :disabled="field.disabled"
                  :border="field.props?.border"
                >
                  <el-radio
                    v-for="opt in field.options || []"
                    :key="opt.value"
                    :value="opt.value"
                    :disabled="opt.disabled"
                    :border="field.props?.border"
                  >
                    {{ opt.label }}
                  </el-radio>
                </el-radio-group>
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'checkbox'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-checkbox-group
                  v-model="formData[field.field]"
                  :disabled="field.disabled"
                  :min="field.props?.min"
                  :max="field.props?.max"
                >
                  <el-checkbox
                    v-for="opt in field.options || []"
                    :key="opt.value"
                    :label="opt.value"
                    :disabled="opt.disabled"
                    :border="field.props?.border"
                  >
                    {{ opt.label }}
                  </el-checkbox>
                </el-checkbox-group>
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'switch'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-switch
                  v-model="formData[field.field]"
                  :disabled="field.disabled"
                  :active-text="field.props?.activeText"
                  :inactive-text="field.props?.inactiveText"
                  :active-value="field.props?.activeValue ?? true"
                  :inactive-value="field.props?.inactiveValue ?? false"
                  :inline-prompt="field.props?.inlinePrompt"
                />
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'rate'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-rate
                  v-model="formData[field.field]"
                  :disabled="field.disabled"
                  :max="field.props?.max ?? 5"
                  :allow-half="field.props?.allowHalf"
                  :show-text="field.props?.showText"
                  :show-score="field.props?.showScore"
                  :texts="field.props?.texts"
                />
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'slider'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-slider
                  v-model="formData[field.field]"
                  :disabled="field.disabled"
                  :min="field.props?.min ?? 0"
                  :max="field.props?.max ?? 100"
                  :step="field.props?.step ?? 1"
                  :show-input="field.props?.showInput"
                  :show-stops="field.props?.showStops"
                  :range="field.props?.range"
                />
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'datePicker'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-date-picker
                  v-model="formData[field.field]"
                  :type="field.props?.type || 'date'"
                  :placeholder="field.placeholder"
                  :disabled="field.disabled"
                  :readonly="field.readonly"
                  :format="field.props?.format"
                  :value-format="field.props?.valueFormat"
                  :clearable="field.props?.clearable !== false"
                  :editable="field.props?.editable !== false"
                  style="width: 100%"
                />
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'timePicker'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-time-picker
                  v-model="formData[field.field]"
                  :placeholder="field.placeholder"
                  :disabled="field.disabled"
                  :readonly="field.readonly"
                  :format="field.props?.format"
                  :value-format="field.props?.valueFormat"
                  :clearable="field.props?.clearable !== false"
                  :editable="field.props?.editable !== false"
                  :is-range="field.props?.isRange"
                  style="width: 100%"
                />
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'datetimePicker'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-date-picker
                  v-model="formData[field.field]"
                  type="datetime"
                  :placeholder="field.placeholder"
                  :disabled="field.disabled"
                  :readonly="field.readonly"
                  :format="field.props?.format"
                  :value-format="field.props?.valueFormat"
                  :clearable="field.props?.clearable !== false"
                  :editable="field.props?.editable !== false"
                  style="width: 100%"
                />
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'cascader'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-cascader
                  v-model="formData[field.field]"
                  :options="normalizeCascaderOptions(field.options)"
                  :placeholder="field.placeholder"
                  :disabled="field.disabled"
                  :clearable="field.props?.clearable !== false"
                  :filterable="field.props?.filterable"
                  :show-all-levels="field.props?.showAllLevels !== false"
                  :props="{ checkStrictly: field.props?.checkStrictly }"
                  style="width: 100%"
                />
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'treeSelect'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-tree-select
                  v-model="formData[field.field]"
                  :data="field.options || []"
                  :placeholder="field.placeholder"
                  :disabled="field.disabled"
                  :clearable="field.props?.clearable !== false"
                  :filterable="field.props?.filterable"
                  :multiple="field.props?.multiple"
                  :check-strictly="field.props?.checkStrictly"
                  style="width: 100%"
                />
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'colorPicker'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-color-picker
                  v-model="formData[field.field]"
                  :disabled="field.disabled"
                  :show-alpha="field.props?.showAlpha"
                  :color-format="field.props?.colorFormat"
                  :predefine="field.props?.predefine"
                />
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'upload'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-upload
                  :disabled="field.disabled"
                  :accept="field.props?.accept"
                  :limit="field.props?.limit ?? 1"
                  :multiple="field.props?.multiple"
                  :auto-upload="field.props?.autoUpload !== false"
                  :list-type="field.props?.listType"
                  :drag="field.props?.drag"
                  action="#"
                >
                  <el-button type="primary">
                    点击上传
                  </el-button>
                </el-upload>
              </el-form-item>
            </template>

            <template v-if="field.componentKey === 'transfer'">
              <el-form-item
                :label="fieldLabel(field)"
                :prop="field.field"
                :rules="buildRules(field)"
                v-bind="getItemBindings(field)"
              >
                <el-transfer
                  v-model="formData[field.field]"
                  :data="
                    (field.options || []).map((opt) => ({
                      key: opt.value,
                      label: opt.label,
                      disabled: opt.disabled,
                    }))
                  "
                  :filterable="field.props?.filterable"
                  :filter-placeholder="field.props?.filterPlaceholder"
                  :titles="field.props?.titles"
                  :button-texts="field.props?.buttonTexts"
                />
              </el-form-item>
            </template>
          </div>
        </template>
      </div>

      <div
        v-if="schema.config.submitBtn.show || schema.config.resetBtn.show"
        class="mt-6 flex gap-3 border-t border-[var(--el-border-color-light)] pt-4"
        :class="{
          'justify-start': schema.config.submitBtn.position === 'left',
          'justify-center': schema.config.submitBtn.position === 'center',
          'justify-end': schema.config.submitBtn.position === 'right',
        }"
      >
        <el-button
          v-if="schema.config.resetBtn.show"
          :size="schema.config.size"
          @click="handleReset"
        >
          {{ schema.config.resetBtn.text }}
        </el-button>
        <el-button
          v-if="schema.config.submitBtn.show"
          type="primary"
          :size="schema.config.size"
          @click="handleSubmit"
        >
          {{ schema.config.submitBtn.text }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<style scoped>
.form-renderer {
  box-sizing: border-box;
  min-height: 200px;
  border-radius: var(--fd-radius-md, 10px);
  border: 1px solid var(--fd-paper-edge, var(--el-border-color-light));
  background:
    linear-gradient(
      90deg,
      color-mix(in srgb, var(--el-color-primary) 10%, transparent) 0,
      color-mix(in srgb, var(--el-color-primary) 10%, transparent) 3px,
      transparent 3px,
      transparent 100%
    ),
    var(--el-bg-color);
  box-shadow:
    0 1px 0 color-mix(in srgb, var(--el-color-primary) 8%, transparent),
    var(--el-box-shadow-lighter);
}
</style>
