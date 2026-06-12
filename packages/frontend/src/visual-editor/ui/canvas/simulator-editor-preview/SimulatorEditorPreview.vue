<script lang="ts" setup>
import { storeToRefs } from 'pinia'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import MobileWrapper from './MobileWrapper.vue'
import PcWrapper from './PcWrapper.vue'

defineOptions({
  name: 'SimulatorEditorPreview',
})

const props = withDefaults(
  defineProps<{
    active?: boolean
  }>(),
  {
    active: true,
  },
)

const workspaceStore = useWorkspaceStore()
const { currentApp } = storeToRefs(workspaceStore)
</script>

<template>
  <div :class="$style.preview">
    <MobileWrapper v-if="currentApp?.clientType === 2" :active="active" />
    <PcWrapper v-else :active="active" />
  </div>
</template>

<style lang="scss" module>
.preview {
  width: 100%;
  height: 100%;
}
</style>
