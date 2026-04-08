<script lang="ts" setup>
import type { WorkspaceApp } from '@/store/workspaceStore/workspaceStore'
import { MoreFilled, Plus, Star } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ButtonTabs } from '@/components/button-tabs'
import { useWorkspaceStore } from '@/store/workspaceStore/workspaceStore'

const router = useRouter()

const tableData = [
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles'
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles'
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles'
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles'
  }
]

const appStatus = ref('all')

const workspaceStore = useWorkspaceStore()

const { appList } = storeToRefs(workspaceStore)

const statusOptions = [
  {
    label: '全部应用',
    value: 'all'
  },
  {
    label: '已激活',
    value: 'enable'
  },
  {
    label: '已关闭',
    value: 'disable'
  }
]

function rowClick(row: WorkspaceApp) {
  workspaceStore.setCurrentApp(row)
  router.push({ name: 'ApplicationEdit', params: { id: row?.id } })
}
</script>

<template>
  <div class="w-full h-full">
    <div class="h-[54px] flex items-center justify-between border-bottom-1 px-3">
      <div>
        <!-- <el-segmented v-model="appStatus" :options="statusOptions">
          <template #default="scope">
            <div>{{ scope.item.label }}</div>
          </template>
        </el-segmented> -->
        <ButtonTabs v-model="appStatus" :options="statusOptions" />
      </div>
      <div>
        <el-button round type="primary" :icon="Plus"> 添加应用 </el-button>
      </div>
    </div>
    <el-table :data="appList" style="width: 100%" :cell-style="{ cursor: 'pointer' }" @row-click="rowClick">
      <el-table-column prop="title" label="名称" width="auto" />
      <el-table-column prop="status" label="状态" width="180" align="center">
        <template #default="{ row }">
          <el-button bg text size="small">
            <el-space>
              <span :class="[$style.status, row?.status === 1 ? $style.enable : $style.disable]" />
              {{ row?.status === 1 ? '激活' : '关闭' }}
            </el-space>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column prop="lastUpdated" label="最后更新时间" align="center" width="180" />
      <el-table-column prop="handle" label="操作" width="180" align="center">
        <template #default="{ row }">
          <div class="flex items-center justify-center">
            <el-button link :icon="MoreFilled" />
            <el-button link :icon="Star" />
          </div>
        </template>
      </el-table-column>
    </el-table>
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
