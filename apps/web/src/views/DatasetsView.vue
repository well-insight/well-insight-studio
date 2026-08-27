<script setup lang="ts">
import type { TableColumn } from '@well-insight/ui'
import type { Dataset, DatasetFieldType, DatasetFolder } from '../api/datasets'
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Database,
  FilePlus2,
  Folder,
  FolderOpen,
  FolderPlus,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
} from '@lucide/vue'
import { message, WiButton, WiConfirmDialog, WiDialog, WiInput, WiScrollbar, WiSelect, WiTable, WiTag, WiTextarea } from '@well-insight/ui'
import { computed, onMounted, ref } from 'vue'
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
const datasets = ref<Dataset[]>([])
const folders = ref<DatasetFolder[]>([])
const selectedId = ref<string | null>(null)
const selectedFolderId = ref<string | null>(null)
const expandedFolders = ref<Record<string, boolean>>({})
const rows = ref<Record<string, unknown>[]>([])
const loading = ref(false)
const rowsLoading = ref(false)
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

const selected = computed(() => datasets.value.find(item => item.id === selectedId.value) ?? null)
const tableColumns = computed<TableColumn[]>(() => selected.value?.fields.map(field => ({
  key: field.id,
  label: field.name,
  sortable: true,
  minWidth: 150,
})) ?? [])
const visibleFolders = computed(() => {
  const result: { folder: DatasetFolder; level: number }[] = []
  function visit(parentId: string | null, level: number) {
    for (const folder of childFolders(parentId)) {
      result.push({ folder, level })
      if (expandedFolders.value[folder.id]) visit(folder.id, level + 1)
    }
  }
  visit(null, 0)
  return result
})

function datasetsInFolder(folderId: string | null) {
  return datasets.value.filter(item => item.folderId === folderId)
}

function childFolders(parentId: string | null) {
  return folders.value.filter(folder => folder.parentId === parentId)
}

function toggleFolder(folder: DatasetFolder) {
  expandedFolders.value[folder.id] = !expandedFolders.value[folder.id]
  selectedFolderId.value = folder.id
  selectedId.value = null
}


function selectAll() {
  selectedFolderId.value = null
  selectedId.value = null
  rows.value = []
}

function selectFolder(folder: DatasetFolder) {
  selectedFolderId.value = folder.id
  selectedId.value = null
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
      await updateDatasetFolder(editingFolder.value.id, { name: nameValue, description: folderDescription.value.trim() || null })
      message.success('目录已更新')
    } else {
      await createDatasetFolder({ name: nameValue, description: folderDescription.value.trim() || undefined, parentId: selectedFolderId.value })
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
    if (selectedFolderId.value === folderToDelete.value.id) selectedFolderId.value = null
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
    folders.value.forEach(folder => { expandedFolders.value[folder.id] = true })
    if (selectedId.value && !datasets.value.some(item => item.id === selectedId.value)) selectedId.value = null
    if (!selectedId.value && datasets.value[0]) await openDataset(datasets.value[0])
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载数据集失败')
  } finally {
    loading.value = false
  }
}

async function openDataset(dataset: Dataset) {
  selectedId.value = dataset.id
  selectedFolderId.value = dataset.folderId
  rowsLoading.value = true
  try {
    const result = await listDatasetRows(dataset.id, 1, 100)
    rows.value = result.rows.map(row => ({ id: row.id, ...row.values }))
  } catch (error) {
    message.error(error instanceof Error ? error.message : '加载数据失败')
    rows.value = []
  } finally {
    rowsLoading.value = false
  }
}

function addField() {
  fields.value.push({ name: `字段${fields.value.length + 1}`, fieldType: 'text' })
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
    showCreate.value = false
    message.success('数据集已创建')
    await load()
    const created = datasets.value.find(item => item.id === dataset.id)
    if (created) await openDataset(created)
  } catch (error) {
    message.error(error instanceof Error ? error.message : '创建失败')
  }
}

async function importCsv() {
  if (!selected.value || !csv.value.trim()) return message.warn('请粘贴 CSV 内容')
  const lines = csv.value.trim().split(/\r?\n/).map(line => line.split(','))
  const headers = lines.shift() ?? []
  const imported = lines.map(line => Object.fromEntries(headers.map((header, index) => [selected.value!.fields[index]?.id ?? header, line[index] ?? null])))
  try {
    await addDatasetRows(selected.value.id, imported)
    csv.value = ''
    message.success(`已导入 ${imported.length} 行`)
    await openDataset(selected.value)
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
    selectedId.value = null
    rows.value = []
    await load()
  } catch (error) {
    message.error(error instanceof Error ? error.message : '删除失败')
  }
}


onMounted(load)
</script>

<template>
  <div class="datasets-page">
    <header class="datasets-topbar">
      <div class="topbar-left">
        <WiButton text size="small" aria-label="返回首页" @click="router.push('/')">
          <ArrowLeft :size="15" />
        </WiButton>
        <div class="page-identity">
          <div class="page-icon">
            <Database :size="17" />
          </div><div><strong>数据集</strong><span>DATA CATALOG</span></div>
        </div>
      </div>
      <div class="topbar-right">
        <WiTag :value="`${datasets.length} 个独立数据集`" severity="info" /><WiButton size="small" @click="showCreate = true">
          <Plus :size="14" />新建数据集
        </WiButton>
      </div>
    </header>

    <div class="datasets-workspace">
      <aside class="catalog-sidebar">
        <div class="sidebar-heading">
          <div><span class="eyebrow">WORKSPACE</span><h2>目录</h2></div><div class="sidebar-actions">
            <WiButton text size="small" aria-label="新建目录" @click="openCreateFolder">
              <FolderPlus :size="15" />
            </WiButton><WiButton text size="small" aria-label="新建数据集" @click="showCreate = true">
              <FilePlus2 :size="15" />
            </WiButton>
          </div>
        </div>
        <div class="catalog-summary">
          <Database :size="14" /><span>我的数据集</span><small>{{ datasets.length }}</small>
        </div>
        <WiScrollbar class="catalog-scroll" :native="false" trigger="hover" aria-label="数据集目录">
          <nav class="catalog-tree">
            <WiButton class="tree-item tree-root" :class="{ active: selectedFolderId === null && !selectedId }" variant="ghost" fluid native-type="button" @click="selectAll">
              <FolderOpen :size="15" /><span>全部数据集</span><small>{{ datasets.length }}</small>
            </WiButton>
            <template v-for="entry in visibleFolders" :key="entry.folder.id">
              <WiButton class="tree-item" :class="{ active: selectedFolderId === entry.folder.id && !selectedId }" variant="ghost" fluid native-type="button" :style="{ paddingLeft: `${14 + entry.level * 16}px` }" @click="selectFolder(entry.folder)">
                <span class="tree-toggle" @click.stop="toggleFolder(entry.folder)"><ChevronDown v-if="expandedFolders[entry.folder.id]" :size="13" /><ChevronRight v-else :size="13" /></span><Folder :size="15" /><span>{{ entry.folder.name }}</span><small>{{ datasetsInFolder(entry.folder.id).length }}</small>
              </WiButton>
              <div class="tree-actions" :style="{ paddingLeft: `${14 + entry.level * 16}px` }">
                <WiButton text icon-only size="small" aria-label="编辑目录" @click="openEditFolder(entry.folder)">
                  <Pencil :size="12" />
                </WiButton><WiButton text severity="danger" icon-only size="small" aria-label="删除目录" @click="requestDeleteFolder(entry.folder)">
                  <Trash2 :size="12" />
                </WiButton>
              </div>
              <template v-if="expandedFolders[entry.folder.id]">
                <WiButton v-for="dataset in datasetsInFolder(entry.folder.id)" :key="dataset.id" class="tree-item tree-dataset" :style="{ paddingLeft: `${39 + entry.level * 16}px` }" :class="{ active: selectedId === dataset.id }" variant="ghost" fluid native-type="button" @click="openDataset(dataset)">
                  <Database :size="14" /><span>{{ dataset.name }}</span>
                </WiButton>
              </template>
            </template>
            <WiButton v-for="dataset in datasetsInFolder(null)" :key="dataset.id" class="tree-item tree-dataset" :class="{ active: selectedId === dataset.id }" variant="ghost" fluid native-type="button" @click="openDataset(dataset)">
              <Database :size="14" /><span>{{ dataset.name }}</span>
            </WiButton>
            <div v-if="folders.length === 0 && datasets.length === 0" class="catalog-empty">
              还没有数据集<br><small>点击右上角开始创建</small>
            </div>
          </nav>
        </WiScrollbar>
        <div class="sidebar-footer">
          <span>数据基础</span><strong>{{ datasets.reduce((total, item) => total + item.rowCount, 0).toLocaleString() }} 条记录</strong>
        </div>
      </aside>

      <main class="dataset-main">
        <div class="dataset-toolbar">
          <div class="dataset-title">
            <div class="dataset-title-icon">
              <Database :size="16" />
            </div><div>
              <h1>{{ selected?.name || '选择一个数据集' }}</h1><p v-if="selected">
                {{ selected.description || '可供多个可视化项目复用的业务数据' }} · {{ selected.fields.length }} 个字段 · {{ selected.rowCount.toLocaleString() }} 条记录
              </p><p v-else>
                从左侧目录选择数据集，查看和管理数据记录
              </p>
            </div>
          </div>
          <div class="dataset-actions">
            <WiButton text size="small" :disabled="!selected" @click="selected && openDataset(selected)">
              <RefreshCw :size="14" />刷新
            </WiButton><WiButton size="small" :disabled="!selected" @click="showImport = true">
              <Upload :size="14" />导入数据
            </WiButton><WiButton size="small" :disabled="!selected" @click="showCreate = true">
              <Plus :size="14" />新增数据集
            </WiButton><WiButton v-if="selected" text severity="danger" size="small" aria-label="删除当前数据集" @click="requestDeleteDataset(selected)">
              <Trash2 :size="14" />
            </WiButton>
          </div>
        </div>
        <div class="table-container">
          <div v-if="selected" class="table-caption">
            <span>数据预览</span><small>显示最近 100 条记录 · 横向滚动查看更多字段</small>
          </div>
          <WiTable v-if="selected" :columns="tableColumns" :rows="rows" row-key="id" :loading="rowsLoading" loading-text="正在加载数据…" striped bordered row-hover empty-text="暂无记录" empty-description="导入 CSV 或新增记录后，数据会显示在这里" />
          <div v-else class="dataset-empty">
            <div class="empty-icon">
              <Database :size="24" />
            </div><h2>选择一个数据集</h2><p>从左侧目录选择数据集，开始查看数据表格</p><WiButton size="small" @click="showCreate = true">
              <Plus :size="14" />创建数据集
            </WiButton>
          </div>
        </div>
      </main>
    </div>

    <WiDialog v-model="showCreate" header="创建数据集" width="460px">
      <section class="create-panel">
        <div class="panel-header">
          <span class="eyebrow">NEW DATASET</span>
        </div><WiInput v-model="name" label="名称" placeholder="例如：销售明细" fluid /><div class="field-list">
          <div class="field-list-heading">
            <span>字段定义</span><WiButton text size="small" @click="addField">
              <Plus :size="13" />添加字段
            </WiButton>
          </div><div v-for="(field, index) in fields" :key="index" class="field-row">
            <WiInput v-model="field.name" placeholder="字段名" fluid /><WiSelect v-model="field.fieldType" :options="[{ label: '文本', value: 'text' }, { label: '数字', value: 'number' }, { label: '时间', value: 'datetime' }]" fluid />
          </div>
        </div><div class="panel-actions">
          <WiButton text @click="showCreate = false">
            取消
          </WiButton><WiButton :loading="loading" @click="create">
            创建数据集
          </WiButton>
        </div>
      </section>
    </WiDialog>
    <WiDialog v-model="showImport" header="导入数据" width="520px">
      <section class="create-panel import-panel">
        <div class="panel-header">
          <span class="eyebrow">IMPORT RECORDS</span>
        </div><p class="import-hint">
          当前数据集：{{ selected?.name }}。第一行填写字段名称，后续每行填写一条记录。
        </p><WiTextarea v-model="csv" class="csv-input" placeholder="名称,金额,日期&#10;华东区域,12800,2026-08-01" :rows="8" fluid /><div class="panel-actions">
          <WiButton text @click="showImport = false">
            取消
          </WiButton>
          <WiButton :loading="rowsLoading" @click="importCsv().then(() => { showImport = false })">
            <Upload :size="14" />开始导入
          </WiButton>
        </div>
      </section>
    </WiDialog>
    <WiDialog v-model="showFolderDialog" :header="editingFolder ? '编辑目录' : '新建目录'" width="420px">
      <section class="create-panel">
        <WiInput v-model="folderName" label="目录名称" placeholder="例如：销售数据" fluid />
        <WiTextarea v-model="folderDescription" label="目录说明" placeholder="可选" :rows="3" fluid />
        <div class="panel-actions">
          <WiButton text @click="showFolderDialog = false">
            取消
          </WiButton><WiButton @click="saveFolder">
            保存
          </WiButton>
        </div>
      </section>
    </WiDialog>
    <WiConfirmDialog v-model="showDeleteFolderDialog" header="删除目录" type="warn" :message="`确定删除目录「${folderToDelete?.name ?? ''}」吗？只有空目录可以删除。`" accept-label="删除" reject-label="取消" accept-severity="danger" @accept="confirmDeleteFolder" />
    <WiConfirmDialog v-model="showDeleteDatasetDialog" header="删除数据集" type="warn" :message="`确定删除数据集「${datasetToDelete?.name ?? ''}」吗？此操作不可恢复。`" accept-label="删除" reject-label="取消" accept-severity="danger" @accept="confirmDeleteDataset" />
  </div>
</template>

<style scoped>
.datasets-page { --page-ground: var(--wi-color-ground-background, var(--wi-color-surface)); --page-surface: var(--wi-color-surface); --page-elevated: color-mix(in srgb, var(--wi-color-surface) 94%, var(--wi-color-primary)); --page-border: var(--wi-color-border); --page-text: var(--wi-color-text); --page-muted: var(--wi-color-text-muted); --page-primary: var(--wi-color-primary); display: flex; height: 100%; min-height: 0; flex-direction: column; overflow: hidden; color: var(--page-text); background: var(--page-ground); }
.datasets-topbar { display: flex; height: 64px; flex: 0 0 auto; align-items: center; justify-content: space-between; padding: 0 24px; border-bottom: 1px solid var(--page-border); background: var(--page-surface); }.topbar-left,.topbar-right,.page-identity,.dataset-actions,.dataset-title { display: flex; align-items: center; }.topbar-left,.topbar-right { gap: 14px; }.page-identity { gap: 10px; }.page-icon,.dataset-title-icon,.empty-icon { display: grid; place-items: center; color: var(--page-primary); background: color-mix(in srgb, var(--page-primary) 12%, var(--page-surface)); }.page-icon { width: 30px; height: 30px; border-radius: 8px; }.page-identity strong { display: block; font-size: 14px; }.page-identity span,.eyebrow { color: var(--page-muted); font-size: 9px; letter-spacing: .14em; }.datasets-workspace { display: flex; min-height: 0; flex: 1; }.catalog-sidebar { display: flex; width: 258px; flex: 0 0 258px; min-height: 0; flex-direction: column; border-right: 1px solid var(--page-border); background: var(--page-surface); }.sidebar-heading { display: flex; align-items: center; justify-content: space-between; padding: 22px 18px 14px; }.sidebar-actions { display: flex; align-items: center; gap: 2px; }.sidebar-heading h2 { margin: 5px 0 0; font-size: 18px; font-weight: 600; }.catalog-summary { display: flex; align-items: center; gap: 8px; margin: 0 12px 8px; padding: 9px 10px; border-radius: 7px; color: var(--page-muted); background: var(--page-elevated); font-size: 11px; }.catalog-summary small,.tree-item small { margin-left: auto; color: var(--page-muted); font-size: 10px; }.catalog-scroll { min-height: 0; flex: 1; }.catalog-tree { padding: 4px 10px 18px; }.tree-item { display: flex; width: 100%; align-items: center; gap: 7px; min-height: 34px; padding: 6px 8px; border: 0; border-radius: 6px; color: var(--page-muted); background: transparent; text-align: left; font: inherit; font-size: 12px; cursor: pointer; }.tree-item:hover,.tree-item.active { color: var(--page-text); background: color-mix(in srgb, var(--page-primary) 10%, var(--page-surface)); }.tree-item.active { box-shadow: inset 2px 0 var(--page-primary); }.tree-item svg { flex: 0 0 auto; }.tree-actions { display: none; align-items: center; gap: 2px; margin-left: 4px; }.tree-item:hover .tree-actions,.tree-item.active .tree-actions { display: inline-flex; }.tree-actions :deep(.wi-button) { min-width: 22px; padding: 2px; color: var(--page-muted); }.tree-actions :deep(.wi-button:hover) { color: var(--page-primary); }.tree-root { color: var(--page-text); font-weight: 600; }.tree-toggle { display: grid; width: 13px; place-items: center; }.tree-dataset { padding-left: 39px; }.tree-dataset.active { color: var(--page-primary); }.catalog-empty { padding: 34px 14px; color: var(--page-muted); text-align: center; font-size: 12px; line-height: 1.8; }.sidebar-footer { display: flex; justify-content: space-between; margin: 12px; padding: 12px 4px 2px; border-top: 1px solid var(--page-border); color: var(--page-muted); font-size: 10px; }.sidebar-footer strong { color: var(--page-text); font-weight: 600; }.dataset-main { display: flex; min-width: 0; min-height: 0; flex: 1; flex-direction: column; }.dataset-toolbar { display: flex; min-height: 78px; flex: 0 0 auto; align-items: center; justify-content: space-between; gap: 18px; padding: 0 28px; border-bottom: 1px solid var(--page-border); background: var(--page-surface); }.dataset-title { min-width: 0; gap: 12px; }.dataset-title-icon { width: 34px; height: 34px; flex: 0 0 auto; border-radius: 9px; }.dataset-title h1 { overflow: hidden; margin: 0 0 5px; font-size: 16px; font-weight: 600; text-overflow: ellipsis; white-space: nowrap; }.dataset-title p { overflow: hidden; margin: 0; color: var(--page-muted); font-size: 11px; text-overflow: ellipsis; white-space: nowrap; }.dataset-actions { flex: 0 0 auto; gap: 7px; }.table-container { min-width: 0; min-height: 0; flex: 1; overflow: auto; padding: 20px 28px 28px; }.table-caption { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; color: var(--page-text); font-size: 12px; }.table-caption small { color: var(--page-muted); font-size: 10px; }.dataset-empty { display: grid; min-height: 320px; place-items: center; align-content: center; gap: 8px; color: var(--page-muted); text-align: center; }.dataset-empty h2 { margin: 8px 0 0; color: var(--page-text); font-size: 16px; font-weight: 600; }.dataset-empty p { margin: 0 0 10px; font-size: 12px; }.empty-icon { width: 52px; height: 52px; border-radius: 14px; }.create-overlay { position: fixed; z-index: 20; inset: 0; display: grid; place-items: center; padding: 20px; background: color-mix(in srgb, var(--wi-color-text) 32%, transparent); }.create-panel { display: flex; width: min(460px, 100%); gap: 18px; padding: 24px; border: 1px solid var(--page-border); border-radius: 12px; background: var(--page-surface); box-shadow: var(--wi-shadow-lg, var(--wi-shadow-md)); flex-direction: column; }.panel-header { display: flex; align-items: flex-start; justify-content: space-between; }.panel-header h2 { margin: 5px 0 0; font-size: 20px; }.panel-header button { border: 0; color: var(--page-muted); background: transparent; font-size: 24px; cursor: pointer; }.import-hint { margin: -6px 0 0; color: var(--page-muted); font-size: 11px; line-height: 1.6; }.csv-input { width: 100%; min-height: 180px; box-sizing: border-box; resize: vertical; border: 1px solid var(--page-border); border-radius: 7px; color: var(--page-text); background: var(--page-ground); padding: 12px; font: inherit; font-size: 12px; line-height: 1.6; outline: none; }.csv-input:focus { border-color: var(--page-primary); }.field-list { display: flex; flex-direction: column; gap: 8px; }.field-list-heading,.panel-actions { display: flex; align-items: center; justify-content: space-between; }.field-list-heading { color: var(--page-text); font-size: 12px; }.field-row { display: grid; grid-template-columns: 1fr 100px; gap: 8px; }.field-row select { min-width: 0; border: 1px solid var(--page-border); border-radius: 6px; color: var(--page-text); background: var(--page-surface); padding: 0 8px; font: inherit; font-size: 11px; }.panel-actions { justify-content: flex-end; gap: 8px; padding-top: 4px; border-top: 1px solid var(--page-border); }
@media (max-width: 760px) { .catalog-sidebar { width: 210px; flex-basis: 210px; }.datasets-topbar,.dataset-toolbar { padding-right: 14px; padding-left: 14px; }.dataset-toolbar { align-items: flex-start; flex-direction: column; padding-top: 14px; padding-bottom: 14px; }.dataset-actions { width: 100%; overflow-x: auto; }.table-container { padding: 16px 14px 24px; } }
</style>
