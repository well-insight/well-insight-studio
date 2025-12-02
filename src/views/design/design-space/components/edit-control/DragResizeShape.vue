<script lang='ts' setup>
import { VueDraggableResizable } from '@/components/vue3-draggable-resizable'
</script>

<template>
  <VueDraggableResizable :class-name="$style['drag-resize']">
    <slot name="default" />
  </VueDraggableResizable>
</template>

<style lang='scss' module>
.drag-resize {

}
</style>
