<script lang="ts" setup>
interface Line {
  display?: boolean
  position?: string
  origin?: string
  lineLength?: string
}

const props = withDefaults(
  defineProps<{
    verticalLine: Line[]
    horizontalLine: Line[]
  }>(),
  {},
)
</script>

<template>
  <span
    v-for="(item, index) in verticalLine"
    v-show="item.display"
    :key="`v_${index}`"
    class="ref-line v-line"
    :style="{
      left: item.position,
      top: item.origin,
      height: item.lineLength,
    }"
  />
  <span
    v-for="(item, index) in horizontalLine"
    :key="`h_${index}`"
    class="ref-line h-line"
    :style="{
      top: item.position,
      left: item.origin,
      width: item.lineLength,
    }"
  />
</template>

<style scoped>
.ref-line {
  position: absolute;
  background-color: rgb(219, 89, 110);
  z-index: 9999;
}

.v-line {
  width: 1px;
}

.h-line {
  height: 1px;
}
</style>

<!-- <style lang="scss" scoped>
.mark-line {
    height: 100%;
}
.line {
    background: var(--el-color-primary);
    position: absolute;
    z-index: 1000;
}
.xline {
    width: 100%;
    height: 1px;
}
.yline {
    width: 1px;
    height: 100%;
}
</style> -->
