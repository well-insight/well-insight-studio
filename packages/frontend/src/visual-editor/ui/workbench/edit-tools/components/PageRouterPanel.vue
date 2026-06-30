<script lang="tsx" setup>
import {
  ArrowDown,
  ArrowUp,
  Close,
  Delete,
  Edit,
  Plus,
  Tickets,
} from '@element-plus/icons-vue'
import { ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import { useModal } from '@/visual-editor/hooks/useModal'
import {
  createNewPage,
  normalizeEditorPagePath,
  useVisualData,
} from '@/visual-editor/hooks/useVisualData'

const emits = defineEmits<{
  close: []
}>()

interface PageRouteItem {
  title: string
  path: string
}

const rules = {
  title: [{ required: true, message: '请输入路由名称', trigger: 'blur' }],
  path: [{ required: true, message: '请输入路由地址', trigger: 'blur' }],
}

const {
  jsonData,
  currentPage,
  orderedPagePaths,
  setCurrentPage,
  deletePage,
  updatePage,
  incrementPage,
  reorderPage,
  recordHistory,
} = useVisualData()

const ruleFormRef = ref<InstanceType<typeof ElForm>>()
const operatePageData = ref<PageRouteItem | null>(null)
const form = ref({
  title: '',
  path: '',
})

const pages = computed<PageRouteItem[]>(() =>
  orderedPagePaths.value.map((path) => {
    const page = jsonData.value.pages[path]
    return {
      title: page?.title ?? path,
      path,
    }
  }),
)

const activePath = computed(() => currentPage.value?.path ?? '')

function handleSelectPage(data: PageRouteItem) {
  setCurrentPage(data.path)
}

function showOperateModal() {
  return useModal({
    title: operatePageData.value ? '编辑路由' : '新增路由',
    props: {
      width: 380,
    },
    content: () => (
      <ElForm ref={ruleFormRef} model={form.value} rules={rules}>
        <ElFormItem prop="title" label="路由名称" labelWidth="80px">
          <ElInput v-model={form.value.title} placeholder="如：首页" />
        </ElFormItem>
        <ElFormItem prop="path" label="路由地址" labelWidth="80px">
          <ElInput v-model={form.value.path} placeholder="如：/index" />
        </ElFormItem>
      </ElForm>
    ),
    onConfirm: () => {
      return new Promise((resolve, reject) => {
        ruleFormRef.value?.validate((valid) => {
          if (!valid) {
            reject(new Error('invalid form'))
            return
          }
          const { title, path } = form.value
          if ([title.trim(), path.trim()].includes('')) {
            ElMessage.error('路由名称或地址不能为空')
            reject(new Error('empty fields'))
            return
          }
          if (operatePageData.value) {
            const oldPath = operatePageData.value.path
            updatePage({
              newPath: path,
              oldPath,
              page: { title: title.trim() },
            })
          }
          else {
            const routePath = normalizeEditorPagePath(path)
            const ok = incrementPage(path, createNewPage({ title: title.trim(), path: routePath }))
            if (!ok) {
              ElMessage.error('该路由地址已存在')
              reject(new Error('duplicate path'))
              return
            }
          }
          recordHistory()
          resolve(true)
        })
      })
    },
  })
}

function addPage() {
  operatePageData.value = null
  form.value = {
    title: '',
    path: '',
  }
  showOperateModal()
}

function editPage(data: PageRouteItem, event: Event) {
  event.stopPropagation()
  operatePageData.value = data
  form.value = {
    title: data.title,
    path: data.path,
  }
  showOperateModal()
}

function delPage(data: PageRouteItem, event: Event) {
  event.stopPropagation()
  const ok = deletePage(data.path)
  if (!ok) {
    ElMessage.warning('至少保留一个路由')
    return
  }
  recordHistory()
}

function movePage(data: PageRouteItem, direction: 'up' | 'down', event: Event) {
  event.stopPropagation()
  const ok = reorderPage(data.path, direction)
  if (ok) {
    recordHistory()
  }
}
</script>

<template>
  <div :class="$style.panel">
    <div :class="$style.header">
      <div :class="$style.headerMain">
        <el-icon :size="16">
          <Tickets />
        </el-icon>
        <span>路由管理</span>
      </div>
      <div :class="$style.headerActions">
        <el-tooltip content="新增路由" placement="bottom">
          <el-button text size="small" :icon="Plus" aria-label="新增路由" @click="addPage" />
        </el-tooltip>
        <el-tooltip content="关闭" placement="bottom">
          <el-button text size="small" :icon="Close" aria-label="关闭" @click.stop="emits('close')" />
        </el-tooltip>
      </div>
    </div>

    <el-scrollbar :class="$style.scrollBody">
      <div v-if="pages.length" :class="$style.routeList">
        <div
          v-for="(item, index) in pages"
          :key="item.path"
          :class="[
            $style.routeItem,
            { [$style.routeItemActive]: item.path === activePath },
          ]"
          role="button"
          tabindex="0"
          @click="handleSelectPage(item)"
          @keydown.enter="handleSelectPage(item)"
        >
          <div :class="$style.routeMain">
            <span :class="$style.routeTitle">{{ item.title }}</span>
            <span :class="$style.routePath">{{ item.path }}</span>
          </div>
          <div :class="$style.routeActions" @click.stop>
            <el-tooltip content="上移" placement="top">
              <el-button
                text
                size="small"
                :icon="ArrowUp"
                :disabled="index === 0"
                @click="movePage(item, 'up', $event)"
              />
            </el-tooltip>
            <el-tooltip content="下移" placement="top">
              <el-button
                text
                size="small"
                :icon="ArrowDown"
                :disabled="index === pages.length - 1"
                @click="movePage(item, 'down', $event)"
              />
            </el-tooltip>
            <el-tooltip content="编辑" placement="top">
              <el-button text size="small" :icon="Edit" @click="editPage(item, $event)" />
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button
                text
                size="small"
                :icon="Delete"
                :disabled="pages.length <= 1"
                @click="delPage(item, $event)"
              />
            </el-tooltip>
          </div>
        </div>
      </div>
      <el-empty v-else description="暂无路由" :image-size="64" />
    </el-scrollbar>
  </div>
</template>

<style lang="scss" module>
.panel {
  width: 340px;
  background: var(--el-bg-color-overlay);
  border-radius: var(--el-popover-border-radius, 12px);
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  box-shadow: var(--el-box-shadow-light);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 44px;
  padding: 0 10px 0 14px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.headerMain {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  &::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: var(--el-color-primary);
    margin-right: 2px;
    flex-shrink: 0;
  }
}

.headerActions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;

  :global(.el-button) {
    width: 28px;
    height: 28px;
    min-width: 28px;
    padding: 0;
    border-radius: 6px;
    font-size: 14px;
    color: var(--el-text-color-secondary);

    &:hover {
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
    }
  }
}

.scrollBody {
  padding: 10px 12px 12px;
  width: 100%;
  height: min(480px, calc(100vh - 200px));
  max-height: min(480px, calc(100vh - 200px));
  box-sizing: border-box;

  :global(.el-scrollbar__wrap) {
    max-height: min(480px, calc(100vh - 200px));
  }
}

.routeList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.routeItem {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--el-border-color-lighter);
  background: var(--el-fill-color-lighter);
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;

  &:hover {
    border-color: var(--el-border-color);
    background: var(--el-fill-color-light);
  }
}

.routeItemActive {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.routeMain {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
  flex: 1;
}

.routeTitle {
  font-size: 13px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.routePath {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.routeActions {
  display: flex;
  align-items: center;
  flex-shrink: 0;

  :global(.el-button) {
    width: 24px;
    height: 24px;
    min-width: 24px;
    padding: 0;
    margin: 0;
  }
}
</style>
