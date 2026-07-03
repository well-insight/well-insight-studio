<script lang="ts" setup>
import type { ApiPageItem, PageType } from '@/api/pages'
import type { ApiMenuNode } from '@/api/assembly'
import {
  ArrowLeft,
  DataLine,
  Delete,
  Document,
  EditPen,
  Folder,
  FolderAdd,
  Monitor,
  Plus,
  Search,
  Upload,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchPages } from '@/api/pages'
import { fetchApplication } from '@/api/application'
import { useAssemblyStore } from '@/stores/assemblyStore'

const route = useRoute()
const router = useRouter()
const assemblyStore = useAssemblyStore()

const appId = computed(() => route.params.id as string)
const appTitle = ref('')
const loading = ref(false)

// ========== 左侧：页面仓库 ==========
const searchKeyword = ref('')
const typeFilter = ref<PageType | 'all'>('all')
const availablePages = ref<ApiPageItem[]>([])

const typeLabelMap: Record<string, string> = {
  visualization: '可视化',
  form: '表单',
  report: '报表',
}

const typeTagMap: Record<string, '' | 'success' | 'warning'> = {
  visualization: '',
  form: 'success',
  report: 'warning',
}

const typeIconMap: Record<string, typeof Monitor> = {
  visualization: Monitor,
  form: EditPen,
  report: DataLine,
}

const filteredPages = computed(() => {
  let list = availablePages.value.filter(p => p.status === 'published')
  if (typeFilter.value !== 'all') {
    list = list.filter(p => p.type === typeFilter.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(kw))
  }
  return list
})

async function loadAvailablePages() {
  try {
    const result = await fetchPages({ status: 'published', pageSize: 200 })
    availablePages.value = result.items ?? []
  }
  catch (e) {
    console.error('加载可用页面失败:', e)
  }
}

// ========== 中间：菜单树 ==========
const selectedNode = ref<ApiMenuNode | null>(null)

interface TreeNode {
  id: string
  label: string
  isFolder: boolean
  pageType?: string
  children: TreeNode[]
  _raw: ApiMenuNode
}

function buildTreeNode(node: ApiMenuNode): TreeNode {
  return {
    id: node.id,
    label: node.menu_title,
    isFolder: node.isFolder,
    pageType: node.page?.type,
    children: (node.children || []).map(buildTreeNode),
    _raw: node,
  }
}

const treeData = computed<TreeNode[]>(() =>
  assemblyStore.menuTree.map(buildTreeNode),
)

const treeProps = {
  children: 'children',
  label: 'label',
}

function handleNodeClick(data: TreeNode) {
  selectedNode.value = data._raw
}

// 新建空目录
async function addFolder() {
  try {
    const { value: folderName } = await ElMessageBox.prompt('请输入目录名称', '新建目录', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      inputPattern: /\S+/,
      inputErrorMessage: '名称不能为空',
    })
    if (!folderName) return
    // 空目录 = 不关联 page_id 的菜单项（后端需支持，当前用特殊 page_id='__folder__'）
    await assemblyStore.addMenu({
      page_id: '__folder__',
      menu_title: folderName.trim(),
      menu_icon: null,
      route_path: null,
    })
    ElMessage.success('目录已创建')
  }
  catch { /* 取消 */ }
}

// 删除节点
async function removeNode(node: ApiMenuNode) {
  try {
    await ElMessageBox.confirm(
      node.isFolder ? `确定删除目录「${node.menu_title}」及其子菜单吗？` : `确定从菜单中移除「${node.menu_title}」吗？`,
      '确认操作',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  }
  catch { return }

  await assemblyStore.removeMenu(node.id)
  if (selectedNode.value?.id === node.id) {
    selectedNode.value = null
  }
  ElMessage.success('已移除')
}

// 菜单项被拖拽排序后（el-tree 内部拖拽）
async function handleNodeDrop(draggingNode: any, dropNode: any, dropType: string) {
  const flat: Array<{ id: string; parent_id: string | null; sort_order: number }> = []

  function walk(nodes: TreeNode[], parentId: string | null) {
    nodes.forEach((node, index) => {
      flat.push({ id: node.id, parent_id: parentId, sort_order: index })
      if (node.children?.length) {
        walk(node.children, node.id)
      }
    })
  }

  // 重新从 tree 获取数据构建排序
  // el-tree 拖拽后数据已更新，直接基于当前树数据
  const currentData = treeData.value
  // 由于 el-tree 内部已更新但我们的 treeData 是 computed，需要重新触发
  // 这里简单处理：等下重新 loadMenus 即可
  await loadMenuTree()
}

// ========== 右侧：配置面板 ==========
const editMenuTitle = ref('')
const editRoutePath = ref('')
const editMenuIcon = ref('')

function syncEditForm() {
  if (selectedNode.value) {
    editMenuTitle.value = selectedNode.value.menu_title
    editRoutePath.value = selectedNode.value.route_path || ''
    editMenuIcon.value = selectedNode.value.menu_icon || ''
  }
}

// 当选中节点变化时同步表单
const stopWatch = (() => {
  // 不采用 watch 以避免循环，直接在 select 时同步
})()

function selectNode(node: ApiMenuNode) {
  selectedNode.value = node
  syncEditForm()
}

async function saveMenuConfig() {
  if (!selectedNode.value) return
  try {
    await assemblyStore.updateMenu(selectedNode.value.id, {
      menu_title: editMenuTitle.value,
      route_path: editRoutePath.value || null,
      menu_icon: editMenuIcon.value || null,
    })
    ElMessage.success('菜单配置已更新')
  }
  catch (e) {
    ElMessage.error((e as Error).message || '保存失败')
  }
}

// ========== 拖拽（从左侧页面仓库拖到中间菜单树） ==========
function onDragStart(e: DragEvent, page: ApiPageItem) {
  e.dataTransfer!.setData('application/json', JSON.stringify({
    pageId: page.id,
    pageName: page.name,
    pageType: page.type,
  }))
  e.dataTransfer!.effectAllowed = 'copy'
}

async function onTreeDrop(e: DragEvent) {
  e.preventDefault()
  const raw = e.dataTransfer!.getData('application/json')
  if (!raw) return

  let dragData: { pageId: string; pageName: string; pageType: string }
  try {
    dragData = JSON.parse(raw)
  }
  catch { return }

  try {
    await assemblyStore.addMenu({
      page_id: dragData.pageId,
      menu_title: dragData.pageName,
      route_path: `/${dragData.pageType}/${dragData.pageId.substring(0, 8)}`,
      menu_icon: null,
    })
    ElMessage.success(`已添加页面: ${dragData.pageName}`)
  }
  catch (e) {
    ElMessage.error((e as Error).message || '添加失败')
  }
}

// ========== 加载与生命周期 ==========
async function loadAppInfo() {
  try {
    const detail = await fetchApplication(appId.value)
    appTitle.value = detail.title
  }
  catch { /* ignore */ }
}

async function loadMenuTree() {
  await assemblyStore.loadMenus(appId.value)
}

function goBack() {
  router.push({ name: 'AppAssemblyList' })
}

async function handlePublish() {
  try {
    await assemblyStore.publish()
    ElMessage.success('应用发布成功！')
  }
  catch (e) {
    ElMessage.error((e as Error).message || '发布失败')
  }
}

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([loadAppInfo(), loadAvailablePages(), loadMenuTree()])
  }
  finally {
    loading.value = false
  }
})

onBeforeUnmount(() => {
  assemblyStore.reset()
})
</script>

<template>
  <div v-loading="loading" class="assembly-editor" element-loading-text="加载应用数据…">
    <!-- 顶部工具栏 -->
    <div class="assembly-toolbar">
      <div class="toolbar-left">
        <el-button text @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <el-divider direction="vertical" />
        <span class="app-title">{{ appTitle || '未命名应用' }}</span>
        <el-tag size="small" type="info" style="margin-left: 8px">组装模式</el-tag>
      </div>
      <div class="toolbar-right">
        <el-button type="primary" @click="handlePublish">
          <el-icon><Upload /></el-icon>
          发布应用
        </el-button>
      </div>
    </div>

    <!-- 三栏布局 -->
    <div class="assembly-body">
      <!-- 左：页面仓库 -->
      <div class="page-repo">
        <div class="repo-header">
          <span class="repo-title">页面仓库</span>
          <span class="repo-hint">拖拽到右侧菜单树</span>
        </div>
        <div class="repo-filters">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索页面..."
            :prefix-icon="Search"
            clearable
            size="small"
          />
          <el-select v-model="typeFilter" size="small" style="width: 100%">
            <el-option label="全部类型" value="all" />
            <el-option label="可视化大屏" value="visualization" />
            <el-option label="表单管理" value="form" />
            <el-option label="复杂报表" value="report" />
          </el-select>
        </div>
        <div class="page-list">
          <div
            v-for="page in filteredPages"
            :key="page.id"
            class="page-item"
            draggable="true"
            @dragstart="onDragStart($event, page)"
          >
            <el-icon :size="18">
              <component :is="typeIconMap[page.type] || Document" />
            </el-icon>
            <span class="page-item-name">{{ page.name }}</span>
            <el-tag size="small" :type="typeTagMap[page.type] || 'info'">
              {{ typeLabelMap[page.type] || page.type }}
            </el-tag>
          </div>
          <el-empty
            v-if="filteredPages.length === 0"
            description="暂无已发布的页面"
            :image-size="60"
          />
        </div>
      </div>

      <!-- 中：菜单树组装区 -->
      <div class="menu-tree-area">
        <div class="tree-header">
          <span>菜单结构</span>
          <el-button size="small" :icon="FolderAdd" @click="addFolder">
            新建目录
          </el-button>
        </div>
        <div class="tree-container" @dragover.prevent @drop="onTreeDrop">
          <el-empty
            v-if="treeData.length === 0"
            description="从左侧拖拽页面到此处，或点击上方新建目录"
            :image-size="80"
          />
          <el-tree
            v-else
            ref="treeRef"
            :data="treeData"
            :props="treeProps"
            node-key="id"
            default-expand-all
            draggable
            highlight-current
            :allow-drop="() => true"
            :allow-drag="() => true"
            @node-click="handleNodeClick"
            @node-drop="handleNodeDrop"
          >
            <template #default="{ data }">
              <div class="tree-node-content">
                <el-icon v-if="data.isFolder" style="color: var(--el-color-warning)">
                  <Folder />
                </el-icon>
                <el-icon v-else style="color: var(--el-color-primary)">
                  <Document />
                </el-icon>
                <span class="tree-node-label">{{ data.label }}</span>
                <el-tag
                  v-if="data.pageType && !data.isFolder"
                  size="small"
                  :type="typeTagMap[data.pageType] || 'info'"
                  class="tree-node-tag"
                >
                  {{ typeLabelMap[data.pageType] || data.pageType }}
                </el-tag>
                <el-button
                  link
                  type="danger"
                  :icon="Delete"
                  size="small"
                  class="tree-node-delete"
                  @click.stop="removeNode(data._raw)"
                />
              </div>
            </template>
          </el-tree>
        </div>
      </div>

      <!-- 右：配置面板 -->
      <div class="config-panel">
        <template v-if="selectedNode">
          <div class="panel-header">
            <h4>菜单配置</h4>
          </div>
          <div class="panel-body">
            <el-form label-width="72px" size="small">
              <el-form-item label="显示名称">
                <el-input v-model="editMenuTitle" @change="saveMenuConfig" />
              </el-form-item>
              <el-form-item label="路由路径">
                <el-input v-model="editRoutePath" @change="saveMenuConfig">
                  <template #prepend>/</template>
                </el-input>
              </el-form-item>
              <el-form-item label="图标名称">
                <el-input v-model="editMenuIcon" placeholder="Element Plus 图标名" @change="saveMenuConfig" />
              </el-form-item>
            </el-form>
            <el-divider />
            <div class="panel-info">
              <p v-if="selectedNode.page">
                <strong>关联页面：</strong>{{ selectedNode.page.name }}
              </p>
              <p v-if="selectedNode.page">
                <strong>页面类型：</strong>{{ typeLabelMap[selectedNode.page.type] || selectedNode.page.type }}
              </p>
            </div>
            <el-divider />
            <el-button type="danger" size="small" @click="removeNode(selectedNode)">
              <el-icon><Delete /></el-icon>
              从菜单移除
            </el-button>
          </div>
        </template>
        <div v-else class="panel-empty">
          <el-empty description="点击菜单节点进行配置" :image-size="80" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.assembly-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--el-bg-color-page, #f5f7fa);
}

// ===== 工具栏 =====
.assembly-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  padding: 0 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.toolbar-left {
  display: flex;
  align-items: center;
  gap: 4px;
}

.app-title {
  font-size: 16px;
  font-weight: 600;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

// ===== 三栏主体 =====
.assembly-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

// ===== 左侧页面仓库 =====
.page-repo {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
}

.repo-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 4px;
}

.repo-title {
  font-size: 14px;
  font-weight: 600;
}

.repo-hint {
  font-size: 11px;
  color: var(--el-text-color-placeholder);
}

.repo-filters {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 12px 8px;
}

.page-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
}

.page-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  margin-bottom: 4px;
  border-radius: 6px;
  cursor: grab;
  transition: background 0.2s;
  border: 1px solid transparent;

  &:hover {
    background: var(--el-fill-color-light);
    border-color: var(--el-border-color);
  }

  &:active {
    cursor: grabbing;
  }
}

.page-item-name {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// ===== 中间菜单树 =====
.menu-tree-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--el-bg-color);
}

.tree-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 8px;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.tree-container {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}

.tree-node-content {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}

.tree-node-label {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tree-node-tag {
  flex-shrink: 0;
}

.tree-node-delete {
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.tree-node-content:hover .tree-node-delete {
  opacity: 1;
}

// ===== 右侧配置面板 =====
.config-panel {
  width: 280px;
  flex-shrink: 0;
  border-left: 1px solid var(--el-border-color-light);
  background: var(--el-bg-color);
  display: flex;
  flex-direction: column;
}

.panel-header {
  padding: 12px 16px 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);

  h4 {
    margin: 0;
    font-size: 14px;
  }
}

.panel-body {
  padding: 16px;
  overflow-y: auto;
}

.panel-info {
  font-size: 13px;
  color: var(--el-text-color-regular);

  p {
    margin: 4px 0;
  }
}

.panel-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
