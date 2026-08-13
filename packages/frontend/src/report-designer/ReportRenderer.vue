<script lang="ts" setup>
import type { ReportPreviewMode, ReportSchema } from './types'
import { computed } from 'vue'
import ReportSectionEditor from './ReportSectionEditor.vue'

const props = withDefaults(defineProps<{
  schema: ReportSchema
  mode?: ReportPreviewMode
}>(), { mode: 'a4-portrait' })

const paperStyle = computed(() => {
  if (props.mode === 'online')
    return { maxWidth: `${props.schema.settings.online.maxWidth}px` }
  const landscape = props.mode === 'a4-landscape'
  const { margin } = props.schema.settings.page
  return {
    width: landscape ? '297mm' : '210mm',
    minHeight: landscape ? '210mm' : '297mm',
    padding: `${margin.top}mm ${margin.right}mm ${margin.bottom}mm ${margin.left}mm`,
  }
})
</script>

<template>
  <article class="report-renderer" :class="`report-renderer--${mode}`" :style="paperStyle">
    <section class="report-renderer__section report-renderer__section--header">
      <ReportSectionEditor :content="schema.sections.header.content" :editable="false" />
    </section>
    <section class="report-renderer__section report-renderer__section--body">
      <ReportSectionEditor :content="schema.sections.body.content" :editable="false" />
    </section>
    <section class="report-renderer__section report-renderer__section--footer">
      <ReportSectionEditor :content="schema.sections.footer.content" :editable="false" />
    </section>
  </article>
</template>

<style lang="scss" scoped>
.report-renderer {
  box-sizing: border-box;
  margin: 0 auto;
  color: var(--el-text-color-primary);
  background: var(--el-bg-color);
}
.report-renderer--online {
  width: 100%;
  min-height: 100%;
  padding: 40px clamp(24px, 6vw, 80px);
}
.report-renderer__section + .report-renderer__section {
  margin-top: 20px;
}
.report-renderer__section--header {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.report-renderer__section--footer {
  padding-top: 12px;
  color: var(--el-text-color-secondary);
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
