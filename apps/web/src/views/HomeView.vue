<script setup lang="ts">
import type { ProjectSummary } from '../api/projects'
import {
  ArrowRight,
  BarChart3,
  Clock3,
  Database,
  LogOut,
  Plus,
  Sparkles,
  Trash2,
} from '@lucide/vue'
import { message, WiButton, WiInput, WiScrollbar, WiSkeleton, WiTag } from '@well-insight/ui'
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { createProject, deleteProject, listProjects } from '../api/projects'
import { useAuthStore } from '../styles/stores/authStore'
import { useProjectStore } from '../styles/stores/projectStore'

const router = useRouter()
const projectStore = useProjectStore()
const authStore = useAuthStore()

const projects = ref<ProjectSummary[]>([])
const loading = ref(true)
const newProjectName = ref('')
const creating = ref(false)

const firstName = computed(() => {
  const name = authStore.user?.displayName?.trim() || authStore.user?.username?.trim() || '朋友'
  return name.split(/\s+/)[0]
})

const latestProject = computed(() => projects.value[0] ?? null)

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

function openDatasets() {
  router.push('/datasets')
}

function continueLatest() {
  if (latestProject.value) openProject(latestProject.value.id)
  else document.querySelector<HTMLInputElement>('.hero-create input')?.focus()
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
    return new Date(iso).toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
</script>

<template>
  <div class="home-shell">
    <header class="topbar">
      <div class="brand" aria-label="Well-Insight 首页">
        <div class="brand-mark">
          <span>WI</span><i />
        </div>
        <div class="brand-copy">
          <strong>Well-Insight</strong>
          <span>INSIGHT STUDIO</span>
        </div>
      </div>

      <div class="topbar-actions">
        <button class="quiet-link" type="button" @click="openDatasets">
          <Database :size="14" />
          <span>数据集</span>
        </button>
        <span class="topbar-divider" />
        <WiTag v-if="authStore.user" :value="authStore.user.displayName" severity="info" />
        <button class="quiet-link logout-button" type="button" @click="signOut">
          <LogOut :size="14" />
          <span>退出</span>
        </button>
      </div>
    </header>

    <WiScrollbar class="home-scrollbar" :native="false" trigger="hover" aria-label="主页内容">
      <main class="home-main">
        <section class="hero-section">
          <div class="hero-copy">
            <div class="eyebrow">
              <span class="eyebrow-dot" /> PERSONAL WORKSPACE
            </div>
            <h1>早上好，{{ firstName }}<span>。</span></h1>
            <p>把分散的数据，整理成每个人都能看懂的决策画面。</p>

            <div class="hero-actions">
              <div class="hero-create">
                <WiInput v-model="newProjectName" placeholder="给你的新项目起个名字" @keydown.enter="onCreate" />
                <WiButton :loading="creating" @click="onCreate">
                  <Plus :size="15" />
                  {{ creating ? '创建中…' : '新建项目' }}
                </WiButton>
              </div>
              <button class="text-action" type="button" @click="continueLatest">
                {{ latestProject ? '继续上次工作' : '从空白画布开始' }}
                <ArrowRight :size="14" />
              </button>
            </div>
          </div>

          <div class="hero-visual" aria-hidden="true">
            <div class="visual-grid" />
            <div class="visual-label">
              LIVE WORKSPACE / 01
            </div>
            <div class="orbit orbit-large" />
            <div class="orbit orbit-small" />
            <div class="signal signal-one" />
            <div class="signal signal-two" />
            <div class="hero-chart">
              <div class="chart-top">
                <span>REVENUE TREND</span><strong>+24.8%</strong>
              </div>
              <div class="chart-bars">
                <i /><i /><i /><i /><i /><i /><i />
              </div>
              <svg viewBox="0 0 280 90" preserveAspectRatio="none">
                <path d="M0 72 C28 60 36 67 58 51 S95 55 116 40 S149 52 170 27 S207 35 229 19 S258 26 280 5" />
              </svg>
            </div>
            <div class="floating-pill pill-one">
              <BarChart3 :size="13" /> 12 widgets
            </div>
            <div class="floating-pill pill-two">
              <span /> Connected
            </div>
          </div>
        </section>

        <section class="workspace-section">
          <div class="section-heading">
            <div>
              <span class="section-kicker">YOUR WORKSPACE</span>
              <h2>从这里继续</h2>
            </div>
            <span class="section-count">{{ projects.length }} 个项目</span>
          </div>

          <div class="workspace-grid">
            <button class="action-card action-card-primary" type="button" @click="onCreate">
              <span class="action-icon"><Plus :size="19" /></span>
              <span class="action-card-copy"><strong>创建可视化项目</strong><small>连接数据，拖拽字段，构建你的洞察页面</small></span>
              <ArrowRight :size="16" class="action-arrow" />
            </button>
            <button class="action-card" type="button" @click="openDatasets">
              <span class="action-icon dataset-icon"><Database :size="18" /></span>
              <span class="action-card-copy"><strong>整理数据集</strong><small>管理业务数据，为分析准备干净的数据基础</small></span>
              <ArrowRight :size="16" class="action-arrow" />
            </button>
          </div>
        </section>

        <section class="projects-section">
          <div class="section-heading projects-heading">
            <div class="heading-with-icon">
              <Clock3 :size="16" /><h2>最近项目</h2>
            </div>
            <span class="section-note">按最近更新排序</span>
          </div>

          <div v-if="loading" class="project-grid loading-projects">
            <WiSkeleton v-for="i in 3" :key="i" height="156px" border-radius="12px" />
          </div>

          <div v-else-if="projects.length === 0" class="empty-state">
            <div class="empty-illustration">
              <Sparkles :size="22" />
            </div>
            <div><strong>你的第一个洞察，将从这里开始</strong><p>创建一个项目，把数据变成团队可以行动的答案。</p></div>
            <WiButton size="small" @click="onCreate">
              <Plus :size="13" />创建项目
            </WiButton>
          </div>

          <div v-else class="project-grid">
            <article v-for="(project, index) in projects" :key="project.id" class="project-tile" @click="openProject(project.id)">
              <div class="tile-preview" :class="`preview-${(index % 3) + 1}`">
                <div class="preview-toolbar">
                  <span /><span /><span />
                </div>
                <div class="preview-content">
                  <i /><i /><i /><i /><i />
                </div>
              </div>
              <div class="tile-body">
                <div class="tile-title-row">
                  <strong :title="project.name">{{ project.name }}</strong><WiButton severity="danger" text size="small" aria-label="删除项目" @click.stop="onDelete(project.id, project.name)">
                    <Trash2 :size="13" />
                  </WiButton>
                </div>
                <div class="tile-meta">
                  <span><Clock3 :size="11" />{{ formatDate(project.updatedAt) }}</span><span class="open-label">打开 <ArrowRight :size="11" /></span>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="workflow-strip">
          <div class="workflow-title">
            <span class="section-kicker">A SIMPLE LOOP</span><h2>让洞察自然流动</h2>
          </div>
          <div class="workflow-steps">
            <div class="workflow-step">
              <span>01</span><div><strong>连接</strong><small>接入你的真实数据</small></div>
            </div>
            <div class="workflow-line" />
            <div class="workflow-step">
              <span>02</span><div><strong>编排</strong><small>拖拽组件构建画面</small></div>
            </div>
            <div class="workflow-line" />
            <div class="workflow-step">
              <span>03</span><div><strong>分享</strong><small>让团队看见同一个答案</small></div>
            </div>
          </div>
        </section>
      </main>

      <footer class="home-footer">
        <span>WELL-INSIGHT / DATA TO DECISIONS</span><span>Studio workspace</span>
      </footer>
    </WiScrollbar>
  </div>
</template>

<style scoped>
.home-scrollbar {
  flex: 1 1 auto;
  height: auto;
  min-height: 0;
}
.home-scrollbar :deep(.wi-scrollbar__view) {
  min-height: 100%;
}
.home-shell {
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  color: var(--wi-color-text);
  background: var(--wi-color-ground-background, var(--wi-color-surface));
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.topbar { height: 68px; flex: 0 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 0 clamp(20px, 5vw, 76px); border-bottom: var(--wi-border-width) solid var(--wi-color-border); background: color-mix(in srgb, var(--wi-color-surface) 92%, transparent); backdrop-filter: blur(16px); position: relative; z-index: 5; }
.brand { display: flex; align-items: center; gap: 11px; }
.brand-mark { width: 30px; height: 30px; position: relative; display: grid; place-items: center; border: var(--wi-border-width) solid var(--wi-color-primary); border-radius: var(--wi-radius-md) var(--wi-radius-md) var(--wi-radius-md) var(--wi-radius-sm); color: var(--wi-color-on-emphasis); background: var(--wi-color-primary); transform: rotate(-5deg); }
.brand-mark span { font-size: 10px; font-weight: 900; transform: rotate(5deg); } .brand-mark i { position: absolute; width: 5px; height: 5px; right: -3px; bottom: -3px; border-radius: 50%; background: #f3b66d; }
.brand-copy { display: flex; flex-direction: column; gap: 2px; } .brand-copy strong { font-size: 13px; letter-spacing: -.02em; } .brand-copy span, .section-kicker, .eyebrow, .visual-label { font-size: 9px; letter-spacing: .16em; color: #77949b; }
.topbar-actions { display: flex; align-items: center; gap: 17px; } .quiet-link { display: inline-flex; align-items: center; gap: 7px; border: 0; padding: 6px 0; color: #a9c0c4; background: transparent; font: inherit; font-size: 12px; cursor: pointer; } .quiet-link:hover, .text-action:hover { color: #9be1c6; } .topbar-divider { width: 1px; height: 18px; background: rgba(161, 211, 194, .16); }
.home-main { width: min(1180px, calc(100% - 40px)); margin: 0 auto; } .hero-section { min-height: 390px; display: grid; grid-template-columns: minmax(0, 1fr) minmax(360px, .85fr); gap: 40px; align-items: center; padding: 58px 0 54px; border-bottom: 1px solid rgba(161, 211, 194, .13); }
.eyebrow { display: flex; align-items: center; gap: 8px; color: #9be1c6; } .eyebrow-dot, .pill-two span { width: 6px; height: 6px; border-radius: 50%; background: #f3b66d; box-shadow: 0 0 0 4px rgba(243, 182, 109, .12); } h1 { max-width: 590px; margin: 17px 0 12px; color: #eef8f4; font-family: Georgia, "Times New Roman", serif; font-size: clamp(40px, 5.2vw, 72px); font-weight: 400; letter-spacing: -.055em; line-height: .98; } h1 span { color: #9be1c6; } .hero-copy > p { max-width: 470px; margin: 0; color: #9ab2b5; font-size: 15px; line-height: 1.7; }
.hero-actions { margin-top: 31px; } .hero-create { display: flex; max-width: 435px; gap: 8px; } .hero-create :deep(.wi-input) { flex: 1; } .text-action { display: inline-flex; align-items: center; gap: 7px; margin-top: 14px; padding: 0; border: 0; color: #8da9ad; background: transparent; font-size: 11px; cursor: pointer; }
.hero-visual { min-height: 285px; position: relative; overflow: hidden; border: 1px solid rgba(155, 225, 198, .22); border-radius: 18px; background: linear-gradient(145deg, rgba(25, 74, 72, .54), rgba(8, 31, 35, .3)); box-shadow: 0 22px 70px rgba(0, 0, 0, .18); } .visual-grid { position: absolute; inset: 0; opacity: .32; background-image: linear-gradient(rgba(155,225,198,.12) 1px, transparent 1px), linear-gradient(90deg, rgba(155,225,198,.12) 1px, transparent 1px); background-size: 31px 31px; mask-image: linear-gradient(to bottom, black, transparent 85%); } .visual-label { position: absolute; top: 19px; left: 21px; }
.orbit { position: absolute; border: 1px solid rgba(155, 225, 198, .17); border-radius: 50%; transform: rotate(-25deg); } .orbit-large { width: 350px; height: 145px; top: 57px; left: 11%; } .orbit-small { width: 240px; height: 100px; top: 80px; left: 25%; border-color: rgba(243, 182, 109, .2); } .signal { position: absolute; width: 8px; height: 8px; border-radius: 50%; background: #9be1c6; box-shadow: 0 0 18px #9be1c6; } .signal-one { top: 101px; left: 25%; } .signal-two { right: 20%; top: 163px; background: #f3b66d; box-shadow: 0 0 18px #f3b66d; }
.hero-chart { position: absolute; right: 25px; bottom: 26px; width: 280px; height: 125px; padding: 15px 17px 10px; border: 1px solid rgba(213, 244, 231, .18); border-radius: 10px; background: rgba(5, 26, 30, .78); box-sizing: border-box; } .chart-top { display: flex; justify-content: space-between; color: #729196; font-size: 8px; letter-spacing: .1em; } .chart-top strong { color: #9be1c6; font-size: 11px; letter-spacing: 0; } .chart-bars { position: absolute; inset: 39px 17px 12px; display: flex; align-items: end; justify-content: space-between; opacity: .28; } .chart-bars i { width: 13px; background: #9be1c6; border-radius: 2px 2px 0 0; } .chart-bars i:nth-child(1) { height: 24%; } .chart-bars i:nth-child(2) { height: 38%; } .chart-bars i:nth-child(3) { height: 29%; } .chart-bars i:nth-child(4) { height: 57%; } .chart-bars i:nth-child(5) { height: 45%; } .chart-bars i:nth-child(6) { height: 74%; } .chart-bars i:nth-child(7) { height: 92%; } .hero-chart svg { position: absolute; inset: 39px 17px 12px; width: calc(100% - 34px); height: calc(100% - 51px); } .hero-chart path { fill: none; stroke: #f3b66d; stroke-width: 2; vector-effect: non-scaling-stroke; }
.floating-pill { position: absolute; display: flex; align-items: center; gap: 6px; padding: 7px 10px; border: 1px solid rgba(155,225,198,.22); border-radius: 7px; color: #bdd6d2; background: rgba(8, 32, 35, .8); font-size: 10px; } .pill-one { top: 73px; right: 24px; } .pill-two { left: 24px; bottom: 28px; }
.workspace-section, .projects-section { padding: 42px 0 0; } .section-heading { display: flex; align-items: end; justify-content: space-between; margin-bottom: 17px; } .section-heading h2, .workflow-title h2 { margin: 5px 0 0; color: #e5f1ed; font-family: Georgia, "Times New Roman", serif; font-size: 25px; font-weight: 400; letter-spacing: -.03em; } .section-count, .section-note { color: #718d92; font-size: 11px; } .workspace-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; } .action-card { display: flex; align-items: center; gap: 13px; min-height: 90px; padding: 17px 19px; border: 1px solid rgba(155,225,198,.14); border-radius: 11px; color: #d9e9e5; background: #0b2429; text-align: left; cursor: pointer; transition: border-color .2s, transform .2s, background .2s; } .action-card:hover { border-color: rgba(155,225,198,.5); background: #103239; transform: translateY(-2px); } .action-card-primary { border-color: rgba(155,225,198,.32); background: linear-gradient(110deg, rgba(28, 91, 82, .7), #0b2429); } .action-icon { display: grid; flex: 0 0 35px; width: 35px; height: 35px; place-items: center; border-radius: 9px; color: #082027; background: #9be1c6; } .dataset-icon { color: #eec78e; background: rgba(243,182,109,.16); } .action-card-copy { display: flex; min-width: 0; flex: 1; flex-direction: column; gap: 5px; } .action-card-copy strong { font-size: 13px; } .action-card-copy small { color: #87a5a7; font-size: 11px; line-height: 1.4; } .action-arrow { color: #719398; }
.heading-with-icon { display: flex; align-items: center; gap: 8px; } .heading-with-icon svg { color: #9be1c6; } .project-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 13px; } .project-tile { overflow: hidden; border: 1px solid rgba(155,225,198,.13); border-radius: 12px; background: #0b2429; cursor: pointer; transition: border-color .2s, transform .2s; } .project-tile:hover { border-color: rgba(155,225,198,.5); transform: translateY(-3px); } .tile-preview { height: 94px; position: relative; overflow: hidden; padding: 11px; background: #12373a; } .preview-2 { background: #29344a; } .preview-3 { background: #3c3030; } .preview-toolbar { display: flex; gap: 4px; } .preview-toolbar span { width: 4px; height: 4px; border-radius: 50%; background: rgba(226,247,235,.48); } .preview-content { position: absolute; right: 17px; bottom: 15px; left: 17px; display: flex; align-items: end; gap: 6px; height: 49px; } .preview-content i { flex: 1; border-radius: 2px 2px 0 0; background: rgba(155,225,198,.55); } .preview-content i:nth-child(1) { height: 40%; } .preview-content i:nth-child(2) { height: 65%; } .preview-content i:nth-child(3) { height: 48%; } .preview-content i:nth-child(4) { height: 80%; } .preview-content i:nth-child(5) { height: 100%; background: #f3b66d; } .tile-body { padding: 12px 14px 13px; } .tile-title-row { display: flex; align-items: center; justify-content: space-between; gap: 7px; } .tile-title-row strong { overflow: hidden; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; } .tile-meta { display: flex; justify-content: space-between; margin-top: 13px; color: #708d91; font-size: 10px; } .tile-meta span { display: inline-flex; align-items: center; gap: 5px; } .open-label { color: #9be1c6; } .empty-state { display: flex; align-items: center; gap: 15px; padding: 22px; border: 1px dashed rgba(155,225,198,.25); border-radius: 12px; color: #a5c0bd; background: rgba(11, 36, 41, .55); } .empty-state strong { color: #dcece6; font-size: 13px; } .empty-state p { margin: 5px 0 0; color: #769397; font-size: 11px; } .empty-illustration { display: grid; flex: 0 0 42px; width: 42px; height: 42px; place-items: center; border-radius: 11px; color: #082027; background: #9be1c6; } .empty-state :deep(.wi-button) { margin-left: auto; }
.workflow-strip { display: flex; align-items: center; justify-content: space-between; gap: 30px; margin: 58px 0 45px; padding: 23px 25px; border: 1px solid rgba(155,225,198,.12); border-radius: 13px; background: rgba(11, 36, 41, .65); } .workflow-steps { display: flex; align-items: center; gap: 17px; } .workflow-step { display: flex; align-items: center; gap: 9px; } .workflow-step > span { color: #f3b66d; font-family: Georgia, serif; font-size: 16px; } .workflow-step div { display: flex; flex-direction: column; gap: 2px; } .workflow-step strong { font-size: 12px; } .workflow-step small { color: #789599; font-size: 10px; white-space: nowrap; } .workflow-line { width: 28px; height: 1px; background: rgba(155,225,198,.25); }
.home-footer { display: flex; justify-content: space-between; padding: 0 clamp(20px, 5vw, 76px) 22px; color: #557176; font-size: 9px; letter-spacing: .12em; }
@media (max-width: 800px) { .hero-section { grid-template-columns: 1fr; padding-top: 42px; } .hero-visual { min-height: 250px; } .project-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .workflow-strip { align-items: flex-start; flex-direction: column; } }
@media (max-width: 560px) { .home-main { width: min(100% - 28px, 1180px); } .topbar { height: 60px; padding: 0 14px; } .topbar-actions { gap: 10px; } .topbar-divider, .logout-button span, .topbar-actions :deep(.wi-tag) { display: none; } .hero-section { padding: 37px 0 40px; } h1 { font-size: 45px; } .hero-create, .workspace-grid { grid-template-columns: 1fr; display: grid; } .hero-create :deep(.wi-button) { width: 100%; } .hero-visual { min-height: 225px; } .hero-chart { right: 15px; bottom: 18px; width: 235px; } .pill-one { top: 55px; right: 15px; } .pill-two { left: 15px; bottom: 18px; } .project-grid { grid-template-columns: 1fr; } .workflow-steps { width: 100%; justify-content: space-between; gap: 7px; } .workflow-line { width: 12px; } .workflow-step small { max-width: 64px; white-space: normal; line-height: 1.3; } .home-footer { padding-bottom: 15px; font-size: 8px; } .home-footer span:last-child { display: none; } }
@media (prefers-reduced-motion: reduce) { .action-card, .project-tile { transition: none; } }

/* Theme bridge: keep the product composition while consuming the component library palette. */
.home-shell {
  --home-ground: var(--wi-color-ground-background, var(--wi-color-surface));
  --home-surface: var(--wi-color-surface);
  --home-elevated: color-mix(in srgb, var(--wi-color-surface) 94%, var(--wi-color-text));
  --home-subtle: color-mix(in srgb, var(--wi-color-surface) 88%, var(--wi-color-primary));
  --home-border: var(--wi-color-border);
  --home-text: var(--wi-color-text);
  --home-muted: var(--wi-color-text-muted);
  --home-primary: var(--wi-color-primary);
  --home-primary-hover: var(--wi-color-primary-hover);
  --home-success: var(--wi-color-success);
  --home-warning: var(--wi-color-warning);
  color: var(--home-text);
  background: var(--home-ground);
  box-sizing: border-box;
}
.home-shell .topbar { border-color: var(--home-border); background: color-mix(in srgb, var(--home-surface) 94%, transparent); }
.home-shell .brand-mark { border-color: var(--home-primary); color: var(--wi-color-on-emphasis); background: var(--home-primary); }
.home-shell .brand-mark i, .home-shell .eyebrow-dot, .home-shell .pill-two span { background: var(--home-warning); box-shadow: 0 0 0 4px color-mix(in srgb, var(--home-warning) 16%, transparent); }
.home-shell .brand-copy strong, .home-shell h1, .home-shell .section-heading h2, .home-shell .workflow-title h2, .home-shell .action-card, .home-shell .project-tile { color: var(--home-text); }
.home-shell .brand-copy span, .home-shell .section-kicker, .home-shell .visual-label, .home-shell .section-count, .home-shell .section-note, .home-shell .hero-copy > p, .home-shell .text-action, .home-shell .quiet-link, .home-shell .action-card-copy small, .home-shell .tile-meta, .home-shell .workflow-step small, .home-shell .home-footer { color: var(--home-muted); }
.home-shell .eyebrow, .home-shell h1 span, .home-shell .quiet-link:hover, .home-shell .text-action:hover, .home-shell .open-label { color: var(--home-primary); }
.home-shell .hero-section { border-color: var(--home-border); }
.home-shell .hero-visual, .home-shell .action-card, .home-shell .project-tile, .home-shell .workflow-strip { border-color: color-mix(in srgb, var(--home-primary) 24%, var(--home-border)); background: var(--home-subtle); }
.home-shell .hero-visual { background: color-mix(in srgb, var(--home-primary) 12%, var(--home-ground)); box-shadow: var(--wi-shadow-md); }
.home-shell .visual-grid { background-image: linear-gradient(color-mix(in srgb, var(--home-primary) 14%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in srgb, var(--home-primary) 14%, transparent) 1px, transparent 1px); }
.home-shell .orbit-large, .home-shell .orbit-small { border-color: color-mix(in srgb, var(--home-primary) 30%, transparent); }
.home-shell .orbit-small, .home-shell .signal-two, .home-shell .hero-chart path { border-color: color-mix(in srgb, var(--home-warning) 35%, transparent); }
.home-shell .signal-one { background: var(--home-primary); box-shadow: 0 0 18px var(--home-primary); }
.home-shell .signal-two { background: var(--home-warning); box-shadow: 0 0 18px var(--home-warning); }
.home-shell .hero-chart, .home-shell .floating-pill { border-color: color-mix(in srgb, var(--home-primary) 28%, var(--home-border)); background: color-mix(in srgb, var(--home-surface) 86%, transparent); }
.home-shell .hero-chart path { stroke: var(--home-warning); }
.home-shell .chart-top strong { color: var(--home-success); }
.home-shell .chart-bars i, .home-shell .action-icon { background: var(--home-primary); }
.home-shell .chart-bars i:nth-child(5) { background: var(--home-warning); }
.home-shell .action-card-primary { border-color: color-mix(in srgb, var(--home-primary) 45%, var(--home-border)); background: color-mix(in srgb, var(--home-primary) 12%, var(--home-subtle)); }
.home-shell .action-card:hover, .home-shell .project-tile:hover { border-color: var(--home-primary); background: color-mix(in srgb, var(--home-primary) 9%, var(--home-surface)); }
.home-shell .dataset-icon { color: var(--home-warning); background: color-mix(in srgb, var(--home-warning) 15%, var(--home-surface)); }
.home-shell .preview-1 { background: color-mix(in srgb, var(--home-primary) 30%, var(--home-surface)); }
.home-shell .preview-2 { background: color-mix(in srgb, var(--home-color-info, var(--wi-color-info)) 24%, var(--home-surface)); }
.home-shell .preview-3 { background: color-mix(in srgb, var(--home-warning) 20%, var(--home-surface)); }
.home-shell .preview-content i { background: color-mix(in srgb, var(--home-primary) 65%, transparent); }
.home-shell .preview-content i:nth-child(5) { background: var(--home-warning); }
.home-shell .empty-state { color: var(--home-muted); border-color: color-mix(in srgb, var(--home-primary) 35%, var(--home-border)); background: var(--home-subtle); }
.home-shell .empty-state strong, .home-shell .workflow-step strong { color: var(--home-text); }
.home-shell .empty-illustration { color: var(--wi-color-on-emphasis); background: var(--home-primary); }
.home-shell .workflow-strip { background: color-mix(in srgb, var(--home-primary) 5%, var(--home-surface)); }
.home-shell .workflow-step > span { color: var(--home-warning); }
.home-shell .workflow-line { background: color-mix(in srgb, var(--home-primary) 30%, var(--home-border)); }
.home-shell .home-footer { border-color: var(--home-border); }
</style>
