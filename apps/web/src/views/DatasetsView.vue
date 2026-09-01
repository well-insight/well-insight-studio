<script setup lang="ts">
import type { TableColumn, TreeNode } from '@well-insight/ui'
import type { Dataset, DatasetFieldType, DatasetFolder } from '../api/datasets'
import {
  ArrowLeft,
  Database,
  Folder,
  FolderOpen,
  FolderPlus,
  Layers,
  Table2,
  Trash2,
} from '@lucide/vue'
import {
  message,
  WiBreadcrumb,
  WiButton,
  WiCard,
  WiConfirmDialog,
  WiDialog,
  WiDropdown,
  WiFlex,
  WiForm,
  WiFormItem,
  WiInput,
  WiLayout,
  WiLayoutContent,
  WiLayoutHeader,
  WiLayoutSider,
  WiPagination,
  WiScrollbar,
  WiSelect,
  WiSpace,
  WiTable,
  WiTag,
  WiTextarea,
  WiTree
} from '@well-insight/ui'
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  addDatasetRows,
  createDataset,
  createDatasetFolder,
  deleteDataset,
  deleteDatasetFolder,
  listDatasetFolders,
  listDatasetRows,
  listDatasets,
  updateDatasetFolder,
} from '../api/datasets'
import { Brand } from '../components'

const router = useRouter()

type ViewMode = 'catalog' | 'preview'

interface CatalogRow extends Record<string, unknown> {
  id: string
  name: string
  fields: number
  rowCount: string
  folder: string
}

const datasets = ref<Dataset[]>([])
const folders = ref<DatasetFolder[]>([])
const selectedId = ref<string | null>(null)
const selectedFolderId = ref<string | null>(null)
const rows = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const rowsLoading = ref(false)
const viewMode = ref<ViewMode>('catalog')
const keyword = ref('')
const catalogPage = ref(1)
const catalogPageSize = ref(10)
const page = ref(1)
const pageSize = ref(20)
const totalRows = ref(0)

const showCreate = ref(false)
const showImport = ref(false)
const showFolderDialog = ref(false)
const showDeleteFolderDialog = ref(false)
const showDeleteDatasetDialog = ref(false)
const editingFolder = ref<DatasetFolder | null>(null)
const folderName = ref('')
const folderDescription = ref('')
const folderToDelete = ref<DatasetFolder | null>(null)
const datasetToDelete = ref<Dataset | null>(null)
const name = ref('')
const csv = ref('')
const fields = ref<{ name: string; fieldType: DatasetFieldType }[]>([{ name: '名称', fieldType: 'text' }])

const fieldTypeOptions = [
  { label: '文本', value: 'text' },
  { label: '数字', value: 'number' },
  { label: '时间', value: 'datetime' },
]

const rowActionItems = [
  { value: 'view', label: '查看数据' },
  { value: 'delete', label: '删除' },
]

const catalogStats = computed(() => {
  const scoped = scopedDatasets.value
  return [
    {
      key: 'datasets',
      label: '数据集',
      value: scoped.length.toLocaleString(),
      hint: selectedFolder.value ? '当前目录' : '全部目录',
      icon: Database,
    },
    {
      key: 'fields',
      label: '字段定义',
      value: scoped.reduce((sum, item) => sum + item.fields.length, 0).toLocaleString(),
      hint: '可复用结构',
      icon: Layers,
    },
    {
      key: 'rows',
      label: '总记录',
      value: scoped.reduce((sum, item) => sum + item.rowCount, 0).toLocaleString(),
      hint: '可用于可视化',
      icon: Table2,
    },
  ]
})

const selected = computed(() => datasets.value.find(item => item.id === selectedId.value) ?? null)

const selectedFolder = computed(() =>
  selectedFolderId.value ? folders.value.find(item => item.id === selectedFolderId.value) ?? null : null,
)

const ALL_TREE_KEY = 'all'

function folderTreeKey(id: string) {
  return `folder:${id}`
}

function datasetTreeKey(id: string) {
  return `dataset:${id}`
}

function isFolderTreeKey(key: string) {
  return key.startsWith('folder:')
}

function folderIdFromTreeKey(key: string) {
  return key.slice('folder:'.length)
}

function datasetIdFromTreeKey(key: string) {
  return key.slice('dataset:'.length)
}

const catalogTree = computed<TreeNode[]>(() => {
  function folderNode(folder: DatasetFolder): TreeNode {
    const children = [
      ...childFolders(folder.id).map(folderNode),
      ...datasetsInFolder(folder.id).map(datasetNode),
    ]
    return {
      key: folderTreeKey(folder.id),
      label: folder.name,
      children: children.length ? children : undefined,
      isLeaf: children.length === 0,
    }
  }

  function datasetNode(dataset: Dataset): TreeNode {
    return {
      key: datasetTreeKey(dataset.id),
      label: dataset.name,
      isLeaf: true,
    }
  }

  return [
    { key: ALL_TREE_KEY, label: '全部数据集', isLeaf: true },
    ...childFolders(null).map(folderNode),
    ...datasetsInFolder(null).map(datasetNode),
  ]
})

const selectedTreeKey = computed({
  get(): string | null {
    if (viewMode.value === 'preview' && selectedId.value) return datasetTreeKey(selectedId.value)
    if (selectedFolderId.value) return folderTreeKey(selectedFolderId.value)
    return ALL_TREE_KEY
  },
  set(key: string | null) {
    if (!key) return
    if (key === ALL_TREE_KEY) {
      selectAll()
      return
    }
    if (isFolderTreeKey(key)) {
      const folder = folders.value.find(item => item.id === folderIdFromTreeKey(key))
      if (folder) selectFolder(folder)
      return
    }
    const dataset = datasets.value.find(item => item.id === datasetIdFromTreeKey(key))
    if (dataset) void openDataset(dataset)
  },
})

function treeNodeCount(node: TreeNode) {
  if (node.key === ALL_TREE_KEY) return datasets.value.length
  if (isFolderTreeKey(node.key)) return datasetsInFolder(folderIdFromTreeKey(node.key)).length
  return undefined
}

const scopedDatasets = computed(() => {
  if (selectedFolderId.value === null) return datasets.value
  return datasets.value.filter(item => item.folderId === selectedFolderId.value)
})

const filteredDatasets = computed(() => {
  const q = keyword.value.trim().toLowerCase()
  if (!q) return scopedDatasets.value
  return scopedDatasets.value.filter(item =>
    item.name.toLowerCase().includes(q)
    || (item.description?.toLowerCase().includes(q) ?? false),
  )
})

const catalogColumns = computed<TableColumn[]>(() => {
  const columns: TableColumn[] = [
    { key: 'name', label: '名称', minWidth: 180 },
    { key: 'fields', label: '字段', width: '6rem' },
    { key: 'rowCount', label: '记录数', width: '7rem' },
  ]
  if (!selectedFolderId.value) {
    columns.push({ key: 'folder', label: '目录', minWidth: 120 })
  }
  columns.push({ key: 'actions', label: '', width: '3rem', align: 'center' })
  return columns
})

const catalogRows = computed<CatalogRow[]>(() => filteredDatasets.value.map(item => ({
  id: item.id,
  name: item.name,
  fields: item.fields.length,
  rowCount: item.rowCount.toLocaleString(),
  folder: folderLabel(item.folderId),
})))

const paginatedCatalogRows = computed(() => {
  const start = (catalogPage.value - 1) * catalogPageSize.value
  return catalogRows.value.slice(start, start + catalogPageSize.value)
})

const previewColumns = computed<TableColumn[]>(() => selected.value?.fields.map(field => ({
  key: field.id,
  label: field.name,
  sortable: true,
  minWidth: 150,
})) ?? [])

const breadcrumbItems = computed(() => {
  const items: { label: string; to?: string }[] = [
    { label: '首页', to: '/' },
    { label: '数据集' },
  ]
  if (selectedFolder.value) items.push({ label: selectedFolder.value.name })
  if (viewMode.value === 'preview' && selected.value) items.push({ label: selected.value.name })
  return items
})

const pageTitle = computed(() => {
  if (viewMode.value === 'preview' && selected.value) return selected.value.name
  if (selectedFolder.value) return selectedFolder.value.name
  return '全部数据集'
})

const pageDescription = computed(() => {
  if (viewMode.value === 'preview' && selected.value) {
    return selected.value.description || '可供多个可视化项目复用的业务数据'
  }
  if (selectedFolder.value?.description) return selectedFolder.value.description
  return '管理业务数据目录，为可视化项目准备干净的数据基础'
})

const catalogResultLabel = computed(() => {
  const total = scopedDatasets.value.length
  const filtered = filteredDatasets.value.length
  if (keyword.value.trim()) return `找到 ${filtered} / ${total} 个数据集`
  return `共 ${total} 个数据集`
})

const previewMetaTags = computed(() => {
  if (!selected.value) return []
  return [
    { label: `${selected.value.fields.length} 个字段`, severity: 'info' as const },
    { label: `${selected.value.rowCount.toLocaleString()} 条记录`, severity: 'secondary' as const },
    { label: folderLabel(selected.value.folderId), severity: 'secondary' as const },
  ]
})

const catalogPageRange = computed(() => {
  const total = catalogRows.value.length
  if (total === 0) return '暂无数据集'
  const start = (catalogPage.value - 1) * catalogPageSize.value + 1
  const end = Math.min(catalogPage.value * catalogPageSize.value, total)
  return `显示 ${start}-${end}，共 ${total} 个`
})

const previewPageRange = computed(() => {
  if (totalRows.value === 0) return '暂无记录'
  const start = (page.value - 1) * pageSize.value + 1
  const end = Math.min(page.value * pageSize.value, totalRows.value)
  return `显示 ${start}-${end}，共 ${totalRows.value.toLocaleString()} 条`
})

const folderManageItems = [
  { value: 'edit', label: '编辑目录' },
  { value: 'delete', label: '删除目录' },
]

const previewMoreItems = [
  { value: 'refresh', label: '刷新数据' },
  { value: 'delete', label: '删除数据集' },
]

function folderLabel(folderId: string | null) {
  if (!folderId) return '未分类'
  return folders.value.find(item => item.id === folderId)?.name ?? '未知目录'
}

function onCatalogRowAction(id: string, action: string | undefined) {
  if (action === 'view') openDatasetFromCatalog(id)
  else if (action === 'delete') deleteDatasetFromCatalog(id)
}

function onFolderManageAction(action: string | undefined) {
  if (!selectedFolder.value) return
  if (action === 'edit') openEditFolder(selectedFolder.value)
  else if (action === 'delete') requestDeleteFolder(selectedFolder.value)
}

function onPreviewMoreAction(action: string | undefined) {
  if (!selected.value) return
  if (action === 'refresh') void loadRows()
  else if (action === 'delete') requestDeleteDataset(selected.value)
}

function datasetsInFolder(folderId: string | null) {
  return datasets.value.filter(item => item.folderId === folderId)
}

function childFolders(parentId: string | null) {
  return folders.value.filter(folder => folder.parentId === parentId)
}

function selectAll() {
  selectedFolderId.value = null
  selectedId.value = null
  viewMode.value = 'catalog'
  rows.value = []
  catalogPage.value = 1
}

function selectFolder(folder: DatasetFolder) {
  selectedFolderId.value = folder.id
  selectedId.value = null
  viewMode.value = 'catalog'
  rows.value = []
  catalogPage.value = 1
}

function openCreateFolder() {
  editingFolder.value = null
  folderName.value = ''
  folderDescription.value = ''
  showFolderDialog.value = true
}

function openEditFolder(folder: DatasetFolder) {
  editingFolder.value = folder
  folderName.value = folder.name
  folderDescription.value = folder.description ?? ''
  showFolderDialog.value = true
}

async function saveFolder() {
  const nameValue = folderName.value.trim()
  if (!nameValue) return message.warn('请输入目录名称')
  try {
    if (editingFolder.value) {
      await updateDatasetFolder(editingFolder.value.id, {
        name: nameValue,
        description: folderDescription.value.trim() || null,
      })
      message.success('目录已更新')
    } else {
      await createDatasetFolder({
        name: nameValue,
        description: folderDescription.value.trim() || undefined,
        parentId: selectedFolderId.value,
      })
      message.success('目录已创建')
    }
    showFolderDialog.value = false
    await load()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '保存目录失败')
  }
}

function requestDeleteFolder(folder: DatasetFolder) {
  folderToDelete.value = folder
  showDeleteFolderDialog.value = true
}

async function confirmDeleteFolder() {
  if (!folderToDelete.value) return
  try {
    await deleteDatasetFolder(folderToDelete.value.id)
    if (selectedFolderId.value === folderToDelete.value.id) {
      selectedFolderId.value = null
      viewMode.value = 'catalog'
    }
    message.success('目录已删除')
    showDeleteFolderDialog.value = false
    await load()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '删除目录失败')
  }
}

async function load() {
  loading.value = true
  try {
    const [datasetList, folderList] = await Promise.all([
      listDatasets(),
      listDatasetFolders(),
    ])
    datasets.value = datasetList
    folders.value = folderList
    if (selectedId.value && !datasets.value.some(item => item.id === selectedId.value)) {
      selectedId.value = null
      viewMode.value = 'catalog'
      rows.value = []
    }
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载数据集失败')
  } finally {
    loading.value = false
  }
}

async function loadRows() {
  if (!selectedId.value) return
  rowsLoading.value = true
  try {
    const result = await listDatasetRows(selectedId.value, page.value, pageSize.value)
    rows.value = result.rows.map(row => ({ id: row.id, ...row.values }))
    totalRows.value = result.total
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载数据失败')
    rows.value = []
    totalRows.value = 0
  } finally {
    rowsLoading.value = false
  }
}

function datasetById(id: string) {
  return datasets.value.find(item => item.id === id) ?? null
}

function openDatasetFromCatalog(id: string) {
  const dataset = datasetById(id)
  if (dataset) openDataset(dataset)
}

function deleteDatasetFromCatalog(id: string) {
  const dataset = datasetById(id)
  if (dataset) requestDeleteDataset(dataset)
}

async function openDataset(dataset: Dataset) {
  selectedId.value = dataset.id
  selectedFolderId.value = dataset.folderId
  viewMode.value = 'preview'
  page.value = 1
  await loadRows()
}

function backToCatalog() {
  viewMode.value = 'catalog'
  selectedId.value = null
  rows.value = []
}

function resetFilters() {
  keyword.value = ''
  catalogPage.value = 1
}

function addField() {
  fields.value.push({ name: `字段${fields.value.length + 1}`, fieldType: 'text' })
}

function removeField(index: number) {
  if (fields.value.length <= 1) return
  fields.value.splice(index, 1)
}

async function create() {
  if (!name.value.trim()) return message.warn('请填写数据集名称')
  try {
    const dataset = await createDataset({
      name: name.value.trim(),
      folderId: selectedFolderId.value ?? undefined,
      fields: fields.value.filter(field => field.name.trim()),
    })
    name.value = ''
    fields.value = [{ name: '名称', fieldType: 'text' }]
    showCreate.value = false
    message.success('数据集已创建')
    await load()
    await openDataset(dataset)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '创建失败')
  }
}

async function importCsv() {
  if (!selected.value || !csv.value.trim()) return message.warn('请粘贴 CSV 内容')
  const lines = csv.value.trim().split(/\r?\n/).map(line => line.split(','))
  const headers = lines.shift() ?? []
  const imported = lines.map(line =>
    Object.fromEntries(headers.map((header, index) => [
      selected.value!.fields[index]?.id ?? header,
      line[index] ?? null,
    ])),
  )
  try {
    await addDatasetRows(selected.value.id, imported)
    csv.value = ''
    message.success(`已导入 ${imported.length} 行`)
    await loadRows()
    await load()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '导入失败')
  }
}

function requestDeleteDataset(dataset: Dataset) {
  datasetToDelete.value = dataset
  showDeleteDatasetDialog.value = true
}

async function confirmDeleteDataset() {
  if (!datasetToDelete.value) return
  try {
    await deleteDataset(datasetToDelete.value.id)
    message.success('数据集已删除')
    if (selectedId.value === datasetToDelete.value.id) {
      selectedId.value = null
      viewMode.value = 'catalog'
      rows.value = []
    }
    showDeleteDatasetDialog.value = false
    await load()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '删除失败')
  }
}

watch([page, pageSize], () => {
  if (viewMode.value === 'preview' && selectedId.value) loadRows()
})

watch(keyword, () => {
  catalogPage.value = 1
})

watch(filteredDatasets, (rows) => {
  const maxPage = Math.max(1, Math.ceil(rows.length / catalogPageSize.value))
  if (catalogPage.value > maxPage) catalogPage.value = maxPage
})

const collapsed = ref(false)

onMounted(load)
</script>

<template>
  <WiFlex class="datasets-manage-page h-full w-full" vertical>
    <WiLayout class="h-full min-h-0">
      <WiLayoutHeader bordered>
        <WiFlex class="w-full h-full" align="center" justify="space-between">
          <WiSpace align="center">
            <Brand />
            <WiBreadcrumb :model="breadcrumbItems" />
          </WiSpace>
          <WiButton severity="secondary" text size="small" @click="router.push('/')">
            <ArrowLeft :size="14" />
            返回工作台
          </WiButton>
        </WiFlex>
      </WiLayoutHeader>
      <WiLayout has-sider>
        <WiLayoutSider
          v-model:collapsed="collapsed" bordered show-trigger="arrow-circle" :collapsed-width="20"
          :width="260" :padding="16" class="datasets-page__sider min-h-0"
          :content-style="{ display: 'flex', flexDirection: 'column', minHeight: 0, height: '100%', overflow: 'hidden' }"
        >
          <WiCard class="h-full w-full">
            <template #header>
              <WiSpace class="w-full" justify="space-between">
                <span>数据目录</span>
                <WiSpace>
                  <WiButton text icon-only size="small" :icon="FolderPlus" aria-label="新建目录" @click="openCreateFolder" />
                  <WiButton text icon-only size="small" icon="plus" aria-label="新建数据集" @click="showCreate = true" />
                </WiSpace>
              </WiSpace>
            </template>
            <WiScrollbar
              class="datasets-page__tree-scroll"
              :native="false"
              trigger="hover"
              aria-label="数据集目录"
            >
              <WiTree v-model="selectedTreeKey" :value="catalogTree" default-expand-all>
                <template #default="{ node }">
                  <WiSpace>
                    <FolderOpen v-if="node.key === ALL_TREE_KEY" :size="15" aria-hidden="true" />
                    <Folder v-else-if="isFolderTreeKey(node.key)" :size="15" aria-hidden="true" />
                    <Database v-else :size="14" aria-hidden="true" />
                    <span class="datasets-page__tree-name">{{ node.label }}</span>
                    <small v-if="treeNodeCount(node) != null">{{ treeNodeCount(node) }}</small>
                  </WiSpace>
                </template>
              </WiTree>
              <p v-if="folders.length === 0 && datasets.length === 0" class="datasets-page__tree-empty">
                还没有数据集，点击右上角创建。
              </p>
            </WiScrollbar>
          </WiCard>
        </WiLayoutSider>
        <WiLayout class="datasets-page__main min-h-0 min-w-0">
          <WiLayoutContent
            class="datasets-page__content min-h-0"
            :content-style="{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }"
          >
            <WiCard class="datasets-page__workspace">
              <template #header>
                <div class="datasets-page__workspace-header">
                  <WiFlex class="datasets-page__head" align="start" justify="space-between" wrap size="small">
                    <div class="datasets-page__intro">
                      <h1 class="datasets-page__title">
                        {{ pageTitle }}
                      </h1>
                      <p class="datasets-page__desc">
                        {{ pageDescription }}
                      </p>
                    </div>

                    <WiSpace wrap class="datasets-page__actions" :size="8">
                      <template v-if="viewMode === 'catalog'">
                        <WiDropdown
                          v-if="selectedFolder"
                          :items="folderManageItems"
                          @select="(item) => onFolderManageAction(item.value)"
                        >
                          <template #trigger>
                            <WiButton severity="secondary" size="small" icon="more-vertical" label="目录管理" />
                          </template>
                        </WiDropdown>
                        <WiButton icon="plus" label="新建数据集" size="small" @click="showCreate = true" />
                      </template>
                      <template v-else>
                        <WiButton severity="secondary" label="返回列表" size="small" @click="backToCatalog" />
                        <WiButton
                          icon="upload"
                          label="导入数据"
                          size="small"
                          :disabled="!selected"
                          @click="showImport = true"
                        />
                        <WiDropdown
                          v-if="selected"
                          :items="previewMoreItems"
                          @select="(item) => onPreviewMoreAction(item.value)"
                        >
                          <template #trigger>
                            <WiButton severity="secondary" size="small" icon="more-vertical" aria-label="更多操作" />
                          </template>
                        </WiDropdown>
                      </template>
                    </WiSpace>
                  </WiFlex>

                  <WiFlex v-if="viewMode === 'catalog'" justify="space-between">
                    <WiSpace>
                      <WiTag v-for="stat in catalogStats" :key="stat.key">
                        <component :is="stat.icon" :size="14" aria-hidden="true" />
                        <span>{{ stat.label }}</span>
                        <strong>{{ stat.value }}</strong>
                      </WiTag>
                    </WiSpace>
                    

                    <WiFlex
                      v-if="viewMode === 'catalog'"
                      align="center"
                      justify="space-between"
                      wrap
                      size="small"
                    >
                      <WiInput
                        v-model="keyword"
                        placeholder="搜索名称或描述"
                        clearable
                        aria-label="搜索数据集"
                      />
                      <WiSpace :size="8" align="center">
                        <span class="datasets-page__result-count">{{ catalogResultLabel }}</span>
                        <WiButton
                          v-if="keyword"
                          severity="secondary"
                          size="small"
                          native-type="button"
                          @click="resetFilters"
                        >
                          重置
                        </WiButton>
                      </WiSpace>
                    </WiFlex>
                  </WiFlex>

                  <WiFlex v-if="viewMode === 'preview' && selected" justify="space-between">
                    <WiSpace wrap :size="6">
                      <WiTag
                        v-for="tag in previewMetaTags"
                        :key="tag.label"
                        :value="tag.label"
                        :severity="tag.severity"
                      />
                    </WiSpace>
                  </WiFlex>
                </div>
              </template>

              <WiScrollbar
                v-if="viewMode === 'catalog'"
                class="datasets-page__table-scroll"
                :native="false"
                trigger="hover"
                aria-label="数据集列表"
              >
                <WiTable
                  class="datasets-page__table-area h-full"
                  :columns="catalogColumns"
                  :rows="paginatedCatalogRows"
                  row-key="id"
                  :loading="loading"
                  loading-text="正在加载数据集…"
                  striped
                  row-hover
                  empty-text="暂无数据集"
                  empty-description="创建目录或新建数据集，开始整理业务数据"
                >
                  <template #cell-name="{ row }">
                    <button type="button" class="datasets-page__link" @click="openDatasetFromCatalog(String(row.id))">
                      {{ row.name }}
                    </button>
                  </template>
                  <template #cell-fields="{ row }">
                    <WiTag :value="`${row.fields} 个`" severity="info" size="small" />
                  </template>
                  <template #cell-folder="{ row }">
                    <WiTag :value="String(row.folder)" severity="secondary" size="small" />
                  </template>
                  <template #cell-actions="{ row }">
                    <WiDropdown
                      :items="rowActionItems"
                      @select="(item) => onCatalogRowAction(String(row.id), item.value)"
                    >
                      <template #trigger>
                        <WiButton severity="secondary" size="small" icon="more-vertical" aria-label="数据集操作" />
                      </template>
                    </WiDropdown>
                  </template>
                </WiTable>
              </WiScrollbar>

              <WiScrollbar
                v-else-if="selected"
                class="datasets-page__table-scroll"
                :native="false"
                trigger="hover"
                aria-label="数据预览"
              >
                <WiTable
                  class="datasets-page__table-area h-full"
                  :columns="previewColumns"
                  :rows="rows"
                  row-key="id"
                  :loading="rowsLoading"
                  loading-text="正在加载数据…"
                  striped
                  row-hover
                  empty-text="暂无记录"
                  empty-description="导入 CSV 或新增记录后，数据会显示在这里"
                />
              </WiScrollbar>

              <div v-else class="datasets-page__empty">
                <Database :size="28" aria-hidden="true" />
                <h2>选择一个数据集</h2>
                <p>从左侧目录或列表中选择数据集，预览数据记录。</p>
                <WiButton icon="plus" label="创建数据集" size="small" @click="showCreate = true" />
              </div>

              <template v-if="viewMode === 'catalog' ? catalogRows.length > 0 : !!selected" #footer>
                <WiFlex class="w-full datasets-page__pager" align="center" justify="space-between" wrap size="small">
                  <span class="datasets-page__pager-info">
                    {{ viewMode === 'catalog' ? catalogPageRange : previewPageRange }}
                  </span>
                  <WiPagination
                    v-if="viewMode === 'catalog'"
                    v-model="catalogPage"
                    v-model:page-size="catalogPageSize"
                    :total-records="catalogRows.length"
                    show-size-picker
                  />
                  <WiPagination
                    v-else
                    v-model="page"
                    v-model:page-size="pageSize"
                    :total-records="totalRows"
                    show-size-picker
                  />
                </WiFlex>
              </template>
            </WiCard>
          </WiLayoutContent>
        </WiLayout>
      </WiLayout>
    </WiLayout>

    <WiDialog v-model="showCreate" header="创建数据集" width="480px">
      <WiForm class="datasets-page__dialog-form" @submit.prevent="create">
        <WiFormItem label="名称" name="name" required>
          <WiInput v-model="name" placeholder="例如：销售明细" fluid />
        </WiFormItem>
        <WiFormItem label="字段定义" name="fields">
          <div class="datasets-page__field-list">
            <div v-for="(field, index) in fields" :key="index" class="datasets-page__field-row">
              <WiInput v-model="field.name" placeholder="字段名" fluid />
              <WiSelect v-model="field.fieldType" :options="fieldTypeOptions" fluid />
              <WiButton
                v-if="fields.length > 1"
                text
                severity="danger"
                size="small"
                aria-label="删除字段"
                @click="removeField(index)"
              >
                <Trash2 :size="14" />
              </WiButton>
            </div>
            <WiButton icon="plus" label="添加字段" text size="small" @click="addField" />
          </div>
        </WiFormItem>
        <WiSpace class="datasets-page__dialog-actions">
          <WiButton severity="secondary" native-type="button" @click="showCreate = false">
            取消
          </WiButton>
          <WiButton native-type="submit" :loading="loading">
            创建数据集
          </WiButton>
        </WiSpace>
      </WiForm>
    </WiDialog>

    <WiDialog v-model="showImport" header="导入数据" width="520px">
      <WiForm class="datasets-page__dialog-form" @submit.prevent="importCsv().then(() => { showImport = false })">
        <p class="datasets-page__import-hint">
          当前数据集：{{ selected?.name }}。第一行填写字段名称，后续每行填写一条记录。
        </p>
        <WiFormItem label="CSV 内容" name="csv" required>
          <WiTextarea v-model="csv" placeholder="名称,金额,日期&#10;华东区域,12800,2026-08-01" :rows="8" fluid />
        </WiFormItem>
        <WiSpace class="datasets-page__dialog-actions">
          <WiButton severity="secondary" native-type="button" @click="showImport = false">
            取消
          </WiButton>
          <WiButton icon="upload" label="开始导入" native-type="submit" :loading="rowsLoading" />
        </WiSpace>
      </WiForm>
    </WiDialog>

    <WiDialog v-model="showFolderDialog" :header="editingFolder ? '编辑目录' : '新建目录'" width="420px">
      <WiForm class="datasets-page__dialog-form" @submit.prevent="saveFolder">
        <WiFormItem label="目录名称" name="folderName" required>
          <WiInput v-model="folderName" placeholder="例如：销售数据" fluid />
        </WiFormItem>
        <WiFormItem label="目录说明" name="folderDescription">
          <WiTextarea v-model="folderDescription" placeholder="可选" :rows="3" fluid />
        </WiFormItem>
        <WiSpace class="datasets-page__dialog-actions">
          <WiButton severity="secondary" native-type="button" @click="showFolderDialog = false">
            取消
          </WiButton>
          <WiButton native-type="submit">
            保存
          </WiButton>
        </WiSpace>
      </WiForm>
    </WiDialog>

    <WiConfirmDialog
      v-model="showDeleteFolderDialog"
      header="删除目录"
      type="warn"
      :message="`确定删除目录「${folderToDelete?.name ?? ''}」吗？只有空目录可以删除。`"
      accept-label="删除"
      reject-label="取消"
      accept-severity="danger"
      @accept="confirmDeleteFolder"
    />
    <WiConfirmDialog
      v-model="showDeleteDatasetDialog"
      header="删除数据集"
      type="warn"
      :message="`确定删除数据集「${datasetToDelete?.name ?? ''}」吗？此操作不可恢复。`"
      accept-label="删除"
      reject-label="取消"
      accept-severity="danger"
      @accept="confirmDeleteDataset"
    />
  </WiFlex>
</template>


<style scoped>
.datasets-manage-page {
  min-height: 0;
  overflow: hidden;
  background: var(--wi-color-ground-background);
}

.datasets-page__sider {
  min-height: 0;
}

.datasets-page__sider :deep(.wi-layout-sider__scroll) {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.datasets-page__sider :deep(.wi-card) {
  display: flex;
  min-height: 0;
  flex-direction: column;
}

.datasets-page__sider :deep(.wi-card__body) {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  overflow: hidden;
  padding: var(--wi-space-3);
}

.datasets-page__tree-scroll {
  min-height: 0;
  flex: 1;
}

.datasets-page__tree-scroll :deep(.wi-scrollbar__wrap),
.datasets-page__tree-scroll :deep(.wi-scrollbar__view) {
  height: 100%;
  min-height: 100%;
}

.datasets-page__tree-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.datasets-page__tree-empty {
  margin: var(--wi-space-6) var(--wi-space-3);
  color: var(--wi-color-text-muted);
  text-align: center;
  font-size: var(--wi-font-size-sm);
  line-height: 1.6;
}

.datasets-page__main {
  min-width: 0;
  min-height: 0;
}

.datasets-page__content {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: var(--wi-space-4) var(--wi-space-5);
  overflow: hidden;
}

.datasets-page__workspace {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.datasets-page__workspace :deep(.wi-card__header) {
  padding: var(--wi-space-4);
}

.datasets-page__workspace :deep(.wi-card__body) {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  padding: 0;
  overflow: hidden;
}

.datasets-page__workspace :deep(.wi-card__footer) {
  padding: var(--wi-space-3) var(--wi-space-4);
  border-top: 1px solid var(--wi-color-border);
}

.datasets-page__workspace-header {
  display: flex;
  flex-direction: column;
  gap: var(--wi-space-3);
}

.datasets-page__head {
  width: 100%;
}

.datasets-page__intro {
  display: flex;
  min-width: 0;
  flex: 1;
  flex-direction: column;
  gap: var(--wi-space-2);
}

.datasets-page__actions {
  flex-shrink: 0;
}

.datasets-page__meta-tags {
  margin-top: var(--wi-space-1);
}

.datasets-page__title {
  margin: 0;
  font-size: var(--wi-font-size-lg);
  font-weight: 600;
  color: var(--wi-color-text);
  line-height: 1.3;
}

.datasets-page__desc {
  margin: 0;
  max-width: 40rem;
  color: var(--wi-color-text-muted);
  font-size: var(--wi-font-size-sm);
  line-height: 1.55;
}

.datasets-page__metrics {
  display: flex;
  flex-wrap: wrap;
  gap: var(--wi-space-2);
  padding-top: var(--wi-space-1);
  border-top: 1px solid color-mix(in srgb, var(--wi-color-border) 65%, transparent);
}

.datasets-page__metric {
  display: inline-flex;
  align-items: center;
  gap: var(--wi-space-2);
  padding: var(--wi-space-1) var(--wi-space-3);
  border-radius: var(--wi-radius-md);
  color: var(--wi-color-text-muted);
  background: color-mix(in srgb, var(--wi-color-border) 22%, transparent);
  font-size: var(--wi-font-size-sm);
}

.datasets-page__metric strong {
  color: var(--wi-color-text);
  font-weight: 600;
}

.datasets-page__toolbar {
  width: 100%;
  padding-top: var(--wi-space-1);
  border-top: 1px solid color-mix(in srgb, var(--wi-color-border) 65%, transparent);
}

.datasets-page__search {
  width: min(100%, 16rem);
}

.datasets-page__result-count {
  color: var(--wi-color-text-muted);
  font-size: var(--wi-font-size-sm);
  white-space: nowrap;
}

.datasets-page__pager {
  width: 100%;
}

.datasets-page__pager-info {
  color: var(--wi-color-text-muted);
  font-size: var(--wi-font-size-sm);
}

.datasets-page__table-scroll {
  display: flex;
  min-height: 0;
  flex: 1;
  flex-direction: column;
}

.datasets-page__table-scroll :deep(.wi-scrollbar__wrap),
.datasets-page__table-scroll :deep(.wi-scrollbar__view) {
  height: 100%;
  min-height: 100%;
}

.datasets-page__table-area {
  width: 100%;
  border: none;
}

.datasets-page__table-area :deep(.wi-table-wrapper) {
  border: 0;
  border-radius: 0;
}

.datasets-page__table-area :deep(.wi-table__cell-inner) {
  font-size: var(--wi-table-font-size);
}

.datasets-page__empty {
  display: grid;
  place-items: center;
  align-content: center;
  gap: var(--wi-space-2);
  min-height: 260px;
  padding: var(--wi-space-6);
  color: var(--wi-color-text-muted);
  text-align: center;
}

.datasets-page__link {
  max-width: 100%;
  padding: 0;
  border: 0;
  overflow: hidden;
  color: var(--wi-color-primary);
  background: transparent;
  font: inherit;
  line-height: var(--wi-table-cell-line-height);
  cursor: pointer;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.datasets-page__link:hover {
  text-decoration: underline;
}

.datasets-page__empty h2 {
  margin: var(--wi-space-2) 0 0;
  color: var(--wi-color-text);
  font-size: var(--wi-font-size-lg);
  font-weight: 600;
}

.datasets-page__empty p {
  margin: 0 0 var(--wi-space-2);
  font-size: var(--wi-font-size-sm);
}

.datasets-page__dialog-form {
  display: flex;
  flex-direction: column;
  gap: var(--wi-space-4);
}

.datasets-page__field-list {
  display: flex;
  flex-direction: column;
  gap: var(--wi-space-2);
  width: 100%;
}

.datasets-page__field-row {
  display: grid;
  grid-template-columns: 1fr 7rem auto;
  gap: var(--wi-space-2);
  align-items: center;
}

.datasets-page__dialog-actions {
  justify-content: flex-end;
  padding-top: var(--wi-space-2);
  border-top: 1px solid var(--wi-color-border);
}

.datasets-page__import-hint {
  margin: 0;
  color: var(--wi-color-text-muted);
  font-size: var(--wi-font-size-sm);
  line-height: 1.6;
}

@media (max-width: 900px) {
  .datasets-page__content {
    padding: var(--wi-space-3);
  }

  .datasets-page__head {
    flex-direction: column;
  }

  .datasets-page__toolbar {
    flex-direction: column;
    align-items: stretch;
  }

  .datasets-page__search {
    width: 100%;
  }
}
</style>

