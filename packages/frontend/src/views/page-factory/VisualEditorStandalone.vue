<script lang="ts" setup>
/**
 * 可视化编辑器 - 独立全屏工作区
 * 脱离主 Layout，自带顶栏工具栏
 */
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePageStore } from '@/stores/pageStore'
import PageEditor from './PageEditor.vue'
import PageEditorActions from './components/PageEditorActions.vue'
import { isPageDirty, markVisualClean } from './visualEditorState'

const route = useRoute()
const router = useRouter()
const pageStore = usePageStore()

const pageId = computed(() => {
  const raw = route.params.id
  if (!raw) return undefined
  return Array.isArray(raw) ? raw[0] : String(raw)
})

const pageName = computed(() => pageStore.currentPage?.name || '未命名页面')

const editing = ref(false)
const inputValue = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

watch(pageName, (val) => {
  if (!editing.value) inputValue.value = val
}, { immediate: true })

function startEdit() {
  inputValue.value = pageName.value
  editing.value = true
  nextTick(() => inputRef.value?.focus())
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
  if (e.key === 'Enter') {
    finishEdit()
  }
  if (e.key === 'Escape') {
    editing.value = false
    inputValue.value = pageName.value
  }
}

function goBack() {
  router.push({ name: 'VisualDesign' })
}
</script>

<template>
  <div class="visual-workspace">
    <!-- 顶栏 -->
    <header class="visual-workspace__header">
      <button class="visual-workspace__back" type="button" title="返回列表" @click="goBack">
        <el-icon :size="18"><ArrowLeft /></el-icon>
      </button>

      <div class="visual-workspace__title">
        <el-tooltip :content="isPageDirty ? '有未保存的更改' : '已保存'" placement="bottom">
          <span class="visual-workspace__dot" :class="{ 'is-dirty': isPageDirty }" />
        </el-tooltip>
        <template v-if="!editing">
          <span class="visual-workspace__name" @click="startEdit">{{ pageName }}</span>
        </template>
        <el-input
          v-else
          ref="inputRef"
          v-model="inputValue"
          size="default"
          class="visual-workspace__input"
          :maxlength="50"
          @blur="finishEdit"
          @keydown="onKeydown"
        />
      </div>

      <div class="visual-workspace__actions">
        <PageEditorActions />
      </div>
    </header>

    <!-- 编辑器主体 -->
    <main class="visual-workspace__body">
      <PageEditor />
    </main>
  </div>
</template>

<style scoped>
.visual-workspace {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.visual-workspace__header {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(82, 124, 181, 0.14);
  background: var(--el-bg-color);
  z-index: 10;
}

.visual-workspace__back {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid rgba(82, 124, 181, 0.12);
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  transition: all 0.2s ease;
}

.visual-workspace__back:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
  border-color: rgba(37, 99, 235, 0.2);
}

.visual-workspace__title {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.visual-workspace__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: var(--el-color-success);
  transition: background-color 0.3s;
}

.visual-workspace__dot.is-dirty {
  background-color: var(--el-color-warning);
}

.visual-workspace__name {
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

.visual-workspace__name:hover {
  background: var(--el-fill-color-light);
}

.visual-workspace__input {
  width: 220px;
}

.visual-workspace__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.visual-workspace__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
