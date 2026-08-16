<script setup lang="ts">
defineProps<{
  lang?: string
  meta?: string
  code?: string
}>()
</script>

<template>
  <section class="code-preview">
    <div class="code-preview__demo">
      <slot />
    </div>
    <details class="code-preview__code">
      <summary>查看代码 <span>{{ lang || 'vue' }}</span></summary>
      <div v-if="$slots.code" class="code-preview__highlight">
        <slot name="code" />
      </div>
      <pre v-else class="code-preview__fallback"><code>{{ code }}</code></pre>
    </details>
  </section>
</template>

<style scoped>
.code-preview {
  border: 1px solid var(--wd-color-border);
  border-radius: var(--wd-radius-md);
  margin: 1.25rem 0 1.75rem;
  overflow: hidden;
}
.code-preview__demo {
  align-items: center;
  background: color-mix(in srgb, var(--wd-color-primary) 4%, var(--wd-color-surface));
  display: flex;
  flex-wrap: wrap;
  gap: var(--wd-space-3);
  min-height: 7rem;
  padding: var(--wd-space-4);
}
.code-preview__demo :deep(.wd-splitter) {
  align-self: stretch;
  flex: 1 1 100%;
  width: 100%;
}
.code-preview__code summary {
  align-items: center;
  border-top: 1px solid var(--wd-color-border);
  color: var(--wd-color-text);
  cursor: pointer;
  display: flex;
  font-size: 0.78rem;
  justify-content: space-between;
  padding: var(--wd-space-3) var(--wd-space-4);
}
.code-preview__code summary span {
  color: var(--wd-color-text-muted);
  font-family: ui-monospace, monospace;
  font-size: 0.65rem;
  text-transform: uppercase;
}
.code-preview__highlight,
.code-preview__fallback {
  background: color-mix(in srgb, var(--wd-color-text) 7%, var(--wd-color-surface));
  border-top: 1px solid var(--wd-color-border);
  margin: 0;
  overflow-x: auto;
  padding: var(--wd-space-4);
}
.code-preview__fallback {
  color: var(--wd-color-text);
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  line-height: 1.6;
  white-space: pre;
}
.code-preview__fallback code {
  background: transparent;
  color: inherit;
  font: inherit;
  padding: 0;
}
.code-preview__highlight :deep(pre),
.code-preview__highlight :deep(.shiki) {
  background: transparent !important;
  margin: 0;
  overflow-x: visible;
  padding: 0;
}
.code-preview__highlight :deep(code),
.code-preview__highlight :deep(.shiki code) {
  background: transparent;
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  line-height: 1.6;
  padding: 0;
  white-space: pre;
}
</style>
