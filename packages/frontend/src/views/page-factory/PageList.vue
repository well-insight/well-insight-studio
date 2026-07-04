<script lang="ts" setup>
import type { ApiPageListItem, PageStatus, PageType } from '@/api/pages'
import { DataLine, Delete, EditPen, EditPen as EditPenIcon, Monitor, Plus, Search, View } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onActivated, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createPage, deletePage, fetchPageList, updatePage } from '@/api/pages'
import { AdaptiveDialog } from '@/components/adaptive-dialog'
import { ButtonTabs } from '@/components/button-tabs'

const router = useRouter()
const route = useRoute()

/** 根据路由名称决定默认 Tab */
const routeTabMap: Record<string, 'all' | PageType> = {
  PageList: 'all',
  PageListForm: 'form',
  PageListReport: 'report',
}
const activeTab = ref<'all' | PageType>(routeTabMap[route.name as string] || 'all')
const loading = ref(false)
const pageItems = ref<ApiPageListItem[]>([])
const total = ref(0)
const createDialogVisible = ref(false)
const searchKeyword = ref('')
const editDialogVisible = ref(false)
const editingPage = ref<ApiPageListItem | null>(null)
const editForm = ref({ name: '', type: '' as PageType })
const editSaving = ref(false)

const tabOptions = [
  { label: '全部', value: 'all' },
  { label: '可视化', value: 'visualization' },
  { label: '表单', value: 'form' },
  { label: '报表', value: 'report' },
]

const typeLabels: Record<string, string> = {
  visualization: '可视化',
  form: '表单',
  report: '报表',
}

const typeIcons: Record<string, any> = {
  visualization: Monitor,
  form: EditPenIcon,
  report: DataLine,
}

const typeColors: Record<string, string> = {
  visualization: '',
  form: 'success',
  report: 'warning',
}

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
    const params: { type?: PageType, keyword?: string } = {}
    if (activeTab.value !== 'all') {
      params.type = activeTab.value
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

watch(activeTab, () => {
  loadList()
})

onMounted(() => {
  loadList()
})

onActivated(() => {
  loadList()
})

function designPage(id: string) {
  router.push({ name: 'PageEditor', params: { id } })
}

function openEditDialog(row: ApiPageListItem) {
  editingPage.value = row
  editForm.value = { name: row.name, type: row.type }
  editDialogVisible.value = true
}

async function savePageInfo() {
  if (!editingPage.value) return
  editSaving.value = true
  try {
    await updatePage(editingPage.value.id, {
      name: editForm.value.name,
    })
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

async function createNewPage(type: PageType) {
  createDialogVisible.value = false
  try {
    const name = type === 'visualization' ? '未命名大屏' : type === 'form' ? '未命名表单' : '未命名报表'
    const page = await createPage({ name, type, status: 'draft' })
    router.push({ name: 'PageEditor', params: { id: page.id } })
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
  <div class="h-full w-full flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="border-bottom-1 flex h-[54px] items-center justify-between px-3 shrink-0">
      <ButtonTabs v-model="activeTab" :options="tabOptions" />
      <div class="flex items-center gap-2">
        <el-button round type="primary" :icon="Plus" @click="createDialogVisible = true">
          新建页面
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
          <el-space>
            <el-icon :size="18">
              <component :is="typeIcons[row.type]" />
            </el-icon>
            <el-link type="primary" :underline="false" @click="designPage(row.id)">
              {{ row.name }}
            </el-link>
          </el-space>
        </template>
      </el-table-column>
      <el-table-column prop="type" label="类型" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="typeColors[row.type] as any" size="small">
            {{ typeLabels[row.type] }}
          </el-tag>
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

    <!-- 新建页面对话框 -->
    <AdaptiveDialog v-model="createDialogVisible" title="选择页面类型" width="640px">
      <div class="type-cards grid grid-cols-3 gap-4">
        <el-card
          shadow="hover"
          class="cursor-pointer text-center"
          @click="createNewPage('visualization')"
        >
          <el-icon :size="40" color="#409EFF">
            <Monitor />
          </el-icon>
          <h3 class="my-2">
            可视化大屏
          </h3>
          <p class="text-sm text-gray-400">
            图表展示、数据看板、监控大屏
          </p>
        </el-card>
        <el-card
          shadow="hover"
          class="cursor-pointer text-center"
          @click="createNewPage('form')"
        >
          <el-icon :size="40" color="#67C23A">
            <EditPenIcon />
          </el-icon>
          <h3 class="my-2">
            表单管理
          </h3>
          <p class="text-sm text-gray-400">
            数据录入、增删改查、列表展示
          </p>
        </el-card>
        <el-card
          shadow="hover"
          class="cursor-pointer text-center"
          @click="createNewPage('report')"
        >
          <el-icon :size="40" color="#E6A23C">
            <DataLine />
          </el-icon>
          <h3 class="my-2">
            复杂报表
          </h3>
          <p class="text-sm text-gray-400">
            分组汇总、交叉表、导出打印
          </p>
        </el-card>
      </div>
    </AdaptiveDialog>

    <!-- 编辑页面基础信息对话框 -->
    <AdaptiveDialog v-model="editDialogVisible" title="编辑页面信息" width="480px" @close="editingPage = null">
      <el-form v-if="editingPage" :model="editForm" label-width="80px">
        <el-form-item label="页面名称">
          <el-input v-model="editForm.name" placeholder="请输入页面名称" />
        </el-form-item>
        <el-form-item label="页面类型">
          <el-tag :type="typeColors[editForm.type] as any" size="default">
            {{ typeLabels[editForm.type] }}
          </el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="savePageInfo">保存</el-button>
      </template>
    </AdaptiveDialog>
  </div>
</template>
