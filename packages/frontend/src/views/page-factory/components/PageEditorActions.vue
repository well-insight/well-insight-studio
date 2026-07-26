<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePageStore } from '@/stores/pageStore'
import PageEditorBasicActions from './PageEditorBasicActions.vue'
import PageEditorVisualActions from './PageEditorVisualActions.vue'

const route = useRoute()
const pageStore = usePageStore()

function getPageTypeFromPath(path: string) {
  if (path.startsWith('/workspace/visual-editor'))
    return 'visualization'
  if (path.startsWith('/project/pages/visual/edit'))
    return 'visualization'
  if (path.startsWith('/project/pages/report/'))
    return 'report'
  if (path.startsWith('/project/pages/form/edit'))
    return 'form'
  return undefined
}

const isVisualization = computed(() => {
  const pathType = getPageTypeFromPath(route.path)
  if (pathType)
    return pathType === 'visualization'
  if (route.params.type)
    return route.params.type === 'visualization'
  return pageStore.currentPage?.type === 'visualization'
})
</script>

<template>
  <PageEditorVisualActions v-if="isVisualization" />
  <PageEditorBasicActions v-else />
</template>
