<script setup lang="ts">
import type {ProjectSummary} from '../api/projects';
import { ArrowRight, Clock, FolderKanban, LayoutTemplate, LogOut, Plus, Trash2 } from '@lucide/vue'
import { message, WiButton, WiCard, WiInput, WiSkeleton, WiTag } from '@well-insight/ui'
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createProject, deleteProject, listProjects  } from '../api/projects'
import { useAuthStore } from '../styles/stores/authStore'
import { useProjectStore } from '../styles/stores/projectStore'

const router = useRouter()
const projectStore = useProjectStore()
const authStore = useAuthStore()

const projects = ref<ProjectSummary[]>([])
const loading = ref(true)
const newProjectName = ref('')
const creating = ref(false)

onMounted(loadProjects)

async function loadProjects() {
  loading.value = true
  try {
    projects.value = await listProjects()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '加载项目列表失败')
  } finally {
    loading.value = false
  }
}

async function onCreate() {
  const name = newProjectName.value.trim() || '未命名项目'
  creating.value = true
  try {
    const project = await createProject(name, { version: 1, widgets: [], canvas: { zoom: 1 } })
    projectStore.refreshList()
    router.push({ path: '/studio', query: { project: project.id } })
  } catch (err) {
    message.error(err instanceof Error ? err.message : '创建项目失败')
  } finally {
    creating.value = false
    newProjectName.value = ''
  }
}

function openProject(id: string) {
  router.push({ path: '/studio', query: { project: id } })
}

async function signOut() {
  try {
    await authStore.logout()
    await router.push('/login')
  } catch (err) {
    message.error(err instanceof Error ? err.message : '退出失败')
  }
}

async function onDelete(id: string, name: string) {
  if (!window.confirm(`确定删除项目「${name}」？此操作不可恢复。`)) return
  try {
    await deleteProject(id)
    message.success('项目已删除')
    await loadProjects()
    projectStore.refreshList()
  } catch (err) {
    message.error(err instanceof Error ? err.message : '删除失败')
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}
</script>

<template>
  <div class="home min-h-screen bg-[var(--wi-color-surface)] text-[var(--wi-color-text)]">
    <header class="home-header flex items-center justify-between border-b border-[var(--wi-color-border)] bg-[var(--wi-color-surface-elevated)] px-4 py-3 sm:px-8">
      <div class="brand flex items-center gap-3">
        <div class="brand-logo grid size-9 place-items-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 text-sm font-extrabold text-white">
          WI
        </div>
        <div>
          <h1 class="m-0 text-base font-bold">
            Well-Insight
          </h1>
          <p class="brand-sub m-0 text-xs text-[var(--wi-color-text-muted)]">
            数据可视化工作台
          </p>
        </div>
      </div>
      <div class="header-actions flex items-center gap-3">
        <WiTag v-if="authStore.user" :value="authStore.user.displayName" severity="info" />
        <WiButton
          severity="secondary"
          text
          size="small"
          @click="signOut"
        >
          <LogOut :size="12" /> 退出
        </WiButton>
      </div>
    </header>

    <main class="home-main mx-auto max-w-[1200px] p-4 sm:p-8">
      <section class="hero mb-8 flex flex-col justify-between gap-8 rounded-xl border border-[var(--wi-color-border)] bg-gradient-to-br from-blue-500/[0.08] to-cyan-400/[0.05] p-5 sm:flex-row sm:items-end sm:p-7">
        <div class="hero-text">
          <h2 class="m-0 mb-2 text-xl font-bold sm:text-[22px]">
            从数据到洞察，只需几分钟
          </h2>
          <p class="hero-desc mb-[18px] mt-0 max-w-[460px] text-[13px] leading-normal text-[var(--wi-color-text-muted)]">
            创建项目、连接数据源、拖拽字段生成可视化组件，一键导出报告。
          </p>
          <div class="new-project flex flex-col items-stretch gap-2 sm:flex-row">
            <WiInput v-model="newProjectName" class="w-full sm:w-60" placeholder="输入项目名称开始" @keydown.enter="onCreate" />
            <WiButton :loading="creating" @click="onCreate">
              <Plus :size="14" /> {{ creating ? '创建中…' : '新建项目' }}
            </WiButton>
          </div>
        </div>
        <div class="hero-stats flex gap-3">
          <WiCard class="stat-card flex w-[110px] flex-col items-center justify-center gap-1 rounded-lg" size="small">
            <LayoutTemplate :size="18" />
            <span class="stat-value">{{ projects.length }}</span>
            <span class="stat-label">项目</span>
          </WiCard>
          <WiCard class="stat-card flex w-[110px] flex-col items-center justify-center gap-1 rounded-lg" size="small">
            <FolderKanban :size="18" />
            <span class="stat-value">Studio</span>
            <span class="stat-label">可视化编辑器</span>
          </WiCard>
        </div>
      </section>

      <section class="projects">
        <div class="section-title mb-3 flex items-center gap-1.5 text-sm font-semibold text-[var(--wi-color-text-muted)]">
          <Clock :size="14" /> 最近项目
        </div>

        <div v-if="loading" class="loading-grid grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          <WiSkeleton v-for="i in 4" :key="i" height="120px" border-radius="10px" />
        </div>

        <div v-else-if="projects.length === 0" class="empty-state flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--wi-color-border)] bg-[var(--wi-color-surface-elevated)] p-12 text-center text-[var(--wi-color-text-muted)]">
          <div class="empty-icon">
            <FolderKanban :size="32" />
          </div>
          <p>还没有项目</p>
          <p class="empty-sub">
            在上方输入名称，立即创建第一个可视化项目。
          </p>
        </div>

        <div v-else class="project-grid grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
          <WiCard
            v-for="p in projects"
            :key="p.id"
            class="project-card cursor-pointer transition duration-150 hover:-translate-y-0.5"
            hoverable
            @click="openProject(p.id)"
          >
            <template #header>
              <div class="project-card-header">
                <span class="project-name" :title="p.name">{{ p.name }}</span>
                <WiButton
                  severity="danger"
                  text
                  size="small"
                  aria-label="删除项目"
                  @click.stop="onDelete(p.id, p.name)"
                >
                  <Trash2 :size="12" />
                </WiButton>
              </div>
            </template>
            <div class="project-meta flex items-center gap-1 text-xs text-[var(--wi-color-text-muted)]">
              <Clock :size="11" />
              <span>更新于 {{ formatDate(p.updatedAt) }}</span>
            </div>
            <div class="project-action flex items-center justify-between text-xs font-semibold text-[var(--wi-color-primary)]">
              <span>进入 Studio</span>
              <ArrowRight :size="12" />
            </div>
          </WiCard>
        </div>
      </section>
    </main>
  </div>
</template>
