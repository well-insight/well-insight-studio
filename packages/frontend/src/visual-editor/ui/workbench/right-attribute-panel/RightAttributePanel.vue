<script lang="ts" setup>
import { debounce } from 'lodash-es'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { ButtonTabs } from '@/components/button-tabs'
import { useControlStore } from '@/stores/controlStore'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import CanvasLayerPanel from '@/visual-editor/ui/workbench/edit-tools/components/CanvasLayerPanel.vue'
import PageSettingPanel from '@/visual-editor/ui/workbench/edit-tools/components/PageSettingPanel.vue'
import { Animate, AttrEditor, EventAction, FormRule } from './components'

defineOptions({
  name: 'RightAttributePanel',
})

const controlStore = useControlStore()
const { currentBlock } = useVisualData()
const { floatingSettingActiveTab } = storeToRefs(controlStore)

const currentActive = ref('attr')

const pageListOptions = ref<{ label: string, value: string }[]>([])
const selectionTabs = ['attr', 'animate', 'form-rule', 'event']
const hasCurrentBlock = computed(() => !!currentBlock.value?._vid)

function initPageOptions() {
  const options = [
    {
      label: '属性',
      value: 'attr',
    },
    {
      label: '动画',
      value: 'animate',
    },
  ]

  if (currentBlock.value?.label?.startsWith('表单')) {
    options.push({
      label: '规则',
      value: 'form-rule',
    })
  }

  options.push(
    {
      label: '事件',
      value: 'event',
    },
    {
      label: '层级',
      value: 'layer',
    },
    {
      label: '页面',
      value: 'page',
    },
  )

  pageListOptions.value = options

  const nextActive = floatingSettingActiveTab.value || currentActive.value
  const hasTarget = options.some(item => item.value === nextActive)

  if (hasTarget) {
    currentActive.value = nextActive
    return
  }

  if (!hasCurrentBlock.value && selectionTabs.includes(currentActive.value)) {
    currentActive.value = 'layer'
    return
  }

  if (!options.some(item => item.value === currentActive.value)) {
    currentActive.value = hasCurrentBlock.value ? 'attr' : 'layer'
  }
}

const isOpen = ref(true)

watch(
  () => currentBlock.value,
  debounce(
    () => {
      initPageOptions()
    },
    100,
    { leading: false, trailing: true },
  ),
  { immediate: true },
)

watch(
  () => floatingSettingActiveTab.value,
  () => {
    initPageOptions()
  },
)
</script>

<template>
  <div :class="[$style.wrapper, isOpen ? $style['open-wrapper'] : '']">
    <div :class="[$style.drawer, isOpen ? $style['is-open'] : '']">
      <div :class="$style.panelShell">
        <div :class="$style.tabBar">
          <ButtonTabs v-model="currentActive" :options="pageListOptions" />
        </div>
        <div class="h-0 w-full flex-auto overflow-hidden">
          <template v-if="currentActive === 'layer'">
            <CanvasLayerPanel embedded />
          </template>
          <template v-else-if="currentActive === 'page'">
            <PageSettingPanel embedded />
          </template>
          <el-scrollbar v-else :class="currentActive === 'animate' ? 'animate-scrollbar' : ''" class="p-3">
            <template v-if="hasCurrentBlock">
              <AttrEditor v-if="currentActive === 'attr'" />
              <Animate v-else-if="currentActive === 'animate'" />
              <FormRule v-else-if="currentActive === 'form-rule'" />
              <EventAction v-else-if="currentActive === 'event'" />
            </template>
            <div v-else :class="$style.emptyState">
              <div :class="$style.emptyIcon">
                ⚙️
              </div>
              <p>请先选择一个组件</p>
              <span>然后在这里配置属性、动画或事件</span>
            </div>
          </el-scrollbar>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
// $boxShadow: -2px 0 4px 0 rgb(0 0 0 / 10%);

.wrapper {
  width: 100%;
  height: 100%;
  transition: width 0.5s;

  // &.open-wrapper {
  //   width: 350px;
  // }
}

.drawer {
  position: relative;
  height: 100%;
  width: 100%;
  background-color: transparent;
  transform: translateX(100%);
  transition: transform 0.5s ease-in-out;
  contain: layout;

  &.is-open {
    transform: translateX(0);

    /* .floating-action-btn {
      transform: translateX(0);
    } */
  }

  /* &:hover {
    .floating-action-btn {
      transform: translateX(-20px);
    }
  } */
}

.floating-action-btn {
  position: absolute;
  top: 50%;
  left: 0;
  display: flex;
  width: 30px;
  height: 30px;
  z-index: 99;
  border: var(--el-border);
  border-radius: 50%;
  cursor: pointer;
  background: var(--el-bg-color);
  transform: translateX(-50%);
  // box-shadow: $boxShadow;
  transition: transform 0.5s ease-in-out;
  justify-content: center;
  align-items: center;
}

.attrs {
  position: absolute;
  width: 100%;
  height: 100%;
  overflow-y: hidden;
  background-color: var(--el-bg-color);
}

.panelShell {
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
}

.tabBar {
  display: flex;
  flex-wrap: wrap;
  min-height: 40px;
  align-items: center;
  gap: 2px;
  padding-bottom: 10px;
  margin-bottom: 8px;
  border-bottom: 1px solid rgba(82, 124, 181, 0.13);
  flex-shrink: 0;

  :deep(.el-button) {
    height: 26px;
    padding: 0 10px;
    border-radius: 999px;
    font-size: 12px;
  }
}

.emptyState {
  display: flex;
  min-height: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  text-align: center;
  color: #7a8aa3;

  p {
    margin: 0 0 4px;
    font-size: 13px;
    font-weight: 600;
    color: #3a4a6b;
  }

  span {
    font-size: 12px;
    color: #8e9fb5;
  }
}

.emptyIcon {
  margin-bottom: 12px;
  font-size: 30px;
  line-height: 1;
  filter: grayscale(1) opacity(0.5);
}
</style>
