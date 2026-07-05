<script lang="ts" setup>
/**
 * 表单设计器主组件
 * 组合顶部工具栏、左侧面板、中间画布/预览、右侧属性/JSON面板
 */
import type { FormField, FormSchema } from './types'
import { Edit, View } from '@element-plus/icons-vue'
import { provide, ref, watch } from 'vue'
import { FORM_DATA_KEY, useFormData } from './hooks/useFormData'
import FormCanvas from './ui/canvas/FormCanvas.vue'
import FormRenderer from './ui/renderer/FormRenderer.vue'
import FormComponentList from './ui/workbench/left-panel/FormComponentList.vue'
import FormFieldSettings from './ui/workbench/right-panel/FormFieldSettings.vue'
import FormSettings from './ui/workbench/right-panel/FormSettings.vue'
import JsonEditor from './ui/workbench/right-panel/JsonEditor.vue'

const props = defineProps<{
  /** 外部传入的初始 Schema（用于加载已有页面） */
  initialSchema?: FormSchema | null
  /** 是否预览模式 */
  preview?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:schema', schema: FormSchema): void
  (e: 'dirtyChange', dirty: boolean): void
}>()

/** 表单数据管理 */
const formData = useFormData()

// 提供数据给子组件
provide(FORM_DATA_KEY, formData)

/** 如果有初始 Schema，加载它 */
watch(
  () => props.initialSchema,
  (schema) => {
    if (schema) {
      formData.setFormSchema(JSON.parse(JSON.stringify(schema)))
    }
  },
  { immediate: true },
)

/** 监听 dirty 变化 */
watch(() => formData.isDirty.value, (val) => {
  emit('dirtyChange', val)
})

/** 监听 schema 变化，向外同步 */
watch(
  () => formData.formSchema,
  (schema) => {
    emit('update:schema', JSON.parse(JSON.stringify(schema)))
  },
  { deep: true },
)

/** 预览模式 */
const isPreview = ref(props.preview ?? false)

watch(() => props.preview, (val) => {
  isPreview.value = val ?? false
})

function togglePreview() {
  isPreview.value = !isPreview.value
  if (isPreview.value) {
    formData.selectField(null)
  }
}

/** 右侧面板当前 Tab */
const rightTab = ref<'field' | 'form' | 'json'>('field')

/** 添加字段（从左侧面板） */
function handleAddField(field: FormField, index?: number) {
  formData.addField(field, index)
  rightTab.value = 'field'
}

/** 移动字段 */
function handleMoveField(fromIndex: number, toIndex: number) {
  formData.moveField(fromIndex, toIndex)
}

/** 删除字段 */
function handleRemoveField(vid: string) {
  formData.removeField(vid)
}

/** 选中字段 */
function handleSelectField(vid: string | null) {
  formData.selectField(vid)
  if (vid) {
    rightTab.value = 'field'
  }
}

/** 更新字段属性 */
function handleUpdateField(vid: string, patch: Partial<FormField>) {
  formData.updateField(vid, patch)
}

/** 更新表单配置 */
function handleUpdateFormConfig(patch: Partial<FormSchema['config']>) {
  formData.updateFormConfig(patch)
}

/** JSON 编辑器替换整个 Schema */
function handleReplaceSchema(schema: FormSchema) {
  formData.setFormSchema(JSON.parse(JSON.stringify(schema)))
}

defineExpose({
  getFormData: () => formData,
  getSchema: () => JSON.parse(JSON.stringify(formData.formSchema)),
  syncSavedBaseline: () => formData.syncSavedBaseline(),
})
</script>

<template>
  <div class="form-designer h-full w-full flex flex-col overflow-hidden bg-[var(--el-bg-color)]">
    <!-- 顶部工具栏 -->
    <div class="form-designer-toolbar flex shrink-0 items-center justify-between border-b border-[var(--el-border-color)] bg-[var(--el-bg-color)] px-4 py-2">
      <div class="flex items-center gap-2">
        <el-button-group size="small">
          <el-button
            :type="!isPreview ? 'primary' : 'default'"
            :icon="Edit"
            @click="isPreview = false"
          >
            编辑
          </el-button>
          <el-button
            :type="isPreview ? 'primary' : 'default'"
            :icon="View"
            @click="togglePreview"
          >
            预览
          </el-button>
        </el-button-group>
      </div>
      <div class="flex items-center gap-2 text-xs text-[var(--el-text-color-secondary)]">
        <span v-if="formData.fields.value.length > 0">
          {{ formData.fields.value.length }} 个字段
        </span>
      </div>
    </div>

    <!-- 主体三栏 -->
    <div class="form-designer-body flex flex-1 overflow-hidden min-h-0">
      <!-- 左侧：组件面板（预览模式隐藏） -->
      <div
        v-show="!isPreview"
        class="form-designer-left w-[240px] shrink-0 border-r border-[var(--el-border-color)] bg-[var(--el-bg-color-overlay)]"
      >
        <FormComponentList @add-field="handleAddField" />
      </div>

      <!-- 中间：画布 / 预览 -->
      <div class="form-designer-center flex-1 overflow-hidden bg-[var(--el-bg-color-page)]">
        <FormCanvas
          v-if="!isPreview"
          :fields="formData.fields.value"
          :active-field-id="formData.activeFieldId.value"
          :form-config="formData.formSchema.config"
          @select="handleSelectField"
          @remove="handleRemoveField"
          @add-field="handleAddField"
          @move-field="handleMoveField"
        />
        <el-scrollbar v-else class="h-full">
          <div class="p-6">
            <FormRenderer :schema="formData.formSchema" />
          </div>
        </el-scrollbar>
      </div>

      <!-- 右侧：属性面板（预览模式隐藏） -->
      <div
        v-show="!isPreview"
        class="form-designer-right w-[300px] shrink-0 border-l border-[var(--el-border-color)] bg-[var(--el-bg-color-overlay)]"
      >
        <el-tabs v-model="rightTab" class="form-designer-tabs h-full">
          <el-tab-pane label="字段属性" name="field">
            <FormFieldSettings
              :field="formData.activeField.value"
              @update="handleUpdateField"
            />
          </el-tab-pane>
          <el-tab-pane label="表单设置" name="form">
            <FormSettings
              :config="formData.formSchema.config"
              @update="handleUpdateFormConfig"
            />
          </el-tab-pane>
          <el-tab-pane label="JSON" name="json">
            <JsonEditor
              :schema="formData.formSchema"
              @update="handleReplaceSchema"
            />
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-designer {
  height: 100%;
}

.form-designer-toolbar {
  min-height: 40px;
}

:deep(.form-designer-tabs) {
  display: flex;
  flex-direction: column;
}

:deep(.form-designer-tabs .el-tabs__header) {
  margin-bottom: 0;
  padding: 0 8px;
  border-bottom: 1px solid var(--el-border-color-light);
}

:deep(.form-designer-tabs .el-tabs__content) {
  flex: 1;
  overflow: hidden;
  min-height: 0;
}

:deep(.form-designer-tabs .el-tab-pane) {
  height: 100%;
}
</style>
