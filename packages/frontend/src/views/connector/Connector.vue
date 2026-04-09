<script setup lang="ts">
import {
    Coin,
    Connection,
    DataAnalysis,
    Document,
    FolderOpened,
    Grid,
    List,
    Notebook,
    Odometer
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import DbImporter from './importer/DbImporter.vue'
import ExcelImporter from './importer/ExcelImporter.vue'

// 数据源原始列表
const allSources = [
  {
    type: 'excel',
    title: 'Excel',
    description: '从 Excel 文件导入',
    icon: Document,
    iconColor: '#2d8cff',
    category: 'file'
  },
  {
    type: 'mysql',
    title: 'MySQL',
    description: '连接 MySQL 数据库',
    icon: Coin,
    iconColor: '#f29111',
    category: 'relational'
  },
  {
    type: 'postgresql',
    title: 'PostgreSQL',
    description: '连接 PostgreSQL',
    icon: DataAnalysis,
    iconColor: '#326690',
    category: 'relational'
  },
  {
    type: 'oracle',
    title: 'Oracle',
    description: '连接 Oracle',
    icon: Odometer,
    iconColor: '#ea1e1e',
    category: 'relational'
  },
  {
    type: 'sqlserver',
    title: 'SQL Server',
    description: '连接 SQL Server',
    icon: Notebook,
    iconColor: '#b60000',
    category: 'relational'
  },
  {
    type: 'mongodb',
    title: 'MongoDB',
    description: '连接 MongoDB',
    icon: Connection,
    iconColor: '#47a248',
    category: 'nosql'
  }
  // 可继续添加更多
]

// 分组定义
const groups = [
  { name: '文件导入', key: 'file', icon: FolderOpened },
  { name: '关系型数据库', key: 'relational', icon: Grid },
  { name: 'NoSQL / 其他', key: 'nosql', icon: List }
]

// 按分组组织数据源
const groupedSources = computed(() => {
  return groups
    .map(group => ({
      name: group.name,
      icon: group.icon,
      items: allSources.filter(s => s.category === group.key)
    }))
    .filter(group => group.items.length > 0)
})

// 其余逻辑保持不变（与之前相同）...
const excelDialogVisible = ref(false)
const dbDialogVisible = ref(false)
const currentDbType = ref<string | null>(null)

const dbForm = ref({
  host: '',
  port: '',
  database: '',
  username: '',
  password: ''
})

function handleExcelSuccess(datasetId: string, datasetName: string) {
  ElMessage.success(`数据集「${datasetName}」已创建成功`)
  excelDialogVisible.value = false
}

function closeExcelDialog() {
  excelDialogVisible.value = false
}

function handleCardClick(type: string) {
  if (type === 'excel') {
    excelDialogVisible.value = true
  } else {
    currentDbType.value = type
    switch (type) {
      case 'mysql':
        dbForm.value.port = '3306'
        break
      case 'postgresql':
        dbForm.value.port = '5432'
        break
      case 'oracle':
        dbForm.value.port = '1521'
        break
      case 'sqlserver':
        dbForm.value.port = '1433'
        break
      case 'mongodb':
        dbForm.value.port = '27017'
        break
    }
    dbDialogVisible.value = true
  }
}

async function connectDatabase() {
  ElMessage.info(`连接 ${currentDbType.value} 数据库功能开发中...`)
  console.log('连接参数', dbForm.value)
  dbDialogVisible.value = false
}
</script>

<template>
  <div class="data-source-selector">
    <!-- 按分类渲染 -->
    <div v-if="!excelDialogVisible && !dbDialogVisible" class="w-full h-full flex-auto p-3">
      <div v-for="group in groupedSources" :key="group.name" class="mb-3">
        <div class="h-[42px] flex items-center px-3 mb-3 source-title-line">
          <el-space>
            <el-icon color="var(--el-color-primary)" :size="18">
              <component :is="group.icon" />
            </el-icon>
            <el-text type="primary">
              {{ group.name }}
            </el-text>
          </el-space>
        </div>

        <div class="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
          <el-card
            v-for="source in group.items"
            :key="source.type"
            shadow="never"
            class="source-card cursor-pointer"
            :body-style="{ padding: '12px' }"
            @click="handleCardClick(source.type)"
          >
            <div class="flex flex-col items-center text-center">
              <el-icon :size="32" :color="source.iconColor">
                <component :is="source.icon" />
              </el-icon>
              <h3 class="text-sm font-medium mt-2">
                {{ source.title }}
              </h3>
              <p class="text-gray-500 text-xs mt-1">
                {{ source.description }}
              </p>
            </div>
          </el-card>
        </div>
      </div>
    </div>

    <!-- Excel 导入对话框 -->
    <ExcelImporter
      v-else-if="excelDialogVisible"
      @success="handleExcelSuccess"
      @close="closeExcelDialog"
    />

    <!-- 数据库连接配置对话框（占位） -->
    <DbImporter v-else-if="dbDialogVisible" />
  </div>
</template>

<style scoped lang="scss">
.data-source-selector {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;

  .source-title-line {
    background-color: var(--el-color-primary-light-9);
    border-radius: var(--el-border-radius-base);
  }

  .source-card {
    //
  }
}
</style>
