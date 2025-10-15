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
    <CanvasAttrList v-if="currentIndex === -1" />
    <ComponentAttrList v-else />
  </div>
</template>

<style scoped lang="scss" src='./index.scss'></style>
