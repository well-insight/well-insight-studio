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

const catalogColumns: TableColumn[] = [
  { key: 'name', label: '名称', minWidth: 180 },
  { key: 'fields', label: '字段', width: '6rem' },
  { key: 'rowCount', label: '记录数', width: '7rem' },
  { key: 'folder', label: '目录', minWidth: 120 },
  { key: 'actions', label: '操作', width: '11rem' },
]

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
    return `${selected.value.description || '可供多个可视化项目复用的业务数据'} · ${selected.value.fields.length} 个字段 · ${selected.value.rowCount.toLocaleString()} 条记录`
  }
  return `共 ${scopedDatasets.value.length} 个数据集 · ${scopedDatasets.value.reduce((sum, item) => sum + item.rowCount, 0).toLocaleString()} 条记录`
})

function folderLabel(folderId: string | null) {
  if (!folderId) return '未分类'
  return folders.value.find(item => item.id === folderId)?.name ?? '未知目录'
}

function fieldTypeLabel(type: DatasetFieldType) {
  return fieldTypeOptions.find(item => item.value === type)?.label ?? type
}

function onCatalogRowAction(id: string, action: string | undefined) {
  if (action === 'view') openDatasetFromCatalog(id)
  else if (action === 'delete') deleteDatasetFromCatalog(id)
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

onMounted(load)
</script>

<template>
  <div class="datasets-shell">
    <header class="datasets-shell__topbar">
      <button class="datasets-shell__brand" type="button" aria-label="返回工作台" @click="router.push('/')">
        <span class="datasets-shell__brand-mark">WI</span>
        <span class="datasets-shell__brand-copy">
          <strong>Well-Insight</strong>
          <small>DATASETS</small>
        </span>
      </button>
      <nav class="datasets-shell__breadcrumb" aria-label="页面导航">
        <WiBreadcrumb :model="breadcrumbItems" />
      </nav>
      <WiButton severity="secondary" text size="small" @click="router.push('/')">
        <ArrowLeft :size="14" />
        返回工作台
      </WiButton>
    </header>

    <WiLayout has-sider class="datasets-page h-full w-full min-h-0 overflow-hidden">
      <WiLayoutSider
        bordered
        :width="260"
        :padding="16"
        class="datasets-page__sider min-h-0"
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
          <WiScrollbar class="datasets-page__tree-scroll" :native="false" trigger="hover" aria-label="数据集目录">
            <WiTree
              v-model="selectedTreeKey"
              class="datasets-page__tree"
              :value="catalogTree"
              default-expand-all
            >
              <template #default="{ node }">
                <span class="datasets-page__tree-label">
                  <FolderOpen v-if="node.key === ALL_TREE_KEY" :size="15" aria-hidden="true" />
                  <Folder v-else-if="isFolderTreeKey(node.key)" :size="15" aria-hidden="true" />
                  <Database v-else :size="14" aria-hidden="true" />
                  <span class="datasets-page__tree-name">{{ node.label }}</span>
                  <small v-if="treeNodeCount(node) != null">{{ treeNodeCount(node) }}</small>
                </span>
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
          <section v-if="viewMode === 'catalog'" class="datasets-page__stats" aria-label="数据概览">
            <article v-for="stat in catalogStats" :key="stat.key" class="datasets-page__stat">
              <span class="datasets-page__stat-icon" aria-hidden="true">
                <component :is="stat.icon" :size="16" />
              </span>
              <div class="datasets-page__stat-copy">
                <span class="datasets-page__stat-label">{{ stat.label }}</span>
                <strong class="datasets-page__stat-value">{{ stat.value }}</strong>
                <small>{{ stat.hint }}</small>
              </div>
            </article>
          </section>

          <section v-if="viewMode === 'catalog'" class="datasets-page__filters" aria-label="筛选">
            <WiForm class="datasets-page__filter-form" @submit.prevent="catalogPage = 1">
              <WiSpace wrap>
                <WiInput
                  v-model="keyword"
                  placeholder="搜索名称或描述"
                  clearable
                  style="width: 18rem"
                  aria-label="搜索数据集"
                />
                <WiButton severity="secondary" native-type="button" @click="resetFilters">
                  重置
                </WiButton>
              </WiSpace>
            </WiForm>
          </section>

          <header class="datasets-page__toolbar">
            <div class="datasets-page__title-block">
              <h1 class="datasets-page__title">
                {{ pageTitle }}
              </h1>
              <p class="datasets-page__desc">
                {{ pageDescription }}
              </p>
            </div>
            <WiSpace wrap>
              <WiButton
                v-if="viewMode === 'catalog' && selectedFolder"
                icon="edit"
                label="编辑目录"
                severity="secondary"
                size="small"
                @click="openEditFolder(selectedFolder)"
              />
              <WiButton
                v-if="viewMode === 'catalog' && selectedFolder"
                icon="trash"
                label="删除目录"
                severity="danger"
                size="small"
                @click="requestDeleteFolder(selectedFolder)"
              />
              <WiButton v-if="viewMode === 'preview'" severity="secondary" label="返回列表" @click="backToCatalog" />
              <WiButton
                v-if="viewMode === 'preview'"
                icon="refresh"
                label="刷新"
                severity="secondary"
                size="small"
                :disabled="!selected"
                @click="selected && loadRows()"
              />
              <WiButton
                v-if="viewMode === 'catalog'"
                icon="plus"
                label="新建数据集"
                size="small"
                @click="showCreate = true"
              />
              <WiButton
                v-else
                icon="upload"
                label="导入数据"
                severity="secondary"
                size="small"
                :disabled="!selected"
                @click="showImport = true"
              />
              <WiButton
                v-if="viewMode === 'preview' && selected"
                icon="trash"
                label="删除"
                text
                severity="danger"
                size="small"
                aria-label="删除当前数据集"
                @click="requestDeleteDataset(selected)"
              />
            </WiSpace>
          </header>

          <WiCard v-if="viewMode === 'catalog'" class="datasets-page__data-card">
            <WiTable
              class="datasets-page__table-area"
              :columns="catalogColumns"
              :rows="paginatedCatalogRows"
              row-key="id"
              :loading="loading"
              loading-text="正在加载数据集…"
              striped
              bordered
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
                    <WiButton
                      severity="secondary"
                      size="small"
                      icon="more-vertical"
                      aria-label="数据集操作"
                    />
                  </template>
                </WiDropdown>
              </template>
            </WiTable>

            <footer v-if="catalogRows.length > 0" class="datasets-page__footer">
              <WiPagination
                v-model="catalogPage"
                v-model:page-size="catalogPageSize"
                :total-records="catalogRows.length"
                show-size-picker
              />
            </footer>
          </WiCard>

          <template v-else>
            <section v-if="selected" class="datasets-page__schema" aria-label="字段结构">
              <span class="datasets-page__schema-label">字段结构</span>
              <WiSpace wrap :size="6">
                <WiTag
                  v-for="field in selected.fields"
                  :key="field.id"
                  :value="`${field.name} · ${fieldTypeLabel(field.fieldType)}`"
                  severity="secondary"
                  size="small"
                />
              </WiSpace>
            </section>

            <WiCard v-if="selected" class="datasets-page__data-card">
              <WiTable
                class="datasets-page__table-area"
                :columns="previewColumns"
                :rows="rows"
                row-key="id"
                :loading="rowsLoading"
                loading-text="正在加载数据…"
                striped
                bordered
                row-hover
                empty-text="暂无记录"
                empty-description="导入 CSV 或新增记录后，数据会显示在这里"
              />

              <footer class="datasets-page__footer">
                <WiPagination
                  v-model="page"
                  v-model:page-size="pageSize"
                  :total-records="totalRows"
                  show-size-picker
                />
              </footer>
            </WiCard>

            <WiCard v-else class="datasets-page__data-card datasets-page__empty-card">
              <div class="datasets-page__empty">
                <Database :size="28" aria-hidden="true" />
                <h2>选择一个数据集</h2>
                <p>从左侧目录或列表中选择数据集，预览数据记录。</p>
                <WiButton icon="plus" label="创建数据集" size="small" @click="showCreate = true" />
              </div>
            </WiCard>
          </template>
        </WiLayoutContent>
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
            <WiTextarea
              v-model="csv"
              placeholder="名称,金额,日期&#10;华东区域,12800,2026-08-01"
              :rows="8"
              fluid
            />
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
    </WiLayout>
  </div>
</template>
