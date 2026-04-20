<script lang="tsx" setup>
import { storeToRefs } from 'pinia'
import { computed } from 'vue'
import { useControlStore } from '@/stores/controlStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import MobileWrapper from './MobileWrapper.vue'
import PcWrapper from './PcWrapper.vue'

defineOptions({
  name: 'SimulatorEditorPreview'
})

const workspaceStore = useWorkspaceStore()

const { currentApp } = storeToRefs(workspaceStore)

const controlStore = useControlStore()

const { editScale } = storeToRefs(controlStore)

const scaleValue = computed({
  get() {
    return editScale.value * 100
  },
  set(v: number) {
    editScale.value = v / 100
  }
})

function changeScale(s: number) {
  editScale.value = s
}

function triggerShowComponents() {
  controlStore.customComponentsVisible = !controlStore.customComponentsVisible
}
</script>

<template>
  <div :class="$style.preview">
    <MobileWrapper v-if="currentApp?.clientType === 2" />
    <PcWrapper v-else :scale="editScale" @change-scale="changeScale" />
  </div>
</template>

<style lang="scss" module>
.preview {
  width: 100%;
  height: 100%;
}
</style>
