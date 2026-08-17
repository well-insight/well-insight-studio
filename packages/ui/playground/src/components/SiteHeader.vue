<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useTheme } from '@well-design/ui'

const GIT_REPO = 'https://gitcode.com/Wayne1308/well-design'

const route = useRoute()
const { isDark, toggleTheme } = useTheme()

const activeSection = computed(() => {
  const name = String(route.name ?? '')
  if (name === 'home') return 'home'
  if (name.startsWith('docs')) return 'docs'
  if (name.startsWith('component')) return 'components'
  return ''
})
</script>

<template>
  <header class="site-header">
    <RouterLink class="site-brand" :to="{ name: 'home' }" aria-label="Well Design 首页">
      <span class="site-brand__mark" aria-hidden="true">W</span>
      <span class="site-brand__name">well design</span>
      <span class="site-brand__version">v0.1.0</span>
    </RouterLink>

    <nav class="site-nav" aria-label="站点导航">
      <RouterLink
        class="site-nav__link"
        :class="{ 'is-active': activeSection === 'home' }"
        :to="{ name: 'home' }"
      >
        首页
      </RouterLink>
      <RouterLink
        class="site-nav__link"
        :class="{ 'is-active': activeSection === 'docs' }"
        :to="{ name: 'docs', params: { slug: 'introduction' } }"
      >
        文档
      </RouterLink>
      <RouterLink
        class="site-nav__link"
        :class="{ 'is-active': activeSection === 'components' }"
        :to="{ name: 'components' }"
      >
        组件
      </RouterLink>
    </nav>

    <div class="site-header__actions">
      <button
        class="site-icon-btn"
        type="button"
        :aria-label="isDark ? '切换到浅色模式' : '切换到暗色模式'"
        :title="isDark ? '浅色模式' : '暗色模式'"
        @click="toggleTheme"
      >
        <span aria-hidden="true">{{ isDark ? '☀' : '☾' }}</span>
      </button>
      <a
        class="site-icon-btn"
        :href="GIT_REPO"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="打开 Git 仓库"
        title="Git 仓库"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" fill="currentColor">
          <path
            d="M12 2C6.48 2 2 6.58 2 12.26c0 4.52 2.87 8.35 6.84 9.71.5.1.68-.22.68-.48 0-.24-.01-.87-.01-1.7-2.78.62-3.37-1.37-3.37-1.37-.46-1.2-1.12-1.52-1.12-1.52-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.57 2.36 1.12 2.94.85.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.32.1-2.75 0 0 .84-.27 2.75 1.05A9.3 9.3 0 0 1 12 6.84c.85.004 1.71.12 2.51.35 1.9-1.32 2.74-1.05 2.74-1.05.55 1.43.2 2.49.1 2.75.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.47-.01 2.81 0 .26.18.59.69.48A10.05 10.05 0 0 0 22 12.26C22 6.58 17.52 2 12 2Z"
          />
        </svg>
      </a>
    </div>
  </header>
</template>

<style scoped>
.site-header {
  align-items: center;
  background: color-mix(in srgb, var(--wd-color-surface) 92%, transparent);
  border-bottom: 1px solid var(--wd-color-border);
  display: grid;
  flex: 0 0 auto;
  gap: 1rem;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  height: 3.75rem;
  padding: 0 clamp(1rem, 3vw, 2.5rem);
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 200;
  backdrop-filter: blur(10px);
}

.site-brand {
  align-items: center;
  color: var(--wd-color-text);
  display: inline-flex;
  font-size: 0.95rem;
  font-weight: 750;
  gap: 0.65rem;
  letter-spacing: -0.03em;
  text-decoration: none;
  width: max-content;
}

.site-brand__mark {
  align-items: center;
  background: var(--wd-color-primary);
  border-radius: var(--wd-radius-sm);
  color: #fff;
  display: inline-flex;
  font-family: Georgia, serif;
  font-size: 1.05rem;
  height: 1.85rem;
  justify-content: center;
  width: 1.85rem;
}

.site-brand__version {
  color: var(--wd-color-text-muted);
  font-family: ui-monospace, SFMono-Regular, Consolas, monospace;
  font-size: 0.65rem;
  font-weight: 500;
  letter-spacing: 0.04em;
}

.site-nav {
  align-items: center;
  display: flex;
  gap: 0.25rem;
  justify-content: center;
}

.site-nav__link {
  border-radius: var(--wd-radius-sm);
  color: var(--wd-color-text-muted);
  font-size: 0.875rem;
  font-weight: 550;
  padding: 0.45rem 0.9rem;
  text-decoration: none;
  transition: color var(--wd-motion-fast) var(--wd-motion-ease), background var(--wd-motion-fast) var(--wd-motion-ease);
}

.site-nav__link:hover {
  background: color-mix(in srgb, var(--wd-color-primary) 8%, transparent);
  color: var(--wd-color-text);
}

.site-nav__link.is-active {
  background: color-mix(in srgb, var(--wd-color-primary) 12%, transparent);
  color: var(--wd-color-primary);
  font-weight: 700;
}

.site-header__actions {
  align-items: center;
  display: flex;
  gap: 0.35rem;
  justify-content: flex-end;
}

.site-icon-btn {
  align-items: center;
  background: transparent;
  border: 1px solid var(--wd-color-border);
  border-radius: var(--wd-radius-sm);
  color: var(--wd-color-text);
  cursor: pointer;
  display: inline-flex;
  height: 2.1rem;
  justify-content: center;
  text-decoration: none;
  width: 2.1rem;
}

.site-icon-btn:hover {
  border-color: color-mix(in srgb, var(--wd-color-primary) 45%, var(--wd-color-border));
  color: var(--wd-color-primary);
}

@media (max-width: 700px) {
  .site-header {
    grid-template-columns: 1fr auto;
    height: auto;
    padding: 0.65rem 0.85rem;
    row-gap: 0.55rem;
  }

  .site-brand__name {
    display: none;
  }

  .site-nav {
    grid-column: 1 / -1;
    justify-content: flex-start;
    order: 3;
    overflow-x: auto;
  }

  .site-header__actions {
    grid-column: 2;
    grid-row: 1;
  }
}
</style>
