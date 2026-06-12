<script lang="ts" setup>
import type { ComponentConfig } from '@/custom-components/types'
import { get } from 'lodash-es'
import { storeToRefs } from 'pinia'
import { ref, watch, watchEffect } from 'vue'
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

watch(
  () => props?.configs,
  () => {
    activeNames.value = props?.collapseAll === true ? props?.configs?.map(e => e?.value) || [] : []
  },
  { immediate: true, deep: true },
)

watchEffect(() => {
  console.log('currentComponentConfig.value', currentComponentConfig.value, props?.configs)
  // debugger
})

function changeCurrenComponentConfig(m: any, e: ComponentConfig) {
  designStore.updateCurrentComponentConfig(e.path!, m)
}
</script>

<template>
  <el-collapse v-model="activeNames" class="custom-collapse">
    <template v-for="e in configs" :key="e?.key">
      <el-collapse-item v-if="e?.children?.length" :title="e?.title" :name="e?.value">
        <AttrListRender :configs="e?.children" />
      </el-collapse-item>
      <div v-else class="items-center attrs-setting-item">
        <el-text class="attrs-setting-item-title">
          {{ e?.title }}
        </el-text>
        <div class="attrs-setting-item-content">
          <component
            :is="getComponent(e?.key)"
            :model-value="get(currentComponentConfig, e.path || '')"
            v-bind="e?.props"
            @update:model-value="(m: any) => changeCurrenComponentConfig(m, e)"
          />
        </div>
      </div>
    </template>
  </el-collapse>
</template>

<style lang="scss" scoped>
.attrs-setting-item {
  display: flex;
  align-items: flex-start;
  border-bottom: var(--el-border);
  padding: 12px 0;

  .attrs-setting-item-title {
    width: 30%;
    line-height: var(--el-component-size);
    height: var(--el-component-size);
    align-self: baseline;
  }

  .attrs-setting-item-content {
    flex: 1;
    width: 0;
  }
}

.custom-collapse {
  border-bottom: none;

  :deep(.el-collapse-item__content) {
    padding-left: 20px;
  }
}
</style>
