<script lang="ts" setup>
import type { PageType, ApiPageListItem } from '@/api/pages'
import type { MenuTreeNode } from '@/api/assembly'
import { ArrowLeft, Upload, Folder, Document, Plus, Monitor, EditPen as EditPenIcon, DataLine } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchApplication, updateApplication } from '@/api/application'
import { fetchPageList } from '@/api/pages'
import { useAssemblyStore } from '@/stores/assemblyStore'

const route = useRoute()
const router = useRouter()
const assemblyStore = useAssemblyStore()

const appId = computed(() => route.params.id as string)
const appInfo = ref({ title: '' })
const searchKeyword = ref('')
const typeFilter = ref<'all' | PageType>('all')
const selectedNode = ref<MenuTreeNode | null>(null)
const availablePages = ref<ApiPageListItem[]>([])
const menuTree = ref<MenuTreeNode[]>([])

// 编辑状态
const editMenuTitle = ref('')
const editRoutePath = ref('')
const editMenuIcon = ref('')
const editPermission = ref('')

const typeLabels: Record<string, string> = {
  visualization: '可视化',
  form: '表单',
  report: '报表',
}

const typeColors: Record<string, string> = {
  visualization: '',
  form: 'success',
  report: 'warning',
}

const typeIcons: Record<string, any> = {
  visualization: Monitor,
  form: EditPenIcon,
  report: DataLine,
}

const filteredPages = computed(() => {
  let list = availablePages.value
  if (typeFilter.value !== 'all') {
    list = list.filter(p => p.type === typeFilter.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(kw))
  }
  return list
})

async function loadAppInfo() {
  try {
    const detail = await fetchApplication(appId.value)
    appInfo.value = { title: detail.title }
  }
  catch {
    ElMessage.error('应用不存在')
    router.push({ name: 'AppAssembly' })
  }
}

async function loadAvailablePages() {
  try {
    const result = await fetchPageList({ status: 'published' })
    availablePages.value = result.items
  }
  catch (e) {
    console.error('加载页面列表失败', e)
  }
}

async function loadMenuTree() {
  try {
    menuTree.value = await assemblyStore.loadMenus(appId.value)
  }
  catch (e) {
    ElMessage.error('加载菜单树失败')
  }
}

onMounted(async () => {
  await loadAppInfo()
  await Promise.all([loadAvailablePages(), loadMenuTree()])
})

/** 拖拽开始 */
function onDragStart(e: DragEvent, page: ApiPageListItem) {
  e.dataTransfer?.setData('pageId', page.id)
  e.dataTransfer?.setData('pageName', page.name)
  e.dataTransfer?.setData('pageType', page.type)
}

/** 拖拽放置到菜单树区域 */
async function onDrop(e: DragEvent) {
  const pageId = e.dataTransfer?.getData('pageId')
  const pageName = e.dataTransfer?.getData('pageName')
  if (!pageId || !pageName) return

  try {
    await assemblyStore.addMenu({
      application_id: appId.value,
      page_id: pageId,
      menu_title: pageName,
      route_path: `/${String(pageName).toLowerCase().replace(/\s+/g, '-')}-${pageId.substring(0, 8)}`,
    })
    await loadMenuTree()
    ElMessage.success(`已添加页面: ${pageName}`)
  }
  catch (e) {
    ElMessage.error((e as Error).message || '添加失败')
  }
}

/** 展开/折叠树节点 */
const expandedKeys = ref<string[]>([])

function toggleExpand(id: string) {
  const idx = expandedKeys.value.indexOf(id)
  if (idx >= 0) {
    expandedKeys.value.splice(idx, 1)
  }
  else {
    expandedKeys.value.push(id)
  }
}

/** 选择节点进行编辑 */
function selectNode(node: MenuTreeNode) {
  selectedNode.value = node
  editMenuTitle.value = node.menu_title
  editRoutePath.value = node.route_path || ''
  editMenuIcon.value = node.menu_icon || ''
  editPermission.value = node.permission || ''
}

/** 保存菜单编辑 */
async function saveMenuEdit() {
  if (!selectedNode.value) return
  try {
    await assemblyStore.editMenu(appId.value, selectedNode.value.id, {
      menu_title: editMenuTitle.value,
      route_path: editRoutePath.value || null,
      menu_icon: editMenuIcon.value || null,
      permission: editPermission.value || null,
    })
    await loadMenuTree()
    ElMessage.success('菜单已更新')
  }
  catch (e) {
    ElMessage.error((e as Error).message || '更新失败')
  }
}

/** 从菜单移除 */
async function removeFromMenu(menuId: string) {
  try {
    await ElMessageBox.confirm('确定从菜单中移除此项吗？（不会删除原页面）', '确认', {
      type: 'warning', confirmButtonText: '移除', cancelButtonText: '取消',
    })
  }
  catch { return }
  try {
    await assemblyStore.deleteMenu(appId.value, menuId)
    await loadMenuTree()
    selectedNode.value = null
    ElMessage.success('已从菜单移除')
  }
  catch (e) {
    ElMessage.error((e as Error).message || '移除失败')
  }
}

/** 添加空目录 */
async function addFolder() {
  try {
    await assemblyStore.addMenu({
      application_id: appId.value,
      menu_title: '新建目录',
    })
    await loadMenuTree()
  }
  catch (e) {
    ElMessage.error((e as Error).message || '创建目录失败')
  }
}

/** 发布应用 */
async function handlePublish() {
  try {
    const result = await assemblyStore.publish(appId.value)
    ElMessage.success(`应用发布成功！菜单数: ${result.menu_count}`)
  }
  catch (e) {
    ElMessage.error((e as Error).message || '发布失败')
  }
}

</script>

<template>
  <div class="assembly-editor h-full w-full flex flex-col">
    <!-- 顶部工具栏 -->
    <div class="assembly-toolbar flex h-[50px] items-center gap-3 border-bottom-1 bg-white px-3 shrink-0">
      <el-button text :icon="ArrowLeft" @click="router.push({ name: 'AppAssembly' })">
        返回
      </el-button>
      <span class="font-medium">{{ appInfo.title }} - 应用组装</span>
      <span class="text-xs text-gray-400">将独立页面拖拽到右侧菜单树进行组装</span>
      <div class="ml-auto">
        <el-button type="primary" :icon="Upload" @click="handlePublish">
          发布应用
        </el-button>
      </div>
    </div>

    <!-- 三栏主体 -->
    <div class="assembly-body flex flex-1 overflow-hidden">
      <!-- 左侧：页面仓库 -->
      <div class="page-repo w-[280px] border-end-1 flex flex-col shrink-0">
        <div class="p-3 border-bottom-1 space-y-2">
          <el-input
            v-model="searchKeyword"
            placeholder="搜索页面..."
            size="small"
            clearable
          />
          <el-select v-model="typeFilter" size="small" class="w-full">
            <el-option label="全部类型" value="all" />
            <el-option label="可视化" value="visualization" />
            <el-option label="表单" value="form" />
            <el-option label="报表" value="report" />
          </el-select>
          <div class="text-xs text-gray-400">
            {{ filteredPages.length }} 个已发布页面
          </div>
        </div>
        <div class="flex-1 overflow-y-auto p-2 space-y-1">
          <div
            v-for="page in filteredPages"
            :key="page.id"
            class="page-item flex items-center gap-2 px-3 py-2 rounded cursor-grab hover:bg-blue-50 border border-transparent hover:border-blue-200"
            draggable="true"
            @dragstart="onDragStart($event, page)"
          >
            <el-icon :size="18" :color="page.type === 'visualization' ? '#409EFF' : page.type === 'form' ? '#67C23A' : '#E6A23C'">
              <component :is="typeIcons[page.type]" />
            </el-icon>
            <span class="flex-1 truncate text-sm">{{ page.name }}</span>
            <el-tag :type="typeColors[page.type] as any" size="small">
              {{ typeLabels[page.type] }}
            </el-tag>
          </div>
          <el-empty v-if="filteredPages.length === 0" description="暂无已发布的页面" :image-size="80" />
        </div>
      </div>

      <!-- 中间：菜单树组装区 -->
      <div class="menu-tree-area flex-1 flex flex-col" @dragover.prevent @drop="onDrop">
        <div class="flex items-center justify-between px-3 py-2 border-bottom-1 bg-gray-50">
          <span class="text-sm font-medium">菜单结构</span>
          <el-button size="small" :icon="Plus" @click="addFolder">
            新建目录
          </el-button>
        </div>
        <div class="flex-1 overflow-y-auto p-2">
          <div v-if="menuTree.length === 0" class="flex items-center justify-center h-full">
            <div class="text-center text-gray-400">
              <el-icon :size="40"><Folder /></el-icon>
              <p class="mt-2">拖拽左侧页面到此处构建菜单</p>
            </div>
          </div>
          <div v-else>
            <div v-for="node in menuTree" :key="node.id">
              <div :style="{ paddingLeft: '12px' }">
                <div
                  class="tree-node flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-gray-100"
                  :class="selectedNode?.id === node.id ? 'bg-blue-50 text-blue-600' : ''"
                  @click="selectNode(node)"
                >
                  <el-icon><Folder v-if="node.isFolder" /><Document v-else /></el-icon>
                  <span class="flex-1 truncate">{{ node.menu_title }}</span>
                  <el-tag v-if="node.page" :type="typeColors[node.page.type] as any" size="small">
                    {{ typeLabels[node.page.type] }}
                  </el-tag>
                </div>
              </div>
              <!-- 子节点递归 -->
              <template v-for="child in node.children" :key="child.id">
                <div :style="{ paddingLeft: '32px' }">
                  <div
                    class="tree-node flex items-center gap-2 px-3 py-2 rounded cursor-pointer hover:bg-gray-100"
                    :class="selectedNode?.id === child.id ? 'bg-blue-50 text-blue-600' : ''"
                    @click="selectNode(child)"
                  >
                    <el-icon><Document /></el-icon>
                    <span class="flex-1 truncate">{{ child.menu_title }}</span>
                    <el-tag v-if="child.page" :type="typeColors[child.page.type] as any" size="small">
                      {{ typeLabels[child.page.type] }}
                    </el-tag>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：配置面板 -->
      <div class="config-panel w-[320px] border-start-1 flex flex-col shrink-0">
        <div v-if="selectedNode" class="p-4 space-y-4">
          <h4 class="text-sm font-medium">菜单配置</h4>
          <el-form label-width="80px" size="small">
            <el-form-item label="显示名称">
              <el-input v-model="editMenuTitle" @change="saveMenuEdit" />
            </el-form-item>
            <el-form-item label="路由路径">
              <el-input v-model="editRoutePath" @change="saveMenuEdit">
                <template #prepend>/</template>
              </el-input>
            </el-form-item>
            <el-form-item label="菜单图标">
              <el-input v-model="editMenuIcon" placeholder="图标名称" @change="saveMenuEdit" />
            </el-form-item>
            <el-form-item label="权限标识">
              <el-input v-model="editPermission" placeholder="如: admin" @change="saveMenuEdit" />
            </el-form-item>
          </el-form>
          <el-divider />
          <div class="space-y-2">
            <div class="text-xs text-gray-400">
              关联页面：
              <el-tag v-if="selectedNode.page" :type="typeColors[selectedNode.page.type] as any" size="small">
                {{ selectedNode.page.name }} ({{ typeLabels[selectedNode.page.type] }})
              </el-tag>
              <span v-else class="text-gray-300">无（目录节点）</span>
            </div>
            <el-button type="danger" size="small" @click="removeFromMenu(selectedNode.id)">
              从菜单移除
            </el-button>
          </div>
        </div>
        <div v-else class="flex items-center justify-center flex-1">
          <el-empty description="点击菜单节点进行配置" :image-size="80" />
        </div>
      </div>
    </div>
  </div>
</template>
