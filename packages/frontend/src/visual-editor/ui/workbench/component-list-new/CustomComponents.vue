<script lang="ts" setup>
import { Search } from '@element-plus/icons-vue'
import { storeToRefs } from 'pinia'
import { nextTick, onMounted, ref, useTemplateRef, watch } from 'vue'
import { useControlStore } from '@/stores/controlStore'
import { AdaptiveDialog } from '@/components/adaptive-dialog'
import ComponentList from './ComponentList.vue'

const controlStore = useControlStore()

const { customComponentsVisible } = storeToRefs(controlStore)

const appendToElement = ref<HTMLElement>()
const searchRef = useTemplateRef('searchRef')

const searchValue = ref('')

onMounted(() => {
  appendToElement.value = document.getElementById('application-edit-wrapper')
})

watch(customComponentsVisible, () => {
  if (customComponentsVisible.value) {
    nextTick(() => {
      setTimeout(() => {
        searchRef.value?.focus()
      }, 500)
    })
  }
})
</script>

<template>
  <AdaptiveDialog
    v-model="customComponentsVisible"
    title="添加组件"
    default-mode="drawer"
    drawer-size="350px"
    :drawer-modal="false"
    :drawer-lock-scroll="false"
    :append-to="appendToElement"
    shell-class="custom-components-drawer"
  >
    <div class="flex flex-col w-full h-full">
      <el-input
        ref="searchRef"
        v-model="searchValue"
        placeholder="搜索组件"
        class="mb-3"
        clearable
        :prefix-icon="Search"
      />
      <div class="w-full h-0 flex-auto">
        <ComponentList />
      </div>
    </div>
  </AdaptiveDialog>
</template>

<style lang="scss" module>
.modal {
  position: absolute !important;

  :global(.el-drawer) {
    border-left: 1px solid var(--el-border-color);

    :global(.el-drawer__header) {
      height: 50px;
      margin: 0;
      padding: 0 var(--el-drawer-padding-primary);
      border-bottom: var(--el-border);
    }
  }

  --el-box-shadow-dark: none;
  --el-dialog-padding-primary: 12px;
}
</style>
