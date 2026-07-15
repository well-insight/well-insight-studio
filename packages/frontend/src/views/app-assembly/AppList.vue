<script lang="ts" setup>
import type { ApiApplicationListItem } from '@/api/application'
import type { WorkspaceApp } from '@/stores/workspaceStore'
import { Delete, EditPen, MoreFilled, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { storeToRefs } from 'pinia'
import { onActivated, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { createApplication, deleteApplication, fetchApplicationList, updateApplication } from '@/api/application'
import { AdaptiveDialog } from '@/components/adaptive-dialog'
import { ButtonTabs } from '@/components/button-tabs'
import { useWorkspaceStore } from '@/stores/workspaceStore'

const router = useRouter()
const workspaceStore = useWorkspaceStore()
const { appList } = storeToRefs(workspaceStore)

const loading = ref(false)
const createVisible = ref(false)
const createTitle = ref('')
const createClientType = ref<1 | 2>(1)

async function loadList() {
  loading.value = true
  try {
    const data = await fetchApplicationList('all')
    workspaceStore.setAppList((data.items || []).map(toWorkspaceApp))
  }
  catch (e) {
    ElMessage.error((e as Error).message || '加载应用列表失败')
  }
  finally {
    loading.value = false
  }
}

function toWorkspaceApp(row: ApiApplicationListItem): WorkspaceApp {
  return {
    id: row.id,
    title: row.title,
    status: row.status,
    clientType: row.client_type,
    starred: row.starred,
    lastUpdated: row.updated_at ? row.updated_at.slice(0, 10) : undefined,
  }
}

onMounted(() => { loadList() })
onActivated(() => { loadList() })

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
    const created = await createApplication({ title, client_type: createClientType.value, status: 1 })
    createVisible.value = false
    ElMessage.success('创建成功')
    router.push({ name: 'AppAssemblyEditor', params: { id: created.id } })
  }
  catch (e) {
    ElMessage.error((e as Error).message || '创建失败')
  }
}

async function removeApp(row: WorkspaceApp) {
  try {
    await ElMessageBox.confirm(`确定删除应用「${row.title}」吗？`, '删除应用', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  }
  catch { return }
  try {
    await deleteApplication(String(row.id))
    ElMessage.success('已删除')
    await loadList()
  }
  catch (e) {
    ElMessage.error((e as Error).message || '删除失败')
  }
}
</script>

<template>
  <div class="h-full w-full flex flex-col bg-[var(--el-bg-color)]">
    <div class="border-bottom-1 flex h-[54px] items-center justify-between px-3 shrink-0">
      <div>
        <h3 class="text-base font-medium">
          应用集
        </h3>
        <p class="text-xs text-gray-400">
          将独立页面拖拽组装成完整应用
        </p>
      </div>
      <el-button round type="primary" :icon="Plus" @click="openCreate">
        新建应用
      </el-button>
    </div>
    <el-table
      v-loading="loading"
      :data="appList"
      style="width: 100%"
      :cell-style="{ cursor: 'pointer' }"
      class="flex-1"
      @row-click="(row) => router.push({ name: 'AppAssemblyEditor', params: { id: row.id } })"
    >
      <el-table-column prop="title" label="应用名称" min-width="200" />
      <el-table-column prop="updated_at" label="最后更新" width="180" align="center" />
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button size="small" :icon="EditPen" @click.stop="router.push({ name: 'AppAssemblyEditor', params: { id: row.id } })">
            组装
          </el-button>
          <el-button size="small" type="danger" :icon="Delete" @click.stop="removeApp(row)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <AdaptiveDialog v-model="createVisible" title="新建应用" width="600px">
      <el-form label-width="100px">
        <el-form-item label="应用名称">
          <el-input v-model="createTitle" placeholder="请输入应用名称" />
        </el-form-item>
        <el-form-item label="客户端类型">
          <el-radio-group v-model="createClientType">
            <el-radio :value="1">
              PC 端
            </el-radio>
            <el-radio :value="2">
              移动端
            </el-radio>
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
    </AdaptiveDialog>
  </div>
</template>
