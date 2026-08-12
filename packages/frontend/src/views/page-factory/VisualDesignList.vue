<script lang="ts" setup>
/** 可视化页面列表 */
import type { ApiPageListItem } from '@/api/pages'
import { Delete, Edit, EditPen, Grid, List, Plus, Search, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onActivated, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createPage, deletePage, fetchPageList, updatePage } from '@/api/pages'
import { AdaptiveDialog } from '@/components/adaptive-dialog'

type ViewMode = 'card' | 'list'

const VIEW_MODE_KEY = 'wellcube-visual-list-view'

const router = useRouter()
const loading = ref(false)
const pageItems = ref<ApiPageListItem[]>([])
const total = ref(0)
const searchKeyword = ref('')
const viewMode = ref<ViewMode>(loadViewMode())
const createDialogVisible = ref(false)
const createForm = ref({ name: '' })
const createSaving = ref(false)
const editDialogVisible = ref(false)
const editingPage = ref<ApiPageListItem | null>(null)
const editForm = ref({ name: '' })
const editSaving = ref(false)
let isFirstActivation = true

const viewTabs: { name: ViewMode, label: string, icon: typeof Grid }[] = [
  { name: 'card', label: '卡片', icon: Grid },
  { name: 'list', label: '列表', icon: List },
]

function loadViewMode(): ViewMode {
  try {
    const raw = localStorage.getItem(VIEW_MODE_KEY)
    if (raw === 'card' || raw === 'list')
      return raw
  }
  catch {
    /* ignore */
  }
  return 'card'
}

watch(viewMode, (mode) => {
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode)
  }
  catch {
    /* ignore */
  }
})

function formatTime(value: string): string {
  if (!value)
    return '-'

  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}

function statusLabel(status: ApiPageListItem['status']): string {
  return status === 'published' ? '已发布' : '草稿'
}

function statusType(status: ApiPageListItem['status']): 'success' | 'info' {
  return status === 'published' ? 'success' : 'info'
}

async function loadList(): Promise<void> {
  loading.value = true
  try {
    const params: { type: 'visualization', keyword?: string } = { type: 'visualization' }
    if (searchKeyword.value.trim())
      params.keyword = searchKeyword.value.trim()

    const result = await fetchPageList(params)
    pageItems.value = result.items
    total.value = result.total
  }
  catch (error) {
    ElMessage.error((error as Error).message || '加载可视化页面失败')
  }
  finally {
    loading.value = false
  }
}

function designPage(id: string): void {
  router.push({ name: 'VisualEditorStandalone', params: { id } })
  // const url = router.resolve({ name: 'VisualEditorStandalone', params: { id } }).href
  // window.open(url, '_blank')
}

function previewSource(id: string): string {
  return router.resolve({ name: 'PagePreview', params: { id } }).href
}

function previewPage(id: string): void {
  window.open(previewSource(id), '_blank')
}

function openCreateDialog(): void {
  createForm.value = { name: '' }
  createDialogVisible.value = true
}

function openEditDialog(page: ApiPageListItem): void {
  editingPage.value = page
  editForm.value = { name: page.name }
  editDialogVisible.value = true
}

async function submitCreatePage(): Promise<void> {
  const name = createForm.value.name.trim()
  if (!name) {
    ElMessage.warning('请输入页面名称')
    return
  }

  createSaving.value = true
  try {
    const page = await createPage({ name, type: 'visualization', status: 'draft' })
    ElMessage.success('页面已创建')
    createDialogVisible.value = false
    designPage(page.id)
    await loadList()
  }
  catch (error) {
    ElMessage.error((error as Error).message || '创建失败')
  }
  finally {
    createSaving.value = false
  }
}

async function savePageInfo(): Promise<void> {
  if (!editingPage.value)
    return

  const name = editForm.value.name.trim()
  if (!name) {
    ElMessage.warning('请输入页面名称')
    return
  }

  editSaving.value = true
  try {
    await updatePage(editingPage.value.id, { name })
    ElMessage.success('页面信息已更新')
    editDialogVisible.value = false
    await loadList()
  }
  catch (error) {
    ElMessage.error((error as Error).message || '更新失败')
  }
  finally {
    editSaving.value = false
  }
}

async function removePage(page: ApiPageListItem): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定删除页面「${page.name}」吗？此操作不可恢复。`, '删除页面', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  }
  catch {
    return
  }

  try {
    await deletePage(page.id)
    ElMessage.success('已删除')
    await loadList()
  }
  catch (error) {
    ElMessage.error((error as Error).message || '删除失败')
  }
}

onMounted(() => {
  void loadList()
})

onActivated(() => {
  if (isFirstActivation) {
    isFirstActivation = false
    return
  }
  void loadList()
})
</script>

<template>
  <main v-loading="loading" class="visual-list">
    <header class="visual-list__header">
      <div class="visual-list__copy">
        <span class="visual-list__eyebrow">Visualization</span>
        <h1>可视化</h1>
        <p>管理可视化页面，预览、设计或发布交付。</p>
      </div>
      <div class="visual-list__toolbar">
        <el-input
          v-model="searchKeyword"
          class="visual-list__search"
          placeholder="搜索页面"
          :prefix-icon="Search"
          clearable
          @input="loadList"
        />
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          新建可视化页面
        </el-button>
      </div>
    </header>

    <div class="visual-list__meta">
      <el-tabs v-model="viewMode" class="visual-list__tabs">
        <el-tab-pane
          v-for="tab in viewTabs"
          :key="tab.name"
          :name="tab.name"
        >
          <template #label>
            <span class="visual-list__tab-label">
              <el-icon :size="14">
                <component :is="tab.icon" />
              </el-icon>
              {{ tab.label }}
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
      <span v-if="total > 0" class="visual-list__count">共 {{ total }} 个页面</span>
    </div>

    <el-scrollbar class="visual-list__scrollbar">
      <div class="visual-list__content">
        <!-- 卡片视图 -->
        <div v-if="pageItems.length && viewMode === 'card'" class="page-grid">
          <article v-for="page in pageItems" :key="page.id" class="page-card">
            <button
              class="page-card__preview"
              type="button"
              :aria-label="`预览 ${page.name}`"
              @click="previewPage(page.id)"
            >
              <iframe
                :src="previewSource(page.id)"
                :title="`${page.name} 预览`"
                loading="lazy"
                tabindex="-1"
              />
              <span class="page-card__preview-mask">
                <el-icon><View /></el-icon>
                查看预览
              </span>
            </button>
            <div class="page-card__body">
              <div class="page-card__title-row">
                <h3 :title="page.name">
                  {{ page.name }}
                </h3>
                <el-tag
                  :type="statusType(page.status)"
                  size="small"
                  effect="plain"
                >
                  {{ statusLabel(page.status) }}
                </el-tag>
              </div>
              <time>更新于 {{ formatTime(page.updated_at) }}</time>
              <div class="page-card__actions">
                <el-button
                  class="page-card__action page-card__action--primary"
                  type="primary"
                  size="small"
                  :icon="EditPen"
                  @click="designPage(page.id)"
                >
                  设计
                </el-button>
                <el-tooltip content="重命名" placement="top" :show-after="200">
                  <el-button
                    class="page-card__action"
                    size="small"
                    text
                    bg
                    :icon="Edit"
                    aria-label="重命名"
                    @click="openEditDialog(page)"
                  />
                </el-tooltip>
                <el-tooltip content="删除" placement="top" :show-after="200">
                  <el-button
                    class="page-card__action page-card__action--danger"
                    size="small"
                    text
                    bg
                    type="danger"
                    :icon="Delete"
                    aria-label="删除"
                    @click="removePage(page)"
                  />
                </el-tooltip>
              </div>
            </div>
          </article>
        </div>

        <!-- 列表视图 -->
        <div v-else-if="pageItems.length && viewMode === 'list'" class="page-table-wrap">
          <el-table
            class="page-table"
            :data="pageItems"
            row-key="id"
            stripe
          >
            <el-table-column label="页面名称" min-width="220" show-overflow-tooltip>
              <template #default="{ row }">
                <button class="page-table__name" type="button" @click="designPage(row.id)">
                  {{ row.name }}
                </button>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag
                  :type="statusType(row.status)"
                  size="small"
                  effect="plain"
                >
                  {{ statusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="更新时间" width="190" align="center">
              <template #default="{ row }">
                <span class="page-table__time">{{ formatTime(row.updated_at) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="190" align="center">
              <template #default="{ row }">
                <span class="page-table__time">{{ formatTime(row.created_at) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="300" fixed="right" align="center">
              <template #default="{ row }">
                <div class="page-table__actions">
                  <el-button text type="primary" size="small" @click="designPage(row.id)">
                    设计
                  </el-button>
                  <el-button text size="small" @click="previewPage(row.id)">
                    预览
                  </el-button>
                  <el-button text size="small" @click="openEditDialog(row)">
                    重命名
                  </el-button>
                  <el-button text type="danger" size="small" @click="removePage(row)">
                    删除
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-empty v-else-if="!loading" description="暂无可视化页面">
          <el-button type="primary" :icon="Plus" @click="openCreateDialog">
            新建可视化页面
          </el-button>
        </el-empty>
      </div>
    </el-scrollbar>

    <AdaptiveDialog v-model="editDialogVisible" title="编辑页面信息" width="480px" @close="editingPage = null">
      <el-form v-if="editingPage" :model="editForm" label-width="80px">
        <el-form-item label="页面名称" required>
          <el-input v-model="editForm.name" placeholder="请输入页面名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="editSaving" @click="savePageInfo">
          保存
        </el-button>
      </template>
    </AdaptiveDialog>

    <AdaptiveDialog v-model="createDialogVisible" title="新建可视化页面" width="480px" @close="createForm.name = ''">
      <el-form :model="createForm" label-width="80px">
        <el-form-item label="页面名称" required>
          <el-input v-model="createForm.name" placeholder="请输入页面名称" @keyup.enter="submitCreatePage" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="createSaving" @click="submitCreatePage">
          创建
        </el-button>
      </template>
    </AdaptiveDialog>
  </main>
</template>

<style scoped>
.visual-list {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 100%;
  background: var(--workbench-bg, var(--el-bg-color-page, #f7f8fa));
  color: var(--type-body, var(--el-text-color-primary));
}

.visual-list__header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-shrink: 0;
  margin: 16px 18px 0;
  padding: 14px 18px;
  border: 1px solid var(--workbench-hero-border, var(--workbench-card-border));
  border-radius: var(--app-shell-radius, 8px);
  background: var(--workbench-hero-bg, var(--workbench-card-bg));
  box-shadow: var(--workbench-shadow, none);
}

.visual-list__copy {
  min-width: 0;
}

.visual-list__eyebrow {
  display: block;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--workbench-hero-eyebrow, var(--type-eyebrow));
  font-family: var(--cube-font-mono, inherit);
}

.visual-list__header h1 {
  margin: 4px 0 0;
  font-size: 22px;
  line-height: 1.15;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-family: var(--cube-font-display, inherit);
  color: var(--workbench-hero-title, var(--type-title));
}

.visual-list__header p {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.45;
  color: var(--workbench-hero-lead, var(--type-body));
}

.visual-list__toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-shrink: 0;
}

.visual-list__search {
  width: 240px;
}

.visual-list__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-shrink: 0;
  margin: 10px 18px 0;
  padding: 0 2px;
}

.visual-list__tabs {
  flex: 1;
  min-width: 0;
}

.visual-list__tabs :deep(.el-tabs__header) {
  margin: 0;
}

.visual-list__tabs :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: var(--el-border-color-extra-light);
}

.visual-list__tabs :deep(.el-tabs__item) {
  height: 36px;
  padding: 0 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.visual-list__tabs :deep(.el-tabs__item.is-active) {
  color: var(--el-color-primary);
  font-weight: 600;
}

.visual-list__tabs :deep(.el-tabs__active-bar) {
  height: 2px;
  border-radius: 1px;
}

.visual-list__tabs :deep(.el-tabs__content) {
  display: none;
}

.visual-list__tab-label {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.visual-list__count {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--workbench-muted, var(--el-text-color-secondary));
  font-family: var(--cube-font-mono, inherit);
}

.visual-list__scrollbar {
  flex: 1;
  height: 0;
  min-height: 0;
}

.visual-list__content {
  padding: 12px 18px 18px;
}

.page-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.page-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--workbench-card-border);
  border-radius: var(--app-shell-radius, 8px);
  background: var(--workbench-card-bg);
  box-shadow: var(--workbench-shadow, none);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
}

.page-card:hover {
  border-color: var(--workbench-hover-border);
  box-shadow: 0 0 0 1px var(--workbench-hover-border);
  transform: translateY(-1px);
}

.page-card__preview {
  position: relative;
  display: block;
  width: 100%;
  height: 168px;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-bottom: 1px solid var(--workbench-soft-border, var(--workbench-card-border));
  background: var(--workbench-soft-bg, var(--el-fill-color-light));
  cursor: pointer;
}

.page-card__preview iframe {
  display: block;
  width: 400%;
  height: 400%;
  border: 0;
  pointer-events: none;
  transform: scale(0.25);
  transform-origin: top left;
}

.page-card__preview-mask {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
  background: transparent;
  opacity: 0;
  transition:
    opacity 0.18s ease,
    background 0.18s ease;
}

.page-card__preview:hover .page-card__preview-mask,
.page-card__preview:focus-visible .page-card__preview-mask {
  background: rgba(15, 23, 42, 0.42);
  opacity: 1;
}

.page-card__preview:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -2px;
}

.page-card__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 12px 14px 12px;
}

.page-card__title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.page-card h3 {
  overflow: hidden;
  min-width: 0;
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.35;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--workbench-card-title, var(--type-title));
}

.page-card time {
  display: block;
  margin-top: 6px;
  color: var(--workbench-card-caption, var(--type-caption));
  font-size: 12px;
  font-family: var(--cube-font-mono, inherit);
}

.page-card__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 4px;
  margin-top: auto;
  padding-top: 12px;
}

.page-card__action {
  margin: 0 !important;
  border-radius: var(--app-shell-radius, 4px);
}

.page-card__action--primary {
  font-weight: 600;
  padding: 5px 12px;
}

.page-card__action:not(.page-card__action--primary) {
  width: 30px;
  height: 30px;
  padding: 0;
}

.page-card__title-row :deep(.el-tag),
.page-table :deep(.el-tag) {
  border-radius: var(--app-shell-radius, 4px);
}

.page-card__title-row :deep(.el-tag--plain),
.page-table :deep(.el-tag--plain) {
  --el-tag-border-color: var(--el-border-color-lighter);
  --el-tag-bg-color: var(--el-fill-color-blank);
}

.page-card__title-row :deep(.el-tag--plain.el-tag--info),
.page-table :deep(.el-tag--plain.el-tag--info) {
  --el-tag-text-color: var(--el-text-color-secondary);
  --el-tag-bg-color: var(--el-fill-color-lighter);
  --el-tag-border-color: var(--el-border-color-lighter);
}

.page-card__title-row :deep(.el-tag--plain.el-tag--success),
.page-table :deep(.el-tag--plain.el-tag--success) {
  --el-tag-bg-color: color-mix(in srgb, var(--el-color-success) 8%, transparent);
  --el-tag-border-color: color-mix(in srgb, var(--el-color-success) 22%, transparent);
  --el-tag-text-color: var(--el-color-success);
}

/* 列表 */
.page-table-wrap {
  overflow: hidden;
  border: 1px solid var(--workbench-card-border, var(--el-border-color-lighter));
  border-radius: var(--app-shell-radius, 8px);
  background: var(--workbench-card-bg, var(--el-bg-color));
}

.page-table {
  --el-table-header-bg-color: var(--el-fill-color-lighter);
  width: 100%;
}

.page-table :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.page-table__name {
  max-width: 100%;
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--el-text-color-primary);
  font: inherit;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
}

.page-table__name:hover {
  color: var(--el-color-primary);
}

.page-table__time {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-family: var(--cube-font-mono, inherit);
}

.page-table__actions {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2px;
}

/* 暗色细节 */
:global(html.dark) .page-card {
  background: var(--el-bg-color);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--workbench-card-border) 40%, transparent);
}

:global(html.dark) .page-card:hover {
  background: var(--el-bg-color);
  box-shadow:
    inset 0 0 0 1px var(--workbench-hover-border),
    0 8px 20px rgba(0, 0, 0, 0.18);
}

:global(html.dark) .page-card__preview {
  background: var(--el-fill-color-lighter);
  border-bottom-color: var(--el-border-color-lighter);
}

:global(html.dark) .page-card__preview:hover .page-card__preview-mask,
:global(html.dark) .page-card__preview:focus-visible .page-card__preview-mask {
  background: rgba(0, 0, 0, 0.4);
}

:global(html.dark) .page-card__title-row :deep(.el-tag--plain),
:global(html.dark) .page-table :deep(.el-tag--plain) {
  --el-tag-border-color: var(--el-border-color-extra-light);
}

:global(html.dark) .page-card__title-row :deep(.el-tag--plain.el-tag--info),
:global(html.dark) .page-table :deep(.el-tag--plain.el-tag--info) {
  --el-tag-bg-color: var(--el-fill-color-lighter);
  --el-tag-border-color: var(--el-border-color-extra-light);
  --el-tag-text-color: var(--el-text-color-secondary);
}

:global(html.dark) .page-card__title-row :deep(.el-tag--plain.el-tag--success),
:global(html.dark) .page-table :deep(.el-tag--plain.el-tag--success) {
  --el-tag-bg-color: color-mix(in srgb, var(--el-color-success) 10%, transparent);
  --el-tag-border-color: color-mix(in srgb, var(--el-color-success) 20%, transparent);
  --el-tag-text-color: var(--el-color-success-light-3);
}

:global(html.dark) .page-table-wrap {
  background: var(--el-bg-color);
  border-color: var(--el-border-color-lighter);
}

:global(html.dark) .visual-list__search :deep(.el-input__wrapper) {
  background: var(--el-fill-color-blank);
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
}

@media (prefers-reduced-motion: reduce) {
  .page-card,
  .page-card__preview-mask {
    transition: none;
  }

  .page-card:hover {
    transform: none;
  }
}

@media (max-width: 720px) {
  .visual-list__header {
    flex-direction: column;
    align-items: stretch;
  }

  .visual-list__toolbar {
    flex-wrap: wrap;
  }

  .visual-list__search {
    width: 100%;
  }

  .visual-list__meta {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
