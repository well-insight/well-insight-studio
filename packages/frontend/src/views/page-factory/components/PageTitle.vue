<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { usePageStore } from '@/stores/pageStore'
import { markVisualClean } from '../visualEditorState'

const route = useRoute()
const pageStore = usePageStore()

const editing = ref(false)
const inputValue = ref('')
const inputRef = ref<HTMLInputElement | any>(null)

const pageId = computed(() => {
  const raw = route.params.id
  if (!raw) return undefined
  return Array.isArray(raw) ? raw[0] : String(raw)
})

const pageName = computed(() => pageStore.currentPage?.name || '未命名页面')

// 当 store 中页面名变化时同步
watch(pageName, (val) => {
  if (!editing.value) {
    inputValue.value = val
  }
}, { immediate: true })

function startEdit() {
  inputValue.value = pageName.value
  editing.value = true
  nextTick(() => {
    inputRef.value?.focus?.()
  })
}

async function finishEdit() {
  editing.value = false
  const newName = inputValue.value.trim()
  if (!newName || newName === pageName.value) return

  try {
    await pageStore.savePage({
      id: pageId.value,
      name: newName,
      type: pageStore.currentPage?.type || 'visualization',
    } as any)
    pageStore.currentPage!.name = newName
    markVisualClean()
    ElMessage.success('名称已更新')
  }
  catch (e) {
    ElMessage.error((e as Error).message || '更新失败')
  }
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') finishEdit()
  if (e.key === 'Escape') { editing.value = false; inputValue.value = pageName.value }
}
</script>

<template>
  <div class="page-title-area">
    <span v-if="!editing" class="page-title-text" @click="startEdit">{{ pageName }}</span>
    <el-input
      v-else
      ref="inputRef"
      v-model="inputValue"
      size="small"
      class="page-title-input"
      :maxlength="50"
      @blur="finishEdit"
      @keydown="onKeydown"
    />
  </div>
</template>

<style scoped>
.page-title-area {
  display: flex;
  align-items: center;
}

.page-title-text {
  font-size: 15px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  cursor: pointer;
  padding: 2px 8px;
  border-radius: 4px;
  transition: background 0.2s;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.page-title-text:hover {
  background: var(--el-fill-color-light);
}

.page-title-input {
  width: 220px;
}
</style>
