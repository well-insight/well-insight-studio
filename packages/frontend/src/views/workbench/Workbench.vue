<script lang="ts" setup>
import type { ApiApplicationListItem } from '@/api/application'
import type { ApiDatasetListItem } from '@/api/dataset'
import type { ApiPageListItem } from '@/api/pages'
import { DataAnalysis, DataBoard, Document, Grid, Monitor, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onActivated, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchApplicationList } from '@/api/application'
import { fetchAllDatasets } from '@/api/dataset'
import { fetchPageList } from '@/api/pages'

const router = useRouter()
const loading = ref(false)
const pages = ref<ApiPageListItem[]>([])
const datasets = ref<ApiDatasetListItem[]>([])
const applications = ref<ApiApplicationListItem[]>([])

const visualPages = computed(() => pages.value.filter(page => page.type === 'visualization'))
const formPages = computed(() => pages.value.filter(page => page.type === 'form'))
const reportPages = computed(() => pages.value.filter(page => page.type === 'report'))
const publishedPages = computed(() => pages.value.filter(page => page.status === 'published'))
const totalResources = computed(() => pages.value.length + datasets.value.length + applications.value.length)
const progress = computed(() => pages.value.length ? Math.round((publishedPages.value.length / pages.value.length) * 100) : 0)

async function loadWorkbench(): Promise<void> {
  loading.value = true
  try {
    const [pageResult, datasetResult, applicationResult] = await Promise.all([
      fetchPageList({ pageSize: 100 }),
      fetchAllDatasets(),
      fetchApplicationList(),
    ])
    pages.value = pageResult.items
    datasets.value = datasetResult
    applications.value = applicationResult.items
  }
  catch (error) {
    ElMessage.error((error as Error).message || '加载工作台资源失败')
  }
  finally {
    loading.value = false
  }
}

function goTo(path: string): void {
  void router.push(path)
}

onMounted(() => {
  void loadWorkbench()
})

onActivated(() => {
  void loadWorkbench()
})
</script>

<template>
  <main v-loading="loading" class="workbench">
    <header class="workbench__hero">
      <div>
        <span>PROJECT OVERVIEW</span>
        <h1>工作台</h1>
        <p>集中查看项目资源与工作进度。</p>
      </div>
      <div class="workbench__actions">
        <el-button :icon="RefreshRight" @click="loadWorkbench">
          刷新数据
        </el-button>
        <el-button type="primary" :icon="DataBoard" @click="goTo('/project/pages/visual')">
          新建可视化
        </el-button>
      </div>
    </header>

    <section class="metrics" aria-label="资源概览">
      <button type="button" @click="goTo('/project/pages/visual')">
        <el-icon><Monitor /></el-icon>
        <strong>{{ visualPages.length }}</strong>
        <span>可视化</span>
        <small>{{ publishedPages.length }} 个页面已发布</small>
      </button>
      <button type="button" @click="goTo('/project/dataset')">
        <el-icon><DataAnalysis /></el-icon>
        <strong>{{ datasets.length }}</strong>
        <span>数据集</span>
        <small>{{ datasets.reduce((count, item) => count + item.row_count, 0) }} 条数据记录</small>
      </button>
      <button type="button" @click="goTo('/project/pages/report')">
        <el-icon><Document /></el-icon>
        <strong>{{ reportPages.length }}</strong>
        <span>报表</span>
        <small>{{ formPages.length }} 个表单页面</small>
      </button>
      <button type="button" @click="goTo('/project/app-assembly')">
        <el-icon><Grid /></el-icon>
        <strong>{{ applications.length }}</strong>
        <span>应用集</span>
        <small>{{ applications.filter(item => item.status === 1).length }} 个正在启用</small>
      </button>
    </section>

    <section class="progress-card">
      <div>
        <span>项目进度</span>
        <h2>交付准备度</h2>
      </div>
      <el-tag type="success">
        {{ progress }}%
      </el-tag>
      <el-progress :percentage="progress" :stroke-width="12" :show-text="false" />
      <div class="progress-card__stats">
        <div><strong>{{ publishedPages.length }}</strong><span>已发布</span></div>
        <div><strong>{{ pages.length - publishedPages.length }}</strong><span>待完成</span></div>
        <div><strong>{{ totalResources }}</strong><span>全部资源</span></div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.workbench {
  min-height: 100%;
  padding: 22px;
  background: #f6f8fb;
}
.workbench__hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 26px 30px;
  border-radius: 20px;
  background: linear-gradient(115deg, #153c76, #2663b3 58%, #138f91);
  color: #fff;
}
.workbench__hero > div > span,
.progress-card > div > span {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.2px;
  opacity: 0.72;
}
h1 {
  margin: 8px 0 6px;
  font-size: 30px;
}
h2 {
  margin: 5px 0 0;
  font-size: 18px;
}
p {
  margin: 0;
  opacity: 0.85;
}
.workbench__actions {
  display: flex;
  gap: 10px;
}
.metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 16px 0;
}
.metrics button,
.progress-card {
  min-width: 0;
  padding: 18px;
  border: 1px solid #e5eaf2;
  border-radius: 16px;
  background: #fff;
  text-align: left;
  box-shadow: 0 9px 24px rgba(42, 74, 122, 0.06);
}
.metrics button {
  cursor: pointer;
}
.metrics button:hover {
  border-color: #bed0ed;
}
.metrics .el-icon {
  color: #2764b4;
  font-size: 22px;
}
.metrics strong {
  display: block;
  margin-top: 12px;
  font-size: 30px;
}
.metrics small {
  display: block;
  margin-top: 5px;
  color: #8290a6;
}
.progress-card {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 18px;
}
.progress-card :deep(.el-progress) {
  grid-column: 1 / -1;
}
.progress-card__stats {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.progress-card__stats div {
  padding: 12px;
  border-radius: 10px;
  background: #f5f8fc;
}
.progress-card__stats strong,
.progress-card__stats span {
  display: block;
}
.progress-card__stats span {
  color: #7c8ba0;
  font-size: 12px;
}
@media (max-width: 900px) {
  .metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  .workbench__hero {
    align-items: flex-start;
    flex-direction: column;
  }
}
@media (max-width: 600px) {
  .workbench {
    padding: 12px;
  }
  .metrics {
    grid-template-columns: 1fr;
  }
}
</style>
