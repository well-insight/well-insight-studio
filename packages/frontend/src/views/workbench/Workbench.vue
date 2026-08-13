<script lang="ts" setup>
import type { EChartsOption } from 'echarts'
import type { ApiApplicationListItem } from '@/api/application'
import type { ApiDatasetListItem } from '@/api/dataset'
import type { ApiPageListItem } from '@/api/pages'
import { ArrowRight, Connection, DataAnalysis, DataBoard, Document, Grid, Monitor, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed, onActivated, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchApplicationList } from '@/api/application'
import { fetchAllDatasets } from '@/api/dataset'
import { fetchPageList } from '@/api/pages'
import { EChartsView } from '@/components/echarts'
import { useThemeStore } from '@/stores/themeStore'

const router = useRouter()
const themeStore = useThemeStore()
const { isDark, config: themeConfig } = storeToRefs(themeStore)

const loading = ref(false)
const pages = ref<ApiPageListItem[]>([])
const datasets = ref<ApiDatasetListItem[]>([])
const applications = ref<ApiApplicationListItem[]>([])
const pagesTotal = ref(0)

const visualPages = computed(() => pages.value.filter(page => page.type === 'visualization'))
const formPages = computed(() => pages.value.filter(page => page.type === 'form'))

const draftPages = computed(() => pages.value.filter(page => page.status === 'draft'))
const publishedPages = computed(() => pages.value.filter(page => page.status === 'published'))
const totalResources = computed(() => pages.value.length + datasets.value.length + applications.value.length)
const progress = computed(() => pages.value.length ? Math.round((publishedPages.value.length / pages.value.length) * 100) : 0)
const datasetRows = computed(() => datasets.value.reduce((count, item) => count + item.row_count, 0))
const datasetFields = computed(() => datasets.value.reduce((count, item) => count + item.field_count, 0))
const activeApps = computed(() => applications.value.filter(item => item.status === 1).length)
const starredApps = computed(() => applications.value.filter(item => item.starred).length)
const inactiveApps = computed(() => applications.value.length - activeApps.value)

const WORKBENCH_ICONS = {
  visual: Monitor,
  dataset: DataAnalysis,
  report: Document,
  app: Grid,
  api: Connection,
} as const

type WorkbenchIcon = typeof Monitor

const PAGE_TYPE_LABEL: Record<string, string> = {
  visualization: '可视化',
  form: '表单',
  report: '报表',
}

interface RecentActivity {
  id: string
  title: string
  description: string
  time: string
  icon: WorkbenchIcon
  path: string
}

const recentActivities = computed<RecentActivity[]>(() => [
  ...pages.value.filter(page => page.type !== 'report').map(page => ({
    id: `page-${page.id}`,
    title: page.name,
    description: `${PAGE_TYPE_LABEL[page.type] ?? page.type} · ${page.status === 'published' ? '已发布' : '草稿'}`,
    time: page.updated_at,
    icon: page.type === 'visualization'
      ? WORKBENCH_ICONS.visual
      : WORKBENCH_ICONS.dataset,
    path: page.type === 'visualization'
      ? '/project/pages/visual'
      : '/project/dataset',
  })),
  ...datasets.value.map(dataset => ({
    id: `dataset-${dataset.id}`,
    title: dataset.name,
    description: `数据集 · ${dataset.field_count} 字段 · ${dataset.row_count} 行`,
    time: dataset.updated_at,
    icon: WORKBENCH_ICONS.dataset,
    path: `/project/dataset?selectedDatasetId=${dataset.id}`,
  })),
  ...applications.value.map(application => ({
    id: `application-${application.id}`,
    title: application.title,
    description: `应用 · ${application.status === 1 ? '启用' : '停用'}${application.starred ? ' · 已标星' : ''}`,
    time: application.updated_at,
    icon: WORKBENCH_ICONS.app,
    path: '/project/app-assembly',
  })),
].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 15))

interface MixSlice {
  name: string
  value: number
  color: string
  path: string
}

const resourceMix = computed<MixSlice[]>(() => {
  void isDark.value
  void themeConfig.value.primary
  const signal = readCssVar('--cube-signal', '#2563EB')

  const success = readCssVar('--el-color-success', '#67C23A')
  const slices: MixSlice[] = [
    { name: '可视化', value: visualPages.value.length, color: signal, path: '/project/pages/visual' },
    { name: '表单', value: formPages.value.length, color: success, path: '/project/pages/form' },

    { name: '数据集', value: datasets.value.length, color: readCssVar('--el-color-primary-light-3', signal), path: '/project/dataset' },
    { name: '应用集', value: applications.value.length, color: readCssVar('--el-color-danger', '#F56C6C'), path: '/project/app-assembly' },
  ]
  return slices.filter(slice => slice.value > 0)
})

const mixShare = computed(() => {
  const total = Math.max(totalResources.value, 1)
  return resourceMix.value.map(slice => ({
    ...slice,
    percent: Math.round((slice.value / total) * 100),
  }))
})

const recentPages = computed(() =>
  pages.value.filter(page => page.type !== 'report')
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 8),
)

const topDatasets = computed(() =>
  [...datasets.value]
    .sort((a, b) => b.row_count - a.row_count || b.field_count - a.field_count)
    .slice(0, 8),
)

const recentApps = computed(() =>
  [...applications.value]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 8),
)

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function formatDayLabel(date: Date): string {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

/** 近 14 日资源更新次数 */
const TREND_DAYS = 14

const activityTrend = computed(() => {
  const today = startOfDay(new Date())
  const days = Array.from({ length: TREND_DAYS }, (_, index) => {
    const day = new Date(today)
    day.setDate(day.getDate() - (TREND_DAYS - 1 - index))
    return {
      key: startOfDay(day),
      label: formatDayLabel(day),
      value: 0,
    }
  })
  const indexByKey = new Map(days.map((day, index) => [day.key, index]))

  const stamp = (value: string) => {
    if (!value)
      return
    const key = startOfDay(new Date(value))
    const index = indexByKey.get(key)
    if (index !== undefined)
      days[index].value += 1
  }

  pages.value.forEach(page => stamp(page.updated_at))
  datasets.value.forEach(dataset => stamp(dataset.updated_at))
  applications.value.forEach(app => stamp(app.updated_at))

  return days
})

const periodUpdateCount = computed(() => activityTrend.value.reduce((sum, day) => sum + day.value, 0))
const todayUpdates = computed(() => activityTrend.value.at(-1)?.value ?? 0)
const avgDailyUpdates = computed(() => Math.round((periodUpdateCount.value / TREND_DAYS) * 10) / 10)

function readCssVar(name: string, fallback: string): string {
  if (typeof document === 'undefined')
    return fallback
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
}

function chartInk() {
  void isDark.value
  void themeConfig.value.appearance
  void themeConfig.value.primary
  return {
    text: readCssVar('--workbench-card-title', readCssVar('--el-text-color-primary', '#eaf2ff')),
    muted: readCssVar('--workbench-card-caption', readCssVar('--el-text-color-secondary', 'rgba(234,242,255,0.5)')),
    border: readCssVar('--workbench-soft-border', 'rgba(124,242,255,0.12)'),
    cardBg: readCssVar('--workbench-card-bg', '#0e141e'),
    signal: readCssVar('--cube-signal', '#7cf2ff'),
    brass: readCssVar('--cube-brass', '#c9a76a'),
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const mixChartOption = computed<EChartsOption>(() => {
  const ink = chartInk()
  const data = resourceMix.value
  const reduceMotion = prefersReducedMotion()

  if (!data.length) {
    return {
      animation: false,
      title: {
        text: '暂无',
        left: 'center',
        top: 'center',
        textStyle: { color: ink.muted, fontSize: 12, fontWeight: 500 },
      },
      series: [],
    }
  }

  return {
    animation: !reduceMotion,
    animationDuration: reduceMotion ? 0 : 420,
    color: data.map(slice => slice.color),
    tooltip: {
      trigger: 'item',
      confine: true,
      formatter: '{b}: {c} ({d}%)',
    },
    series: [
      {
        type: 'pie',
        radius: ['58%', '82%'],
        center: ['50%', '50%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 2,
          borderColor: ink.cardBg,
          borderWidth: 1.5,
        },
        label: { show: false },
        emphasis: {
          scale: true,
          scaleSize: 2,
        },
        data: data.map(slice => ({
          name: slice.name,
          value: slice.value,
        })),
      },
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '40%',
        style: {
          text: String(totalResources.value),
          textAlign: 'center',
          fill: ink.text,
          fontSize: 24,
          fontWeight: 600,
          fontFamily: 'Georgia, Times New Roman, serif',
        },
        bounding: 'raw',
        z: 10,
      },
      {
        type: 'text',
        left: 'center',
        top: '56%',
        style: {
          text: 'TOTAL',
          textAlign: 'center',
          fill: ink.muted,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: 1.5,
          fontFamily: 'Consolas, Menlo, monospace',
        },
        bounding: 'raw',
        z: 10,
      },
    ],
  }
})

const trendChartOption = computed<EChartsOption>(() => {
  const ink = chartInk()
  const days = activityTrend.value
  const reduceMotion = prefersReducedMotion()
  const peak = Math.max(...days.map(day => day.value), 1)

  return {
    animation: !reduceMotion,
    animationDuration: reduceMotion ? 0 : 480,
    grid: {
      left: 28,
      right: 8,
      top: 12,
      bottom: 22,
      containLabel: false,
    },
    tooltip: {
      trigger: 'axis',
      confine: true,
      formatter: (params: unknown) => {
        const items = Array.isArray(params) ? params : [params]
        const first = items[0] as { axisValue?: string, data?: number }
        return `${first?.axisValue ?? ''}<br/>更新 ${first?.data ?? 0} 次`
      },
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: days.map(day => day.label),
      axisLine: { lineStyle: { color: ink.border } },
      axisTick: { show: false },
      axisLabel: {
        color: ink.muted,
        fontSize: 9,
        fontFamily: 'Consolas, Menlo, monospace',
        interval: 1,
      },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      max: peak < 3 ? 3 : undefined,
      splitNumber: 3,
      splitLine: {
        lineStyle: { color: ink.border, type: 'dashed' },
      },
      axisLabel: {
        color: ink.muted,
        fontSize: 9,
      },
    },
    series: [
      {
        type: 'line',
        name: '更新',
        data: days.map(day => day.value),
        smooth: 0.3,
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: days.length <= 8,
        lineStyle: { width: 2, color: ink.signal },
        itemStyle: {
          color: ink.signal,
          borderColor: ink.cardBg,
          borderWidth: 1,
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(124, 242, 255, 0.22)' },
              { offset: 1, color: 'rgba(124, 242, 255, 0.01)' },
            ],
          },
        },
      },
    ],
  }
})

const statusChartOption = computed<EChartsOption>(() => {
  const ink = chartInk()
  const reduceMotion = prefersReducedMotion()
  const published = publishedPages.value.length
  const draft = draftPages.value.length

  return {
    animation: !reduceMotion,
    animationDuration: reduceMotion ? 0 : 360,
    grid: { left: 0, right: 0, top: 8, bottom: 8 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      confine: true,
    },
    xAxis: {
      type: 'value',
      show: false,
      max: Math.max(published + draft, 1),
    },
    yAxis: {
      type: 'category',
      data: ['页面'],
      show: false,
    },
    series: [
      {
        name: '已发布',
        type: 'bar',
        stack: 'status',
        barWidth: 14,
        data: [published],
        itemStyle: { color: ink.signal, borderRadius: [3, 0, 0, 3] },
      },
      {
        name: '草稿',
        type: 'bar',
        stack: 'status',
        barWidth: 14,
        data: [draft],
        itemStyle: { color: ink.brass, borderRadius: [0, 3, 3, 0] },
      },
    ],
  }
})

function formatTime(value: string): string {
  if (!value)
    return '-'
  const date = new Date(value)
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${date.getMonth() + 1}/${date.getDate()} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat('zh-CN').format(value)
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
    pagesTotal.value = pageResult.total
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
  <el-scrollbar v-loading="loading" class="workbench">
    <section class="workbench__hero workbench__band">
      <div class="workbench__hero-copy">
        <span class="workbench__eyebrow">PROJECT TELEMETRY</span>
        <div class="workbench__hero-title-row">
          <h1>工作台</h1>
          <p>资源构成、更新节奏与清单，一屏扫完。</p>
        </div>
      </div>
      <div class="workbench__hero-actions">
        <el-button size="small" :icon="RefreshRight" @click="loadWorkbench">
          刷新
        </el-button>
        <el-button size="small" type="primary" :icon="DataBoard" @click="goTo('/project/pages/visual')">
          新建可视化
        </el-button>
      </div>
    </section>

    <section class="workbench__metrics workbench__band" aria-label="资源概览">
      <button class="metric-card metric-card--visual" type="button" @click="goTo('/project/pages/visual')">
        <span class="metric-card__top">
          <span class="metric-card__icon"><el-icon :size="14"><component :is="WORKBENCH_ICONS.visual" /></el-icon></span>
          <span>可视化</span>
        </span>
        <strong>{{ visualPages.length }}</strong>
        <small>已发布 {{ publishedPages.filter(p => p.type === 'visualization').length }}</small>
      </button>
      <button class="metric-card metric-card--form" type="button" @click="goTo('/project/pages/form')">
        <span class="metric-card__top">
          <span class="metric-card__icon"><el-icon :size="14"><component :is="WORKBENCH_ICONS.dataset" /></el-icon></span>
          <span>表单</span>
        </span>
        <strong>{{ formPages.length }}</strong>
        <small>草稿 {{ draftPages.filter(p => p.type === 'form').length }}</small>
      </button>

      <button class="metric-card metric-card--dataset" type="button" @click="goTo('/project/dataset')">
        <span class="metric-card__top">
          <span class="metric-card__icon"><el-icon :size="14"><component :is="WORKBENCH_ICONS.dataset" /></el-icon></span>
          <span>数据集</span>
        </span>
        <strong>{{ datasets.length }}</strong>
        <small>{{ formatNumber(datasetRows) }} 行 · {{ datasetFields }} 字段</small>
      </button>
      <button class="metric-card metric-card--app" type="button" @click="goTo('/project/app-assembly')">
        <span class="metric-card__top">
          <span class="metric-card__icon"><el-icon :size="14"><component :is="WORKBENCH_ICONS.app" /></el-icon></span>
          <span>应用</span>
        </span>
        <strong>{{ applications.length }}</strong>
        <small>启用 {{ activeApps }} · 标星 {{ starredApps }}</small>
      </button>
      <button class="metric-card metric-card--pulse" type="button" @click="loadWorkbench">
        <span class="metric-card__top">
          <span class="metric-card__icon"><el-icon :size="14"><RefreshRight /></el-icon></span>
          <span>更新</span>
        </span>
        <strong>{{ periodUpdateCount }}</strong>
        <small>今日 {{ todayUpdates }} · 日均 {{ avgDailyUpdates }}</small>
      </button>
    </section>

    <section class="workbench__telemetry workbench__grow" aria-label="资源遥测">
      <article class="panel panel--mix">
        <div class="panel__head">
          <div>
            <span>Mix</span>
            <h2>资源构成</h2>
          </div>
          <span class="panel__meta">{{ totalResources }}</span>
        </div>
        <div class="mix-body panel__body">
          <div class="chart-frame chart-frame--mix">
            <EChartsView :option="mixChartOption" :loading="loading" />
          </div>
          <ul class="mix-legend">
            <li v-for="slice in mixShare" :key="slice.name">
              <button type="button" @click="goTo(slice.path)">
                <i :style="{ background: slice.color }" />
                <span class="mix-legend__name">{{ slice.name }}</span>
                <span class="mix-legend__value">{{ slice.value }}</span>
                <span class="mix-legend__pct">{{ slice.percent }}%</span>
              </button>
            </li>
            <li v-if="!mixShare.length" class="mix-legend__empty">
              暂无资源
            </li>
          </ul>
        </div>
      </article>

      <article class="panel panel--trend">
        <div class="panel__head">
          <div>
            <span>Pulse · {{ TREND_DAYS }}d</span>
            <h2>更新节奏</h2>
          </div>
          <span class="panel__meta">{{ periodUpdateCount }} 次</span>
        </div>
        <div class="chart-frame chart-frame--trend panel__body">
          <EChartsView :option="trendChartOption" :loading="loading" />
        </div>
      </article>

      <article class="panel panel--rail">
        <div class="panel__head">
          <div>
            <span>Delivery</span>
            <h2>交付 {{ progress }}%</h2>
          </div>
        </div>
        <div class="panel__body panel__body--rail">
          <div class="chart-frame chart-frame--status">
            <EChartsView :option="statusChartOption" :loading="loading" />
          </div>
          <div class="status-legend">
            <span><i class="is-published" />已发布 {{ publishedPages.length }}</span>
            <span><i class="is-draft" />草稿 {{ draftPages.length }}</span>
          </div>
          <div class="quick-actions">
            <button type="button" @click="goTo('/project/pages/visual')">
              <span class="quick-actions__icon"><el-icon :size="14"><component :is="WORKBENCH_ICONS.visual" /></el-icon></span>
              <span class="quick-actions__label">可视化</span>
              <el-icon :size="12">
                <ArrowRight />
              </el-icon>
            </button>
            <button type="button" @click="goTo('/project/dataset')">
              <span class="quick-actions__icon"><el-icon :size="14"><component :is="WORKBENCH_ICONS.dataset" /></el-icon></span>
              <span class="quick-actions__label">数据集</span>
              <el-icon :size="12">
                <ArrowRight />
              </el-icon>
            </button>
            <button type="button" @click="goTo('/project/api')">
              <span class="quick-actions__icon"><el-icon :size="14"><component :is="WORKBENCH_ICONS.api" /></el-icon></span>
              <span class="quick-actions__label">导入</span>
              <el-icon :size="12">
                <ArrowRight />
              </el-icon>
            </button>
            <button type="button" @click="goTo('/project/app-assembly')">
              <span class="quick-actions__icon"><el-icon :size="14"><component :is="WORKBENCH_ICONS.app" /></el-icon></span>
              <span class="quick-actions__label">应用</span>
              <el-icon :size="12">
                <ArrowRight />
              </el-icon>
            </button>
          </div>
        </div>
      </article>
    </section>

    <section class="workbench__inventory workbench__grow" aria-label="资源清单">
      <article class="panel">
        <div class="panel__head">
          <div>
            <span>Pages</span>
            <h2>最近页面</h2>
          </div>
          <button class="panel__link" type="button" @click="goTo('/project/pages/visual')">
            全部
          </button>
        </div>
        <div v-if="recentPages.length" class="data-table panel__body">
          <button
            v-for="page in recentPages"
            :key="page.id"
            type="button"
            class="data-row"
            @click="goTo(page.type === 'visualization' ? '/project/pages/visual' : '/project/pages/form')"
          >
            <span class="data-row__name">{{ page.name }}</span>
            <span class="data-row__tag">{{ PAGE_TYPE_LABEL[page.type] }}</span>
            <span class="data-row__tag" :class="page.status === 'published' ? 'is-ok' : 'is-warn'">
              {{ page.status === 'published' ? '已发布' : '草稿' }}
            </span>
            <time>{{ formatTime(page.updated_at) }}</time>
          </button>
        </div>
        <p v-else class="empty-hint">
          暂无页面
        </p>
      </article>

      <article class="panel">
        <div class="panel__head">
          <div>
            <span>Datasets</span>
            <h2>数据规模 Top</h2>
          </div>
          <button class="panel__link" type="button" @click="goTo('/project/dataset')">
            全部
          </button>
        </div>
        <div v-if="topDatasets.length" class="data-table panel__body">
          <button
            v-for="dataset in topDatasets"
            :key="dataset.id"
            type="button"
            class="data-row"
            @click="goTo(`/project/dataset?selectedDatasetId=${dataset.id}`)"
          >
            <span class="data-row__name">{{ dataset.name }}</span>
            <span class="data-row__num">{{ formatNumber(dataset.row_count) }} 行</span>
            <span class="data-row__num">{{ dataset.field_count }} 字段</span>
            <time>{{ formatTime(dataset.updated_at) }}</time>
          </button>
        </div>
        <p v-else class="empty-hint">
          暂无数据集
        </p>
      </article>

      <article class="panel">
        <div class="panel__head">
          <div>
            <span>Apps</span>
            <h2>应用集</h2>
          </div>
          <button class="panel__link" type="button" @click="goTo('/project/app-assembly')">
            全部
          </button>
        </div>
        <div v-if="recentApps.length" class="data-table panel__body">
          <button
            v-for="app in recentApps"
            :key="app.id"
            type="button"
            class="data-row"
            @click="goTo('/project/app-assembly')"
          >
            <span class="data-row__name">{{ app.title }}</span>
            <span class="data-row__tag" :class="app.status === 1 ? 'is-ok' : 'is-warn'">
              {{ app.status === 1 ? '启用' : '停用' }}
            </span>
            <span class="data-row__tag">{{ app.starred ? '标星' : `客户端 ${app.client_type}` }}</span>
            <time>{{ formatTime(app.updated_at) }}</time>
          </button>
        </div>
        <p v-else class="empty-hint">
          暂无应用 · 停用 {{ inactiveApps }}
        </p>
      </article>
    </section>

    <section class="workbench__activity workbench__grow workbench__grow--activity">
      <article class="panel panel--activity">
        <div class="panel__head">
          <div>
            <span>Recent · {{ recentActivities.length }}</span>
            <h2>资源动态</h2>
          </div>
        </div>
        <div v-if="recentActivities.length" class="activity-list panel__body">
          <button
            v-for="activity in recentActivities"
            :key="activity.id"
            type="button"
            @click="goTo(activity.path)"
          >
            <span class="activity-icon">
              <el-icon :size="14"><component :is="activity.icon" /></el-icon>
            </span>
            <span class="activity-copy">
              <strong>{{ activity.title }}</strong>
              <small>{{ activity.description }}</small>
            </span>
            <time>{{ formatTime(activity.time) }}</time>
          </button>
        </div>
        <p v-else class="empty-hint">
          暂无资源动态
        </p>
      </article>
    </section>
  </el-scrollbar>
</template>

<style scoped>
.workbench {
  height: 100%;
  min-height: 0;
  background: var(--workbench-bg);
}

.workbench :deep(.el-scrollbar__view) {
  box-sizing: border-box;
  display: grid;
  grid-template-rows: auto auto minmax(250px, 1.2fr) minmax(200px, 1fr) minmax(260px, 0.85fr);
  gap: 12px;
  width: 100%;
  min-height: 100%;
  padding: 16px 18px;
  background: var(--workbench-bg);
  color: var(--type-body, var(--el-text-color-primary));
}

.workbench__band {
  min-width: 0;
}

.workbench__grow {
  min-height: 0;
  min-width: 0;
}

.workbench__hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  padding: 14px 18px;
  border: 1px solid var(--workbench-hero-border);
  border-radius: var(--app-shell-radius, 8px);
  background: var(--workbench-hero-bg);
  color: var(--workbench-hero-title);
  box-shadow: var(--workbench-shadow, none);
}

.workbench__hero-title-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 10px 14px;
  margin-top: 2px;
}

.workbench__eyebrow,
.panel__head > div > span {
  display: block;
  margin: 0;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--workbench-hero-eyebrow, var(--type-eyebrow));
  font-family: var(--cube-font-mono, inherit);
}

.panel__head > div > span {
  color: var(--type-eyebrow, var(--workbench-card-caption));
}

h1 {
  margin: 0;
  font-size: 22px;
  line-height: 1.15;
  font-family: var(--cube-font-display, inherit);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--workbench-hero-title, var(--type-title));
}

.workbench__hero p {
  margin: 0;
  font-size: 13px;
  line-height: 1.4;
  color: var(--workbench-hero-lead, var(--type-body));
}

.workbench__hero-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.workbench__metrics {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin: 0;
}

.metric-card {
  min-width: 0;
  height: 100%;
  padding: 12px 14px;
  text-align: left;
  border: 1px solid var(--workbench-card-border);
  border-radius: var(--app-shell-radius, 8px);
  background: var(--workbench-card-bg);
  box-shadow: var(--workbench-shadow, none);
  cursor: pointer;
  color: var(--workbench-card-title, var(--type-title));
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.metric-card:hover {
  border-color: var(--workbench-hover-border);
  background: var(--workbench-hover-bg);
}

.metric-card:focus-visible,
.quick-actions button:focus-visible,
.activity-list button:focus-visible,
.data-row:focus-visible,
.mix-legend button:focus-visible,
.panel__link:focus-visible {
  outline: 2px solid var(--cube-signal, var(--el-color-primary));
  outline-offset: 1px;
}

.metric-card__top {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--workbench-card-label, var(--type-body));
  font-weight: 600;
  font-size: 12px;
}

.metric-card strong {
  display: block;
  margin: 8px 0 4px;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1;
  color: var(--workbench-card-title, var(--type-title));
}

.metric-card small {
  display: block;
  color: var(--workbench-card-caption, var(--type-caption));
  font-size: 11px;
  line-height: 1.35;
}

.metric-card__icon,
.quick-actions__icon,
.activity-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
  border-radius: var(--app-shell-radius, 4px);
  border: 1px solid transparent;
  line-height: 0;
}

.metric-card--visual .metric-card__icon,
.metric-card--pulse .metric-card__icon {
  background: rgba(var(--el-color-primary-rgb), 0.14);
  border-color: rgba(var(--el-color-primary-rgb), 0.24);
  color: var(--el-color-primary);
}

.metric-card--form .metric-card__icon {
  background: rgba(94, 200, 176, 0.14);
  border-color: rgba(94, 200, 176, 0.28);
  color: #2f9d86;
}

.metric-card--dataset .metric-card__icon {
  background: rgba(110, 168, 255, 0.14);
  border-color: rgba(110, 168, 255, 0.28);
  color: #3d7fd4;
}

.metric-card--report .metric-card__icon {
  background: color-mix(in srgb, var(--el-color-warning) 16%, transparent);
  border-color: color-mix(in srgb, var(--el-color-warning) 30%, transparent);
  color: var(--el-color-warning);
}

.metric-card--app .metric-card__icon {
  background: rgba(167, 139, 250, 0.14);
  border-color: rgba(167, 139, 250, 0.28);
  color: #7c63c8;
}

.metric-card__icon :deep(.el-icon),
.quick-actions__icon :deep(.el-icon),
.activity-icon :deep(.el-icon) {
  display: inline-flex !important;
  align-items: center;
  justify-content: center;
  margin: 0;
  line-height: 1;
}

.metric-card__icon :deep(.el-icon svg),
.quick-actions__icon :deep(.el-icon svg),
.activity-icon :deep(.el-icon svg) {
  width: 1em;
  height: 1em;
  display: block;
  shape-rendering: geometricPrecision;
}

.workbench__telemetry {
  display: grid;
  grid-template-columns: minmax(260px, 0.95fr) minmax(0, 1.25fr) minmax(220px, 0.8fr);
  gap: 12px;
  height: 100%;
}

.workbench__inventory {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  height: 100%;
  margin: 0;
}

.workbench__activity {
  height: 100%;
  margin: 0;
}

.workbench__activity .panel--activity {
  height: 100%;
}

.panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  height: 100%;
  border: 1px solid var(--workbench-card-border);
  border-radius: var(--app-shell-radius, 8px);
  padding: 14px 14px 12px;
  background: var(--workbench-card-bg);
  box-shadow: var(--workbench-shadow, none);
}

.panel__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 10px;
  gap: 8px;
  flex-shrink: 0;
}

.panel__head h2 {
  margin: 2px 0 0;
  font-size: 15px;
  line-height: 1.2;
  font-family: var(--cube-font-display, inherit);
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--workbench-card-title, var(--type-title));
}

.panel__meta,
.panel__link {
  flex-shrink: 0;
  color: var(--workbench-card-caption, var(--type-caption));
  font-size: 11px;
  font-family: var(--cube-font-mono, inherit);
  letter-spacing: 0.02em;
}

.panel__link {
  border: 0;
  background: transparent;
  cursor: pointer;
  padding: 0;
}

.panel__link:hover {
  color: var(--cube-signal, var(--el-color-primary));
}

.panel__body {
  flex: 1 1 auto;
  min-height: 0;
}

.panel__body--rail {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.mix-body {
  display: grid;
  grid-template-columns: minmax(140px, 0.9fr) minmax(0, 1.1fr);
  gap: 12px;
  align-items: stretch;
}

.chart-frame {
  width: 100%;
  min-height: 0;
  height: 100%;
}

.chart-frame--mix {
  min-height: 160px;
}

.chart-frame--trend {
  min-height: 160px;
}

.chart-frame--status {
  flex: 0 0 auto;
  height: 40px;
  min-height: 40px;
}

.mix-legend {
  list-style: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  margin: 0;
  padding: 0;
  min-height: 0;
  overflow: auto;
}

.mix-legend button {
  display: grid;
  grid-template-columns: 8px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 6px;
  border: 0;
  border-radius: var(--app-shell-radius, 4px);
  background: transparent;
  cursor: pointer;
  color: var(--workbench-card-title, var(--type-title));
  font-size: 12px;
}

.mix-legend button:hover {
  background: var(--workbench-hover-bg);
}

.mix-legend i {
  width: 8px;
  height: 8px;
  border-radius: 1px;
}

.mix-legend__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.mix-legend__value,
.mix-legend__pct {
  font-family: var(--cube-font-mono, inherit);
  color: var(--workbench-card-caption, var(--type-caption));
}

.mix-legend__value {
  min-width: 1.5em;
  text-align: right;
  color: var(--workbench-card-title, var(--type-title));
  font-weight: 600;
}

.mix-legend__empty {
  color: var(--workbench-card-caption, var(--type-caption));
  font-size: 12px;
  padding: 8px 4px;
}

.status-legend {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
  color: var(--workbench-card-caption, var(--type-caption));
  font-size: 11px;
}

.status-legend i {
  display: inline-block;
  width: 8px;
  height: 8px;
  margin-right: 4px;
  border-radius: 1px;
  vertical-align: middle;
}

.status-legend .is-published {
  background: var(--cube-signal, #7cf2ff);
}

.status-legend .is-draft {
  background: var(--cube-brass, var(--el-color-warning));
}

.quick-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-top: auto;
}

.quick-actions button,
.activity-list button,
.data-row {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 6px;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: var(--workbench-card-title, var(--type-title));
}

.quick-actions button {
  padding: 8px 8px;
  border-radius: var(--app-shell-radius, 4px);
  border: 1px solid var(--workbench-soft-border, transparent);
  background: var(--workbench-soft-bg);
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
}

.quick-actions button:hover,
.activity-list button:hover,
.data-row:hover {
  border-color: var(--workbench-hover-border);
  background: var(--workbench-hover-bg);
}

.quick-actions__label {
  flex: 1;
  font-weight: 600;
  font-size: 12px;
  color: var(--workbench-card-label, var(--type-body));
}

.quick-actions__icon,
.activity-icon {
  width: 26px;
  height: 26px;
  background: var(--workbench-soft-bg);
  border-color: var(--workbench-soft-border, transparent);
  color: var(--menu-icon-color, #2764b4);
}

.data-table {
  display: grid;
  align-content: start;
  gap: 2px;
  overflow: auto;
}

.data-row {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) auto auto auto;
  gap: 8px;
  align-items: center;
  padding: 7px 6px;
  border-radius: var(--app-shell-radius, 4px);
  border: 1px solid transparent;
  font-size: 12px;
}

.data-row__name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 600;
}

.data-row__tag,
.data-row__num,
.data-row time {
  color: var(--workbench-card-caption, var(--type-caption));
  font-size: 11px;
  white-space: nowrap;
}

.data-row__num,
.data-row time {
  font-family: var(--cube-font-mono, inherit);
}

.data-row__tag.is-ok {
  color: #2aa8b8;
}

.data-row__tag.is-warn {
  color: #b8893d;
}

.empty-hint {
  margin: 8px 0 4px;
  color: var(--workbench-card-caption, var(--type-caption));
  font-size: 12px;
}

.activity-list {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-content: start;
  gap: 4px 12px;
  overflow: auto;
}

.activity-list button {
  padding: 8px 6px;
  border-radius: var(--app-shell-radius, 4px);
  border: 1px solid transparent;
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

.activity-copy strong {
  font-size: 12px;
  font-weight: 600;
  color: var(--workbench-card-title, var(--type-title));
}

.activity-copy small,
.activity-list time {
  color: var(--workbench-card-caption, var(--type-caption));
  font-size: 11px;
}

.activity-list time {
  white-space: nowrap;
  font-family: var(--cube-font-mono, inherit);
  font-size: 10px;
}

@media (max-width: 1280px) {
  .workbench {
    height: auto;
    min-height: 100%;
    grid-template-rows: auto;
  }

  .workbench__metrics {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .workbench__telemetry {
    grid-template-columns: 1fr 1fr;
    height: auto;
  }

  .workbench__inventory,
  .workbench__activity {
    height: auto;
  }

  .panel--rail {
    grid-column: 1 / -1;
  }

  .chart-frame--mix,
  .chart-frame--trend {
    height: 180px;
  }

  .activity-list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 960px) {
  .workbench__hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .workbench__metrics {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .workbench__telemetry,
  .workbench__inventory {
    grid-template-columns: 1fr;
  }

  .panel--rail {
    grid-column: auto;
  }

  .activity-list {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .workbench {
    padding: 12px;
  }

  .workbench__metrics {
    grid-template-columns: 1fr;
  }

  .mix-body {
    grid-template-columns: 120px minmax(0, 1fr);
  }
}
</style>
