<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ComponentDocViewer from '../components/ComponentDocViewer.vue'
import { listDocumentedComponents, resolveComponentDoc } from '../docs/loadComponentDocs'
import { useMotion, useTheme } from '@well-design/theme'
import { WdCard, WdIcon, WdScrollbar } from '@well-design/ui'

const search = ref('')
const selectedComponent = ref('全部组件')
const accent = ref('blue')
const radius = ref('comfortable')
const density = ref('comfortable')
const { preference: motionPreference, setMotion } = useMotion()
const { isDark, setTheme, toggleTheme } = useTheme()

const motionOptions = [
  { name: 'full', label: '完整' },
  { name: 'reduced', label: '减弱' },
  { name: 'none', label: '关闭' },
] as const

const accentOptions = [
  { name: 'blue', label: 'Ocean', color: '#2563eb', hover: '#1d4ed8' },
  { name: 'violet', label: 'Violet', color: '#7c3aed', hover: '#6d28d9' },
  { name: 'green', label: 'Meadow', color: '#159570', hover: '#0f766e' },
  { name: 'orange', label: 'Ember', color: '#ea580c', hover: '#c2410c' },
] as const

const radiusOptions = [
  { name: 'sharp', label: 'Sharp', values: ['0.125rem', '0.25rem', '0.5rem'] },
  { name: 'comfortable', label: 'Comfortable', values: ['0.25rem', '0.5rem', '0.75rem'] },
  { name: 'soft', label: 'Soft', values: ['0.5rem', '0.75rem', '1rem'] },
] as const

const densityOptions = [
  { name: 'compact', label: 'Compact', scale: 0.85 },
  { name: 'comfortable', label: 'Comfortable', scale: 1 },
  { name: 'spacious', label: 'Spacious', scale: 1.15 },
] as const

const componentBlurbs: Record<string, string> = {
  Button: '触发一个动作，反馈当前状态。',
  Input: '接收用户输入，并提供校验提示。',
  Textarea: '收集多行、可调整大小的文本。',
  Select: '从一组预定义选项中选择一个值。',
  Checkbox: '切换独立的二元选项。',
  Radio: '在互斥选项中选择一个。',
  Switch: '立即改变一个开关状态。',
  Tabs: '在同一上下文中切换内容视图。',
  Divider: '以清晰层级分隔内容区域。',
  Tag: '展示简洁、语义化的状态标签。',
  Tooltip: '在悬停或聚焦时补充说明。',
  Toast: '以非阻断方式反馈操作结果。',
  Table: '以可扩展的列和单元格插槽展示数据。',
  Pagination: '控制长列表的数据分页状态。',
  Card: '组织一组相关信息和操作。',
  Dialog: '聚焦一件需要确认的事情。',
  Dropdown: '在浮层菜单中选择一个动作。',
  Icon: '传达轻量、明确的视觉信息。',
  Scrollbar: '替换原生滚动条，提供可换肤滚动体验。',
}

const documented = listDocumentedComponents()
const components = [
  { name: '全部组件', count: documented.length },
  ...documented.map((name) => ({ name, count: 1 })),
]

function applyPlaygroundTheme() {
  const root = document.documentElement
  const selectedAccent = accentOptions.find((item) => item.name === accent.value) ?? accentOptions[0]
  const selectedRadius = radiusOptions.find((item) => item.name === radius.value) ?? radiusOptions[1]
  const selectedDensity = densityOptions.find((item) => item.name === density.value) ?? densityOptions[1]
  const spacing = selectedDensity.scale

  root.style.setProperty('--wd-color-primary', selectedAccent.color)
  root.style.setProperty('--wd-color-primary-hover', selectedAccent.hover)
  root.style.setProperty('--wd-color-focus-ring', selectedAccent.color)
  root.style.setProperty('--wd-radius-sm', selectedRadius.values[0])
  root.style.setProperty('--wd-radius-md', selectedRadius.values[1])
  root.style.setProperty('--wd-radius-lg', selectedRadius.values[2])
  root.style.setProperty('--wd-space-1', `${0.25 * spacing}rem`)
  root.style.setProperty('--wd-space-2', `${0.5 * spacing}rem`)
  root.style.setProperty('--wd-space-3', `${0.75 * spacing}rem`)
  root.style.setProperty('--wd-space-4', `${1 * spacing}rem`)
  root.style.setProperty('--wd-space-6', `${1.5 * spacing}rem`)
  root.style.setProperty('--wd-space-8', `${2 * spacing}rem`)
  root.style.setProperty('--wd-motion-fast', motionPreference.value === 'full' ? '150ms' : motionPreference.value === 'reduced' ? '80ms' : '0ms')
  root.style.setProperty('--wd-motion-normal', motionPreference.value === 'full' ? '250ms' : motionPreference.value === 'reduced' ? '120ms' : '0ms')
}

watch([accent, radius, density, motionPreference], applyPlaygroundTheme, { immediate: true })

const activePackageDoc = computed(() => {
  if (selectedComponent.value === '全部组件') return null
  return resolveComponentDoc(selectedComponent.value)
})

const filteredComponents = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) return components
  return components.filter((component) => component.name.toLowerCase().includes(query))
})
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <a class="brand" href="#top" aria-label="Well Design 组件库首页">
        <span class="brand-mark">W</span>
        <span>well design</span>
        <span class="version">v0.1.0</span>
      </a>
      <div class="topbar-actions">
        <span class="status-dot" aria-hidden="true" />
        <span class="status-text">本地开发中</span>
        <button class="theme-toggle" type="button" :aria-label="isDark ? '切换到亮色主题' : '切换到暗色主题'" @click="toggleTheme">
          <span aria-hidden="true">{{ isDark ? '☼' : '◐' }}</span>
          {{ isDark ? '亮色' : '暗色' }}
        </button>
      </div>
    </header>

    <div id="top" class="workspace">
      <aside class="sidebar" aria-label="组件导航">
        <WdScrollbar class="column-scroll">
          <div class="sidebar-body">
            <div class="sidebar-intro">
              <span class="kicker">COMPONENT LAB</span>
              <p>探索、组合、验证。</p>
            </div>
            <label class="search-box">
              <WdIcon name="info" size="sm" />
              <input v-model="search" type="search" placeholder="搜索组件" aria-label="搜索组件" />
            </label>
            <section class="appearance-panel" aria-labelledby="appearance-title">
              <div class="appearance-title-row">
                <h2 id="appearance-title">外观设置</h2>
                <span class="live-label">LIVE</span>
              </div>
              <div class="setting-group">
                <span class="setting-label">主题模式</span>
                <div class="segmented-control">
                  <button type="button" :class="{ 'is-selected': !isDark }" @click="setTheme('light')">亮色</button>
                  <button type="button" :class="{ 'is-selected': isDark }" @click="setTheme('dark')">暗色</button>
                </div>
              </div>
              <div class="setting-group">
                <span class="setting-label">品牌主色</span>
                <div class="accent-list">
                  <button
                    v-for="option in accentOptions"
                    :key="option.name"
                    type="button"
                    class="accent-swatch"
                    :class="{ 'is-selected': accent === option.name }"
                    :style="{ '--swatch-color': option.color }"
                    :aria-label="`使用${option.label}主题色`"
                    @click="accent = option.name"
                  />
                </div>
              </div>
              <label class="setting-group setting-select">
                <span class="setting-label">圆角</span>
                <select v-model="radius" aria-label="选择圆角风格">
                  <option v-for="option in radiusOptions" :key="option.name" :value="option.name">{{ option.label }}</option>
                </select>
              </label>
              <label class="setting-group setting-select">
                <span class="setting-label">内容密度</span>
                <select v-model="density" aria-label="选择内容密度">
                  <option v-for="option in densityOptions" :key="option.name" :value="option.name">{{ option.label }}</option>
                </select>
              </label>
              <div class="setting-group motion-setting">
                <span class="setting-label">动效</span>
                <div class="segmented-control" role="group" aria-label="全局组件动效">
                  <button v-for="option in motionOptions" :key="option.name" type="button" :class="{ 'is-selected': motionPreference === option.name }" @click="setMotion(option.name)">{{ option.label }}</button>
                </div>
                <span class="motion-status">{{ motionPreference === 'full' ? '标准过渡与浮层动画' : motionPreference === 'reduced' ? '减弱时长并移除位移' : '立即切换，不播放动画' }}</span>
              </div>
            </section>
            <nav class="component-nav" aria-label="组件目录">
              <p class="nav-heading">COMPONENTS</p>
              <button
                v-for="component in filteredComponents"
                :key="component.name"
                type="button"
                class="nav-item"
                :class="{ 'nav-item--active': selectedComponent === component.name }"
                @click="selectedComponent = component.name"
              >
                <span>{{ component.name }}</span>
                <span class="nav-count">{{ component.count }}</span>
              </button>
              <p v-if="filteredComponents.length === 0" class="empty-search">没有找到组件</p>
            </nav>
            <div class="sidebar-footer">
              <span class="footer-symbol">✦</span>
              <p>组件是产品语言的<br />基本句子。</p>
            </div>
          </div>
        </WdScrollbar>
      </aside>

      <main class="content">
        <WdScrollbar class="column-scroll">
          <div class="content-body">
            <section class="hero">
              <div>
                <p class="eyebrow">DOCS / COMPONENTS / {{ selectedComponent.toUpperCase() }}</p>
                <h1>组件实验室<span>。</span></h1>
                <p class="hero-copy">文档写在各组件的 <code>docs/index.md</code>，支持 Markdown + <code>vue preview</code>。API 对齐 PrimeVue。</p>
                <div class="doc-meta"><span>Vue 3</span><span>PrimeVue-aligned</span><span>Markdown docs</span></div>
              </div>
              <div class="hero-glyph" aria-hidden="true"><span>W</span></div>
            </section>

            <template v-if="selectedComponent === '全部组件'">
              <div class="section-heading"><div><p class="eyebrow">FOUNDATION / OVERVIEW</p><h2>基础组件</h2></div><span class="section-rule" /></div>
              <section class="demo-grid" aria-label="组件总览">
                <WdCard v-for="item in components.slice(1)" :key="item.name" class="overview-card">
                  <div class="overview-card__number">{{ String(item.count).padStart(2, '0') }}</div>
                  <h2>{{ item.name }}</h2>
                  <p>{{ componentBlurbs[item.name] ?? '组件文档。' }}</p>
                  <button type="button" class="text-link" @click="selectedComponent = item.name">查看详情 <span>→</span></button>
                </WdCard>
              </section>
            </template>

            <ComponentDocViewer v-else-if="activePackageDoc" :doc="activePackageDoc" />

            <section v-else class="missing-doc">
              <h2>{{ selectedComponent }}</h2>
              <p>尚未找到 <code>docs/index.md</code>。</p>
            </section>
          </div>
        </WdScrollbar>
      </main>

      <aside class="token-panel" aria-label="设计令牌">
        <WdScrollbar class="column-scroll">
          <div class="token-panel-body">
            <div class="token-heading"><span class="kicker">TOKENS</span><span class="token-index">/ 04</span></div>
            <p class="token-description">组件共享同一套视觉语法。主题切换时，语义保持不变。</p>
            <div class="token-group"><h3>Color</h3><div class="swatch-row"><span class="swatch swatch--primary" /><span>primary</span><code>brand</code></div><div class="swatch-row"><span class="swatch swatch--surface" /><span>surface</span><code>canvas</code></div><div class="swatch-row"><span class="swatch swatch--border" /><span>border</span><code>line</code></div></div>
            <div class="token-group"><h3>Radius</h3><div class="radius-row"><span class="radius-sample radius-sample--sm" /><span>sm</span><span class="radius-sample radius-sample--md" /><span>md</span><span class="radius-sample radius-sample--lg" /><span>lg</span></div></div>
            <div class="token-group"><h3>Spacing</h3><div class="spacing-bars"><span style="--bar: 25%">1</span><span style="--bar: 50%">2</span><span style="--bar: 75%">3</span><span style="--bar: 100%">4</span></div></div>
            <div class="token-note"><WdIcon name="info" size="sm" /><span>所有组件都使用<br /><strong>--wd-*</strong> 设计变量。</span></div>
          </div>
        </WdScrollbar>
      </aside>
    </div>
  </div>
</template>

<style>
:root { color: var(--wd-color-text); background: var(--wd-color-surface); font-family: var(--wd-font-sans); }
html, body, #app { height: 100%; }
body { margin: 0; min-width: 320px; overflow: hidden; }
* { box-sizing: border-box; }
button, input { font: inherit; }
button:focus-visible, input:focus-visible { outline: 3px solid color-mix(in srgb, var(--wd-color-focus-ring) 40%, transparent); outline-offset: 3px; }
.app-shell { background: var(--wd-color-surface); display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.topbar { align-items: center; background: var(--wd-color-surface); border-bottom: 1px solid var(--wd-color-border); display: flex; flex: 0 0 auto; height: 4.5rem; justify-content: space-between; padding: 0 clamp(1.25rem, 3vw, 3.5rem); width: 100%; z-index: 100; }
.brand { align-items: center; color: var(--wd-color-text); display: flex; font-size: 1rem; font-weight: 750; gap: .7rem; letter-spacing: -.03em; text-decoration: none; }
.brand-mark { align-items: center; background: var(--wd-color-primary); border-radius: var(--wd-radius-sm); color: white; display: inline-flex; font-family: Georgia, serif; font-size: 1.15rem; height: 2rem; justify-content: center; width: 2rem; }
.version, .token-index { color: var(--wd-color-text-muted); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: .68rem; letter-spacing: .04em; }
.topbar-actions { align-items: center; color: var(--wd-color-text-muted); display: flex; font-size: .75rem; gap: .5rem; }
.status-dot { background: #41b883; border-radius: 50%; height: .45rem; width: .45rem; }
.theme-toggle { background: transparent; border: 1px solid var(--wd-color-border); border-radius: var(--wd-radius-full); color: var(--wd-color-text); cursor: pointer; font-size: .75rem; margin-left: 1rem; padding: .45rem .8rem; }
.workspace { display: grid; flex: 1; grid-template-columns: 15rem minmax(0, 1fr) 14rem; min-height: 0; overflow: hidden; }
.sidebar, .content, .token-panel { display: flex; flex-direction: column; min-height: 0; overflow: hidden; }
.column-scroll { flex: 1; height: 100%; min-height: 0; }
.column-scroll :deep(.wd-scrollbar__wrap) { overscroll-behavior: contain; }
.sidebar, .token-panel { border-right: 1px solid var(--wd-color-border); }
.token-panel { border-left: 1px solid var(--wd-color-border); border-right: 0; }
.sidebar-body { padding: 2.5rem 1.5rem; }
.content-body { padding: clamp(2rem, 5vw, 4.5rem) clamp(1.25rem, 4vw, 4rem); width: 100%; }
.token-panel-body { padding: 2.5rem 1.25rem; }
.kicker, .eyebrow { color: var(--wd-color-primary); font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: .63rem; font-weight: 700; letter-spacing: .14em; }
.sidebar-intro p { color: var(--wd-color-text-muted); font-family: Georgia, serif; font-size: 1.1rem; line-height: 1.25; margin: .7rem 0 2rem; }
.search-box { align-items: center; background: color-mix(in srgb, var(--wd-color-border) 35%, transparent); border-radius: var(--wd-radius-sm); color: var(--wd-color-text-muted); display: flex; gap: .5rem; padding: .55rem .65rem; }
.search-box input { background: transparent; border: 0; color: var(--wd-color-text); min-width: 0; outline: 0; width: 100%; }
.appearance-panel { border-bottom: 1px solid var(--wd-color-border); margin: 1.5rem 0 1.25rem; padding-bottom: 1.35rem; }
.appearance-title-row { align-items: center; display: flex; justify-content: space-between; margin-bottom: 1.2rem; }
.appearance-title-row h2 { font-size: .78rem; letter-spacing: -.02em; margin: 0; }
.live-label { color: var(--wd-color-primary); font-family: ui-monospace, monospace; font-size: .55rem; letter-spacing: .08em; }
.setting-group { display: grid; gap: .5rem; margin: .9rem 0; }
.setting-label, .nav-heading { color: var(--wd-color-text-muted); font-family: ui-monospace, monospace; font-size: .59rem; letter-spacing: .08em; text-transform: uppercase; }
.segmented-control { background: color-mix(in srgb, var(--wd-color-border) 45%, transparent); border-radius: var(--wd-radius-sm); display: grid; grid-template-columns: 1fr 1fr; padding: .15rem; }
.segmented-control button { background: transparent; border: 0; border-radius: var(--wd-radius-sm); color: var(--wd-color-text-muted); cursor: pointer; font-size: .68rem; padding: .38rem .25rem; }
.segmented-control button.is-selected { background: var(--wd-color-surface); box-shadow: 0 1px 3px rgb(15 23 42 / .12); color: var(--wd-color-text); font-weight: 650; }
.accent-list { display: flex; gap: .55rem; }
.accent-swatch { background: var(--swatch-color); border: 2px solid transparent; border-radius: 50%; cursor: pointer; height: 1.25rem; outline: 0; padding: 0; width: 1.25rem; }
.accent-swatch.is-selected { box-shadow: 0 0 0 2px var(--wd-color-surface), 0 0 0 4px var(--swatch-color); }
.setting-select { display: grid; grid-template-columns: 1fr 1.15fr; align-items: center; }
.setting-select select { background: var(--wd-color-surface); border: 1px solid var(--wd-color-border); border-radius: var(--wd-radius-sm); color: var(--wd-color-text); font-size: .68rem; padding: .35rem .45rem; width: 100%; }
.component-nav { display: grid; gap: .2rem; margin-top: 1.25rem; }
.nav-heading { margin: 0 0 .35rem .75rem; }
.nav-item { align-items: center; background: transparent; border: 0; border-radius: var(--wd-radius-sm); color: var(--wd-color-text-muted); cursor: pointer; display: flex; font-size: .8rem; justify-content: space-between; padding: .7rem .75rem; text-align: left; }
.nav-item:hover, .nav-item--active { background: color-mix(in srgb, var(--wd-color-primary) 9%, transparent); color: var(--wd-color-primary); }
.nav-item--active { font-weight: 700; }
.nav-count { font-family: ui-monospace, monospace; font-size: .65rem; opacity: .7; }
.empty-search { color: var(--wd-color-text-muted); font-size: .75rem; padding: .5rem .75rem; }
.sidebar-footer { border-top: 1px solid var(--wd-color-border); color: var(--wd-color-text-muted); display: flex; gap: .65rem; margin-top: 3rem; padding-top: 1.25rem; }
.footer-symbol { color: var(--wd-color-primary); font-size: 1.4rem; }
.sidebar-footer p { font-family: Georgia, serif; font-size: .75rem; line-height: 1.4; margin: 0; }
.motion-status { color: var(--wd-color-text-muted); font-size: .65rem; }
.content { min-width: 0; width: 100%; }
.hero { align-items: end; display: flex; justify-content: space-between; margin-bottom: 3.5rem; }
.hero h1 { font-family: Georgia, 'Times New Roman', serif; font-size: clamp(2.8rem, 6vw, 5.4rem); font-weight: 400; letter-spacing: -.07em; line-height: .95; margin: 1rem 0 1.3rem; }
.hero h1 span { color: var(--wd-color-primary); }
.hero-copy { color: var(--wd-color-text-muted); font-size: .9rem; line-height: 1.6; margin: 0; max-width: 36rem; }
.hero-copy code { font-family: ui-monospace, monospace; font-size: .8em; }
.doc-meta { display: flex; flex-wrap: wrap; gap: .5rem; margin-top: 1.5rem; }
.doc-meta span { border: 1px solid var(--wd-color-border); border-radius: var(--wd-radius-full); color: var(--wd-color-text-muted); font-family: ui-monospace, monospace; font-size: .6rem; padding: .3rem .55rem; }
.section-heading { align-items: end; display: flex; gap: 1rem; margin-bottom: 1rem; }
.section-heading h2 { font-family: Georgia, serif; font-size: 1.6rem; font-weight: 400; letter-spacing: -.04em; margin: .5rem 0 0; }
.section-rule { background: var(--wd-color-border); flex: 1; height: 1px; margin-bottom: .45rem; }
.hero-glyph { align-items: center; border: 1px solid var(--wd-color-border); border-radius: 50%; color: var(--wd-color-primary); display: flex; font-family: Georgia, serif; font-size: 5rem; height: 9rem; justify-content: center; opacity: .8; transform: rotate(-12deg); width: 9rem; }
.demo-grid { display: grid; gap: 1rem; grid-template-columns: repeat(2, minmax(0, 1fr)); }
.overview-card { min-height: 13rem; position: relative; }
.overview-card__number { color: var(--wd-color-primary); font-family: ui-monospace, monospace; font-size: .65rem; }
.overview-card h2 { font-family: Georgia, serif; font-size: 1.65rem; font-weight: 400; letter-spacing: -.04em; margin: 2.5rem 0 .5rem; }
.overview-card p { color: var(--wd-color-text-muted); font-size: .78rem; line-height: 1.5; margin: 0; max-width: 15rem; }
.text-link { background: transparent; border: 0; color: var(--wd-color-primary); cursor: pointer; font-size: .75rem; margin-top: 1.4rem; padding: 0; }
.text-link span { display: inline-block; margin-left: .35rem; transition: transform var(--wd-motion-fast) var(--wd-motion-ease); }
.text-link:hover span { transform: translateX(.25rem); }
.missing-doc { color: var(--wd-color-text-muted); }
.token-heading { display: flex; justify-content: space-between; }.token-description { color: var(--wd-color-text-muted); font-family: Georgia, serif; font-size: .8rem; line-height: 1.5; margin: 1.5rem 0 2.5rem; }.token-group { border-top: 1px solid var(--wd-color-border); padding: 1rem 0; }.token-group h3 { font-family: ui-monospace, monospace; font-size: .65rem; font-weight: 500; letter-spacing: .08em; margin: 0 0 1rem; text-transform: uppercase; }.swatch-row { align-items: center; color: var(--wd-color-text-muted); display: grid; font-size: .7rem; gap: .5rem; grid-template-columns: 1rem 1fr auto; margin: .6rem 0; }.swatch { border: 1px solid var(--wd-color-border); border-radius: 50%; height: .8rem; width: .8rem; }.swatch--primary { background: var(--wd-color-primary); }.swatch--surface { background: var(--wd-color-surface); }.swatch--border { background: var(--wd-color-border); }.swatch-row code { color: var(--wd-color-text-muted); font-family: ui-monospace, monospace; font-size: .6rem; }.radius-row { align-items: center; color: var(--wd-color-text-muted); display: flex; font-family: ui-monospace, monospace; font-size: .6rem; gap: .35rem; }.radius-sample { background: color-mix(in srgb, var(--wd-color-primary) 15%, transparent); border: 1px solid var(--wd-color-primary); height: 1.25rem; width: 1.25rem; }.radius-sample--sm { border-radius: var(--wd-radius-sm); }.radius-sample--md { border-radius: var(--wd-radius-md); }.radius-sample--lg { border-radius: var(--wd-radius-lg); }.spacing-bars { align-items: end; display: flex; gap: .35rem; height: 4rem; }.spacing-bars span { align-items: center; background: color-mix(in srgb, var(--wd-color-primary) 20%, transparent); color: var(--wd-color-primary); display: flex; font-family: ui-monospace, monospace; font-size: .6rem; height: var(--bar); justify-content: center; width: 1.45rem; }.token-note { align-items: start; border: 1px solid var(--wd-color-border); color: var(--wd-color-text-muted); display: flex; font-size: .68rem; gap: .5rem; line-height: 1.5; margin-top: 2rem; padding: .75rem; }.token-note .wd-icon { color: var(--wd-color-primary); flex: 0 0 auto; }
@media (max-width: 1100px) { .workspace { grid-template-columns: 13rem minmax(0, 1fr); }.token-panel { display: none; } }
@media (max-width: 700px) {
  body { overflow: auto; }
  .app-shell { height: auto; min-height: 100vh; overflow: visible; }
  .topbar { height: 4rem; }
  .status-text { display: none; }
  .workspace { display: block; flex: none; overflow: visible; }
  .sidebar, .content, .token-panel { display: block; overflow: visible; }
  .column-scroll { height: auto; }
  .sidebar { border-bottom: 1px solid var(--wd-color-border); border-right: 0; }
  .sidebar-body { padding: 1.25rem; }
  .sidebar-intro { display: none; }
  .appearance-panel { margin-top: 1rem; }
  .component-nav { display: flex; flex-wrap: wrap; }
  .nav-heading { flex-basis: 100%; margin-top: .25rem; }
  .nav-item { padding: .5rem .7rem; }
  .sidebar-footer { display: none; }
  .content-body { padding: 2rem 1.25rem; }
  .hero { align-items: start; }
  .hero-glyph { display: none; }
  .demo-grid { grid-template-columns: 1fr; }
}
</style>
