<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPage } from '@/api/pages'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import SimulatorEditorPreview from '@/visual-editor/ui/canvas/simulator-editor-preview/SimulatorEditorPreview.vue'

const route = useRoute()
const { overrideProject, updateVisualLoading } = useVisualData()
const loading = ref(true)
const error = ref(false)

onMounted(async () => {
  updateVisualLoading(true)
  try {
    const id = route.params.id as string
    const detail = await fetchPage(id)
    overrideProject(detail.dsl as any)
    document.title = `${detail.name} - 页面预览`
  }
  catch (e) {
    ElMessage.error((e as Error).message || '加载页面失败')
    error.value = true
  }
  finally {
    loading.value = false
    updateVisualLoading(false)
  }
})
</script>

<template>
  <div v-loading="loading" class="page-preview h-full w-full">
    <SimulatorEditorPreview v-if="!error" :key="String(route.params.id)" />
    <el-empty v-else description="页面不存在或加载失败" />
  </div>
</template>
