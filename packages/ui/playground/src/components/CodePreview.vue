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
      <pre v-else><code>{{ code }}</code></pre>
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
.code-preview__code pre {
  background: color-mix(in srgb, var(--wd-color-text) 7%, var(--wd-color-surface));
  border-top: 1px solid var(--wd-color-border);
  margin: 0;
  overflow-x: auto;
  padding: var(--wd-space-4);
}
.code-preview__code code,
.code-preview__highlight :deep(code),
.code-preview__highlight :deep(pre) {
  background: transparent;
  color: var(--wd-color-text);
  font-family: ui-monospace, monospace;
  font-size: 0.7rem;
  line-height: 1.6;
  margin: 0;
  white-space: pre;
}
</style>
