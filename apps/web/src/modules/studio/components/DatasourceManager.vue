<script setup lang="ts">
import { computed, ref } from 'vue'
import { WiDialog, WiInput, WiSelect, message, toast } from '@well-insight/ui'
import { Database, Pencil, Trash2, Plus, RefreshCw, CheckCircle2, AlertCircle } from '@lucide/vue'
import type { ProjectDatasource } from '../../../api/datasources'
import { createDatasource, updateDatasource, deleteDatasource, testDatasource } from '../../../api/datasources'

const props = defineProps<{
  projectId: string | null
  datasources: ProjectDatasource[]
  currentId: string | null
}>()

const emit = defineEmits<{
  close: []
  refresh: []
  select: [id: string]
}>()

const visible = defineModel<boolean>('visible', { default: false })

const editingId = ref<string | null>(null)
const editingName = ref('')
const isAdding = ref(false)
const newName = ref('')
const newType = ref<'mysql' | 'postgres' | 'csv'>('mysql')
const newConnectionString = ref('')
const isLoading = ref(false)
const testResults = ref<Record<string, { ok: boolean; message?: string }>>({})
const testingId = ref<string | null>(null)

const sortedDatasources = computed(() =>
  [...props.datasources].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
)

function startEdit(ds: ProjectDatasource) {
  editingId.value = ds.id
  editingName.value = ds.name
}

function cancelEdit() {
  editingId.value = null
  editingName.value = ''
}

async function saveEdit(ds: ProjectDatasource) {
  const name = editingName.value.trim()
  if (!name) return
  try {
    await updateDatasource(ds.id, { name })
    message.success('已重命名数据源')
    emit('refresh')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '重命名失败')
  } finally {
    editingId.value = null
  }
}

async function confirmDelete(ds: ProjectDatasource) {
  if (!window.confirm(`确定删除数据源「${ds.name}」？相关的查询缓存会被一并清理。`)) return
  try {
    await deleteDatasource(ds.id)
    message.success('已删除数据源')
    if (props.currentId === ds.id) {
      const next = sortedDatasources.value.find(d => d.id !== ds.id)?.id ?? null
      emit('select', next ?? '')
    }
    emit('refresh')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '删除失败')
  }
}

async function startAdd() {
  isAdding.value = true
  newName.value = ''
  newType.value = 'mysql'
  newConnectionString.value = ''
}

function cancelAdd() {
  isAdding.value = false
}

async function submitAdd() {
  if (!props.projectId) return
  const name = newName.value.trim()
  if (!name) return

  isLoading.value = true
  try {
    const ds = await createDatasource({
      projectId: props.projectId,
      name,
      type: newType.value,
      connectionString: newConnectionString.value.trim() || undefined,
    })
    message.success('已创建数据源')
    isAdding.value = false
    emit('refresh')
    emit('select', ds.id)
  } catch (err) {
    message.error(err instanceof Error ? err.message : '创建失败')
  } finally {
    isLoading.value = false
  }
}

async function syncConnectionString(ds: ProjectDatasource) {
  const typeLabel = ds.type === 'postgres' ? 'PostgreSQL' : ds.type === 'csv' ? 'CSV' : 'MySQL'
  const placeholder = ds.type === 'csv' ? '粘贴 CSV 内容，首行为表头' : `${typeLabel}://user:pass@host:port/db`
  const connectionString = window.prompt(`请输入 ${typeLabel} 连接串或内容（示例：${placeholder}）`, ds.connectionString ?? '')
  if (connectionString === null) return
  isLoading.value = true
  try {
    await updateDatasource(ds.id, { connectionString: connectionString.trim() || undefined })
    message.success('已同步数据源 schema')
    emit('refresh')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '同步失败')
  } finally {
    isLoading.value = false
  }
}

async function testConnection(ds: ProjectDatasource) {
  if (!ds.connectionString) {
    testResults.value[ds.id] = { ok: false, message: '未配置连接串' }
    return
  }
  testingId.value = ds.id
  try {
    const result = await testDatasource(ds.id)
    testResults.value[ds.id] = result
    if (result.ok) {
      message.success('连接测试成功')
    } else {
      toast.error({ summary: '连接失败', detail: result.message })
    }
  } catch (err) {
    const errMessage = err instanceof Error ? err.message : '测试失败'
    testResults.value[ds.id] = { ok: false, message: errMessage }
    toast.error({ summary: '连接测试失败', detail: errMessage })
  } finally {
    testingId.value = null
  }
}

function onSelect(id: string) {
  emit('select', id)
  visible.value = false
}

function close() {
  visible.value = false
  emit('close')
}
</script>

<template>
  <WiDialog
    v-model:visible="visible"
    header="数据源管理"
    :style="{ width: '540px', height: '460px' }"
    :modal="true"
    :closable="true"
    :close-on-escape="true"
    @hide="close"
  >
    <div class="ds-manager-body">
      <div class="ds-manager-header">
        <span class="ds-count">{{ datasources.length }} 个数据源</span>
        <button class="btn-add" @click="startAdd">
          <Plus :size="12" /> 新增数据源
        </button>
      </div>

      <div v-if="isAdding" class="ds-add-form">
        <div class="form-row">
          <WiInput v-model="newName" label="名称" placeholder="例如：生产数据库" fluid />
          <WiSelect v-model="newType" label="类型" :options="[
            { label: 'MySQL', value: 'mysql' },
            { label: 'PostgreSQL', value: 'postgres' },
            { label: 'CSV', value: 'csv' },
          ]" fluid />
        </div>
        <WiInput v-model="newConnectionString" label="连接串 / CSV 内容（可选）" :placeholder="newType === 'csv' ? '粘贴 CSV 内容，首行为表头' : `${newType}://user:pass@host:port/db`" fluid />
        <div class="form-actions">
          <button class="btn-text" @click="cancelAdd">取消</button>
          <button class="btn-primary" :disabled="isLoading" @click="submitAdd">{{ isLoading ? '创建中…' : '创建' }}</button>
        </div>
      </div>

      <ul class="ds-list">
        <li
          v-for="ds in sortedDatasources"
          :key="ds.id"
          class="ds-item"
          :class="{ active: ds.id === currentId }"
        >
          <div class="ds-icon">
            <Database :size="14" />
          </div>
          <div class="ds-info">
            <div v-if="editingId === ds.id" class="ds-edit-row">
              <input v-model="editingName" class="ds-name-input" @keydown.enter="saveEdit(ds)" @keydown.escape="cancelEdit" />
              <button class="btn-icon" @click="saveEdit(ds)">保存</button>
              <button class="btn-icon" @click="cancelEdit">取消</button>
            </div>
            <template v-else>
              <div class="ds-name" @click="onSelect(ds.id)">{{ ds.name }}</div>
              <div class="ds-meta">
                {{ ds.type }} · {{ Object.keys(ds.schemaCache ?? {}).length }} 表
                <span v-if="ds.connectionString" class="ds-tag external">外部</span>
                <span v-else class="ds-tag sample">内置</span>
              </div>
            </template>
          </div>
          <div class="ds-actions">
            <button v-if="ds.type !== 'csv'" class="btn-icon" title="测试连接" :disabled="testingId === ds.id" @click.stop="testConnection(ds)">
              <CheckCircle2 :size="11" />
            </button>
            <button class="btn-icon" title="重命名" @click.stop="startEdit(ds)">
              <Pencil :size="11" />
            </button>
            <button class="btn-icon" title="连接串 / 同步 schema" @click.stop="syncConnectionString(ds)">
              <RefreshCw :size="11" />
            </button>
            <button class="btn-icon danger" title="删除" @click.stop="confirmDelete(ds)">
              <Trash2 :size="11" />
            </button>
          </div>
          <div v-if="testResults[ds.id]" class="test-result" :class="{ ok: testResults[ds.id]?.ok }" :title="testResults[ds.id]?.message ?? ''">
            <component :is="testResults[ds.id]?.ok ? CheckCircle2 : AlertCircle" :size="10" />
          </div>
        </li>
        <li v-if="datasources.length === 0" class="ds-empty">暂无数据源，点击上方按钮创建</li>
      </ul>
    </div>
  </WiDialog>
</template>

<style scoped>
.ds-manager-body {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 10px;
  min-height: 0;
}
.ds-manager-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.ds-count {
  font-size: 11px;
  color: var(--wi-text-secondary, #6a7b98);
}
.btn-add {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  padding: 5px 10px;
  border-radius: 5px;
  border: 1px solid var(--wi-primary, #3b82f6);
  background: var(--wi-primary, #3b82f6);
  color: white;
  cursor: pointer;
}
.btn-add:hover {
  opacity: 0.9;
}
.btn-add:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ds-add-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border: 1px solid var(--wi-border-color, #1e2638);
  border-radius: 6px;
  background: var(--wi-surface, #0a0f18);
  flex-shrink: 0;
}
.form-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 8px;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 6px;
}
.btn-text,
.btn-primary {
  font-size: 11px;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  border: 1px solid var(--wi-border-color, #2a3448);
}
.btn-text {
  background: transparent;
  color: var(--wi-text-secondary, #8a9bb5);
}
.btn-primary {
  background: var(--wi-primary, #3b82f6);
  border-color: var(--wi-primary, #3b82f6);
  color: white;
}
.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.ds-list {
  flex: 1;
  overflow-y: auto;
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.ds-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid var(--wi-border-color, #1e2638);
  background: var(--wi-surface, #0a0f18);
  cursor: pointer;
}
.ds-item:hover,
.ds-item.active {
  border-color: var(--wi-primary, #3b82f6);
  background: var(--wi-surface-hover, #141c2a);
}
.ds-icon {
  color: var(--wi-primary, #3b82f6);
  flex-shrink: 0;
}
.ds-info {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.ds-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--wi-text-color, #e8edf5);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ds-meta {
  font-size: 10px;
  color: var(--wi-text-secondary, #6a7b98);
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}
.ds-tag {
  font-size: 9px;
  padding: 0 4px;
  border-radius: 3px;
  border: 1px solid var(--wi-border-color, #1e2638);
}
.ds-tag.external {
  color: #10b981;
  border-color: #10b981;
}
.ds-tag.sample {
  color: #8b5cf6;
  border-color: #8b5cf6;
}
.ds-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.btn-icon {
  width: 22px;
  height: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--wi-border-color, #1e2638);
  border-radius: 4px;
  background: transparent;
  color: var(--wi-text-secondary, #8a9bb5);
  cursor: pointer;
}
.btn-icon:hover {
  color: var(--wi-text-color, #e8edf5);
  border-color: var(--wi-border-color, #2a3448);
  background: var(--wi-surface-hover, #141c2a);
}
.btn-icon.danger:hover {
  color: #ef4444;
  border-color: #ef4444;
}
.btn-icon:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.test-result {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #ef4444;
  flex-shrink: 0;
}
.test-result.ok {
  color: #10b981;
}
.ds-empty {
  text-align: center;
  padding: 24px;
  font-size: 11px;
  color: var(--wi-text-secondary, #4a5a78);
}
.ds-edit-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
.ds-name-input {
  flex: 1;
  background: var(--wi-surface-hover, #141c2a);
  border: 1px solid var(--wi-border-color, #1e2638);
  border-radius: 4px;
  color: var(--wi-text-color, #e8edf5);
  font-size: 12px;
  padding: 3px 6px;
  outline: none;
}
.ds-name-input:focus {
  border-color: var(--wi-primary, #3b82f6);
}
</style>
