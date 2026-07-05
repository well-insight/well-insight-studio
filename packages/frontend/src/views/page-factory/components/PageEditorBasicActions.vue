<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePageStore } from '@/stores/pageStore'
import { notifySaved, visualDSL } from '../visualEditorState'

const route = useRoute()
const router = useRouter()
const pageStore = usePageStore()

const saving = ref(false)

const pageId = computed(() => {
  const raw = route.params.id
  if (!raw) return undefined
  return Array.isArray(raw) ? raw[0] : String(raw)
})
const isNew = computed(() => !pageId.value || pageId.value === 'new')
const pageType = computed(() => (route.params.type as string) || pageStore.currentPage?.type || 'form')

async function handleSave(status?: 'draft' | 'published') {
  saving.value = true
  try {
    const body: Record<string, unknown> = {
      name: pageStore.currentPage?.name || '未命名页面',
      type: pageType.value,
    }
    if (visualDSL.value) {
      body.dsl = JSON.parse(JSON.stringify(visualDSL.value))
    }
    // 仅当 status 为有效字符串时才包含
    if (status === 'draft' || status === 'published') {
      body.status = status
    }

    const saved = await pageStore.savePage({
      id: isNew.value ? undefined : pageId.value,
      ...body,
    } as any)
    notifySaved()
    ElMessage.success(status === 'published' ? '已发布' : '保存成功')
    if (isNew.value && saved.id) {
      router.replace({ name: 'PageEditor', params: { id: saved.id } })
    }
  }
  catch (e) {
    ElMessage.error((e as Error).message || '保存失败')
  }
  finally {
    saving.value = false
  }
}

async function handlePreview() {
  if (!pageId.value) return
  const url = router.resolve({ name: 'PagePreview', params: { id: pageId.value } }).href
  window.open(url, '_blank')
}

function goBack() {
  router.push({ name: 'VisualDesign' })
}
</script>

<template>
  <div class="flex items-center gap-0">
    <el-button :loading="saving" size="small" @click="() => handleSave()">保存</el-button>
    <el-button size="small" type="primary" @click="() => handleSave('published')">发布</el-button>
    <el-button size="small" @click="handlePreview">预览</el-button>
    <el-divider direction="vertical" />
    <el-button size="small" @click="goBack">返回</el-button>
  </div>
</template>
