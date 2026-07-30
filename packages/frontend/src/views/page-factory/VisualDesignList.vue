<script lang="ts" setup>
/** 可视化页面列表 */
import type { ApiPageListItem } from '@/api/pages'
import { EditPen, Plus, Search, View } from '@element-plus/icons-vue'
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
    <div class="visual-list__toolbar">
      <el-button type="primary" :icon="Plus" @click="openCreateDialog">
        新建可视化页面
      </el-button>
      <el-input
        v-model="searchKeyword"
        class="visual-list__search"
        placeholder="搜索页面"
        :prefix-icon="Search"
        clearable
        @input="loadList"
      />
    </div>

    <el-scrollbar class="visual-list__scrollbar" wrap-style="padding: 0 24px">
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
              <el-tag :type="page.status === 'published' ? 'success' : 'info'" size="small" effect="light">
                {{ page.status === 'published' ? '已发布' : '草稿' }}
              </el-tag>
            </div>
            <time>更新于 {{ formatTime(page.updated_at) }}</time>
            <div class="page-card__actions">
              <el-button text :icon="View" @click="previewPage(page.id)">
                预览
              </el-button>
              <el-button text :icon="EditPen" @click="openEditDialog(page)">
                编辑信息
              </el-button>
              <el-button type="primary" text :icon="EditPen" @click="designPage(page.id)">
                设计
              </el-button>
              <el-button type="danger" text @click="removePage(page)">
                删除
              </el-button>
            </div>
          </div>
        </article>
      </div>

      <el-empty v-else-if="!loading" description="暂无可视化页面">
        <el-button type="primary" :icon="Plus" @click="openCreateDialog">
          新建可视化页面
        </el-button>
      </el-empty>
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
  height: 100%;
  /*padding: 24px;*/
  background: var(--el-bg-color, #f7f8fa);
  display: flex;
  flex-direction: column;
}
.visual-list__toolbar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 18px;
  padding: 24px 24px 0 24px;
}
.visual-list__search {
  width: 240px;
}
.visual-list__scrollbar {
  height: 100%;
  flex: 1;
  height: 0;
}
.page-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 16px;
}
.page-card {
  overflow: hidden;
  border: 1px solid #e6ebf2;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 3px 10px rgba(31, 41, 55, 0.04);
  transition:
    border-color 0.18s,
    box-shadow 0.18s,
    transform 0.18s;
}
.page-card:hover {
  border-color: #bcd2f8;
  box-shadow: 0 10px 24px rgba(43, 90, 163, 0.12);
  transform: translateY(-2px);
}
.page-card__preview {
  position: relative;
  display: block;
  width: 100%;
  height: 172px;
  overflow: hidden;
  padding: 0;
  border: 0;
  border-bottom: 1px solid #e6ebf2;
  background: #eef2f7;
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
  background: rgba(26, 57, 105, 0);
  opacity: 0;
  transition:
    opacity 0.18s,
    background 0.18s;
}
.page-card__preview:hover .page-card__preview-mask,
.page-card__preview:focus-visible .page-card__preview-mask {
  background: rgba(26, 57, 105, 0.72);
  opacity: 1;
}
.page-card__body {
  padding: 14px 15px 10px;
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
  font-size: 15px;
  text-overflow: ellipsis;
  white-space: nowrap;
}
h3 {
  margin: 0;
  color: #1f2937;
}
.page-card time {
  display: block;
  margin-top: 8px;
  color: #8491a4;
  font-size: 13px;
}
.page-card__actions {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
  margin-top: 8px;
}
</style>
