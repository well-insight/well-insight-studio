<template>
  <el-popover
    ref="popoverRef"
    v-if="props.virualRef"
    :virtual-ref="props.virualRef"
    trigger="click"
    virtual-triggering
  >
    <span> Some content </span>
  </el-popover>
</template>

<script setup lang="ts">
import { ref } from "vue";

import type { PopoverInstance } from "element-plus";

const props = withDefaults(defineProps<{ virualRef: any }>(), {
  virualRef: null,
});

const popoverInstance = ref<PopoverInstance>();

defineExpose({
  popoverInstance,
});
</script>
