<script lang="ts" setup>
import { ref } from 'vue'
import { ButtonTabs } from '@/components/button-tabs'
import { EventAction } from '@/visual-editor/ui/right-attribute-panel/components'
import PageComponent from './PageComponent.vue'
// import PageEvent from './PageEvent.vue'
import PageStore from './PageStore.vue'

const currentActive = ref('component')

const pageListOptions = ref([
  {
    label: '组件',
    value: 'component'
  },
  {
    label: '事件',
    value: 'event'
  },
  {
    label: '状态',
    value: 'store'
  }
])
</script>

<template>
  <div class="w-full h-full flex flex-col">
    <div class="h-[50px] flex items-center px-3 border-bottom-1">
      <ButtonTabs v-model="currentActive" :options="pageListOptions" />
    </div>
    <div class="flex-auto h-0 w-full">
      <PageComponent v-if="currentActive === 'component'" />
      <EventAction v-else-if="currentActive === 'event'" />
      <PageStore v-else />
    </div>
  </div>
</template>

<style lang="scss" module></style>
