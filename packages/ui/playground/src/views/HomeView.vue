<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { WdButton, WdCard, WdScrollbar } from '@well-design/ui'

const highlights = [
  {
    title: 'PrimeVue 风格 API',
    body: '命名、尺寸、severity、浮层挂载等尽量对齐，降低学习与迁移成本。',
  },
  {
    title: '主题与令牌一体',
    body: '组件只消费 --wd-* 变量；亮暗色与动效由 @well-design/ui 的主题 API 统一管理。',
  },
  {
    title: '文档即预览',
    body: '每个组件自带 Markdown + vue preview，支持查看源码与交互演示。',
  },
  {
    title: '全局配置',
    body: 'WdConfigProvider / createWellDesign 可统一浮层、尺寸、文案与 zIndex。',
  },
]
</script>

<template>
  <WdScrollbar class="home-scroll">
    <div class="home-page">
      <section class="home-hero">
        <p class="home-kicker">WELL DESIGN / UI</p>
        <h1>面向 Vue 3 的<br />本地组件库<span>。</span></h1>
        <p class="home-lead">
          `@well-design/ui` 提供可复用的基础、表单、浮层与数据展示组件，配套主题包与全局配置，适合在 monorepo 或独立应用中落地统一的产品语言。
        </p>
        <div class="home-actions">
          <RouterLink :to="{ name: 'docs', params: { slug: 'quick-start' } }">
            <WdButton label="快速上手" />
          </RouterLink>
          <RouterLink :to="{ name: 'components' }">
            <WdButton label="浏览组件" outlined />
          </RouterLink>
          <RouterLink :to="{ name: 'docs', params: { slug: 'introduction' } }">
            <WdButton label="阅读文档" text />
          </RouterLink>
        </div>
        <div class="home-meta">
          <span>Vue 3</span>
          <span>TypeScript</span>
          <span>PrimeVue-aligned</span>
          <span>Theme tokens</span>
        </div>
      </section>

      <section class="home-grid" aria-label="能力亮点">
        <WdCard v-for="item in highlights" :key="item.title" class="home-card">
          <h2>{{ item.title }}</h2>
          <p>{{ item.body }}</p>
        </WdCard>
      </section>

      <section class="home-cta">
        <div>
          <h2>从文档或组件开始</h2>
          <p>介绍与主题配置在「文档」；交互示例与 API 表在「组件」。</p>
        </div>
        <div class="home-cta__links">
          <RouterLink class="home-text-link" :to="{ name: 'docs', params: { slug: 'theme' } }">主题与动效 →</RouterLink>
          <RouterLink class="home-text-link" :to="{ name: 'docs', params: { slug: 'config' } }">全局配置 →</RouterLink>
          <RouterLink class="home-text-link" :to="{ name: 'components' }">全部组件 →</RouterLink>
        </div>
      </section>
    </div>
  </WdScrollbar>
</template>

<style scoped>
.home-scroll {
  flex: 1;
  height: 100%;
  min-height: 0;
}

.home-page {
  margin: 0 auto;
  max-width: 64rem;
  padding: clamp(2rem, 5vw, 4rem) clamp(1.25rem, 4vw, 3rem) 4rem;
  width: 100%;
}

.home-kicker {
  color: var(--wd-color-primary);
  font-family: ui-monospace, monospace;
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  margin: 0 0 1rem;
}

.home-hero h1 {
  font-family: Georgia, 'Times New Roman', serif;
  font-size: clamp(2.6rem, 6vw, 4.6rem);
  font-weight: 400;
  letter-spacing: -0.06em;
  line-height: 1.05;
  margin: 0 0 1.25rem;
}

.home-hero h1 span {
  color: var(--wd-color-primary);
}

.home-lead {
  color: var(--wd-color-text);
  font-size: 1.05rem;
  line-height: 1.7;
  margin: 0;
  max-width: 40rem;
  opacity: 0.9;
}

.home-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-top: 2rem;
}

.home-actions a {
  text-decoration: none;
}

.home-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.75rem;
}

.home-meta span {
  border: 1px solid var(--wd-color-border);
  border-radius: var(--wd-radius-full);
  color: var(--wd-color-text-muted);
  font-family: ui-monospace, monospace;
  font-size: 0.65rem;
  padding: 0.3rem 0.6rem;
}

.home-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 3.5rem;
}

.home-card h2 {
  font-family: Georgia, serif;
  font-size: 1.35rem;
  font-weight: 400;
  letter-spacing: -0.03em;
  margin: 0 0 0.6rem;
}

.home-card p {
  color: var(--wd-color-text);
  font-size: 0.9rem;
  line-height: 1.6;
  margin: 0;
  opacity: 0.88;
}

.home-cta {
  align-items: end;
  border-top: 1px solid var(--wd-color-border);
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  justify-content: space-between;
  margin-top: 3.5rem;
  padding-top: 2rem;
}

.home-cta h2 {
  font-family: Georgia, serif;
  font-size: 1.6rem;
  font-weight: 400;
  margin: 0 0 0.5rem;
}

.home-cta p {
  color: var(--wd-color-text-muted);
  margin: 0;
}

.home-cta__links {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}

.home-text-link {
  color: var(--wd-color-primary);
  font-size: 0.9rem;
  text-decoration: none;
}

.home-text-link:hover {
  text-decoration: underline;
}

@media (max-width: 700px) {
  .home-grid {
    grid-template-columns: 1fr;
  }
}
</style>
