<script setup lang="ts">
import type { ElTree } from 'element-plus'
import type {
  ApiDatasetListItem,
  ApiFolderTreeNode,
  DatasetFieldType,
} from '@/api/dataset'
import {
  Delete,
  Edit,
  Folder,
  FolderOpened,
  MoreFilled,
  Plus,
} from '@element-plus/icons-vue'
import dayjs from 'dayjs'
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
import SvgIcon from '@/components/svg-icon/SvgIcon.vue'
import { useWorkspaceStore } from '@/stores/workspaceStore'

const router = useRouter()
interface FolderTreeNode {
  id: string
  label: string
  type: 'all' | 'folder'
  folderId?: string
  description?: string | null
  parentFolderId?: string | null
  children?: FolderTreeNode[]
}

const workspaceStore = useWorkspaceStore()

const treeProps = { children: 'children', label: 'label' }
const treeRef = ref<InstanceType<typeof ElTree> | null>(null)

const treeLoading = ref(false)
const listLoading = ref(false)
const folderRoots = ref<ApiFolderTreeNode[]>([])
const allDatasets = ref<ApiDatasetListItem[]>([])

/** 当前选中的目录：全部，或某个 folder id */
const selectedFolderId = ref<string | 'all'>('all')

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
const datasetFields = ref<{ name: string, field_type: DatasetFieldType }[]>([
  { name: '列1', field_type: 'text' },
])

const editVisible = ref(false)
const editSubmitting = ref(false)
const editId = ref<string | null>(null)
const editName = ref('')
const editDesc = ref('')
const editFolderId = ref<string | null>(null)

function mapFoldersToNodes(folders: ApiFolderTreeNode[]): FolderTreeNode[] {
  return folders.map(f => ({
    id: `folder-${f.id}`,
    label: f.name,
    type: 'folder' as const,
    folderId: f.id,
    description: f.description,
    parentFolderId: f.parent_id ?? null,
    children: mapFoldersToNodes(f.children || []),
  }))
}

const treeData = computed<FolderTreeNode[]>(() => {
  return [
    { id: '__all__', label: '全部', type: 'all' },
    ...mapFoldersToNodes(folderRoots.value),
  ]
})

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

const filteredDatasets = computed(() => {
  const list = allDatasets.value
  if (selectedFolderId.value === 'all') {
    return [...list].sort((a, b) =>
      a.updated_at < b.updated_at ? 1 : a.updated_at > b.updated_at ? -1 : 0,
    )
  }
  const fid = selectedFolderId.value
  return list
    .filter(d => d.folder_id === fid)
    .sort((a, b) =>
      a.updated_at < b.updated_at ? 1 : a.updated_at > b.updated_at ? -1 : 0,
    )
})

function formatTime(iso: string) {
  return dayjs(iso).format('YYYY-MM-DD HH:mm')
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
    treeRenderKey.value += 1
    await nextTick()
    const key
      = selectedFolderId.value === 'all'
        ? '__all__'
        : `folder-${selectedFolderId.value}`
    treeRef.value?.setCurrentKey(key)
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

function onFolderDropdownVisible(visible: boolean, data: FolderTreeNode) {
  folderDropdownOpenNodeId.value
    = visible && data.type === 'folder' ? data.id : null
}

function onFolderMenuCommand(cmd: string, data: FolderTreeNode) {
  if (data.type !== 'folder')
    return
  if (cmd === 'edit')
    void openFolderEdit(data)
  else if (cmd === 'delete')
    void confirmDeleteFolder(data)
}

function handleFolderTreeClick(data: FolderTreeNode) {
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

async function openFolderEdit(data: FolderTreeNode) {
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

async function confirmDeleteFolder(data: FolderTreeNode) {
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
  datasetFields.value = [{ name: '列1', field_type: 'text' }]
  datasetDialogVisible.value = true
}

function addFieldRow() {
  datasetFields.value.push({
    name: `列${datasetFields.value.length + 1}`,
    field_type: 'text',
  })
}

function removeFieldRow(i: number) {
  if (datasetFields.value.length <= 1) {
    ElMessage.warning('至少保留一个字段')
    return
  }
  datasetFields.value.splice(i, 1)
}

async function submitDataset() {
  const name = datasetName.value.trim()
  if (!name) {
    ElMessage.warning('请输入数据集名称')
    return
  }
  const fields = datasetFields.value
    .map(f => ({ name: f.name.trim(), field_type: f.field_type }))
    .filter(f => f.name.length > 0)
  if (fields.length === 0) {
    ElMessage.warning('请填写至少一个有效字段名')
    return
  }
  const folder_id
    = selectedFolderId.value === 'all' ? null : selectedFolderId.value
  datasetSubmitting.value = true
  try {
    await createDataset({
      name,
      description: datasetDesc.value.trim() || null,
      folder_id,
      project_id: null,
      fields: fields.map((f, i) => ({ ...f, sort_order: i })),
    })
    ElMessage.success('数据集已创建')
    datasetDialogVisible.value = false
    await loadData()
  }
  catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '创建失败')
  }
  finally {
    datasetSubmitting.value = false
  }
}

function openEdit(ds: ApiDatasetListItem) {
  editId.value = ds.id
  editName.value = ds.name
  editDesc.value = ds.description ?? ''
  editFolderId.value = ds.folder_id
  editVisible.value = true
}

function toEditPage(ds: ApiDatasetListItem) {
  workspaceStore.setCurrentDataset(ds)
  router.push({ name: 'DatasetEdit', params: { id: String(ds.id) } })
}

function onDatasetMenuCommand(cmd: string, ds: ApiDatasetListItem) {
  if (cmd === 'delete')
    void confirmDelete(ds)
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
    await loadData()
  }
  catch (e) {
    ElMessage.error(e instanceof Error ? e.message : '删除失败')
  }
}

onMounted(async () => {
  await loadData()
  await nextTick()
  treeRef.value?.setCurrentKey('__all__')
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
          :expand-on-click-node="true"
          @node-click="handleFolderTreeClick"
        >
          <template #default="{ node, data }">
            <div :class="$style.treeRow">
              <div class="flex items-center gap-2 py-1 min-w-0 flex-1">
                <template v-if="data.type === 'all'">
                  <el-icon :size="18">
                    <FolderOpened />
                  </el-icon>
                </template>
                <template v-else-if="!node.isLeaf">
                  <el-icon v-if="node.expanded" :size="18">
                    <FolderOpened />
                  </el-icon>
                  <el-icon v-else :size="18">
                    <Folder />
                  </el-icon>
                </template>
                <template v-else>
                  <el-icon :size="18">
                    <Folder />
                  </el-icon>
                </template>
                <span class="truncate">{{ node.label }}</span>
              </div>
              <div
                v-if="data.type === 'folder'"
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
                      <el-dropdown-item command="edit">
                        编辑目录
                      </el-dropdown-item>
                      <el-dropdown-item command="delete" divided>
                        删除目录
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

    <!-- 右侧：数据集列表 -->
    <div :class="$style.main">
      <div :class="$style.pageHeader">
        <h2 :class="$style.pageTitle">
          数据集
        </h2>
        <el-button type="primary" round :icon="Plus" @click="openDatasetDialog">
          新增数据集
        </el-button>
      </div>

      <div v-loading="listLoading" :class="$style.cardArea">
        <el-scrollbar class="w-full h-full" view-class="p-3">
          <el-empty
            v-if="!listLoading && filteredDatasets.length === 0"
            description="当前目录下暂无数据集"
          />
          <div v-else :class="$style.cardGrid">
            <el-card
              v-for="ds in filteredDatasets"
              :key="ds.id"
              :class="$style.card"
              shadow="hover"
              @click="toEditPage(ds)"
            >
              <div :class="$style.cardBody">
                <div :class="$style.cardHead">
                  <span :class="$style.cardName">{{ ds.name }}</span>
                  <div :class="$style.cardHeadActions" @click.stop>
                    <el-button
                      link
                      type="primary"
                      :icon="Edit"
                      @click.stop="openEdit(ds)"
                    >
                      编辑
                    </el-button>
                    <el-button
                      link
                      type="danger"
                      :icon="Delete"
                      @click.stop="onDatasetMenuCommand('delete', ds)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
                <p :class="$style.cardDesc">
                  {{ ds.description?.trim() || "暂无描述" }}
                </p>
                <div :class="$style.cardMeta">
                  <span>字段 {{ ds.field_count }}</span>
                  <span>行数 {{ ds.row_count }}</span>
                  <span>更新 {{ formatTime(ds.updated_at) }}</span>
                </div>
              </div>
            </el-card>
          </div>
        </el-scrollbar>
      </div>
    </div>

    <el-dialog
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
    </el-dialog>

    <el-dialog
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
    </el-dialog>

    <el-dialog
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
        <el-form-item label="字段定义">
          <div class="flex flex-col gap-2 w-full">
            <div
              v-for="(row, i) in datasetFields"
              :key="i"
              class="flex gap-2 items-center"
            >
              <el-input
                v-model="row.name"
                placeholder="字段名"
                class="flex-1"
                maxlength="200"
              />
              <el-select v-model="row.field_type" style="width: 120px">
                <el-option value="text" label="文本">
                  <el-space>
                    <SvgIcon name="text" size="14" />n
                  </el-space>
                </el-option>
                <el-option value="number" label="数字">
                  <el-space>
                    <SvgIcon name="number" size="14" />
                    <span>数字</span>
                  </el-space>
                </el-option>
                <el-option value="datetime" label="日期时间">
                  <el-space>
                    <SvgIcon name="datetime" size="14" />
                    <span>日期时间</span>
                  </el-space>
                </el-option>
              </el-select>
              <el-button text type="danger" @click="removeFieldRow(i)">
                删除
              </el-button>
            </div>
            <el-button @click="addFieldRow">
              添加字段
            </el-button>
          </div>
        </el-form-item>
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
    </el-dialog>

    <el-dialog
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
    </el-dialog>
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
  height: 54px;
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 0 24px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.pageTitle {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  line-height: 1;
  color: var(--el-text-color-primary);
}

.cardArea {
  flex: 1;
  height: 0;
  /*padding: 12px;*/
  background-color: var(--el-bg-color);
}

.cardGrid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
}

.card {
  width: 100%;
  max-width: 100%;
  border-radius: 10px;
  cursor: pointer;
  box-sizing: border-box;
}

.cardBody {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cardHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-width: 0;
}

.cardName {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.4;
  word-break: break-word;
  min-width: 0;
  flex: 1;
}

.cardHeadActions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 4px;
}

.cardDesc {
  margin: 0;
  font-size: 13px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
  min-height: 40px;
  line-clamp: 2;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cardMeta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.cardMenuItem {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.cardMenuItemDanger {
  color: var(--el-color-danger);
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
