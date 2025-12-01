<script lang='ts' setup>
import type { ComponentConfig } from '@/custom-components/types'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { useDesignStore } from '@/stores/design'
import { getComponent } from '../control-components'

defineOptions({
  name: 'AttrListRender',
})

const props = withDefaults(defineProps<{ configs?: ComponentConfig[], collapseAll?: boolean }>(), {
  collapseAll: false,
})

const designStore = useDesignStore()

const { currentComponentConfig } = storeToRefs(designStore)

const activeNames = ref<string[]>([])

watch(() => props?.configs, () => {
  activeNames.value = props?.collapseAll === true ? props?.configs?.map(e => e?.value) || [] : []
})
</script>

<template>
  <el-collapse v-model="activeNames" class="custom-collapse">
    <template v-for="e in configs" :key="e?.key">
      <el-collapse-item v-if="e?.children?.length" :title="e?.title" :name="e?.value">
        <AttrListRender :configs="e?.children" />
      </el-collapse-item>
      <div v-else class="w-full flex h-[50px] items-center attrs-setting-item">
        <el-text class="w-[30%]">
          {{ e?.title }}
        </el-text>
        <div class="flex-auto w-0">
          <component :is="getComponent(e?.key)" v-model="currentComponentConfig[e.value]" v-bind="e?.props" />
        </div>
      </div>
    </template>
  </el-collapse>
</template>

<style lang='scss' scoped>
.attrs-setting-item {
  border-bottom: 1px solid var(--el-collapse-border-color);
}
.custom-collapse {
  border-bottom: none;
  :deep(.el-collapse-item__content) {
    padding-left: 20px;
  }
}
</style>
