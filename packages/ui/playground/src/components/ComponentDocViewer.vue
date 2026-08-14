<script setup lang="ts">
import type { ResolvedComponentDoc } from '../docs/loadComponentDocs'

defineProps<{
  doc: ResolvedComponentDoc
}>()
</script>

<template>
  <section class="component-doc-viewer">
    <div class="component-doc-viewer__intro">
      <span v-if="doc.frontmatter.category" class="component-doc-viewer__label">{{ doc.frontmatter.category }}</span>
      <h2>{{ doc.frontmatter.title || doc.name }}</h2>
      <p v-if="doc.frontmatter.description">{{ doc.frontmatter.description }}</p>
    </div>
    <component :is="doc.component" class="component-doc-viewer__body" />
  </section>
</template>

<style scoped>
.component-doc-viewer {
  width: 100%;
}
.component-doc-viewer__intro {
  border-bottom: 1px solid var(--wd-color-border);
  margin-bottom: 0.5rem;
  padding-bottom: 2rem;
}
.component-doc-viewer__label {
  color: var(--wd-color-primary);
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
}
.component-doc-viewer__intro h2 {
  font-family: Georgia, serif;
  font-size: clamp(2rem, 4vw, 3.3rem);
  font-weight: 400;
  letter-spacing: -0.06em;
  margin: 0.8rem 0 1rem;
}
.component-doc-viewer__intro p {
  color: var(--wd-color-text-muted);
  font-size: 0.9rem;
  line-height: 1.7;
  margin: 0;
  max-width: 42rem;
}
</style>

<style>
.wd-markdown-doc {
  color: var(--wd-color-text);
  font-size: 0.86rem;
  line-height: 1.7;
  width: 100%;
}
.wd-markdown-doc > h1:first-child {
  display: none;
}
.wd-markdown-doc h1,
.wd-markdown-doc h2,
.wd-markdown-doc h3 {
  font-family: Georgia, serif;
  font-weight: 400;
  letter-spacing: -0.03em;
  margin: 1.6rem 0 0.7rem;
}
.wd-markdown-doc h1 {
  font-size: 1.6rem;
}
.wd-markdown-doc h2 {
  font-size: 1.25rem;
}
.wd-markdown-doc h3 {
  font-size: 1.05rem;
}
.wd-markdown-doc p,
.wd-markdown-doc ul,
.wd-markdown-doc ol {
  color: var(--wd-color-text-muted);
  margin: 0.55rem 0;
}
.wd-markdown-doc a {
  color: var(--wd-color-primary);
}
.wd-markdown-doc code {
  background: color-mix(in srgb, var(--wd-color-primary) 8%, transparent);
  border-radius: var(--wd-radius-sm);
  font-family: ui-monospace, monospace;
  font-size: 0.78em;
  padding: 0.1rem 0.3rem;
}
.wd-markdown-doc pre {
  background: color-mix(in srgb, var(--wd-color-text) 7%, var(--wd-color-surface));
  border: 1px solid var(--wd-color-border);
  border-radius: var(--wd-radius-md);
  overflow-x: auto;
  padding: var(--wd-space-4);
}
.wd-markdown-doc pre code {
  background: transparent;
  padding: 0;
}
.wd-markdown-doc table {
  border-collapse: collapse;
  font-size: 0.78rem;
  margin: 1rem 0 1.5rem;
  min-width: 100%;
  width: 100%;
}
.wd-markdown-doc th,
.wd-markdown-doc td {
  border-bottom: 1px solid var(--wd-color-border);
  padding: 0.75rem 0.65rem;
  text-align: left;
  vertical-align: top;
}
.wd-markdown-doc thead th {
  color: var(--wd-color-text-muted);
  font-family: ui-monospace, monospace;
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
.wd-markdown-doc tbody td {
  color: var(--wd-color-text-muted);
}
</style>
