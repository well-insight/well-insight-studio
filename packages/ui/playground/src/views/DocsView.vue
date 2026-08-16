<script setup lang="ts">
import { computed, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import ComponentDocViewer from '../components/ComponentDocViewer.vue'
import { listGuideDocs, resolveGuideDoc } from '../docs/guide/loadGuideDocs'
import { WdScrollbar } from '@well-design/ui'

const route = useRoute()
const router = useRouter()
const guides = listGuideDocs()

const activeSlug = computed(() => {
  const slug = route.params.slug
  return typeof slug === 'string' && slug ? slug : 'introduction'
})

const activeDoc = computed(() => resolveGuideDoc(activeSlug.value))

watch(
  activeSlug,
  (slug) => {
    if (!resolveGuideDoc(slug) && guides[0]) {
      void router.replace({ name: 'docs', params: { slug: guides[0].slug } })
    }
  },
  { immediate: true },
)
</script>

<template>
  <div class="docs-shell">
    <aside class="docs-sidebar" aria-label="文档导航">
      <WdScrollbar class="docs-scroll">
        <div class="docs-sidebar__body">
          <p class="docs-kicker">DOCUMENTATION</p>
          <h1 class="docs-sidebar__title">文档</h1>
          <nav class="docs-nav">
            <RouterLink
              v-for="item in guides"
              :key="item.slug"
              class="docs-nav__item"
              :class="{ 'is-active': activeSlug === item.slug }"
              :to="{ name: 'docs', params: { slug: item.slug } }"
            >
              <span>{{ item.title }}</span>
            </RouterLink>
          </nav>
        </div>
      </WdScrollbar>
    </aside>

    <main class="docs-main">
      <WdScrollbar class="docs-scroll">
        <div class="docs-main__body">
          <ComponentDocViewer v-if="activeDoc" :doc="{ name: activeDoc.slug, frontmatter: activeDoc.frontmatter, component: activeDoc.component }" />
          <section v-else class="docs-missing">
            <h2>未找到文档</h2>
            <RouterLink :to="{ name: 'docs', params: { slug: 'introduction' } }">返回介绍</RouterLink>
          </section>
        </div>
      </WdScrollbar>
    </main>
  </div>
</template>

<style scoped>
.docs-shell {
  display: grid;
  flex: 1;
  grid-template-columns: 15rem minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
}

.docs-sidebar {
  border-right: 1px solid var(--wd-color-border);
  min-height: 0;
}

.docs-scroll {
  height: 100%;
  min-height: 0;
}

.docs-sidebar__body {
  padding: 1.5rem 1rem 2rem;
}

.docs-kicker {
  color: var(--wd-color-primary);
  font-family: ui-monospace, monospace;
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  margin: 0 0 0.55rem;
}

.docs-sidebar__title {
  font-family: Georgia, serif;
  font-size: 1.45rem;
  font-weight: 400;
  letter-spacing: -0.04em;
  margin: 0 0 1.15rem;
}

.docs-nav {
  display: grid;
  gap: 0.15rem;
}

.docs-nav__item {
  border-radius: var(--wd-radius-sm);
  color: var(--wd-color-text-muted);
  font-size: 0.84rem;
  padding: 0.5rem 0.65rem;
  text-decoration: none;
}

.docs-nav__item:hover,
.docs-nav__item.is-active {
  background: color-mix(in srgb, var(--wd-color-primary) 9%, transparent);
  color: var(--wd-color-primary);
}

.docs-nav__item.is-active {
  font-weight: 700;
}

.docs-main {
  min-height: 0;
  min-width: 0;
}

.docs-main__body {
  margin: 0 auto;
  max-width: 52rem;
  padding: clamp(1.75rem, 4vw, 3rem) clamp(1.25rem, 4vw, 3rem) 4rem;
}

.docs-missing {
  color: var(--wd-color-text-muted);
}

@media (max-width: 700px) {
  .docs-shell {
    display: block;
    overflow: visible;
  }

  .docs-sidebar,
  .docs-main {
    overflow: visible;
  }

  .docs-scroll {
    height: auto;
  }

  .docs-nav {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }
}
</style>
