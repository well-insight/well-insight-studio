<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message, WiButton, WiCard, WiInput, WiSkeleton, WiTag } from '@well-insight/ui'
import { Plus, FolderKanban, LayoutTemplate, Clock, Trash2, ArrowRight, LogOut } from '@lucide/vue'
import { createProject, deleteProject, listProjects, type ProjectSummary } from '../api/projects'
import { useProjectStore } from '../stores/projectStore'
import { useAuthStore } from '../stores/authStore'

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
  <div class="home">
    <header class="home-header">
      <div class="brand">
        <div class="brand-logo">WI</div>
        <div>
          <h1>Well-Insight</h1>
          <p class="brand-sub">数据可视化工作台</p>
        </div>
      </div>
      <div class="header-actions">
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

    <main class="home-main">
      <section class="hero">
        <div class="hero-text">
          <h2>从数据到洞察，只需几分钟</h2>
          <p class="hero-desc">创建项目、连接数据源、拖拽字段生成可视化组件，一键导出报告。</p>
          <div class="new-project">
            <WiInput v-model="newProjectName" placeholder="输入项目名称开始" @keydown.enter="onCreate" />
            <WiButton :loading="creating" @click="onCreate">
              <Plus :size="14" /> {{ creating ? '创建中…' : '新建项目' }}
            </WiButton>
          </div>
        </div>
        <div class="hero-stats">
          <div class="stat-card">
            <LayoutTemplate :size="18" />
            <span class="stat-value">{{ projects.length }}</span>
            <span class="stat-label">项目</span>
          </div>
          <div class="stat-card">
            <FolderKanban :size="18" />
            <span class="stat-value">Studio</span>
            <span class="stat-label">可视化编辑器</span>
          </div>
        </div>
      </section>

      <section class="projects">
        <div class="section-title">
          <Clock :size="14" /> 最近项目
        </div>

        <div v-if="loading" class="loading-grid">
          <WiSkeleton v-for="i in 4" :key="i" height="120px" border-radius="10px" />
        </div>

        <div v-else-if="projects.length === 0" class="empty-state">
          <div class="empty-icon"><FolderKanban :size="32" /></div>
          <p>还没有项目</p>
          <p class="empty-sub">在上方输入名称，立即创建第一个可视化项目。</p>
        </div>

        <div v-else class="project-grid">
          <WiCard
            v-for="p in projects"
            :key="p.id"
            class="project-card"
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
            <div class="project-meta">
              <Clock :size="11" />
              <span>更新于 {{ formatDate(p.updatedAt) }}</span>
            </div>
            <div class="project-action">
              <span>进入 Studio</span>
              <ArrowRight :size="12" />
            </div>
          </WiCard>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.home {
  min-height: 100vh;
  background: var(--wi-color-surface);
  color: var(--wi-color-text);
}
.home-header {
  padding: 16px 32px;
  border-bottom: 1px solid var(--wi-color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: var(--wi-color-surface-elevated);
}
.brand {
  display: flex;
  align-items: center;
  gap: 12px;
}
.brand-logo {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-weight: 800;
  font-size: 14px;
  color: #fff;
  background: linear-gradient(135deg, #3b82f6, #22d3ee);
}
.brand h1 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--wi-color-text);
}
.brand-sub {
  margin: 0;
  font-size: 12px;
  color: var(--wi-color-text-muted);
}
.home-main {
  padding: 32px;
  max-width: 1200px;
  margin: 0 auto;
}
.hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 32px;
  padding: 28px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), rgba(34, 211, 238, 0.05));
  border: 1px solid var(--wi-color-border);
  margin-bottom: 32px;
}
.hero-text h2 {
  margin: 0 0 8px;
  font-size: 22px;
  font-weight: 700;
  color: var(--wi-color-text);
}
.hero-desc {
  margin: 0 0 18px;
  font-size: 13px;
  color: var(--wi-color-text-muted);
  max-width: 460px;
  line-height: 1.5;
}
.new-project {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.new-project > .wi-input {
  width: 240px;
}
.hero-stats {
  display: flex;
  gap: 12px;
}
.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  width: 110px;
  height: 90px;
  border-radius: 10px;
  background: var(--wi-color-surface-elevated);
  border: 1px solid var(--wi-color-border);
  color: var(--wi-color-text-muted);
}
.stat-value {
  font-size: 18px;
  font-weight: 700;
  color: var(--wi-color-text);
}
.stat-label {
  font-size: 10px;
}
.section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: var(--wi-color-text-muted);
  margin-bottom: 14px;
}
.loading-grid,
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}
.project-card {
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.project-card:hover {
  transform: translateY(-2px);
  border-color: var(--wi-color-primary);
  box-shadow: var(--wi-shadow-sm);
}
.project-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 0 4px;
}
.project-name {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: var(--wi-color-text);
}
.project-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--wi-color-text-muted);
  margin-bottom: 12px;
}
.project-action {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 12px;
  font-weight: 600;
  color: var(--wi-color-primary);
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 48px;
  border-radius: 12px;
  border: 1px dashed var(--wi-color-border);
  color: var(--wi-color-text-muted);
  background: var(--wi-color-surface-elevated);
}
.empty-icon {
  color: var(--wi-color-primary);
  opacity: 0.8;
}
.empty-sub {
  font-size: 12px;
  margin: 0;
}
.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
