<script lang="ts" setup>
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchPage } from '@/api/pages'
import type { ApiPageItem } from '@/api/pages'

const route = useRoute()
const page = ref<ApiPageItem | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const id = route.params.id as string
    page.value = await fetchPage(id)
  }
  catch (error) {
    ElMessage.error('加载页面失败')
  }
  finally {
    loading.value = false
  }
})
</script>

<template>
  <div v-loading="loading" class="page-preview-container">
    <template v-if="page">
      <div class="preview-header">
        <h2>{{ page.name }}</h2>
        <el-tag :type="page.type === 'visualization' ? '' : page.type === 'form' ? 'success' : 'warning'">
          {{ page.type === 'visualization' ? '可视化大屏' : page.type === 'form' ? '表单管理' : '复杂报表' }}
        </el-tag>
      </div>
      <div class="preview-body">
        <div class="preview-placeholder">
          <p>页面预览功能开发中...</p>
        </div>
      </div>
    </template>
    <el-empty v-else description="页面不存在" />
  </div>
</template>

<style lang="scss" scoped>
.page-preview-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.preview-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-light);

  h2 {
    margin: 0;
    font-size: 18px;
  }
}

.preview-body {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--el-bg-color-page, #f5f7fa);
}

.preview-placeholder {
  color: var(--el-text-color-secondary);
  font-size: 16px;
}
</style>
