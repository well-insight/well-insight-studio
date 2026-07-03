<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePageStore } from '@/stores/pageStore'

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

async function handleSave() {
  saving.value = true
  try {
    await pageStore.savePage({
      id: isNew.value ? undefined : pageId.value,
      name: pageStore.currentPage?.name || '未命名页面',
      type: pageType.value as any,
    })
    ElMessage.success('保存成功')
  }
  catch (e) {
    ElMessage.error((e as Error).message || '保存失败')
  }
  finally {
    saving.value = false
  }
}

function goBack() {
  router.push({ name: 'VisualDesign' })
}
</script>

<template>
  <div class="flex items-center gap-2">
    <el-button :loading="saving" size="small" @click="handleSave">
      保存
    </el-button>
    <el-button size="small" type="primary" @click="handleSave">
      发布
    </el-button>
    <el-divider direction="vertical" />
    <el-button size="small" @click="goBack">
      返回
    </el-button>
  </div>
</template>
