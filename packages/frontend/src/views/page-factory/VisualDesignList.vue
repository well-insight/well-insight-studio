<script lang="ts" setup>
/** 可视化页面列表 */
import type { ApiPageListItem } from '@/api/pages'
import { Delete, Edit, EditPen, Plus, Search, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onActivated, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createPage, deletePage, fetchPageList, updatePage } from '@/api/pages'
import { AdaptiveDialog } from '@/components/adaptive-dialog'

const router = useRouter()
const loading = ref(false)
const pageItems = ref<ApiPageListItem[]>([])
const total = ref(0)
const searchKeyword = ref('')
const createDialogVisible = ref(false)
const createForm = ref({ name: '' })
const createSaving = ref(false)
const editDialogVisible = ref(false)
const editingPage = ref<ApiPageListItem | null>(null)
const editForm = ref({ name: '' })
const editSaving = ref(false)
let isFirstActivation = true

function formatTime(value: string): string {
  if (!value)
    return '-'

  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
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
  const url = router.resolve({ name: 'VisualEditorStandalone', params: { id } }).href
  window.open(url, '_blank')
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

    <el-scrollbar class="visual-list__scrollbar">
      <div class="visual-list__content">
        <div v-if="pageItems.length" class="page-grid">
          <article v-for="page in pageItems" :key="page.id" class="page-card">
            <button class="page-card__preview" type="button" :aria-label="`预览 ${page.name}`" @click="previewPage(page.id)">
              <iframe :src="previewSource(page.id)" :title="`${page.name} 预览`" loading="lazy" tabindex="-1" />
              <span class="page-card__preview-mask"><el-icon><View /></el-icon> 查看预览</span>
            </button>
            <div class="page-card__body">
              <div class="page-card__title-row">
                <h3 :title="page.name">
                  {{ page.name }}
                </h3>
                <el-tag
                  :type="page.status === 'published' ? 'success' : 'info'"
                  size="small"
                  effect="plain"
                >
                  {{ page.status === 'published' ? '已发布' : '草稿' }}
                </el-tag>
              </div>
              <time>更新于 {{ formatTime(page.updated_at) }}</time>
              <div class="page-card__actions">
                <el-tooltip content="设计" placement="top" :show-after="200">
                  <el-button
                    class="page-card__action page-card__action--primary"
                    type="primary"
                    size="small"
                    :icon="EditPen"
                    aria-label="设计"
                    @click="designPage(page.id)"
                  />
                </el-tooltip>
                <el-tooltip content="重命名" placement="top" :show-after="200">
                  <el-button
                    class="page-card__action"
                    size="small"
                    plain
                    :icon="Edit"
                    aria-label="重命名"
                    @click="openEditDialog(page)"
                  />
                </el-tooltip>
                <el-tooltip content="删除" placement="top" :show-after="200">
                  <el-button
                    class="page-card__action page-card__action--danger"
                    size="small"
                    plain
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

.visual-list__scrollbar {
  flex: 1;
  height: 0;
  min-height: 0;
}

.visual-list__content {
  padding: 14px 18px 18px;
}

.page-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 12px;
}

.page-card {
  overflow: hidden;
  border: 1px solid var(--workbench-card-border);
  border-radius: var(--app-shell-radius, 8px);
  background: var(--workbench-card-bg);
  box-shadow: var(--workbench-shadow, none);
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.15s ease;
}

.page-card:hover {
  border-color: var(--workbench-hover-border);
  background: var(--workbench-hover-bg, var(--workbench-card-bg));
  transform: translateY(-1px);
}

.page-card__preview {
  position: relative;
  display: block;
  width: 100%;
  height: 172px;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-bottom: 1px solid var(--workbench-soft-border, var(--workbench-card-border));
  background: var(--workbench-soft-bg, #eef2f7);
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
  color: var(--cube-text, #eaf2ff);
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
  background: color-mix(in srgb, var(--cube-bg-0, #0c1016) 72%, transparent);
  opacity: 1;
}

.page-card__preview:focus-visible {
  outline: 2px solid var(--cube-signal, var(--el-color-primary));
  outline-offset: -2px;
}

.page-card__body {
  padding: 12px 14px 10px;
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
  font-size: 15px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--workbench-card-title, var(--type-title));
}

.page-card time {
  display: block;
  margin-top: 8px;
  color: var(--workbench-card-caption, var(--type-caption));
  font-size: 12px;
  font-family: var(--cube-font-mono, inherit);
}

.page-card__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--workbench-soft-border, var(--workbench-card-border));
}

.page-card__action {
  margin: 0 !important;
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: var(--app-shell-radius, 4px);
}

.page-card__action--primary {
  font-weight: 600;
}

.page-card__action--danger:hover {
  border-color: var(--el-color-danger);
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
}
</style>
