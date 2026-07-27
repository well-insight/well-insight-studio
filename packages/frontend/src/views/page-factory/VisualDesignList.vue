<script lang="ts" setup>
/**
 * 可视化设计页面列表
 */
import type { ApiPageListItem } from '@/api/pages'
import { CircleCheckFilled, Clock, EditPen, Grid, Plus, Search } from '@element-plus/icons-vue'
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
const latestPageTime = computed(() => latestPage.value ? relativeTimeParts(latestPage.value.updated_at) : { value: '-', unit: '' })
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

/** 拆分为「数字值 + 单位」，用于卡片大数字展示 */
function relativeTimeParts(iso: string): { value: string, unit: string } {
  if (!iso) {
    return { value: '-', unit: '' }
  }
  const now = Date.now()
  const diff = now - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) {
    return { value: '', unit: '刚刚' }
  }
  if (mins < 60) {
    return { value: String(mins), unit: '分钟前' }
  }
  const hours = Math.floor(mins / 60)
  if (hours < 24) {
    return { value: String(hours), unit: '小时前' }
  }
  const days = Math.floor(hours / 24)
  if (days < 7) {
    return { value: String(days), unit: '天前' }
  }
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return { value: `${pad(d.getMonth() + 1)}/${pad(d.getDate())}`, unit: '' }
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
  const url = router.resolve({ name: 'VisualEditorStandalone', params: { id } }).href
  window.open(url, '_blank')
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
    const url = router.resolve({ name: 'VisualEditorStandalone', params: { id: page.id } }).href
    window.open(url, '_blank')
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
            可视化工作台
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
          <button class="stat-card card-all" type="button" @click="openCreateDialog">
            <span class="glow-dot" style="background: radial-gradient(circle, rgba(37,99,235,0.06), transparent 70%);" />
            <div class="card-header">
              <span class="card-icon"><el-icon size="22"><Grid /></el-icon></span>
              <span class="card-label">全部页面</span>
            </div>
            <div class="stat-number">
              <strong>{{ total }}</strong>
            </div>
            <div class="stat-description">
              <span><i class="stat-desc-icon">+</i> 创建新的画布</span>
              <span class="badge badge-info">总计</span>
            </div>
            <div class="stat-visual">
              <span class="stat-visual-label">已发布占比</span>
              <div class="bar-group">
                <span class="bar fill" :style="{ flex: total ? publishedCount : 0 }" />
                <span class="bar" :style="{ flex: total ? total - publishedCount : 1 }" />
              </div>
            </div>
          </button>

          <div class="stat-card card-published">
            <span class="glow-dot" style="background: radial-gradient(circle, rgba(5,150,105,0.06), transparent 70%);" />
            <div class="card-header">
              <span class="card-icon"><el-icon size="22"><CircleCheckFilled /></el-icon></span>
              <span class="card-label">已发布</span>
            </div>
            <div class="stat-number">
              <strong>{{ publishedCount }}</strong>
            </div>
            <div class="stat-description">
              <span><i class="stat-desc-icon">✓</i> 可用于预览交付</span>
              <span class="badge badge-success">已就绪</span>
            </div>
            <div class="stat-visual">
              <span class="stat-visual-label">发布率</span>
              <div class="bar-group">
                <span class="bar fill-green" :style="{ flex: total ? publishedCount : 0 }" />
                <span class="bar" :style="{ flex: total ? total - publishedCount : 1 }" />
              </div>
            </div>
          </div>

          <div class="stat-card card-draft">
            <span class="glow-dot" style="background: radial-gradient(circle, rgba(217,119,6,0.06), transparent 70%);" />
            <div class="card-header">
              <span class="card-icon"><el-icon size="22"><EditPen /></el-icon></span>
              <span class="card-label">草稿</span>
            </div>
            <div class="stat-number">
              <strong>{{ draftCount }}</strong>
            </div>
            <div class="stat-description">
              <span><i class="stat-desc-icon">◷</i> 等待继续设计</span>
              <span class="badge badge-warning">进行中</span>
            </div>
            <div class="stat-visual">
              <span class="stat-visual-label">草稿率</span>
              <div class="bar-group">
                <span class="bar fill-amber" :style="{ flex: total ? draftCount : 0 }" />
                <span class="bar" :style="{ flex: total ? total - draftCount : 1 }" />
              </div>
            </div>
          </div>

          <div class="stat-card card-updated">
            <span class="glow-dot" style="background: radial-gradient(circle, rgba(59,130,246,0.06), transparent 70%);" />
            <div class="card-header">
              <span class="card-icon"><el-icon size="22"><Clock /></el-icon></span>
              <span class="card-label">最近更新</span>
            </div>
            <div class="stat-number">
              <template v-if="latestPage && latestPageTime.value">
                <strong>{{ latestPageTime.value }}</strong>
                <span class="stat-unit">{{ latestPageTime.unit }}</span>
              </template>
              <strong v-else-if="latestPage">{{ latestPageTime.unit }}</strong>
              <strong v-else>-</strong>
            </div>
            <div class="stat-description">
              <span class="truncate"><i class="stat-desc-icon">↻</i> {{ latestPage?.name || '暂无页面' }}</span>
              <span class="badge badge-cyan">活跃</span>
            </div>
            <div class="stat-visual">
              <span class="stat-visual-label">动态</span>
              <div class="bar-group">
                <span class="bar fill-sky" style="flex:3" />
                <span class="bar fill-sky" style="flex:2" />
                <span class="bar" style="flex:1" />
              </div>
            </div>
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
            <el-button size="small" :disabled="selectedIds.length === 0" @click="clearSelection">
              取消选择
            </el-button>
            <el-button size="small" type="danger" :disabled="selectedIds.length === 0" @click="batchDelete">
              批量删除
            </el-button>
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
  grid-template-columns: minmax(0, 1fr) minmax(0, 56%);
  gap: 24px;
  width: 100%;
  padding: 16px 20px;
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  align-self: stretch;
}

/* ── 卡片本体 ── */
.stat-card {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
  padding: 16px 18px 14px;
  text-align: left;
  border: 1px solid rgba(0, 120, 200, 0.12);
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow:
    0 16px 32px -12px rgba(0, 20, 40, 0.08),
    0 4px 12px -6px rgba(0, 0, 0, 0.02),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  overflow: hidden;
  transition:
    box-shadow 0.3s ease,
    transform 0.3s ease,
    border-color 0.3s ease,
    background 0.3s ease;
}

button.stat-card {
  cursor: pointer;
}

/* 精致渐变边框 — signature 元素 */
.stat-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 1.2px;
  background: linear-gradient(135deg, rgba(0, 160, 255, 0.18), rgba(130, 80, 255, 0.08), rgba(0, 200, 255, 0.12));
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  z-index: 1;
  transition: opacity 0.35s ease;
}

.stat-card:hover {
  transform: translateY(-3px);
  box-shadow:
    0 20px 40px -14px rgba(0, 60, 120, 0.12),
    0 0 0 1.5px rgba(0, 160, 255, 0.06);
  border-color: rgba(0, 160, 255, 0.18);
  background: rgba(255, 255, 255, 0.92);
}

.stat-card:hover::after {
  opacity: 0.7;
}

/* 每个卡片 hover 边框色微调 */
.card-all:hover {
  border-color: rgba(37, 99, 235, 0.18);
}
.card-published:hover {
  border-color: rgba(5, 150, 105, 0.18);
}
.card-draft:hover {
  border-color: rgba(217, 119, 6, 0.18);
}
.card-updated:hover {
  border-color: rgba(59, 130, 246, 0.18);
}

/* 装饰光点 */
.glow-dot {
  position: absolute;
  bottom: 1rem;
  right: 1.2rem;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  filter: blur(24px);
  pointer-events: none;
  z-index: 0;
}

/* 提升内容层级 */
.card-header,
.stat-number,
.stat-description,
.stat-visual {
  position: relative;
  z-index: 5;
}

/* ── header：图标 + 标签 ── */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.card-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: 13px;
  background: rgba(0, 160, 255, 0.04);
  border: 1px solid rgba(0, 160, 255, 0.06);
  box-shadow:
    0 0 16px rgba(0, 140, 255, 0.02),
    inset 0 1px 0 rgba(255, 255, 255, 0.5);
  transition: 0.25s ease;
  color: #1f4a7a;
}

.card-all .card-icon {
  color: #2563eb;
}
.card-published .card-icon {
  color: #059669;
}
.card-draft .card-icon {
  color: #d97706;
}
.card-updated .card-icon {
  color: #3b82f6;
}

.stat-card:hover .card-icon {
  background: rgba(0, 160, 255, 0.07);
  border-color: rgba(0, 160, 255, 0.12);
  transform: scale(1.04);
  box-shadow: 0 0 20px rgba(0, 140, 255, 0.04);
}

.card-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.6px;
  text-transform: uppercase;
  color: #4a6a8a;
  background: rgba(0, 40, 80, 0.02);
  padding: 5px 14px;
  border-radius: 30px;
  border: 1px solid rgba(0, 160, 255, 0.05);
}

/* ── 主数字 ── */
.stat-number {
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  color: #0b1e33;
  letter-spacing: -1px;
  margin-bottom: 6px;
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.stat-number strong {
  font-weight: 700;
}

.stat-unit {
  font-size: 14px;
  font-weight: 500;
  color: #5a7a9a;
  letter-spacing: 0;
}

/* ── 描述 + 徽章 ── */
.stat-description {
  display: flex;
  align-items: center;
  gap: 6px 10px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #3a5a7a;
  margin-bottom: 12px;
}

.stat-desc-icon {
  font-style: normal;
  margin-right: 3px;
  opacity: 0.6;
  font-size: 11px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(0, 160, 255, 0.04);
  padding: 3px 12px;
  border-radius: 30px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: #1a5a8a;
  border: 1px solid rgba(0, 160, 255, 0.06);
}

.badge-warning {
  background: rgba(245, 158, 11, 0.06);
  color: #a46b1a;
  border-color: rgba(245, 158, 11, 0.08);
}

.badge-success {
  background: rgba(16, 185, 129, 0.06);
  color: #0c7a5e;
  border-color: rgba(16, 185, 129, 0.08);
}

.badge-info {
  background: rgba(37, 99, 235, 0.05);
  color: #1a5a9a;
  border-color: rgba(37, 99, 235, 0.06);
}

.badge-cyan {
  background: rgba(0, 180, 255, 0.04);
  color: #0a6a8a;
  border-color: rgba(0, 180, 255, 0.06);
}

/* ── 底部进度条 ── */
.stat-visual {
  display: flex;
  align-items: center;
  gap: 8px;
  border-top: 1px solid rgba(0, 0, 0, 0.03);
  padding-top: 10px;
  font-size: 10px;
  color: #5a7a9a;
}

.stat-visual-label {
  flex-shrink: 0;
  opacity: 0.65;
}

.bar-group {
  display: flex;
  align-items: center;
  gap: 3px;
  flex: 1;
  height: 5px;
}

.bar-group .bar {
  height: 5px;
  border-radius: 10px;
  background: rgba(0, 0, 0, 0.05);
  transition:
    flex 0.5s ease,
    box-shadow 0.3s ease;
}

.bar-group .bar.fill {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.08);
}
.bar-group .bar.fill-green {
  background: linear-gradient(90deg, #10b981, #34d399);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.08);
}
.bar-group .bar.fill-amber {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
  box-shadow: 0 0 10px rgba(245, 158, 11, 0.08);
}
.bar-group .bar.fill-sky {
  background: linear-gradient(90deg, #3b82f6, #60a5fa);
  box-shadow: 0 0 10px rgba(59, 130, 246, 0.08);
}

/* hover 时填充条微微高亮 */
.stat-card:hover .bar-group .bar.fill {
  box-shadow: 0 0 14px rgba(59, 130, 246, 0.14);
}
.stat-card:hover .bar-group .bar.fill-green {
  box-shadow: 0 0 14px rgba(16, 185, 129, 0.14);
}
.stat-card:hover .bar-group .bar.fill-amber {
  box-shadow: 0 0 14px rgba(245, 158, 11, 0.14);
}
.stat-card:hover .bar-group .bar.fill-sky {
  box-shadow: 0 0 14px rgba(59, 130, 246, 0.14);
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
  border-color: rgba(140, 210, 255, 0.1);
  background: rgba(8, 32, 56, 0.65);
}

:global(html.dark) .stat-card {
  border-color: rgba(140, 210, 255, 0.08);
  background: rgba(10, 34, 56, 0.6);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  box-shadow: none;
}

:global(html.dark) .stat-card::after {
  background: linear-gradient(135deg, rgba(100, 200, 255, 0.12), rgba(180, 120, 255, 0.06), rgba(80, 200, 255, 0.08));
}

:global(html.dark) .stat-card:hover {
  border-color: rgba(140, 210, 255, 0.18);
  background: rgba(14, 42, 68, 0.75);
  box-shadow: 0 24px 48px -12px rgba(0, 0, 0, 0.3);
}

:global(html.dark) .stat-card:hover::after {
  background: linear-gradient(135deg, rgba(100, 210, 255, 0.25), rgba(180, 120, 255, 0.14), rgba(80, 200, 255, 0.2));
}

:global(html.dark) .card-all:hover {
  border-color: rgba(59, 130, 246, 0.25);
}
:global(html.dark) .card-published:hover {
  border-color: rgba(16, 185, 129, 0.25);
}
:global(html.dark) .card-draft:hover {
  border-color: rgba(245, 158, 11, 0.25);
}
:global(html.dark) .card-updated:hover {
  border-color: rgba(96, 165, 250, 0.25);
}

:global(html.dark) .card-icon {
  border-color: rgba(140, 210, 255, 0.08);
  background: rgba(140, 210, 255, 0.05);
}

:global(html.dark) .card-all .card-icon {
  color: #60a5fa;
}
:global(html.dark) .card-published .card-icon {
  color: #34d399;
}
:global(html.dark) .card-draft .card-icon {
  color: #fbbf24;
}
:global(html.dark) .card-updated .card-icon {
  color: #60a5fa;
}

:global(html.dark) .stat-card:hover .card-icon {
  background: rgba(140, 210, 255, 0.09);
  border-color: rgba(140, 210, 255, 0.14);
}

:global(html.dark) .card-label {
  color: #8aacce;
  background: rgba(140, 210, 255, 0.04);
  border-color: rgba(140, 210, 255, 0.06);
}

:global(html.dark) .stat-number {
  color: #e8f0f8;
}

:global(html.dark) .stat-unit {
  color: #7a9aba;
}

:global(html.dark) .stat-description {
  color: #8aacce;
}

:global(html.dark) .badge {
  background: rgba(140, 210, 255, 0.06);
  color: #8aacce;
  border-color: rgba(140, 210, 255, 0.08);
}
:global(html.dark) .badge-info {
  background: rgba(59, 130, 246, 0.08);
  color: #93c5fd;
  border-color: rgba(59, 130, 246, 0.1);
}
:global(html.dark) .badge-success {
  background: rgba(16, 185, 129, 0.08);
  color: #6ee7b7;
  border-color: rgba(16, 185, 129, 0.1);
}
:global(html.dark) .badge-warning {
  background: rgba(245, 158, 11, 0.08);
  color: #fcd34d;
  border-color: rgba(245, 158, 11, 0.1);
}
:global(html.dark) .badge-cyan {
  background: rgba(0, 200, 255, 0.08);
  color: #67e8f9;
  border-color: rgba(0, 200, 255, 0.1);
}

:global(html.dark) .stat-visual {
  border-top-color: rgba(140, 210, 255, 0.08);
  color: #6a8aaa;
}

:global(html.dark) .bar-group .bar {
  background: rgba(140, 210, 255, 0.08);
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
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .visual-home__search {
    width: 100%;
  }
}
</style>
