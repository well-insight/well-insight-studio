<script lang="ts" setup>
import type { ApiApplicationListItem } from '@/api/application'
import type { WorkspaceApp } from '@/stores/workspaceStore'
import { Delete, EditPen, MoreFilled, Plus, Star, StarFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { onActivated, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  createApplication,
  deleteApplication,
  fetchApplicationList,
  updateApplication,
} from '@/api/application'
import { ButtonTabs } from '@/components/button-tabs'
import { useWorkspaceStore } from '@/stores/workspaceStore'

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const { appList } = storeToRefs(workspaceStore)

const appStatus = ref<'all' | 'enable' | 'disable'>('all')
const loading = ref(false)
const createVisible = ref(false)
const createTitle = ref('')
const createClientType = ref<1 | 2>(1)
const renameVisible = ref(false)
const renameTitle = ref('')
const renameTargetId = ref<string | null>(null)

const statusOptions = [
  { label: '全部应用', value: 'all' },
  { label: '已激活', value: 'enable' },
  { label: '已关闭', value: 'disable' },
]

function toWorkspaceApp(row: ApiApplicationListItem): WorkspaceApp {
  const iso = row.lastUpdated || row.updated_at
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    clientType: row.client_type,
    starred: row.starred,
    lastUpdated: iso ? iso.slice(0, 10) : undefined,
  }
}

async function loadList() {
  loading.value = true
  try {
    const data = await fetchApplicationList(appStatus.value)
    workspaceStore.setAppList((data.items || []).map(toWorkspaceApp))
  }
  catch (e) {
    ElMessage.error((e as Error).message || '加载应用列表失败')
  }
  finally {
    loading.value = false
  }
}

watch(appStatus, () => {
  loadList()
})

onMounted(() => {
  loadList()
})

onActivated(() => {
  loadList()
})

function rowClick(row: WorkspaceApp) {
  workspaceStore.setCurrentApp(row)
  router.push({ name: 'ApplicationEdit', params: { id: String(row.id) } })
}

function openCreate() {
  createTitle.value = ''
  createClientType.value = 1
  createVisible.value = true
}

async function submitCreate() {
  const title = createTitle.value.trim()
  if (!title) {
    ElMessage.warning('请输入应用名称')
    return
  }
  try {
    const created = await createApplication({
      title,
      client_type: createClientType.value,
      status: 1,
    })
    createVisible.value = false
    ElMessage.success('创建成功')
    await loadList()
    const row = toWorkspaceApp(created)
    workspaceStore.setCurrentApp(row)
    router.push({ name: 'ApplicationEdit', params: { id: String(created.id) } })
  }
  catch (e) {
    ElMessage.error((e as Error).message || '创建失败')
  }
}

function openRename(row: WorkspaceApp) {
  renameTargetId.value = String(row.id)
  renameTitle.value = row.title
  renameVisible.value = true
}

async function submitRename() {
  const id = renameTargetId.value
  const title = renameTitle.value.trim()
  if (!id || !title) {
    ElMessage.warning('请输入应用名称')
    return
  }
  try {
    await updateApplication(id, { title })
    renameVisible.value = false
    ElMessage.success('已更新名称')
    await loadList()
  }
  catch (e) {
    ElMessage.error((e as Error).message || '更新失败')
  }
}

async function removeApp(row: WorkspaceApp) {
  try {
    await ElMessageBox.confirm(`确定删除应用「${row.title}」吗？此操作不可恢复。`, '删除应用', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  }
  catch {
    return
  }
  try {
    await deleteApplication(String(row.id))
    ElMessage.success('已删除')
    await loadList()
  }
  catch (e) {
    ElMessage.error((e as Error).message || '删除失败')
  }
}

async function toggleStar(row: WorkspaceApp, ev: Event) {
  ev.stopPropagation()
  try {
    await updateApplication(String(row.id), { starred: !row.starred })
    await loadList()
  }
  catch (e) {
    ElMessage.error((e as Error).message || '操作失败')
  }
}

const starIcon = (row: WorkspaceApp) => (row.starred ? StarFilled : Star)
</script>

<template>
  <div class="h-full w-full">
    <div class="border-bottom-1 flex h-[54px] items-center justify-between px-3">
      <div>
        <ButtonTabs v-model="appStatus" :options="statusOptions" />
      </div>
      <div>
        <el-button round type="primary" :icon="Plus" @click="openCreate">
          添加应用
        </el-button>
      </div>
    </div>
    <el-table
      v-loading="loading"
      :data="appList"
      style="width: 100%"
      :cell-style="{ cursor: 'pointer' }"
      @row-click="rowClick"
    >
      <el-table-column prop="title" label="名称" min-width="160" />
      <el-table-column prop="status" label="状态" width="180" align="center">
        <template #default="{ row }">
          <el-button bg text size="small">
            <el-space>
              <span :class="[$style.status, row?.status === 1 ? $style.enable : $style.disable]" />
              {{ row?.status === 1 ? "激活" : "关闭" }}
            </el-space>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="lastUpdated" label="最后更新时间" align="center" width="180" />
      <el-table-column prop="handle" label="操作" width="180" align="center">
        <template #default="{ row }">
          <div class="flex items-center justify-center" @click.stop>
            <el-dropdown trigger="click">
              <el-button link :icon="MoreFilled" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item :icon="EditPen" @click="openRename(row)">
                    重命名
                  </el-dropdown-item>
                  <el-dropdown-item :icon="Delete" type="danger" @click="removeApp(row)">
                    删除
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button link @click="toggleStar(row, $event)">
              <el-icon :size="18">
                <component :is="starIcon(row)" />
              </el-icon>
            </el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="createVisible" title="添加应用" width="400px" destroy-on-close>
      <el-form label-width="88px">
        <el-form-item label="应用名称" required>
          <el-input
            v-model="createTitle"
            placeholder="请输入名称"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="端类型">
          <el-radio-group v-model="createClientType">
            <el-radio label="PC 端" :value="1" />
            <el-radio label="移动端" :value="2" />
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="submitCreate">
          创建
        </el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="renameVisible" title="重命名应用" width="400px" destroy-on-close>
      <el-input v-model="renameTitle" maxlength="200" show-word-limit />
      <template #footer>
        <el-button @click="renameVisible = false">
          取消
        </el-button>
        <el-button type="primary" @click="submitRename">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style lang="scss" module>
.status {
  height: 8px;
  width: 8px;
  border-radius: 50%;
  display: inline-block;

  &.enable {
    background-color: green;
  }

  &.disable {
    background-color: red;
  }
}
</style>
