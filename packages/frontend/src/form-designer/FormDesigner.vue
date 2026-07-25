<script lang="ts" setup>
/**
 * 表单设计器主组件
 * 组合左侧组件库、中间画布/预览、右侧属性/JSON
 */
import type { FormField, FormSchema } from './types'
import { debounce } from 'lodash-es'
import { onBeforeUnmount, provide, ref, watch } from 'vue'
import { ButtonTabs } from '@/components/button-tabs'
import { cloneFormSchema } from './form-designer.utils'
import { FORM_DATA_KEY, useFormData } from './hooks/useFormData'
import FormCanvas from './ui/canvas/FormCanvas.vue'
import FormComponentList from './ui/workbench/left-panel/FormComponentList.vue'
import FormFieldSettings from './ui/workbench/right-panel/FormFieldSettings.vue'
import FormSettings from './ui/workbench/right-panel/FormSettings.vue'
import JsonEditor from './ui/workbench/right-panel/JsonEditor.vue'
import './styles/form-designer.scss'

const props = defineProps<{
  /** 外部传入的初始 Schema（用于加载已有页面） */
  initialSchema?: FormSchema | null
}>()

const emit = defineEmits<{
  (e: 'update:schema', schema: FormSchema): void
  (e: 'dirtyChange', dirty: boolean): void
}>()

/** 表单数据管理 */
const formData = useFormData()

provide(FORM_DATA_KEY, formData)

watch(
  () => props.initialSchema,
  (schema) => {
    if (schema && !formData.initialized.value) {
      formData.setFormSchema(cloneFormSchema(schema!))
      formData.initialized.value = true
    }
  },
  { immediate: true },
)

watch(
  () => formData.isDirty.value,
  (val) => {
    emit('dirtyChange', val)
  },
)

const emitSchemaDebounced = debounce((schema: FormSchema) => {
  emit('update:schema', cloneFormSchema(schema))
}, 300)

watch(
  () => formData.formSchema,
  (schema) => {
    emitSchemaDebounced(schema)
  },
  { deep: true },
)

const rightTab = ref('field')

const rightTabOptions = [
  { label: '字段属性', value: 'field' },
  { label: '表单设置', value: 'form' },
  { label: 'JSON', value: 'json' },
]

function handleAddField(field: FormField, index?: number) {
  formData.addField(field, index)
  rightTab.value = 'field'
}

function handleMoveField(fromIndex: number, toIndex: number) {
  formData.moveField(fromIndex, toIndex)
}

function handleUpdateFieldLayout(vid: string, patch: Pick<FormField, 'colSpan' | 'layout'>) {
  formData.updateField(vid, patch)
}

function handleRemoveField(vid: string) {
  formData.removeField(vid)
}

function handleSelectField(vid: string | null) {
  formData.selectField(vid)
  if (vid)
    rightTab.value = 'field'
}

function handleUpdateField(vid: string, patch: Partial<FormField>) {
  formData.updateField(vid, patch)
}

function handleUpdateFormConfig(patch: Partial<FormSchema['config']>) {
  formData.updateFormConfig(patch)
}

function handleReplaceSchema(schema: FormSchema) {
  formData.setFormSchema(cloneFormSchema(schema))
}

onBeforeUnmount(() => {
  emitSchemaDebounced.cancel()
})

defineExpose({
  getFormData: () => formData,
  getSchema: () => cloneFormSchema(formData.formSchema),
  syncSavedBaseline: () => formData.syncSavedBaseline(),
})
</script>

<template>
  <div class="form-designer h-full w-full flex flex-col overflow-hidden bg-[var(--el-bg-color-page)]">
    <div class="form-designer-body flex min-h-0 flex-1 overflow-hidden">
      <div class="form-designer-left shrink-0">
        <FormComponentList @add-field="handleAddField" />
      </div>

      <div class="form-designer-center flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <FormCanvas
          class="min-h-0 flex-1"
          :fields="formData.fields.value"
          :active-field-id="formData.activeFieldId.value"
          :form-config="formData.formSchema.config"
          @select="handleSelectField"
          @remove="handleRemoveField"
          @add-field="handleAddField"
          @move-field="handleMoveField"
          @update-field-layout="handleUpdateFieldLayout"
        />
      </div>

      <div class="form-designer-right flex shrink-0 flex-col">
        <div class="form-designer-right__tabs flex h-[var(--fd-header-h,54px)] shrink-0 items-center px-3">
          <ButtonTabs v-model="rightTab" :options="rightTabOptions" />
        </div>
        <div class="min-h-0 flex-1 overflow-hidden">
          <FormFieldSettings
            v-if="rightTab === 'field'"
            :field="formData.activeField.value"
            @update="handleUpdateField"
          />
          <FormSettings
            v-else-if="rightTab === 'form'"
            :config="formData.formSchema.config"
            @update="handleUpdateFormConfig"
          />
          <JsonEditor
            v-else
            :schema="formData.formSchema"
            @update="handleReplaceSchema"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-designer {
  height: 100%;
  padding: 10px;
  background:
    radial-gradient(circle at 18% 12%, rgba(20, 184, 166, 0.09), transparent 26%),
    linear-gradient(135deg, rgba(248, 251, 255, 0.94), rgba(240, 249, 255, 0.78)), var(--el-bg-color-page);
}

.form-designer-body {
  gap: 10px;
}

.form-designer-left,
.form-designer-right,
.form-designer-center {
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(82, 124, 181, 0.16);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 12px 32px rgba(31, 58, 112, 0.08);
}

.form-designer-left {
  width: var(--fd-rail-width, 292px);
  height: 100%;
}

.form-designer-center {
  height: 100%;
}

.form-designer-right {
  width: var(--fd-inspector-width, 320px);
  height: 100%;
}

.form-designer-right__tabs {
  border-bottom: 1px solid rgba(82, 124, 181, 0.12);
  background: rgba(255, 255, 255, 0.78);
}

:global(html.dark) .form-designer {
  background:
    radial-gradient(circle at 18% 12%, rgba(20, 184, 166, 0.1), transparent 26%),
    linear-gradient(135deg, rgba(6, 17, 28, 0.95), rgba(7, 26, 43, 0.8)), var(--el-bg-color-page);
}

:global(html.dark) .form-designer-left,
:global(html.dark) .form-designer-right,
:global(html.dark) .form-designer-center {
  border-color: rgba(140, 210, 255, 0.14);
  background: rgba(8, 28, 48, 0.72);
}

:global(html.dark) .form-designer-right__tabs {
  background: rgba(13, 40, 64, 0.72);
}
</style>
