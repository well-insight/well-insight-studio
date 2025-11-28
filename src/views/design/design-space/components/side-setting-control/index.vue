<script lang="ts" setup>
import { computed } from 'vue'
import CanvasAttrList from '@/components/Editor/CanvasAttrList.vue'
import ComponentAttrList from '@/components/Editor/ComponentAttrList.vue'
import { useDesignStore } from '@/stores/design'

const store = useDesignStore()

const currentIndex = computed(() => store.$state.curComponentIndex)
</script>

<template>
  <div class="side-setting-container">
    <ComponentAttrList />
  </div>
</template>

<style scoped lang="scss">
.side-setting-container {
    width: 350px;
    height: 100%;
    overflow-y: auto;
}
</style>
