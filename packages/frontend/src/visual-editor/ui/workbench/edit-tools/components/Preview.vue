<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, toRaw, toValue, watch } from 'vue'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { localKey, useVisualData } from '@/visual-editor/hooks/useVisualData'
import { AdaptiveDialog } from '@/components/adaptive-dialog'
import SimulatorEditorPreview from '@/visual-editor/ui/canvas/simulator-editor-preview/SimulatorEditorPreview.vue'

interface Props {
  device?: 'pc' | 'mobile'
}

const props = withDefaults(defineProps<Props>(), {
  device: 'pc',
})

const modelValue = defineModel<boolean>({ required: true })

const { overrideProject, jsonData } = useVisualData()
const workspaceStore = useWorkspaceStore()

const deviceStyle = computed<CSSProperties>(() => ({
  width: props.device === 'pc' ? '100%' : '374px',
  height: '100%',
}))

/** 打开预览前写入最新 schema，并同步到编辑器内存 */
function syncPreviewData() {
  const snapshot = JSON.stringify(toRaw(toValue(jsonData)))
  try {
    sessionStorage.setItem(localKey, snapshot)
    const appId = workspaceStore.currentApp?.id
    if (appId != null && String(appId) !== '') {
      sessionStorage.setItem(`${localKey}_${appId}`, snapshot)
    }
  }
  catch {
    /* ignore quota */
  }
  overrideProject(snapshot)
}

watch(modelValue, (open) => {
  if (open) {
    syncPreviewData()
  }
})
</script>

<template>
  <AdaptiveDialog
    v-model="modelValue"
    title="预览"
    default-mode="drawer"
    drawer-direction="btt"
    drawer-size="95%"
    shell-class="preview-drawer"
    destroy-on-close
  >
    <div class="flex h-full w-full items-center justify-center">
      <el-card :class="$style.card" :style="deviceStyle" shadow="never">
        <SimulatorEditorPreview v-if="modelValue" :active="modelValue" />
      </el-card>
    </div>
  </AdaptiveDialog>
</template>

<style lang="scss" module>
.card {
  height: 100%;
  border: none;

  :global(.el-card__body) {
    height: 100%;
    padding: 12px;
    box-sizing: border-box;
  }
}
</style>

<style lang="scss">
.preview-drawer {
  .el-drawer__body {
    padding: 0;
    height: calc(100% - 56px);
    overflow: hidden;
  }
}
</style>
