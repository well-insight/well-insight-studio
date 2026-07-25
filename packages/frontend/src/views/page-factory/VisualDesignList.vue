<script lang="ts" setup>
/**
 * 可视化设计页面列表
 */
import type { ApiPageListItem } from '@/api/pages'
import { Plus, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onActivated, onMounted, ref } from 'vue'
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
const selectedIds = ref<string[]>([])
const tableRef = ref()

const publishedCount = computed(() => pageItems.value.filter(item => item.status === 'published').length)
const draftCount = computed(() => pageItems.value.filter(item => item.status !== 'published').length)
const latestPage = computed(() => {
  return [...pageItems.value].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0]
})
const recentPages = computed(() => {
  return [...pageItems.value]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3)
})

function formatTime(iso: string): string {
  if (!iso)
    return '-'
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function loadList() {
  loading.value = true
  try {
    const params: { type: 'visualization', keyword?: string } = {
      type: 'visualization',
    }
    if (searchKeyword.value.trim()) {
      params.keyword = searchKeyword.value.trim()
    }
    const result = await fetchPageList(params)
    pageItems.value = result.items
    total.value = result.total
  }
  catch (e) {
    ElMessage.error((e as Error).message || '加载页面列表失败')
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  loadList()
})

onActivated(() => {
  loadList()
})

function designPage(id: string) {
  router.push({ name: 'VisualPageEditor', params: { id } })
}

function openEditDialog(row: ApiPageListItem) {
  editingPage.value = row
  editForm.value = { name: row.name }
  editDialogVisible.value = true
}

async function savePageInfo() {
  if (!editingPage.value)
    return
  editSaving.value = true
  try {
    await updatePage(editingPage.value.id, { name: editForm.value.name })
    ElMessage.success('页面信息已更新')
    editDialogVisible.value = false
    await loadList()
  }
  catch (e) {
    ElMessage.error((e as Error).message || '更新失败')
  }
  finally {
    editSaving.value = false
  }
}

function openCreateDialog() {
  createForm.value = { name: '' }
  createDialogVisible.value = true
}

async function submitCreatePage() {
  if (!createForm.value.name.trim()) {
    ElMessage.warning('请输入页面名称')
    return
  }
  createSaving.value = true
  try {
    const page = await createPage({ name: createForm.value.name.trim(), type: 'visualization', status: 'draft' })
    ElMessage.success('页面已创建')
    createDialogVisible.value = false
    router.push({ name: 'VisualPageEditor', params: { id: page.id } })
  }
  catch (e) {
    ElMessage.error((e as Error).message || '创建失败')
  }
  finally {
    createSaving.value = false
  }
}

async function previewPage(id: string) {
  const url = router.resolve({ name: 'PagePreview', params: { id } }).href
  window.open(url, '_blank')
}

async function removePage(row: ApiPageListItem) {
  try {
    await ElMessageBox.confirm(`确定删除页面「${row.name}」吗？此操作不可恢复。`, '删除页面', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  }
  catch {
    return
  }
  try {
    await deletePage(row.id)
    ElMessage.success('已删除')
    await loadList()
  }
  catch (e) {
    ElMessage.error((e as Error).message || '删除失败')
  }
}

function onSelectionChange(selection: ApiPageListItem[]) {
  selectedIds.value = selection.map(item => item.id)
}

function clearSelection() {
  tableRef.value?.clearSelection()
  selectedIds.value = []
}

async function batchDelete() {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请先选择页面')
    return
  }
  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedIds.value.length} 个页面吗？此操作不可恢复。`,
      '批量删除',
      {
        type: 'warning',
        confirmButtonText: '删除',
        cancelButtonText: '取消',
      },
    )
  }
  catch {
    return
  }
  loading.value = true
  try {
    await Promise.all(selectedIds.value.map(id => deletePage(id)))
    ElMessage.success(`已删除 ${selectedIds.value.length} 个页面`)
    selectedIds.value = []
    await loadList()
  }
  catch (e) {
    ElMessage.error((e as Error).message || '批量删除失败')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="visual-home h-full w-full overflow-hidden">
    <section class="visual-home__hero">
      <div class="visual-home__hero-copy">
        <div class="visual-home__intro">
          <div class="visual-home__eyebrow">
            VISUAL CANVAS
          </div>
          <h1 class="visual-home__title">
            可视化设计工作台
          </h1>
          <p class="visual-home__summary">
            管理大屏草稿、发布状态和最近更新，快速进入画布继续设计。
          </p>
          <div class="visual-home__hero-actions">
            <el-button type="primary" :icon="Plus" @click="openCreateDialog">
              新建可视化页面
            </el-button>
            <el-input
              v-model="searchKeyword"
              class="visual-home__search"
              placeholder="搜索页面"
              :prefix-icon="Search"
              clearable
              @input="loadList"
            />
          </div>
        </div>

        <section class="visual-home__stats" aria-label="页面统计">
          <button class="visual-home__stat visual-home__stat--primary" type="button" @click="openCreateDialog">
            <span class="visual-home__stat-label">全部页面</span>
            <strong>{{ total }}</strong>
            <span>创建新的画布</span>
          </button>
          <div class="visual-home__stat">
            <span class="visual-home__stat-label">已发布</span>
            <strong>{{ publishedCount }}</strong>
            <span>可用于预览交付</span>
          </div>
          <div class="visual-home__stat">
            <span class="visual-home__stat-label">草稿</span>
            <strong>{{ draftCount }}</strong>
            <span>等待继续设计</span>
          </div>
          <div class="visual-home__stat">
            <span class="visual-home__stat-label">最近更新</span>
            <strong>{{ latestPage ? formatTime(latestPage.updated_at).slice(5) : '-' }}</strong>
            <span class="truncate">{{ latestPage?.name || '暂无页面' }}</span>
          </div>
        </section>
      </div>
    </section>

    <section class="visual-home__content">
      <aside class="visual-home__recent">
        <div class="visual-home__section-head">
          <div>
            <h2>最近画布</h2>
            <p>按更新时间排序</p>
          </div>
        </div>
        <div v-if="recentPages.length" class="visual-home__recent-list">
          <button
            v-for="item in recentPages"
            :key="item.id"
            class="visual-home__recent-item"
            type="button"
            @click="designPage(item.id)"
          >
            <span class="visual-home__recent-name">{{ item.name }}</span>
            <span class="visual-home__recent-time">{{ formatTime(item.updated_at) }}</span>
            <el-tag :type="item.status === 'published' ? 'success' : 'info'" size="small">
              {{ item.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </button>
        </div>
        <el-empty v-else class="visual-home__recent-empty" description="暂无最近画布" :image-size="72" />
      </aside>

      <main class="visual-home__table-card">
        <div class="visual-home__section-head visual-home__table-head">
          <div>
            <h2>页面列表</h2>
            <p>{{ searchKeyword ? `搜索「${searchKeyword}」的结果` : '全部可视化页面' }}</p>
          </div>
          <div class="visual-home__batch-actions">
            <span v-if="selectedIds.length > 0" class="visual-home__batch-count">已选 <strong>{{ selectedIds.length }}</strong> 项</span>
            <el-button size="small" :disabled="selectedIds.length === 0" @click="clearSelection">取消选择</el-button>
            <el-button size="small" type="danger" :disabled="selectedIds.length === 0" @click="batchDelete">批量删除</el-button>
          </div>
        </div>

        <el-table
          ref="tableRef"
          v-loading="loading"
          :data="pageItems"
          height="100%"
          stripe
          class="visual-home__table"
          @selection-change="onSelectionChange"
        >
          <el-table-column type="selection" width="48" />
          <el-table-column prop="name" label="页面名称" min-width="220">
            <template #default="{ row }">
              <button class="visual-home__page-link" type="button" @click="designPage(row.id)">
                <span>{{ row.name }}</span>
                <small>进入设计</small>
              </button>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="120" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small" effect="light">
                {{ row.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="updated_at" label="更新时间" width="180" align="center">
            <template #default="{ row }">
              {{ formatTime(row.updated_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="260" align="center" fixed="right">
            <template #default="{ row }">
              <el-button size="small" text type="primary" @click="designPage(row.id)">
                设计
              </el-button>
              <el-button size="small" text @click="openEditDialog(row)">
                编辑
              </el-button>
              <el-button size="small" text type="success" @click="previewPage(row.id)">
                预览
              </el-button>
              <el-button size="small" text type="danger" @click="removePage(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无可视化页面" :image-size="96">
              <el-button type="primary" :icon="Plus" @click="openCreateDialog">
                新建可视化页面
              </el-button>
            </el-empty>
          </template>
        </el-table>
      </main>
    </section>

    <AdaptiveDialog v-model="editDialogVisible" title="编辑页面信息" width="480px" @close="editingPage = null">
      <el-form v-if="editingPage" :model="editForm" label-width="80px">
        <el-form-item label="页面名称">
          <el-input v-model="editForm.name" placeholder="请输入页面名称" />
        </el-form-item>
        <el-form-item label="页面类型">
          <el-tag size="default">
            可视化
          </el-tag>
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
          <el-input v-model="createForm.name" placeholder="请输入页面名称" />
        </el-form-item>
        <el-form-item label="页面类型">
          <el-tag size="default">
            可视化
          </el-tag>
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
  </div>
</template>

<style scoped>
.visual-home {
  --visual-card-radius: 12px;
  --visual-card-border: 1px solid rgba(82, 124, 181, 0.16);
  --visual-card-shadow: 0 12px 32px rgba(31, 58, 112, 0.08);

  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background:
    linear-gradient(135deg, rgba(38, 99, 235, 0.1), transparent 32%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(255, 255, 255, 0)), var(--el-bg-color-page);
  color: var(--el-text-color-primary);
}

.visual-home__hero {
  position: relative;
  display: flex;
  min-height: 0;
  overflow: hidden;
  border: 1px solid rgba(82, 124, 181, 0.22);
  border-radius: var(--visual-card-radius);
  background:
    radial-gradient(circle at 84% 18%, rgba(14, 165, 233, 0.16), transparent 28%),
    linear-gradient(120deg, #f9fbff 0%, #eef5ff 58%, #e7fff8 100%);
  box-shadow: 0 18px 50px rgba(31, 58, 112, 0.1);
}

.visual-home__hero-copy {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 48%);
  gap: 24px;
  width: 100%;
  padding: 22px 24px;
}

.visual-home__intro {
  min-width: 0;
  align-self: center;
}

.visual-home__eyebrow {
  color: #2563eb;
  font-size: 12px;
  font-weight: 700;
  line-height: 1;
}

.visual-home__title {
  margin: 10px 0 0;
  color: #14213d;
  font-size: 28px;
  font-weight: 800;
  line-height: 1.14;
}

.visual-home__summary {
  max-width: 520px;
  margin: 8px 0 0;
  color: #4b5b76;
  font-size: 14px;
  line-height: 1.6;
}

.visual-home__hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
}

.visual-home__search {
  width: 240px;
}

.visual-home__signal {
  display: none;
}

.visual-home__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  align-self: stretch;
}

.visual-home__stat {
  min-width: 0;
  padding: 14px;
  text-align: left;
  border: 1px solid rgba(37, 99, 235, 0.14);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.68);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

button.visual-home__stat {
  cursor: pointer;
}

.visual-home__stat--primary {
  color: #fff;
  border-color: transparent;
  background: linear-gradient(135deg, #1d4ed8, #0f766e);
}

.visual-home__stat-label {
  display: block;
  color: inherit;
  opacity: 0.72;
  font-size: 12px;
  font-weight: 600;
}

.visual-home__stat strong {
  display: block;
  margin-top: 8px;
  font-size: 28px;
  line-height: 1;
}

.visual-home__stat span:last-child {
  display: block;
  margin-top: 10px;
  color: inherit;
  opacity: 0.66;
  font-size: 12px;
}

.visual-home__content {
  display: grid;
  grid-template-columns: 300px minmax(0, 1fr);
  gap: 14px;
  min-height: 0;
  flex: 1;
}

.visual-home__recent,
.visual-home__table-card {
  min-height: 0;
  border: var(--visual-card-border);
  border-radius: var(--visual-card-radius);
  background: var(--el-bg-color);
  box-shadow: var(--visual-card-shadow);
}

.visual-home__recent {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.visual-home__table-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.visual-home__section-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(82, 124, 181, 0.13);
  background: rgba(255, 255, 255, 0.72);
}

.visual-home__section-head h2 {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
}

.visual-home__section-head p {
  margin: 5px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.2;
}

.visual-home__recent-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
}

.visual-home__recent-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px 10px;
  width: 100%;
  padding: 12px;
  text-align: left;
  border: 1px solid transparent;
  border-radius: 10px;
  background: color-mix(in srgb, var(--el-fill-color-light) 62%, transparent);
  cursor: pointer;
  transition:
    border-color 0.16s ease,
    transform 0.16s ease,
    background 0.16s ease;
}

.visual-home__recent-item:hover {
  border-color: rgba(37, 99, 235, 0.22);
  background: rgba(37, 99, 235, 0.05);
  transform: translateY(-1px);
}

.visual-home__recent-name {
  min-width: 0;
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 14px;
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visual-home__recent-time {
  grid-column: 1 / -1;
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

.visual-home__recent-empty {
  flex: 1;
}

.visual-home__table-head {
  flex-shrink: 0;
}

.visual-home__batch-count {
  color: var(--el-text-color-primary);
  font-size: 13px;
  font-weight: 600;
}

.visual-home__batch-count strong {
  color: var(--el-color-primary);
}

.visual-home__batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.visual-home__table {
  flex: 1;
}

.visual-home__page-link {
  display: inline-flex;
  flex-direction: column;
  gap: 4px;
  max-width: 100%;
  padding: 0;
  text-align: left;
  border: 0;
  background: transparent;
  cursor: pointer;
}

.visual-home__page-link span {
  overflow: hidden;
  max-width: 100%;
  color: var(--el-color-primary);
  font-weight: 600;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visual-home__page-link small {
  color: var(--el-text-color-secondary);
  font-size: 12px;
}

:deep(.visual-home__table .el-table__header th) {
  background: color-mix(in srgb, var(--el-fill-color-light) 82%, var(--el-bg-color));
  color: var(--el-text-color-regular);
  font-weight: 700;
}

:deep(.visual-home__table .el-table__row:hover > td) {
  background: rgba(var(--el-color-primary-rgb), 0.035);
}

:global(html.dark) .visual-home {
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.14), transparent 34%), var(--el-bg-color-page);
}

:global(html.dark) .visual-home__hero {
  border-color: rgba(140, 210, 255, 0.14);
  background:
    radial-gradient(circle at 84% 18%, rgba(67, 156, 255, 0.13), transparent 28%),
    linear-gradient(135deg, rgba(8, 28, 48, 0.94), rgba(7, 26, 43, 0.78));
}

:global(html.dark) .visual-home__title {
  color: var(--el-text-color-primary);
}

:global(html.dark) .visual-home__summary {
  color: var(--el-text-color-secondary);
}

:global(html.dark) .visual-home__stat,
:global(html.dark) .visual-home__section-head {
  border-color: rgba(140, 210, 255, 0.12);
  background: rgba(13, 40, 64, 0.62);
}

:global(html.dark) .visual-home__recent,
:global(html.dark) .visual-home__table-card {
  border-color: rgba(140, 210, 255, 0.14);
  background: rgba(8, 28, 48, 0.72);
}

@media (max-width: 1180px) {
  .visual-home__hero-copy {
    grid-template-columns: minmax(0, 1fr);
  }

  .visual-home__stats {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .visual-home__content {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 720px) {
  .visual-home {
    padding: 10px;
  }

  .visual-home__hero-copy {
    padding: 20px;
  }

  .visual-home__title {
    font-size: 24px;
  }

  .visual-home__stats {
    grid-template-columns: minmax(0, 1fr);
  }

  .visual-home__search {
    width: 100%;
  }
}
</style>
