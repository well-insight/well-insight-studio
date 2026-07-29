<script setup lang="ts">
import type { ElTree } from 'element-plus'
import type {
  ApiDatasetListItem,
  ApiFolderTreeNode,
} from '@/api/dataset'
import {
  Edit,
  EditPen,
  Folder,
  FolderOpened,
  MoreFilled,
  Plus,
  Tickets,
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, nextTick, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  createDataset,
  createDatasetFolder,
  deleteDataset,
  deleteDatasetFolder,
  fetchAllDatasets,
  fetchDatasetFolderDetail,
  fetchDatasetFolderTree,
  updateDataset,
  updateDatasetFolder,
} from '@/api/dataset'
import { AdaptiveDialog } from '@/components/adaptive-dialog'
import DatasetTable from './DatasetTable.vue'

interface DatasetTreeNode {
  id: string
  label: string
  type: 'all' | 'folder' | 'dataset'
  folderId?: string
  dataset?: ApiDatasetListItem
  description?: string | null
  parentFolderId?: string | null
  children?: DatasetTreeNode[]
}

const router = useRouter()

const treeProps = { children: 'children', label: 'label' }
const treeRef = ref<InstanceType<typeof ElTree> | null>(null)
const datasetTableRef = ref<InstanceType<typeof DatasetTable> | null>(null)

const treeLoading = ref(false)
const listLoading = ref(false)
const folderRoots = ref<ApiFolderTreeNode[]>([])
const allDatasets = ref<ApiDatasetListItem[]>([])

/** 当前选中的目录：全部，或某个 folder id */
const selectedFolderId = ref<string | 'all'>('all')
const selectedDatasetId = ref<string | null>(null)
const canAddDatasetRow = ref(false)

const contextFolderId = ref<string | null>(null)

const treeRenderKey = ref(0)
/** 目录行「更多」下拉展开时保持显示触发图标（菜单 teleport 到 body 会离开行悬停） */
const folderDropdownOpenNodeId = ref<string | null>(null)

const folderDialogVisible = ref(false)
const folderName = ref('')
const folderSubmitting = ref(false)

const folderEditVisible = ref(false)
const folderEditId = ref<string | null>(null)
const folderEditName = ref('')
const folderEditDesc = ref('')
const folderEditParentId = ref<string | null>(null)
const folderEditSubmitting = ref(false)

const datasetDialogVisible = ref(false)
const datasetName = ref('')
const datasetDesc = ref('')
const datasetSubmitting = ref(false)

const editVisible = ref(false)
const editSubmitting = ref(false)
const editId = ref<string | null>(null)
const editName = ref('')
const editDesc = ref('')
const editFolderId = ref<string | null>(null)

function mapDatasetsToNodes(folderId: string | null): DatasetTreeNode[] {
  return allDatasets.value
    .filter(dataset => dataset.folder_id === folderId)
    .sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    .map(dataset => ({
      id: `dataset-${dataset.id}`,
      label: dataset.name,
      type: 'dataset' as const,
      dataset,
    }))
}

function mapFoldersToNodes(folders: ApiFolderTreeNode[]): DatasetTreeNode[] {
  return folders.map(f => ({
    id: `folder-${f.id}`,
    label: f.name,
    type: 'folder' as const,
    folderId: f.id,
    description: f.description,
    parentFolderId: f.parent_id ?? null,
    children: [...mapFoldersToNodes(f.children || []), ...mapDatasetsToNodes(f.id)],
  }))
}

const treeData = computed<DatasetTreeNode[]>(() => [
  {
    id: '__all__',
    label: '全部',
    type: 'all',
    children: [...mapFoldersToNodes(folderRoots.value), ...mapDatasetsToNodes(null)],
  },
])

const selectedDataset = computed(() =>
  allDatasets.value.find(dataset => dataset.id === selectedDatasetId.value) ?? null,
)

function flattenFolderOptions(
  folders: ApiFolderTreeNode[],
  prefix = '',
): { label: string, value: string }[] {
  const out: { label: string, value: string }[] = []
  for (const f of folders) {
    out.push({ label: `${prefix}${f.name}`, value: f.id })
    if (f.children?.length) {
      out.push(...flattenFolderOptions(f.children, `${prefix}　`))
    }
  }
  return out
}

const folderSelectOptions = computed(() =>
  flattenFolderOptions(folderRoots.value),
)

/** 从根到该文件夹的名称路径（不含「全部」） */
function folderPathSegments(
  folders: ApiFolderTreeNode[],
  targetId: string,
  chain: string[] = [],
): string[] | null {
  for (const f of folders) {
    const next = [...chain, f.name]
    if (f.id === targetId)
      return next
    if (f.children?.length) {
      const found = folderPathSegments(f.children, targetId, next)
      if (found)
        return found
    }
  }
  return null
}

const folderDialogParentPath = computed(() => {
  const pid = contextFolderId.value
  if (pid == null)
    return '根级'
  const segs = folderPathSegments(folderRoots.value, pid)
  return segs?.join(' / ') ?? '（未知目录）'
})

function findFolderInApiTree(
  folders: ApiFolderTreeNode[],
  id: string,
): ApiFolderTreeNode | null {
  for (const f of folders) {
    if (f.id === id)
      return f
    if (f.children?.length) {
      const x = findFolderInApiTree(f.children, id)
      if (x)
        return x
    }
  }
  return null
}

function collectDescendantFolderIds(root: ApiFolderTreeNode): Set<string> {
  const s = new Set<string>()
  const walk = (n: ApiFolderTreeNode) => {
    s.add(n.id)
    for (const c of n.children || []) walk(c)
  }
  walk(root)
  return s
}

/** 编辑目录时可选的父级（排除自身及子孙，避免循环） */
const folderEditParentOptions = computed(() => {
  const flat = flattenFolderOptions(folderRoots.value)
  const fid = folderEditId.value
  if (fid == null)
    return flat
  const node = findFolderInApiTree(folderRoots.value, fid)
  const blocked = node
    ? collectDescendantFolderIds(node)
    : new Set<string>([fid])
  return flat.filter(o => !blocked.has(o.value))
})

function syncTreeCurrentNode() {
  const key = selectedDatasetId.value != null
    ? `dataset-${selectedDatasetId.value}`
    : selectedFolderId.value === 'all'
      ? '__all__'
      : `folder-${selectedFolderId.value}`
  treeRef.value?.setCurrentKey(key)
}

async function loadData() {
  treeLoading.value = true
  listLoading.value = true
  try {
    const [trees, datasets] = await Promise.all([
      fetchDatasetFolderTree(),
      fetchAllDatasets(),
    ])
    folderRoots.value = Array.isArray(trees) ? trees : []
    allDatasets.value = Array.isArray(datasets) ? datasets : []
    if (selectedDatasetId.value != null && !allDatasets.value.some(dataset => dataset.id === selectedDatasetId.value)) {
      selectedDatasetId.value = null
    }
    treeRenderKey.value += 1
    await nextTick()
    syncTreeCurrentNode()
  }
  catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '加载失败')
    folderRoots.value = []
    allDatasets.value = []
  }
  finally {
    treeLoading.value = false
    listLoading.value = false
  }
}

function onFolderDropdownVisible(visible: boolean, data: DatasetTreeNode) {
  folderDropdownOpenNodeId.value
    = visible && data.type !== 'all' ? data.id : null
}

function onFolderMenuCommand(cmd: string, data: DatasetTreeNode) {
  if (data.type === 'folder') {
    if (cmd === 'edit')
      void openFolderEdit(data)
    else if (cmd === 'delete')
      void confirmDeleteFolder(data)
    return
  }
  if (data.type === 'dataset' && data.dataset != null) {
    if (cmd === 'edit')
      openEdit(data.dataset)
    else if (cmd === 'design')
      designDatasetForm(data.dataset.id)
    else if (cmd === 'delete')
      void confirmDelete(data.dataset)
  }
}

function handleFolderTreeClick(data: DatasetTreeNode) {
  if (data.type === 'dataset' && data.dataset != null) {
    selectedDatasetId.value = data.dataset.id
    selectedFolderId.value = data.dataset.folder_id ?? 'all'
    contextFolderId.value = data.dataset.folder_id ?? null
    return
  }
  selectedDatasetId.value = null
  canAddDatasetRow.value = false
  if (data.type === 'all') {
    selectedFolderId.value = 'all'
    contextFolderId.value = null
  }
  else {
    selectedFolderId.value = data.folderId!
    contextFolderId.value = data.folderId ?? null
  }
}

function openFolderDialog() {
  folderName.value = ''
  folderDialogVisible.value = true
}

async function submitFolder() {
  const name = folderName.value.trim()
  if (!name) {
    ElMessage.warning('请输入目录名称')
    return
  }
  folderSubmitting.value = true
  try {
    await createDatasetFolder({
      name,
      parent_id: contextFolderId.value,
      project_id: null,
    })
    ElMessage.success('目录已创建')
    folderDialogVisible.value = false
    await loadData()
    await nextTick()
    treeRef.value?.setCurrentKey(
      selectedFolderId.value === 'all'
        ? '__all__'
        : `folder-${selectedFolderId.value}`,
    )
  }
  catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '创建失败')
  }
  finally {
    folderSubmitting.value = false
  }
}

async function openFolderEdit(data: DatasetTreeNode) {
  if (data.type !== 'folder' || data.folderId == null)
    return
  folderEditId.value = data.folderId
  folderEditName.value = data.label
  folderEditDesc.value = data.description?.trim() ?? ''
  folderEditParentId.value = data.parentFolderId ?? null
  folderEditVisible.value = true
  try {
    const detail = await fetchDatasetFolderDetail(data.folderId)
    folderEditName.value = detail.name
    folderEditDesc.value = detail.description?.trim() ?? ''
    folderEditParentId.value = detail.parent_id ?? null
  }
  catch {
    /* 使用树上已有信息 */
  }
}

async function submitFolderEdit() {
  const id = folderEditId.value
  if (id == null)
    return
  const name = folderEditName.value.trim()
  if (!name) {
    ElMessage.warning('请输入目录名称')
    return
  }
  folderEditSubmitting.value = true
  try {
    await updateDatasetFolder(id, {
      name,
      description: folderEditDesc.value.trim() || null,
      parent_id: folderEditParentId.value ?? null,
    })
    ElMessage.success('已保存')
    folderEditVisible.value = false
    await loadData()
    await nextTick()
    treeRef.value?.setCurrentKey(
      selectedFolderId.value === 'all'
        ? '__all__'
        : `folder-${selectedFolderId.value}`,
    )
  }
  catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  }
  finally {
    folderEditSubmitting.value = false
  }
}

async function confirmDeleteFolder(data: DatasetTreeNode) {
  if (data.type !== 'folder' || data.folderId == null)
    return
  try {
    await ElMessageBox.confirm(
      `确定删除目录「${data.label}」吗？仅空目录可删除；若内含子目录或数据集请先清理。`,
      '删除目录',
      { type: 'warning', confirmButtonText: '删除', cancelButtonText: '取消' },
    )
  }
  catch {
    return
  }
  try {
    await deleteDatasetFolder(data.folderId)
    ElMessage.success('已删除')
    if (selectedFolderId.value === data.folderId) {
      selectedFolderId.value = 'all'
      contextFolderId.value = null
    }
    if (contextFolderId.value === data.folderId) {
      contextFolderId.value = null
    }
    await loadData()
    await nextTick()
    treeRef.value?.setCurrentKey('__all__')
  }
  catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '删除失败')
  }
}

function openDatasetDialog() {
  datasetName.value = ''
  datasetDesc.value = ''
  datasetDialogVisible.value = true
}

async function submitDataset() {
  const name = datasetName.value.trim()
  if (!name) {
    ElMessage.warning('请输入数据集名称')
    return
  }
  const folder_id = selectedFolderId.value === 'all' ? null : selectedFolderId.value
  datasetSubmitting.value = true
  try {
    const created = await createDataset({
      name,
      description: datasetDesc.value.trim() || null,
      folder_id,
      project_id: null,
      fields: [],
    })
    ElMessage.success('数据集已创建，请设计表单字段')
    datasetDialogVisible.value = false
    router.push({ name: 'DatasetFormEditor', params: { id: created.id } })
  }
  catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '创建失败')
  }
  finally {
    datasetSubmitting.value = false
  }
}

function designDatasetForm(id: string) {
  router.push({ name: 'DatasetFormEditor', params: { id } })
}

function openDatasetRowCreator() {
  datasetTableRef.value?.openCreateRow()
}

function onAddRowStateChange(payload: { canAdd: boolean }) {
  canAddDatasetRow.value = payload.canAdd
}

function openEdit(ds: ApiDatasetListItem) {
  editId.value = ds.id
  editName.value = ds.name
  editDesc.value = ds.description ?? ''
  editFolderId.value = ds.folder_id
  editVisible.value = true
}

async function submitEdit() {
  const id = editId.value
  if (id == null)
    return
  const name = editName.value.trim()
  if (!name) {
    ElMessage.warning('请输入名称')
    return
  }
  editSubmitting.value = true
  try {
    await updateDataset(id, {
      name,
      description: editDesc.value.trim() || null,
      folder_id: editFolderId.value ?? null,
    })
    ElMessage.success('已保存')
    editVisible.value = false
    await loadData()
  }
  catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '保存失败')
  }
  finally {
    editSubmitting.value = false
  }
}

async function confirmDelete(ds: ApiDatasetListItem) {
  try {
    await ElMessageBox.confirm(
      `确定删除数据集「${ds.name}」吗？此操作不可恢复。`,
      '删除确认',
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
  try {
    await deleteDataset(ds.id)
    ElMessage.success('已删除')
    if (selectedDatasetId.value === ds.id) {
      selectedDatasetId.value = null
      canAddDatasetRow.value = false
    }
    await loadData()
  }
  catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '删除失败')
  }
}

onMounted(async () => {
  await loadData()
})
</script>

<template>
  <div :class="$style.manager">
    <!-- 左侧：目录 -->
    <aside :class="$style.sidebar">
      <div :class="$style.sidebarHeader">
        <h3 :class="$style.sidebarTitle">
          目录
        </h3>
        <el-button :icon="Plus" plain type="primary" @click="openFolderDialog">
          新建目录
        </el-button>
      </div>
      <div v-loading="treeLoading" :class="$style.treeWrap">
        <el-tree
          :key="treeRenderKey"
          ref="treeRef"
          class="custom-el-tree-wrapper"
          :data="treeData"
          :props="treeProps"
          node-key="id"
          highlight-current
          default-expand-all
          :expand-on-click-node="false"
          @node-click="handleFolderTreeClick"
        >
          <template #default="{ node, data }">
            <div :class="$style.treeRow">
              <div class="flex items-center gap-2 py-1 min-w-0 flex-1">
                <template v-if="data.type === 'all' || data.type === 'folder'">
                  <el-icon v-if="data.type === 'all' || node.expanded" :size="18">
                    <FolderOpened />
                  </el-icon>
                  <el-icon v-else :size="18">
                    <Folder />
                  </el-icon>
                </template>
                <el-icon v-else :size="18">
                  <Tickets />
                </el-icon>
                <span class="truncate">{{ node.label }}</span>
              </div>
              <div
                v-if="data.type !== 'all'"
                :class="[
                  $style.treeRowActions,
                  folderDropdownOpenNodeId === data.id
                    ? $style.treeRowActionsVisible
                    : '',
                ]"
                @click.stop
              >
                <el-dropdown
                  trigger="hover"
                  @visible-change="(v) => onFolderDropdownVisible(v, data)"
                  @command="(cmd) => onFolderMenuCommand(String(cmd), data)"
                >
                  <span :class="$style.treeRowMoreTrigger" @click.stop>
                    <el-icon :size="18">
                      <MoreFilled />
                    </el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-if="data.type === 'folder'" command="edit">
                        编辑目录
                      </el-dropdown-item>
                      <el-dropdown-item v-if="data.type === 'dataset'" command="edit">
                        编辑数据集信息
                      </el-dropdown-item>
                      <el-dropdown-item v-if="data.type === 'dataset'" command="design">
                        设计表单
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        {{ data.type === 'folder' ? '删除目录' : '删除数据集' }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </template>
        </el-tree>
      </div>
    </aside>

    <!-- 右侧：数据集记录 -->
    <main :class="$style.main">
      <header :class="$style.pageHeader">
        <div class="min-w-0">
          <h2 :class="$style.pageTitle">
            {{ selectedDataset?.name || '数据集' }}
          </h2>
          <p :class="$style.pageSubtitle">
            {{ selectedDataset ? `字段 ${selectedDataset.field_count}，记录 ${selectedDataset.row_count} 条` : '请选择一个数据集进入记录表' }}
          </p>
        </div>
        <div :class="$style.pageActions">
          <el-button type="primary" :icon="Plus" @click="openDatasetDialog">
            新增数据集
          </el-button>
          <el-button type="primary" :icon="Plus" :disabled="!canAddDatasetRow" @click="openDatasetRowCreator">
            新增记录
          </el-button>
          <el-button type="primary" :icon="EditPen" :disabled="!selectedDataset" @click="selectedDataset && designDatasetForm(selectedDataset.id)">
            设计表单
          </el-button>
          <el-button :icon="Edit" :disabled="!selectedDataset" @click="selectedDataset && openEdit(selectedDataset)">
            编辑信息
          </el-button>
        </div>
      </header>

      <div v-loading="listLoading" :class="$style.tableArea">
        <el-empty
          v-if="!selectedDatasetId"
          :class="$style.empty"
          :description="allDatasets.length === 0 ? '暂无数据集' : '请从左侧选择一个数据集'"
          :image-size="96"
        >
          <el-button
            v-if="allDatasets.length === 0"
            type="primary"
            :icon="Plus"
            @click="openDatasetDialog"
          >
            添加数据集
          </el-button>
        </el-empty>
        <DatasetTable
          v-else
          ref="datasetTableRef"
          :dataset-id="selectedDatasetId"
          :editable="true"
          @add-row-state-change="onAddRowStateChange"
          @rows-updated="loadData"
        />
      </div>
    </main>

    <AdaptiveDialog
      v-model="folderDialogVisible"
      title="新建目录"
      width="420px"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item>
          <template #label>
            <div :class="$style.folderNameLabelRow">
              <span>目录名称</span>
              <span :class="$style.folderParentHint">父级目录：{{ folderDialogParentPath }}</span>
            </div>
          </template>
          <el-input
            v-model="folderName"
            placeholder="请输入新目录名称"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="folderDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="folderSubmitting"
          @click="submitFolder"
        >
          创建
        </el-button>
      </template>
    </AdaptiveDialog>

    <AdaptiveDialog
      v-model="folderEditVisible"
      title="编辑目录"
      width="480px"
      destroy-on-close
      @closed="folderEditId = null"
    >
      <el-form label-position="top">
        <el-form-item label="目录名称">
          <el-input v-model="folderEditName" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="描述（可选）">
          <el-input
            v-model="folderEditDesc"
            type="textarea"
            :rows="2"
            maxlength="2000"
            show-word-limit
            placeholder="目录说明"
          />
        </el-form-item>
        <el-form-item label="父级目录">
          <el-select
            v-model="folderEditParentId"
            placeholder="选择父级"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option label="根级（无父级）" :value="null" />
            <el-option
              v-for="opt in folderEditParentOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="folderEditVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="folderEditSubmitting"
          @click="submitFolderEdit"
        >
          保存
        </el-button>
      </template>
    </AdaptiveDialog>

    <AdaptiveDialog
      v-model="datasetDialogVisible"
      title="新建数据集"
      width="520px"
      destroy-on-close
    >
      <p class="text-sm text-gray-500 m-0 mb-3">
        {{
          selectedFolderId === "all"
            ? "当前选中「全部」，新数据集将创建在根级（无目录）。请在左侧目录树中选中文件夹后再新建，可归类到该目录。"
            : "新数据集将归入当前选中的目录。"
        }}
      </p>
      <el-form label-position="top">
        <el-form-item label="名称">
          <el-input
            v-model="datasetName"
            placeholder="数据集名称"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述（可选）">
          <el-input
            v-model="datasetDesc"
            type="textarea"
            :rows="2"
            placeholder="说明"
            maxlength="5000"
            show-word-limit
          />
        </el-form-item>
        <p :class="$style.datasetDialogHint">
          创建后进入表单设计，为数据集定义字段。
        </p>
      </el-form>
      <template #footer>
        <el-button @click="datasetDialogVisible = false">
          取消
        </el-button>
        <el-button
          type="primary"
          :loading="datasetSubmitting"
          @click="submitDataset"
        >
          创建
        </el-button>
      </template>
    </AdaptiveDialog>

    <AdaptiveDialog
      v-model="editVisible"
      title="编辑数据集信息"
      width="480px"
      destroy-on-close
      @closed="editId = null"
    >
      <el-form label-position="top">
        <el-form-item label="名称">
          <el-input v-model="editName" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="editDesc"
            type="textarea"
            :rows="3"
            maxlength="5000"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="所属目录">
          <el-select
            v-model="editFolderId"
            placeholder="选择目录"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option label="根级（无目录）" :value="null" />
            <el-option
              v-for="opt in folderSelectOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="editSubmitting" @click="submitEdit">
          保存
        </el-button>
      </template>
    </AdaptiveDialog>
  </div>
</template>

<style module lang="css">
.manager {
  display: flex;
  flex-direction: row;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pageHeader {
  flex-shrink: 0;
  min-height: 64px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 10px 16px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.pageTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.4;
  color: var(--el-text-color-primary);
}

.pageSubtitle {
  margin: 2px 0 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--el-text-color-secondary);
}

.pageActions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 8px;
}

.tableArea {
  flex: 1;
  min-height: 0;
  display: flex;
  overflow: hidden;
  background: var(--el-bg-color);
}

.tableArea > * {
  flex: 1;
  min-width: 0;
}

.empty {
  align-self: center;
}

.sidebar {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color);
  overflow: hidden;
}

.sidebarHeader {
  flex-shrink: 0;
  height: 54px;
  box-sizing: border-box;
  padding: 0 12px 0 16px;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.sidebarTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-text-color-primary);
  flex-shrink: 0;
}

.treeWrap {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}

.folderNameLabelRow {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 8px 12px;
  width: 100%;
}

.folderParentHint {
  font-size: 12px;
  font-weight: normal;
  color: var(--el-text-color-secondary);
}

.treeRow {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  padding-right: 4px;
}

.treeRowActions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  margin-left: 4px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
}

.treeRow:hover .treeRowActions,
.treeRowActionsVisible {
  opacity: 1;
  pointer-events: auto;
}

.treeRowMoreTrigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 4px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  outline: none;
}

.treeRowMoreTrigger:hover {
  color: var(--el-color-primary);
  background: var(--el-fill-color-light);
}
</style>
