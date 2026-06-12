<script lang="ts" setup>
import { ref } from 'vue'
import { ButtonTabs } from '@/components/button-tabs'
import { EventAction } from '@/visual-editor/ui/workbench/right-attribute-panel/components'
import PageComponent from './PageComponent.vue'
// import PageEvent from './PageEvent.vue'
import PageStore from './PageStore.vue'

const currentActive = ref('component')

const pageListOptions = ref([
  {
    label: '组件',
    value: 'component',
  },
  {
    label: '状态',
    value: 'store',
  },
])
</script>

<template>
  <div class="flex h-full w-full flex-col">
    <div class="border-bottom-1 flex h-[50px] items-center px-3">
      <ButtonTabs v-model="currentActive" :options="pageListOptions" />
    </div>
    <div class="h-0 w-full flex-auto">
      <PageComponent v-if="currentActive === 'component'" />
      <EventAction v-else-if="currentActive === 'event'" />
      <PageStore v-else />
    </div>
  </div>
</template>

<style lang="scss" module></style>
