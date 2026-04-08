<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { onDeactivated, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { ELayout, ELayoutContent, ELayoutSider } from '@/components/e-layout'
import { useControlStore } from '@/store/useControlStore/useControlStore'
import { useWorkspaceStore } from '@/store/workspaceStore/workspaceStore'
import { CustomComponents } from '@/visual-editor/components/component-list'
import LeftAside from '@/visual-editor/components/left-aside/LeftAside.vue'
import RightAttributePanel from '@/visual-editor/components/right-attribute-panel/RightAttributePanel.vue'
import SimulatorEditor from '@/visual-editor/components/simulator-editor/SimulatorEditor.vue'

const route = useRoute()
const workspaceStore = useWorkspaceStore()
const { appList } = storeToRefs(workspaceStore)

const controlStore = useControlStore()

const { layoutCollapse, settingCollapse } = storeToRefs(controlStore)

function initCurrentApp() {
  const current = appList.value?.find(e => e?.id === route.params?.appId) || appList.value?.[0]
  if (current) {
    workspaceStore.setCurrentApp(current)
  }
}

onMounted(() => {
  initCurrentApp()
})

onUnmounted(() => {
  workspaceStore.setCurrentApp(null)
})
</script>

<template>
  <ELayout id="application-edit-wrapper" class="w-full h-full flex overflow-hidden relative">
    <ELayoutSider v-model:collapsed="layoutCollapse" show-trigger="bar" :width="280" :collapsed-width="0">
      <LeftAside />
    </ELayoutSider>

    <ELayoutContent>
      <SimulatorEditor />
    </ELayoutContent>

    <ELayoutSider
      v-model:collapsed="settingCollapse"
      show-trigger="bar"
      :width="360"
      :collapsed-width="0"
      position="right"
    >
      <!-- 右侧属性设置 -->
      <RightAttributePanel />
    </ELayoutSider>

    <!-- 组件抽屉 -->
    <CustomComponents />
  </ELayout>
</template>

<style lang="scss" module></style>
