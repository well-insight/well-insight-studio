<script lang="ts" setup>
import type { ApiPageDetail } from '@/api/pages'
import type { ReportSchema } from '@/report-designer/types'
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPage } from '@/api/pages'
import { ReportRenderer } from '@/report-designer'
import { normalizeReportSchema } from '@/report-designer/report-schema.utils'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import SimulatorEditorPreview from '@/visual-editor/ui/canvas/simulator-editor-preview/SimulatorEditorPreview.vue'

const route = useRoute()
const { overrideProject, updateVisualLoading } = useVisualData()
const loading = ref(true)
const error = ref(false)
const page = ref<ApiPageDetail | null>(null)
const reportSchema = ref<ReportSchema | null>(null)

onMounted(async () => {
  updateVisualLoading(true)
  try {
    const id = route.params.id as string
    const detail = await fetchPage(id)
    page.value = detail
    if (detail.type === 'report')
      reportSchema.value = normalizeReportSchema(detail.dsl)
    else
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
    <ReportRenderer v-if="!error && page?.type === 'report' && reportSchema" :schema="reportSchema" mode="online" />
    <SimulatorEditorPreview v-else-if="!error" :key="String(route.params.id)" />
    <el-empty v-else description="页面不存在或加载失败" />
  </div>
</template>
