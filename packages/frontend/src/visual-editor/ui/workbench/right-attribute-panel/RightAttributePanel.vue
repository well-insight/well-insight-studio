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

const currentActive = computed({
  get: () => floatingSettingActiveTab.value || 'attr',
  set: (value) => {
    floatingSettingActiveTab.value = value
  },
})

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

  const nextActive = currentActive.value
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
  <div :class="$style.wrapper">
    <div :class="$style.panelShell">
      <div :class="$style.tabBar">
        <ButtonTabs v-model="currentActive" :options="pageListOptions" />
      </div>
      <div :class="$style.panelContent">
        <template v-if="currentActive === 'layer'">
          <CanvasLayerPanel embedded />
        </template>
        <template v-else-if="currentActive === 'page'">
          <PageSettingPanel embedded />
        </template>
        <el-scrollbar
          v-else
          :class="[$style.contentScrollbar, currentActive === 'animate' ? 'animate-scrollbar' : '']"
        >
          <template v-if="hasCurrentBlock">
            <AttrEditor v-if="currentActive === 'attr'" />
            <Animate v-else-if="currentActive === 'animate'" />
            <FormRule v-else-if="currentActive === 'form-rule'" />
            <EventAction v-else-if="currentActive === 'event'" />
          </template>
          <div v-else :class="$style.emptyState">
            <div :class="$style.emptyIcon" aria-hidden="true">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 3.5a2.2 2.2 0 0 1 2.17 1.85l.06.35h1.02a2.25 2.25 0 0 1 2.25 2.25v1.02l.35.06A2.2 2.2 0 0 1 19.7 11.2a2.2 2.2 0 0 1-1.85 2.17l-.35.06v1.02a2.25 2.25 0 0 1-2.25 2.25h-1.02l-.06.35A2.2 2.2 0 0 1 12 18.9a2.2 2.2 0 0 1-2.17-1.85l-.06-.35H8.75a2.25 2.25 0 0 1-2.25-2.25v-1.02l-.35-.06A2.2 2.2 0 0 1 4.3 11.2a2.2 2.2 0 0 1 1.85-2.17l.35-.06V7.95A2.25 2.25 0 0 1 8.75 5.7h1.02l.06-.35A2.2 2.2 0 0 1 12 3.5Z" stroke="currentColor" stroke-width="1.5" />
                <circle cx="12" cy="11.2" r="2.4" stroke="currentColor" stroke-width="1.5" />
              </svg>
            </div>
            <p>请先选择一个组件</p>
            <span>然后在这里配置属性、动画或事件</span>
          </div>
        </el-scrollbar>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.wrapper {
  width: 100%;
  height: 100%;
}

.panelShell {
  display: flex;
  height: 100%;
  width: 100%;
  flex-direction: column;
  overflow: hidden;
}

.panelContent {
  display: flex;
  height: 0;
  width: 100%;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
}

.contentScrollbar {
  width: 100%;
  height: 100%;
  padding: 12px 14px 16px;
  box-sizing: border-box;

  :global(.el-scrollbar__view) {
    min-height: 100%;
  }

  :global(.el-scrollbar__bar.is-vertical) {
    right: 3px;
  }
}

.tabBar {
  display: flex;
  min-height: 46px;
  height: 46px;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  margin: 0;
  border-bottom: 1px solid rgba(82, 124, 181, 0.13);
  background: rgba(255, 255, 255, 0.34);
  flex-shrink: 0;

  :global(.flex.items-center) {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    overflow-x: auto;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  :global(.el-button) {
    min-width: 0;
    padding: 0 10px;
    border-radius: 7px;
    color: #6f829d;
    font-size: 12px;
    font-weight: 600;
    line-height: 30px;
    transition:
      color 0.3s ease,
      background 0.3s ease;

    &:hover {
      color: var(--el-color-primary);
      background: rgba(37, 99, 235, 0.06);
    }
  }

  :global(.el-button.active),
  :global(.el-button--primary) {
    color: var(--el-color-primary) !important;
  }
}

:global(html.dark) {
  .tabBar {
    border-bottom-color: rgba(148, 163, 184, 0.16);
    background: rgba(15, 23, 42, 0.32);

    :global(.el-button) {
      color: #94a3b8;

      &:hover {
        color: #93c5fd;
        background: rgba(96, 165, 250, 0.1);
      }
    }

    :global(.el-button.active),
    :global(.el-button--primary) {
      background: rgba(96, 165, 250, 0.14) !important;
      color: #93c5fd !important;
    }
  }

  .emptyState {
    color: #94a3b8;

    p {
      color: #dbeafe;
    }

    span {
      color: #94a3b8;
    }
  }

  .emptyIcon {
    border-color: rgba(96, 165, 250, 0.2);
    background: rgba(96, 165, 250, 0.1);
    color: #93c5fd;
  }
}

.emptyState {
  display: flex;
  min-height: 100%;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 40px 20px;
  box-sizing: border-box;
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin-bottom: 16px;
  border: 1px solid rgba(37, 99, 235, 0.12);
  border-radius: 14px;
  background: rgba(37, 99, 235, 0.06);
  color: #5b8fe3;
}
</style>
