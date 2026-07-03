<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { usePageStore } from '@/stores/pageStore'
import PageEditorBasicActions from './PageEditorBasicActions.vue'
import PageEditorVisualActions from './PageEditorVisualActions.vue'

const route = useRoute()
const pageStore = usePageStore()

const isVisualization = computed(() => {
  if (route.params.type) return route.params.type === 'visualization'
  return pageStore.currentPage?.type === 'visualization'
})
</script>

<template>
  <PageEditorVisualActions v-if="isVisualization" />
  <PageEditorBasicActions v-else />
</template>
