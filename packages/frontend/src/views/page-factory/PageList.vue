<script lang="ts" setup>
import type { PageType } from '@/api/pages'
import { DataLine, EditPen, Monitor, Plus, Search } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { usePageStore } from '@/stores/pageStore'

const router = useRouter()
const pageStore = usePageStore()

const activeTab = ref<PageType | 'all'>('all')
const searchKeyword = ref('')
const createDialogVisible = ref(false)
const creating = ref(false)

// 编辑弹窗
const editDialogVisible = ref(false)
const editingPage = ref<any>(null)
const editName = ref('')
const editSaving = ref(false)

const typeLabelMap: Record<PageType, string> = {
  visualization: '可视化大屏',
  form: '表单管理',
  report: '复杂报表',
}

const typeTagMap: Record<PageType, 'success' | 'warning' | ''> = {
  visualization: '',
  form: 'success',
  report: 'warning',
}

const typeIconMap: Record<PageType, typeof Monitor> = {
  visualization: Monitor,
  form: EditPen,
  report: DataLine,
}

const filteredPages = computed(() => {
  let list = pageStore.pageList
  if (activeTab.value !== 'all') {
    list = list.filter(p => p.type === activeTab.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(kw))
  }
  return list
})

async function fetchPages() {
  await pageStore.loadPageList({
    type: activeTab.value === 'all' ? undefined : activeTab.value,
    keyword: searchKeyword.value || undefined,
  })
}

function handleTabChange() {
  fetchPages()
}

function editPage(row: any) {
  editingPage.value = row
  editName.value = row.name
  editDialogVisible.value = true
}

function designPage(row: any) {
  router.push(`/project/page-editor/${row.id}`)
}

function rowClick(row: any) {
  designPage(row)
}

async function submitEdit() {
  if (!editName.value.trim()) {
    ElMessage.warning('页面名称不能为空')
    return
  }
  editSaving.value = true
  try {
    await pageStore.savePage({
      id: editingPage.value.id,
      name: editName.value.trim(),
      type: editingPage.value.type,
    })
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    fetchPages()
  }
  catch (e) {
    ElMessage.error((e as Error).message || '保存失败')
  }
  finally {
    editSaving.value = false
  }
}

function previewPage(id: string) {
  window.open(`/page-preview/${id}`, '_blank')
}

async function deletePage(id: string) {
  try {
    await ElMessageBox.confirm('确定要删除该页面吗？此操作不可恢复。', '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await pageStore.removePage(id)
    ElMessage.success('页面已删除')
  }
  catch {
    // 用户取消
  }
}

function showCreateDialog() {
  createDialogVisible.value = true
}

async function createPage(type: PageType) {
  createDialogVisible.value = false

  creating.value = true
  try {
    // 所有类型：创建页面 → 进入 PageEditor 设计页
    const page = await pageStore.savePage({
      name: '未命名页面',
      type,
    })
    router.push(`/project/page-editor/${page.id}`)
  }
  catch (e) {
    ElMessage.error((e as Error).message || '创建失败')
  }
  finally {
    creating.value = false
  }
}

onMounted(() => {
  fetchPages()
})
</script>

<template>
  <div class="page-list-container">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <el-tabs v-model="activeTab" class="page-tabs" @tab-change="handleTabChange">
          <el-tab-pane label="全部" name="all" />
          <el-tab-pane label="可视化" name="visualization" />
          <el-tab-pane label="表单" name="form" />
          <el-tab-pane label="报表" name="report" />
        </el-tabs>
        <el-input
          v-model="searchKeyword"
          placeholder="搜索页面名称..."
          :prefix-icon="Search"
          clearable
          class="search-input"
          style="width: 240px"
          @input="fetchPages"
        />
      </div>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon>
        新建页面
      </el-button>
    </div>

    <!-- 表格 -->
    <el-table
      v-loading="pageStore.loading"
      :data="filteredPages"
      stripe
      class="page-table"
      empty-text="暂无页面，点击右上角新建"
      :cell-style="{ cursor: 'pointer' }"
      @row-click="rowClick"
    >
      <el-table-column prop="name" label="页面名称" min-width="180">
        <template #default="{ row }">
          <span class="page-name">{{ row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="type" label="类型" width="130">
        <template #default="{ row }">
          <el-tag :type="typeTagMap[row.type as PageType] || 'info'">
            <el-icon style="margin-right: 4px; vertical-align: middle">
              <component :is="typeIconMap[row.type as PageType]" />
            </el-icon>
            {{ typeLabelMap[row.type as PageType] || row.type }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
            {{ row.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="updated_at" label="更新时间" width="180">
        <template #default="{ row }">
          {{ row.updated_at?.slice(0, 16)?.replace('T', ' ') || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="320" fixed="right">
        <template #default="{ row }">
          <el-button size="small" type="primary" link @click.stop="editPage(row)">
            编辑
          </el-button>
          <el-button size="small" link @click.stop="designPage(row)">
            设计
          </el-button>
          <el-button size="small" type="success" link @click.stop="previewPage(row.id)">
            预览
          </el-button>
          <el-button size="small" type="danger" link @click.stop="deletePage(row.id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新建对话框 -->
    <el-dialog
      v-model="createDialogVisible"
      title="选择页面类型"
      width="680px"
      :close-on-click-modal="false"
    >
      <div class="type-cards">
        <div class="type-card" @click="createPage('visualization')">
          <div class="type-card-icon visualization">
            <el-icon :size="36"><Monitor /></el-icon>
          </div>
          <h3>可视化大屏</h3>
          <p>图表展示、数据看板、监控大屏</p>
          <span class="type-card-tag">已可用</span>
        </div>
        <div class="type-card" @click="createPage('form')">
          <div class="type-card-icon form">
            <el-icon :size="36"><EditPen /></el-icon>
          </div>
          <h3>表单管理</h3>
          <p>数据录入、增删改查、列表展示</p>
          <span class="type-card-tag coming-soon">即将推出</span>
        </div>
        <div class="type-card" @click="createPage('report')">
          <div class="type-card-icon report">
            <el-icon :size="36"><DataLine /></el-icon>
          </div>
          <h3>复杂报表</h3>
          <p>分组汇总、交叉表、导出打印</p>
          <span class="type-card-tag coming-soon">即将推出</span>
        </div>
      </div>
    </el-dialog>

    <!-- 编辑基本信息弹窗 -->
    <el-dialog
      v-model="editDialogVisible"
      title="编辑页面信息"
      width="440px"
      :close-on-click-modal="false"
      destroy-on-close
    >
      <el-form label-width="80px" :model="editingPage">
        <el-form-item label="页面名称" required>
          <el-input v-model="editName" placeholder="请输入页面名称" maxlength="50" />
        </el-form-item>
        <el-form-item label="页面类型">
          <el-tag :type="typeTagMap[editingPage?.type as PageType] || 'info'">
            {{ typeLabelMap[editingPage?.type as PageType] || editingPage?.type }}
          </el-tag>
        </el-form-item>
        <el-form-item label="当前状态">
          <el-tag :type="editingPage?.status === 'published' ? 'success' : 'info'" size="small">
            {{ editingPage?.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="editSaving" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" scoped>
.page-list-container {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.page-tabs {
  :deep(.el-tabs__header) {
    margin-bottom: 0;
  }
}

.search-input {
  margin-left: 8px;
}

.page-table {
  flex: 1;
}

.page-name {
  font-weight: 500;
  cursor: pointer;
  color: var(--el-color-primary);

  &:hover {
    text-decoration: underline;
  }
}

.type-cards {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.type-card {
  width: 180px;
  padding: 24px 16px;
  border: 2px solid var(--el-border-color);
  border-radius: 12px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    border-color: var(--el-color-primary);
    box-shadow: 0 4px 16px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.15);
    transform: translateY(-2px);
  }

  h3 {
    margin: 12px 0 8px;
    font-size: 15px;
    color: var(--el-text-color-primary);
  }

  p {
    margin: 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
    line-height: 1.5;
  }
}

.type-card-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;

  &.visualization {
    background: rgba(64, 158, 255, 0.1);
    color: #409eff;
  }

  &.form {
    background: rgba(103, 194, 58, 0.1);
    color: #67c23a;
  }

  &.report {
    background: rgba(230, 162, 60, 0.1);
    color: #e6a23c;
  }
}

.type-card-tag {
  display: inline-block;
  margin-top: 12px;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 11px;
  background: rgba(64, 158, 255, 0.1);
  color: #409eff;

  &.coming-soon {
    background: rgba(144, 147, 153, 0.1);
    color: #909399;
  }
}
</style>
