<script lang="ts" setup>
/**
 * 报表设计页面列表
 */
import type { ApiPageListItem } from '@/api/pages'
import { Plus, Search } from '@element-plus/icons-vue'
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
const editDialogVisible = ref(false)
const editingPage = ref<ApiPageListItem | null>(null)
const editForm = ref({ name: '' })
const editSaving = ref(false)

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
    const params: { type: 'report', keyword?: string } = {
      type: 'report',
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
  router.push({ name: 'ReportPageEditor', params: { id } })
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

async function createNewPage() {
  try {
    const page = await createPage({ name: '未命名报表', type: 'report', status: 'draft' })
    router.push({ name: 'ReportPageEditor', params: { id: page.id } })
  }
  catch (e) {
    ElMessage.error((e as Error).message || '创建失败')
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
</script>

<template>
  <div class="h-full w-full flex flex-col bg-[var(--el-bg-color)]">
    <!-- 顶部工具栏 -->
    <div class="border-bottom-1 flex h-[54px] items-center justify-between px-3 shrink-0">
      <h2 class="text-lg font-semibold">
        报表设计
      </h2>
      <div class="flex items-center gap-2">
        <el-button round type="primary" :icon="Plus" @click="createNewPage">
          新建报表页面
        </el-button>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索页面..."
          :prefix-icon="Search"
          clearable
          style="width: 180px"
          @input="loadList"
        />
      </div>
    </div>

    <!-- 数据表格 -->
    <el-table
      v-loading="loading"
      :data="pageItems"
      style="width: 100%"
      stripe
      class="flex-1"
    >
      <el-table-column prop="name" label="页面名称" min-width="200">
        <template #default="{ row }">
          <el-button link text type="primary" @click="designPage(row.id)">
            {{ row.name }}
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
            {{ row.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新时间" width="180" align="center">
        <template #default="{ row }">
          {{ formatTime(row.updated_at) }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="300" align="center" fixed="right">
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
    </el-table>

    <!-- 编辑页面基础信息对话框 -->
    <AdaptiveDialog v-model="editDialogVisible" title="编辑页面信息" width="480px" @close="editingPage = null">
      <el-form v-if="editingPage" :model="editForm" label-width="80px">
        <el-form-item label="页面名称">
          <el-input v-model="editForm.name" placeholder="请输入页面名称" />
        </el-form-item>
        <el-form-item label="页面类型">
          <el-tag size="default">
            报表
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
  </div>
</template>
