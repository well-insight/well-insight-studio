<script lang="ts" setup>
import {
  DocumentChecked,
  Iphone,
  Monitor,
  Orange,
  RefreshLeft,
  RefreshRight,
  VideoPlay,
  WarnTriangleFilled
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { storeToRefs } from 'pinia'
import { computed, ref, toRaw, toValue } from 'vue'
import { updateApplication } from '@/api/application'
import { useControlStore } from '@/store/useControlStore/useControlStore'
import { useWorkspaceStore } from '@/store/workspaceStore/workspaceStore'
import { localKey, useVisualData } from '@/visual-editor/hooks/useVisualData'
import Preview from './components/Preview.vue'

const workspaceStore = useWorkspaceStore()
const controlStore = useControlStore()
const { currentApp } = storeToRefs(workspaceStore)
const {} = storeToRefs(controlStore)

const { jsonData } = useVisualData()

const previewVisible = ref(false)
const saving = ref(false)

const statusActive = computed({
  get: () => currentApp.value?.status === 1,
  set: async (v: boolean) => {
    const app = currentApp.value
    if (!app?.id) return
    try {
      await updateApplication(String(app.id), { status: v ? 1 : 0 })
      app.status = v ? 1 : 0
    } catch (e) {
      ElMessage.error((e as Error).message || '更新状态失败')
    }
  }
})

async function saveAll() {
  const app = currentApp.value
  if (!app?.id) {
    ElMessage.warning('未找到当前应用')
    return
  }
  saving.value = true
  try {
    const schema = JSON.parse(JSON.stringify(toRaw(toValue(jsonData)))) as Record<string, unknown>
    await updateApplication(String(app.id), {
      schema,
      client_type: app.clientType ?? 1,
      status: app.status ?? 1
    })
    sessionStorage.setItem(localKey, JSON.stringify(toRaw(toValue(jsonData))))
    ElMessage.success('保存成功')
  } catch (e) {
    ElMessage.error((e as Error).message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function triggerClient() {
  const app = currentApp.value
  if (!app?.id) return
  const next = app.clientType === 1 ? 2 : 1
  try {
    await updateApplication(String(app.id), { client_type: next })
    app.clientType = next
    ElMessage.success(next === 2 ? '已切换为移动端画布' : '已切换为 PC 画布')
  } catch (e) {
    ElMessage.error((e as Error).message || '切换失败')
  }
}

function previewPage() {
  sessionStorage.setItem(localKey, JSON.stringify(toRaw(toValue(jsonData))))
  previewVisible.value = true
}
</script>

<template>
  <div class="h-full w-full overflow-hidden border-bottom-1 flex items-center px-4 justify-between">
    <div class="h-full flex items-center" />

    <div class="h-full flex items-center">
      <el-button text :icon="RefreshLeft" />
      <el-button text :icon="RefreshRight" />
      <el-divider direction="vertical" />
      <el-button v-if="currentApp?.clientType === 2" text :icon="Iphone" @click="triggerClient" />
      <el-button v-if="currentApp?.clientType === 1" text :icon="Monitor" @click="triggerClient" />
      <el-button text :icon="Orange" />
      <el-button text :icon="WarnTriangleFilled" />
      <el-divider direction="vertical" />
      <el-button text :icon="DocumentChecked" :loading="saving" @click="saveAll">保存</el-button>
      <el-divider direction="vertical" />
      <el-button text :icon="VideoPlay" @click="previewPage">预览</el-button>
      <el-divider direction="vertical" />
      <el-space>
        <el-button text>
          <span class="mr-2" :class="[$style.status, statusActive ? $style.enable : $style.disable]" />
          <el-text>{{ statusActive ? '激活' : '关闭' }}</el-text>
        </el-button>
        <el-switch v-model="statusActive" />
      </el-space>
    </div>
  </div>

  <Preview v-model="previewVisible" :device="currentApp?.clientType === 1 ? 'pc' : 'mobile'" />
</template>

<style lang="scss" module>
.status {
  height: 8px;
  width: 8px;
  border-radius: 50%;
  display: inline-block;

  &.enable {
    background-color: green;
  }

  &.disable {
    background-color: red;
  }
}
</style>
