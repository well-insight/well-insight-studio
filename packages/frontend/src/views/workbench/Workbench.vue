<script lang="ts" setup>
import type { ApiApplicationListItem } from '@/api/application'
import type { ApiDatasetListItem } from '@/api/dataset'
import type { ApiPageListItem } from '@/api/pages'
import { ArrowRight, Connection, DataAnalysis, DataBoard, Document, Grid, Monitor, RefreshRight } from '@element-plus/icons-vue'
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
const draftPages = computed(() => pages.value.filter(page => page.status === 'draft'))
const publishedPages = computed(() => pages.value.filter(page => page.status === 'published'))
const totalResources = computed(() => pages.value.length + datasets.value.length + applications.value.length)
const progress = computed(() => pages.value.length ? Math.round((publishedPages.value.length / pages.value.length) * 100) : 0)

interface RecentActivity {
  id: string
  title: string
  description: string
  time: string
  icon: typeof Monitor
  path: string
}

const recentActivities = computed<RecentActivity[]>(() => [
  ...pages.value.map(page => ({
    id: `page-${page.id}`,
    title: page.name,
    description: `${page.type === 'visualization' ? '可视化页面' : page.type === 'form' ? '表单页面' : '报表'} · ${page.status === 'published' ? '已发布' : '草稿'}`,
    time: page.updated_at,
    icon: page.type === 'visualization' ? Monitor : Document,
    path: page.type === 'visualization' ? '/project/pages/visual' : page.type === 'report' ? '/project/pages/report' : '/project/dataset',
  })),
  ...datasets.value.map(dataset => ({
    id: `dataset-${dataset.id}`,
    title: dataset.name,
    description: `数据集 · ${dataset.field_count} 个字段 · ${dataset.row_count} 条数据`,
    time: dataset.updated_at,
    icon: DataAnalysis,
    path: `/project/dataset?selectedDatasetId=${dataset.id}`,
  })),
  ...applications.value.map(application => ({
    id: `application-${application.id}`,
    title: application.title,
    description: `应用集 · ${application.status === 1 ? '启用中' : '未启用'}`,
    time: application.updated_at,
    icon: Grid,
    path: '/project/app-assembly',
  })),
].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 7))

function formatTime(value: string): string {
  if (!value)
    return '-'
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

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
  <div v-loading="loading" class="workbench">
    <section class="workbench__hero">
      <div>
        <span class="workbench__eyebrow">PROJECT OVERVIEW</span>
        <h1>工作台</h1>
        <p>集中查看项目资源、设计进度与最近工作，快速继续下一步。</p>
      </div>
      <div class="workbench__hero-actions">
        <el-button :icon="RefreshRight" @click="loadWorkbench">
          刷新数据
        </el-button>
        <el-button type="primary" :icon="DataBoard" @click="goTo('/project/pages/visual')">
          新建可视化
        </el-button>
      </div>
    </section>

    <section class="workbench__metrics" aria-label="资源概览">
      <button class="metric-card metric-card--visual" type="button" @click="goTo('/project/pages/visual')">
        <span class="metric-card__icon"><el-icon><Monitor /></el-icon></span>
        <strong>{{ visualPages.length }}</strong><span>可视化</span>
        <small>{{ publishedPages.length }} 个页面已发布</small>
      </button>
      <button class="metric-card metric-card--dataset" type="button" @click="goTo('/project/dataset')">
        <span class="metric-card__icon"><el-icon><DataAnalysis /></el-icon></span>
        <strong>{{ datasets.length }}</strong><span>数据集</span>
        <small>{{ datasets.reduce((count, item) => count + item.row_count, 0) }} 条数据记录</small>
      </button>
      <button class="metric-card metric-card--report" type="button" @click="goTo('/project/pages/report')">
        <span class="metric-card__icon"><el-icon><Document /></el-icon></span>
        <strong>{{ reportPages.length }}</strong><span>报表</span>
        <small>{{ formPages.length }} 个表单页面</small>
      </button>
      <button class="metric-card metric-card--app" type="button" @click="goTo('/project/app-assembly')">
        <span class="metric-card__icon"><el-icon><Grid /></el-icon></span>
        <strong>{{ applications.length }}</strong><span>应用集</span>
        <small>{{ applications.filter(item => item.status === 1).length }} 个正在启用</small>
      </button>
    </section>

    <section class="workbench__grid">
      <article class="panel">
        <div class="panel__head">
          <div><span>项目进度</span><h2>交付准备度</h2></div><el-tag type="success" effect="light">
            {{ progress }}%
          </el-tag>
        </div>
        <el-progress :percentage="progress" :stroke-width="12" :show-text="false" />
        <div class="progress-summary">
          <div><strong>{{ publishedPages.length }}</strong><span>已发布</span></div><div><strong>{{ draftPages.length }}</strong><span>待完成</span></div><div><strong>{{ totalResources }}</strong><span>全部资源</span></div>
        </div>
        <p class="panel__note">
          发布草稿页面以提高整体交付准备度。
        </p>
      </article>
      <article class="panel">
        <div class="panel__head">
          <div><span>快捷开始</span><h2>继续工作</h2></div>
        </div>
        <div class="quick-actions">
          <button type="button" @click="goTo('/project/pages/visual')">
            <el-icon><Monitor /></el-icon><span>可视化设计</span><el-icon><ArrowRight /></el-icon>
          </button>
          <button type="button" @click="goTo('/project/dataset')">
            <el-icon><DataAnalysis /></el-icon><span>管理数据集</span><el-icon><ArrowRight /></el-icon>
          </button>
          <button type="button" @click="goTo('/project/api')">
            <el-icon><Connection /></el-icon><span>导入数据</span><el-icon><ArrowRight /></el-icon>
          </button>
        </div>
      </article>
      <article class="panel panel--activity">
        <div class="panel__head">
          <div><span>最近活动</span><h2>资源动态</h2></div>
        </div>
        <div v-if="recentActivities.length" class="activity-list">
          <button v-for="activity in recentActivities" :key="activity.id" type="button" @click="goTo(activity.path)">
            <span class="activity-icon"><el-icon><component :is="activity.icon" /></el-icon></span>
            <span class="activity-copy"><strong>{{ activity.title }}</strong><small>{{ activity.description }}</small></span>
            <time>{{ formatTime(activity.time) }}</time>
          </button>
        </div>
        <el-empty v-else description="暂无资源动态" :image-size="70" />
      </article>
    </section>
  </div>
</template>

<style scoped>
.workbench {
  min-height: 100%;
  padding: 22px;
  background: var(--el-bg-color, #f7f8fa);
}
.workbench__hero {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: flex-end;
  padding: 26px 30px;
  border: 1px solid rgba(56, 103, 171, 0.16);
  border-radius: 20px;
  background: linear-gradient(115deg, #153c76, #2663b3 58%, #138f91);
  color: #fff;
  box-shadow: 0 18px 45px rgba(23, 70, 132, 0.18);
}
.workbench__eyebrow,
.panel__head > div > span {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 1.2px;
  text-transform: uppercase;
  opacity: 0.72;
}
h1 {
  margin: 8px 0 6px;
  font-size: 30px;
  line-height: 1;
}
.workbench__hero p {
  margin: 0;
  opacity: 0.85;
}
.workbench__hero-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.workbench__metrics {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 16px 0;
}
.metric-card {
  min-width: 0;
  padding: 18px;
  text-align: left;
  border: 1px solid rgba(67, 106, 160, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.84);
  box-shadow: 0 9px 24px rgba(42, 74, 122, 0.06);
  cursor: pointer;
}
.metric-card strong {
  display: inline-block;
  margin: 15px 6px 3px 0;
  font-size: 31px;
}
.metric-card > span:not(.metric-card__icon) {
  color: #536681;
  font-weight: 700;
}
.metric-card small {
  display: block;
  color: #8290a6;
}
.metric-card__icon {
  display: inline-flex;
  padding: 9px;
  border-radius: 10px;
  color: #fff;
}
.metric-card--visual .metric-card__icon {
  background: #367af2;
}
.metric-card--dataset .metric-card__icon {
  background: #15a78e;
}
.metric-card--report .metric-card__icon {
  background: #db8b17;
}
.metric-card--app .metric-card__icon {
  background: #8757d8;
}
.workbench__grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 14px;
}
.panel {
  min-width: 0;
  border: 1px solid rgba(67, 106, 160, 0.14);
  border-radius: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 9px 24px rgba(42, 74, 122, 0.06);
}
.panel__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 18px;
}
.panel__head h2 {
  margin: 5px 0 0;
  font-size: 18px;
}
.progress-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-top: 20px;
}
.progress-summary div {
  padding: 12px;
  border-radius: 10px;
  background: #f5f8fc;
}
.progress-summary strong,
.progress-summary span {
  display: block;
}
.progress-summary strong {
  font-size: 20px;
}
.progress-summary span,
.panel__note {
  color: #7c8ba0;
  font-size: 12px;
}
.panel__note {
  margin: 15px 0 0;
}
.quick-actions {
  display: grid;
  gap: 10px;
}
.quick-actions button,
.activity-list button {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 10px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}
.quick-actions button {
  padding: 13px;
  border-radius: 10px;
  background: #f6f9fd;
  color: #263a59;
}
.quick-actions button span {
  flex: 1;
  font-weight: 700;
}
.panel--activity {
  grid-column: 1 / -1;
}
.activity-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px 20px;
}
.activity-list button {
  padding: 8px;
  border-radius: 10px;
}
.activity-icon {
  display: inline-flex;
  padding: 8px;
  border-radius: 9px;
  background: #eaf2ff;
  color: #2764b4;
}
.activity-copy {
  flex: 1;
  min-width: 0;
}
.activity-copy strong,
.activity-copy small {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.activity-copy small,
.activity-list time {
  color: #7c8ba0;
  font-size: 12px;
}
.activity-list time {
  white-space: nowrap;
}
@media (max-width: 1000px) {
  .workbench__metrics {
    grid-template-columns: repeat(2, 1fr);
  }
  .workbench__hero {
    align-items: flex-start;
    flex-direction: column;
  }
  .activity-list {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 680px) {
  .workbench {
    padding: 12px;
  }
  .workbench__metrics,
  .workbench__grid {
    grid-template-columns: 1fr;
  }
  .panel--activity {
    grid-column: auto;
  }
}
</style>
