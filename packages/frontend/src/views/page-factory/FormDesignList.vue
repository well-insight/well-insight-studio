<script lang="ts" setup>
import type { ApiFormRecord, ApiPageDetail, ApiPageFolder, ApiPageListItem, PageType } from '@/api/pages'
import type { FormField, FormSchema } from '@/form-designer/types'
import { EditPen, Folder, FolderOpened, MoreFilled, Plus, Tickets } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { computed, nextTick, onActivated, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  createPage,
  createPageFolder,
  createPageRecord,
  deletePage,
  deletePageFolder,
  deletePageRecord,
  fetchPage,
  fetchPageFolderTree,
  fetchPageList,
  fetchPageRecords,
  updatePage,
  updatePageFolder,
  updatePageRecord,
} from '@/api/pages'
import { AdaptiveDialog } from '@/components/adaptive-dialog'
import { FormRenderer } from '@/form-designer'
import { cloneFormSchema, isValidFormSchema, normalizeFormSchema } from '@/form-designer/form-designer.utils'

interface PageTreeNode {
  id: string
  label: string
  kind: 'folder' | 'page'
  folder?: ApiPageFolder
  page?: ApiPageListItem
  children?: PageTreeNode[]
}

interface TreeNodeInstance {
  expanded: boolean
  expand: () => void
  collapse: () => void
}

type PageRecordValue = string | number | boolean | null

const router = useRouter()

const treeLoading = ref(false)
const listLoading = ref(false)
const recordLoading = ref(false)
const pageTreeRef = ref()
const treeActionOpenNodeId = ref<string | null>(null)

const folders = ref<ApiPageFolder[]>([])
const pageItems = ref<ApiPageListItem[]>([])
const selectedFolderId = ref<string | null>(null)
const selectedPageId = ref<string | null>(null)
const selectedPageDetail = ref<ApiPageDetail | null>(null)
const records = ref<ApiFormRecord[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const folderDialogVisible = ref(false)
const folderEditDialogVisible = ref(false)
const folderEditing = ref<ApiPageFolder | null>(null)
const folderForm = reactive({ name: '', description: '', parent_id: null as string | null })
const folderSaving = ref(false)

const pageDialogVisible = ref(false)
const pageEditDialogVisible = ref(false)
const pageEditing = ref<ApiPageListItem | null>(null)
const pageForm = reactive({ name: '', folder_id: null as string | null })
const pageSaving = ref(false)

const recordDialogVisible = ref(false)
const recordEditing = ref<ApiFormRecord | null>(null)
const recordForm = reactive<Record<string, PageRecordValue>>({})
const recordRendererRef = ref<InstanceType<typeof FormRenderer> | null>(null)
const recordSaving = ref(false)

const pageSchema = computed<FormSchema | null>(() => {
  if (!selectedPageDetail.value || selectedPageDetail.value.type !== 'form')
    return null
  if (!isValidFormSchema(selectedPageDetail.value.dsl))
    return null
  return normalizeFormSchema(selectedPageDetail.value.dsl as FormSchema)
})

const formFields = computed<FormField[]>(() => pageSchema.value?.fields ?? [])
const recordFormSchema = computed<FormSchema | null>(() => {
  if (!pageSchema.value)
    return null
  const schema = cloneFormSchema(pageSchema.value)
  schema.config.submitBtn.show = false
  schema.config.resetBtn.show = false
  return schema
})

const folderCount = computed(() => {
  const count = (items: ApiPageFolder[]): number =>
    items.reduce((sum, item) => sum + 1 + count(item.children ?? []), 0)
  return count(folders.value)
})

const formCount = computed(() => pageItems.value.length)

const treeData = computed<PageTreeNode[]>(() => {
  const buildFolders = (items: ApiPageFolder[]): PageTreeNode[] =>
    items.map(folder => ({
      id: `folder:${folder.id}`,
      label: folder.name,
      kind: 'folder',
      folder,
      children: [
        ...buildFolders(folder.children ?? []),
        ...pageItems.value.filter(page => page.folder_id === folder.id).map(page => ({
          id: `page:${page.id}`,
          label: page.name,
          kind: 'page',
          page,
        })),
      ],
    }))

  return [
    {
      id: 'all',
      label: '全部',
      kind: 'folder',
      children: [
        ...buildFolders(folders.value),
        ...pageItems.value.filter(page => !page.folder_id).map(page => ({
          id: `page:${page.id}`,
          label: page.name,
          kind: 'page',
          page,
        })),
      ],
    },
  ]
})

const folderOptions = computed(() => {
  const flat: Array<{ label: string, value: string | null }> = [{ label: '全部', value: null }]
  const walk = (items: ApiPageFolder[], prefix = '') => {
    for (const item of items) {
      flat.push({ label: `${prefix}${item.name}`, value: item.id })
      if (item.children?.length)
        walk(item.children, `${prefix}  `)
    }
  }
  walk(folders.value)
  return flat
})

const treeCurrentKey = computed(() => {
  if (selectedPageId.value)
    return `page:${selectedPageId.value}`
  return undefined
})

const treeExpandedKeys = computed(() => {
  const keys = ['all']
  const walk = (items: ApiPageFolder[]) => {
    for (const item of items) {
      keys.push(`folder:${item.id}`)
      if (item.children?.length)
        walk(item.children)
    }
  }
  walk(folders.value)
  return keys
})

function normalizePages(items: ApiPageListItem[]) {
  return [...items].sort((a, b) => a.updated_at < b.updated_at ? 1 : -1)
}

function formatTime(value: string) {
  if (!value)
    return '-'
  const d = new Date(value)
  if (Number.isNaN(d.getTime()))
    return '-'
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function formatCellValue(field: FormField, value: unknown) {
  if (value == null || value === '')
    return '-'
  if (field.componentKey === 'datetimePicker' && typeof value === 'string')
    return formatTime(value)
  if (typeof value === 'boolean')
    return value ? '是' : '否'
  return String(value)
}

function getDefaultValue(field: FormField): PageRecordValue {
  if (field.defaultValue != null)
    return field.defaultValue as PageRecordValue
  if (field.componentKey === 'switch')
    return false
  return ''
}

function clearForm(target: Record<string, PageRecordValue>) {
  for (const key of Object.keys(target))
    delete target[key]
}

function fillRecordForm(record?: ApiFormRecord | null) {
  clearForm(recordForm)
  for (const field of formFields.value)
    recordForm[field.field] = (record?.values?.[field.field] ?? getDefaultValue(field)) as PageRecordValue
}

async function loadFolders() {
  const tree = await fetchPageFolderTree()
  folders.value = tree ?? []
}

async function loadPages() {
  const params: { type: PageType } = { type: 'form' }
  const result = await fetchPageList(params)
  pageItems.value = normalizePages(result.items)
}

async function loadTreeAndList() {
  treeLoading.value = true
  listLoading.value = true
  try {
    await Promise.all([loadFolders(), loadPages()])
    if (!selectedPageId.value && pageItems.value.length > 0)
      await selectPage(pageItems.value[0].id)
    else if (selectedPageId.value && !pageItems.value.some(item => item.id === selectedPageId.value))
      selectedPageId.value = null
  }
  catch (error) {
    ElMessage.error((error as Error).message || '加载失败')
    folders.value = []
    pageItems.value = []
  }
  finally {
    treeLoading.value = false
    listLoading.value = false
  }
}

async function syncTreeCurrentKey() {
  await nextTick()
  pageTreeRef.value?.setCurrentKey(treeCurrentKey.value)
}

async function selectPage(pageId: string) {
  selectedPageId.value = pageId
  page.value = 1
  const detail = await fetchPage(pageId)
  selectedPageDetail.value = detail
  selectedFolderId.value = detail.folder_id ?? null
  await loadRecords()
}

async function loadRecords() {
  if (!selectedPageId.value)
    return
  recordLoading.value = true
  try {
    const result = await fetchPageRecords(selectedPageId.value, { page: page.value, pageSize: pageSize.value })
    records.value = result.items
    total.value = result.total
  }
  finally {
    recordLoading.value = false
  }
}

async function onTreeNodeClick(data: PageTreeNode, node: TreeNodeInstance) {
  if (data.kind === 'folder') {
    if (node.expanded)
      node.collapse()
    else
      node.expand()
    await syncTreeCurrentKey()
    return
  }
  if (data.page)
    void selectPage(data.page.id)
}

function onTreeActionVisibleChange(visible: boolean, nodeId: string) {
  treeActionOpenNodeId.value = visible ? nodeId : null
}

function openCreatePageInFolder(folderId: string | null) {
  openCreatePage(folderId)
}

function onTreeMenuCommand(command: string, node: PageTreeNode) {
  if (node.kind === 'folder') {
    if (command === 'create-folder')
      openCreateFolder(node.folder?.id ?? null)
    else if (command === 'create-page')
      openCreatePageInFolder(node.folder?.id ?? null)
    else if (command === 'edit' && node.folder)
      openEditFolder(node.folder)
    else if (command === 'delete' && node.folder)
      void confirmDeleteFolder(node.folder)
    return
  }
  if (!node.page)
    return
  if (command === 'design')
    designPage(node.page.id)
  else if (command === 'edit')
    openEditPage(node.page)
  else if (command === 'delete')
    void removePage(node.page)
}

function designPage(pageId: string) {
  router.push({ name: 'FormPageEditor', params: { id: pageId } })
}

function openCreateFolder(parentId = selectedFolderId.value) {
  folderEditing.value = null
  folderForm.name = ''
  folderForm.description = ''
  folderForm.parent_id = parentId
  folderDialogVisible.value = true
}

async function saveFolder() {
  const name = folderForm.name.trim()
  if (!name) {
    ElMessage.warning('请输入目录名称')
    return
  }
  folderSaving.value = true
  try {
    if (folderEditing.value) {
      await updatePageFolder(folderEditing.value.id, {
        name,
        description: folderForm.description.trim() || null,
        parent_id: folderForm.parent_id,
      })
      ElMessage.success('目录已更新')
      folderEditDialogVisible.value = false
    }
    else {
      await createPageFolder({
        name,
        description: folderForm.description.trim() || null,
        parent_id: folderForm.parent_id,
      })
      ElMessage.success('目录已创建')
      folderDialogVisible.value = false
    }
    await loadTreeAndList()
  }
  catch (error) {
    ElMessage.error((error as Error).message || '保存失败')
  }
  finally {
    folderSaving.value = false
  }
}

function openEditFolder(folder: ApiPageFolder) {
  folderEditing.value = folder
  folderForm.name = folder.name
  folderForm.description = folder.description ?? ''
  folderForm.parent_id = folder.parent_id
  folderEditDialogVisible.value = true
}

async function confirmDeleteFolder(folder: ApiPageFolder) {
  try {
    await ElMessageBox.confirm(`确定删除目录「${folder.name}」吗？`, '删除目录', { type: 'warning' })
  }
  catch {
    return
  }
  try {
    await deletePageFolder(folder.id)
    ElMessage.success('目录已删除')
    await loadTreeAndList()
  }
  catch (error) {
    ElMessage.error((error as Error).message || '删除失败')
  }
}

function openCreatePage(folderId = selectedFolderId.value) {
  pageEditing.value = null
  pageForm.name = ''
  pageForm.folder_id = folderId
  pageDialogVisible.value = true
}

async function savePage() {
  const name = pageForm.name.trim()
  if (!name) {
    ElMessage.warning('请输入表单名称')
    return
  }
  pageSaving.value = true
  try {
    if (pageEditing.value) {
      await updatePage(pageEditing.value.id, { name, folder_id: pageForm.folder_id })
      ElMessage.success('表单已更新')
      pageEditDialogVisible.value = false
      await loadTreeAndList()
      if (selectedPageId.value === pageEditing.value.id)
        await selectPage(pageEditing.value.id)
    }
    else {
      const created = await createPage({
        name,
        folder_id: pageForm.folder_id,
        type: 'form',
        status: 'draft',
        dsl: { config: {}, fields: [] },
      })
      ElMessage.success('表单已创建')
      pageDialogVisible.value = false
      designPage(created.id)
    }
  }
  catch (error) {
    ElMessage.error((error as Error).message || '保存失败')
  }
  finally {
    pageSaving.value = false
  }
}

function openEditPage(pageItem: ApiPageListItem) {
  pageEditing.value = pageItem
  pageForm.name = pageItem.name
  pageForm.folder_id = pageItem.folder_id ?? null
  pageEditDialogVisible.value = true
}

async function removePage(pageItem: ApiPageListItem) {
  try {
    await ElMessageBox.confirm(`确定删除表单「${pageItem.name}」吗？`, '删除表单', { type: 'warning' })
  }
  catch {
    return
  }
  try {
    await deletePage(pageItem.id)
    ElMessage.success('表单已删除')
    if (selectedPageId.value === pageItem.id) {
      selectedPageId.value = null
      selectedPageDetail.value = null
      records.value = []
    }
    await loadTreeAndList()
  }
  catch (error) {
    ElMessage.error((error as Error).message || '删除失败')
  }
}

function openCreateRecord() {
  if (!selectedPageId.value) {
    ElMessage.warning('请先选择一个表单')
    return
  }
  recordEditing.value = null
  fillRecordForm()
  recordDialogVisible.value = true
}

function openEditRecord(row: ApiFormRecord) {
  recordEditing.value = row
  fillRecordForm(row)
  recordDialogVisible.value = true
}

async function saveRecord() {
  if (!selectedPageId.value)
    return
  const rendererValues = recordRendererRef.value?.getFormValues?.() as Record<string, PageRecordValue> | undefined
  const values: Record<string, string | number | boolean | null> = {}
  for (const field of formFields.value) {
    const raw = rendererValues?.[field.field] ?? recordForm[field.field]
    if (raw === '' || raw === undefined)
      values[field.field] = null
    else
      values[field.field] = raw as string | number | boolean | null
  }
  recordSaving.value = true
  try {
    if (recordEditing.value) {
      await updatePageRecord(selectedPageId.value, recordEditing.value.id, { values })
      ElMessage.success('记录已更新')
    }
    else {
      await createPageRecord(selectedPageId.value, { values })
      ElMessage.success('记录已新增')
    }
    recordDialogVisible.value = false
    await loadRecords()
  }
  catch (error) {
    ElMessage.error((error as Error).message || '保存失败')
  }
  finally {
    recordSaving.value = false
  }
}

async function removeRecord(row: ApiFormRecord) {
  try {
    await ElMessageBox.confirm('确定删除这条记录吗？', '删除记录', { type: 'warning' })
  }
  catch {
    return
  }
  try {
    await deletePageRecord(selectedPageId.value!, row.id)
    ElMessage.success('记录已删除')
    await loadRecords()
  }
  catch (error) {
    ElMessage.error((error as Error).message || '删除失败')
  }
}

async function refreshAll() {
  await loadTreeAndList()
  if (selectedPageId.value)
    await loadRecords()
}

function openSelectedPageDesigner() {
  if (!selectedPageDetail.value)
    return
  designPage(selectedPageDetail.value.id)
}

onMounted(() => {
  void loadTreeAndList()
})

onActivated(() => {
  void refreshAll()
})
</script>

<template>
  <div class="form-page-shell h-full w-full flex overflow-hidden bg-[var(--el-bg-color-page)]">
    <aside class="form-page-shell__sidebar w-[300px] shrink-0">
      <div class="form-page-shell__sidebar-head">
        <div class="min-w-0">
          <div class="form-page-shell__sidebar-title">
            目录
          </div>
        </div>
      </div>

      <div v-loading="treeLoading" class="form-page-shell__tree">
        <el-tree
          ref="pageTreeRef"
          class="custom-el-tree-wrapper"
          :data="treeData"
          node-key="id"
          highlight-current
          default-expand-all
          :expand-on-click-node="false"
          :default-expanded-keys="treeExpandedKeys"
          :current-node-key="treeCurrentKey"
          :props="{ label: 'label', children: 'children' }"
          @node-click="onTreeNodeClick"
        >
          <template #default="{ node, data }">
            <div class="form-page-shell__tree-row">
              <div class="flex items-center gap-2 py-1 min-w-0 flex-1">
                <el-icon :size="18">
                  <FolderOpened v-if="data.id === 'all' || (data.kind === 'folder' && node.expanded)" />
                  <Folder v-else-if="data.kind === 'folder'" />
                  <Tickets v-else />
                </el-icon>
                <span class="truncate">{{ node.label }}</span>
              </div>
              <div
                class="form-page-shell__tree-actions"
                :class="treeActionOpenNodeId === data.id ? 'form-page-shell__tree-actions--visible' : ''"
                @click.stop
              >
                <el-dropdown
                  trigger="hover"
                  @visible-change="(visible) => onTreeActionVisibleChange(visible, data.id)"
                  @command="(command) => onTreeMenuCommand(String(command), data)"
                >
                  <span class="form-page-shell__tree-more-trigger" @click.stop>
                    <el-icon :size="18">
                      <MoreFilled />
                    </el-icon>
                  </span>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-if="data.kind === 'folder'" command="create-folder">
                        新建目录
                      </el-dropdown-item>
                      <el-dropdown-item v-if="data.kind === 'folder'" command="create-page">
                        新建表单
                      </el-dropdown-item>
                      <el-dropdown-item v-if="data.kind === 'page'" command="design">
                        设计
                      </el-dropdown-item>
                      <el-dropdown-item v-if="data.id !== 'all'" command="edit">
                        编辑
                      </el-dropdown-item>
                      <el-dropdown-item v-if="data.id !== 'all'" command="delete" divided>
                        删除
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
            </div>
          </template>
        </el-tree>
      </div>

      <div class="form-page-shell__sidebar-foot">
        <div class="form-page-shell__sidebar-meta">
          <span>{{ folderCount }} 个目录</span>
          <span>{{ formCount }} 个表单</span>
        </div>
      </div>
    </aside>

    <main class="form-page-shell__main min-w-0 flex-1 overflow-hidden">
      <div class="form-page-shell__header">
        <div class="min-w-0">
          <h2 class="form-page-shell__title">
            {{ selectedPageDetail?.name || '表单设计' }}
          </h2>
          <p class="form-page-shell__subtitle">
            {{ selectedPageDetail ? `字段 ${formFields.length}，记录 ${total} 条` : '请选择一个表单进入记录表' }}
          </p>
        </div>
        <div class="form-page-shell__actions">
          <el-button :icon="Plus" type="primary" :disabled="!selectedPageId || formFields.length === 0" @click="openCreateRecord">
            新增记录
          </el-button>
          <el-button :icon="EditPen" type="primary" :disabled="!selectedPageDetail" @click="openSelectedPageDesigner">
            设计表单
          </el-button>
        </div>
      </div>

      <div class="form-page-shell__body">
        <el-empty
          v-if="!selectedPageId"
          class="form-page-shell__empty"
          description="请从左侧选择一个表单"
          :image-size="96"
        />
        <el-empty
          v-else-if="formFields.length === 0"
          class="form-page-shell__empty"
          description="请先设计表单"
          :image-size="96"
        >
          <el-button type="primary" :icon="EditPen" @click="openSelectedPageDesigner">
            设计表单
          </el-button>
        </el-empty>
        <el-table v-else v-loading="listLoading || recordLoading" :data="records" height="100%" stripe border>
          <el-table-column type="index" width="60" label="#" />
          <el-table-column
            v-for="field in formFields"
            :key="field.field"
            :label="field.label"
            min-width="160"
          >
            <template #default="{ row }">
              {{ formatCellValue(field, row.values?.[field.field]) }}
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="170" align="center">
            <template #default="{ row }">
              {{ formatTime(row.created_at) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right" align="center">
            <template #default="{ row }">
              <el-button text type="primary" @click="openEditRecord(row)">
                编辑
              </el-button>
              <el-button text type="danger" @click="removeRecord(row)">
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>

        <div class="form-page-shell__pager">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @current-change="loadRecords"
            @size-change="loadRecords"
          />
        </div>
      </div>
    </main>

    <AdaptiveDialog v-model="folderDialogVisible" title="新建目录" width="440px">
      <el-form label-position="top">
        <el-form-item label="目录名称">
          <el-input v-model="folderForm.name" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="folderForm.description" type="textarea" :rows="3" maxlength="2000" show-word-limit />
        </el-form-item>
        <el-form-item label="父级目录">
          <el-select v-model="folderForm.parent_id" placeholder="顶层" clearable filterable style="width: 100%">
            <el-option v-for="opt in folderOptions" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="folderDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="folderSaving" @click="saveFolder">
          保存
        </el-button>
      </template>
    </AdaptiveDialog>

    <AdaptiveDialog v-model="folderEditDialogVisible" title="编辑目录" width="440px">
      <el-form label-position="top">
        <el-form-item label="目录名称">
          <el-input v-model="folderForm.name" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="folderForm.description" type="textarea" :rows="3" maxlength="2000" show-word-limit />
        </el-form-item>
        <el-form-item label="父级目录">
          <el-select v-model="folderForm.parent_id" placeholder="顶层" clearable filterable style="width: 100%">
            <el-option v-for="opt in folderOptions" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="folderEditDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="folderSaving" @click="saveFolder">
          保存
        </el-button>
      </template>
    </AdaptiveDialog>

    <AdaptiveDialog v-model="pageDialogVisible" title="新建表单" width="440px">
      <el-form label-position="top">
        <el-form-item label="表单名称">
          <el-input v-model="pageForm.name" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="所属目录">
          <el-select v-model="pageForm.folder_id" placeholder="全部" clearable filterable style="width: 100%">
            <el-option v-for="opt in folderOptions" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pageDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="pageSaving" @click="savePage">
          保存
        </el-button>
      </template>
    </AdaptiveDialog>

    <AdaptiveDialog v-model="pageEditDialogVisible" title="编辑表单" width="440px">
      <el-form label-position="top">
        <el-form-item label="表单名称">
          <el-input v-model="pageForm.name" maxlength="200" show-word-limit />
        </el-form-item>
        <el-form-item label="所属目录">
          <el-select v-model="pageForm.folder_id" placeholder="全部" clearable filterable style="width: 100%">
            <el-option v-for="opt in folderOptions" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pageEditDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="pageSaving" @click="savePage">
          保存
        </el-button>
      </template>
    </AdaptiveDialog>

    <AdaptiveDialog
      v-model="recordDialogVisible"
      :title="recordEditing ? '编辑记录' : '新增记录'"
      width="960px"
      shell-class="form-record-dialog"
    >
      <div class="form-page-shell__record-form">
        <FormRenderer
          v-if="recordFormSchema"
          ref="recordRendererRef"
          :schema="recordFormSchema"
          :initial-values="recordForm"
          @submit="saveRecord"
        />
      </div>
      <template #footer>
        <el-button @click="recordDialogVisible = false">
          取消
        </el-button>
        <el-button type="primary" :loading="recordSaving" @click="saveRecord">
          保存
        </el-button>
      </template>
    </AdaptiveDialog>
  </div>
</template>

<style scoped>
.form-page-shell {
  gap: 12px;
  padding: 12px;
  background:
    radial-gradient(circle at 12% 10%, rgba(20, 184, 166, 0.1), transparent 28%),
    linear-gradient(135deg, rgba(248, 251, 255, 0.94), rgba(240, 249, 255, 0.78)), var(--el-bg-color-page);
}

.form-page-shell__sidebar {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid rgba(82, 124, 181, 0.18);
  border-radius: 12px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 251, 255, 0.86)), var(--el-bg-color);
  box-shadow: 0 12px 32px rgba(31, 58, 112, 0.08);
}

.form-page-shell__sidebar-head,
.form-page-shell__sidebar-foot,
.form-page-shell__header,
.form-page-shell__pager {
  background: rgba(255, 255, 255, 0.82);
}

.form-page-shell__sidebar-head {
  height: 58px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 14px 0 18px;
  border-bottom: 1px solid rgba(82, 124, 181, 0.12);
}

.form-page-shell__eyebrow {
  color: var(--el-text-color-secondary);
  font-size: 12px;
  font-weight: 500;
  line-height: 1.2;
}

.form-page-shell__sidebar-title {
  color: var(--el-text-color-primary);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.25;
}

.form-page-shell__tree {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
}

.form-page-shell__tree-row {
  display: flex;
  align-items: center;
  width: 100%;
  min-width: 0;
  padding-right: 4px;
}

.form-page-shell__tree-actions {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  margin-left: 4px;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
}

.form-page-shell__tree-row:hover .form-page-shell__tree-actions,
.form-page-shell__tree-actions--visible {
  opacity: 1;
  pointer-events: auto;
}

.form-page-shell__tree-more-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--el-text-color-secondary);
  outline: none;
}

.form-page-shell__tree-more-trigger:hover {
  color: var(--el-color-primary);
  background: rgba(var(--el-color-primary-rgb), 0.08);
}

.form-page-shell__sidebar-foot {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid rgba(82, 124, 181, 0.12);
}

.form-page-shell__sidebar-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.2;
}

.form-page-shell__sidebar-meta span {
  padding: 6px 8px;
  border-radius: 999px;
  background: rgba(var(--el-color-primary-rgb), 0.06);
}

.form-page-shell__main {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.form-page-shell__header {
  flex-shrink: 0;
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid rgba(82, 124, 181, 0.16);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(31, 58, 112, 0.08);
}

.form-page-shell__title {
  margin: 0;
  color: var(--el-text-color-primary);
  font-size: 18px;
  font-weight: 800;
  line-height: 1.2;
}

.form-page-shell__subtitle {
  margin: 6px 0 0;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.form-page-shell__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.form-page-shell__body {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.86);
  border: 1px solid rgba(82, 124, 181, 0.16);
  border-radius: 12px;
  box-shadow: 0 12px 32px rgba(31, 58, 112, 0.08);
}

.form-page-shell__record-form {
  padding: 8px 12px 0;
}

:deep(.form-record-dialog .adaptive-dialog__body) {
  min-height: 420px;
}

.form-page-shell__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-page-shell__pager {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  padding: 10px 12px;
  border-top: 1px solid rgba(82, 124, 181, 0.12);
}

:deep(.form-page-shell .el-tree) {
  background: transparent;
}

:deep(.form-page-shell .el-tree-node__content) {
  height: 34px;
  border-radius: 9px;
}

:deep(.form-page-shell .el-tree-node__content:hover) {
  background: rgba(var(--el-color-primary-rgb), 0.06);
}

:deep(.form-page-shell .el-tree-node.is-current > .el-tree-node__content) {
  background: linear-gradient(90deg, rgba(var(--el-color-primary-rgb), 0.14), rgba(20, 184, 166, 0.08));
  color: var(--el-color-primary);
  font-weight: 700;
}

:deep(.form-page-shell .el-table__header th) {
  background: color-mix(in srgb, var(--el-fill-color-light) 82%, var(--el-bg-color));
  color: var(--el-text-color-regular);
  font-weight: 700;
}

:deep(.form-page-shell .el-table__row:hover > td) {
  background: rgba(var(--el-color-primary-rgb), 0.035);
}

:global(html.dark) .form-page-shell {
  background:
    radial-gradient(circle at 12% 10%, rgba(20, 184, 166, 0.1), transparent 28%),
    linear-gradient(135deg, rgba(6, 17, 28, 0.95), rgba(7, 26, 43, 0.8)), var(--el-bg-color-page);
}

:global(html.dark) .form-page-shell__sidebar,
:global(html.dark) .form-page-shell__header,
:global(html.dark) .form-page-shell__body {
  border-color: rgba(140, 210, 255, 0.14);
  background: rgba(8, 28, 48, 0.72);
}

:global(html.dark) .form-page-shell__sidebar-head,
:global(html.dark) .form-page-shell__sidebar-foot,
:global(html.dark) .form-page-shell__pager {
  background: rgba(13, 40, 64, 0.72);
}
</style>
