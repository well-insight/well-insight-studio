<script lang="ts" setup>
/**
 * JSON Schema 编辑器
 * 使用 Monaco Editor 双向编辑 FormSchema
 */
import type { FormSchema } from '../../../types'
import { ElMessage } from 'element-plus'
import { onBeforeUnmount, ref, watch } from 'vue'

const props = defineProps<{
  schema: FormSchema
}>()

const emit = defineEmits<{
  (e: 'update', schema: FormSchema): void
}>()

/** JSON 文本 */
const jsonText = ref('')
const isEditing = ref(false)

/** 格式化 Schema → JSON 文本 */
function schemaToJson(schema: FormSchema): string {
  try {
    return JSON.stringify(schema, null, 2)
  }
  catch {
    return '{}'
  }
}

/** JSON 文本 → Schema（带校验） */
function jsonToSchema(text: string): FormSchema | null {
  try {
    const obj = JSON.parse(text)
    if (!obj || typeof obj !== 'object')
      return null
    if (!('config' in obj) || !('fields' in obj) || !Array.isArray(obj.fields)) {
      return null
    }
    return obj as FormSchema
  }
  catch {
    return null
  }
}

/** 从 props 同步到编辑器 */
watch(
  () => props.schema,
  (schema) => {
    if (schema && !isEditing.value) {
      jsonText.value = schemaToJson(schema)
    }
  },
  { immediate: true, deep: true },
)

/** JSON 变更防抖同步 */
let syncTimer: ReturnType<typeof setTimeout> | null = null

function onCodeChange(value: string) {
  jsonText.value = value
  isEditing.value = true

  if (syncTimer)
    clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    const schema = jsonToSchema(value)
    if (schema) {
      emit('update', schema)
    }
    else {
      ElMessage.warning('JSON 格式有误，请修正后再同步')
    }
    isEditing.value = false
  }, 500)
}

/** 格式化 */
function formatJson() {
  const schema = jsonToSchema(jsonText.value)
  if (schema) {
    jsonText.value = schemaToJson(schema)
    emit('update', schema)
    ElMessage.success('格式化完成')
  }
  else {
    ElMessage.error('JSON 格式有误，无法格式化')
  }
}

onBeforeUnmount(() => {
  if (syncTimer) {
    clearTimeout(syncTimer)
    syncTimer = null
  }
})
</script>

<template>
  <div class="json-editor flex h-full flex-col">
    <div class="flex shrink-0 items-center justify-between px-3 pt-3 pb-1">
      <span class="text-xs text-[var(--el-text-color-placeholder)]">
        直接编辑 JSON Schema，修改后自动同步
      </span>
      <el-button text type="primary" @click="formatJson">
        格式化
      </el-button>
    </div>
    <div class="min-h-0 flex-1 p-3 pt-1">
      <el-input
        type="textarea"
        :model-value="jsonText"
        class="json-textarea"
        :autosize="false"
        resize="none"
        placeholder="编辑 JSON Schema..."
        @input="onCodeChange"
      />
    </div>
  </div>
</template>

<style scoped>
.json-editor {
  height: 100%;
  min-height: 0;
}

.json-textarea {
  height: 100%;
}

:deep(.json-textarea .el-textarea) {
  height: 100%;
}

:deep(.json-textarea .el-textarea__inner) {
  height: 100% !important;
  font-family: var(--wc-font-mono, Consolas, Monaco, monospace);
  font-size: 12px;
  line-height: 1.5;
  resize: none;
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}
</style>
