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
      label: '页面',
      value: 'page',
    },
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

  // 统一右侧面板内原生 ElCard（EventAction / FormRule）为玻璃卡片风格，
  // 与 AttrEditorCard / page-setting-card 保持一致
  :global(.el-card),
  :global(.el-card.is-always-shadow),
  :global(.el-card.is-hover-shadow:hover) {
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;
    background: var(--el-bg-color);
    box-shadow: 0 2px 8px rgba(31, 58, 112, 0.04);
    transition:
      box-shadow 0.3s ease,
      border-color 0.3s ease,
      background 0.3s ease;
  }

  :global(.el-card:hover) {
    border-color: var(--el-color-primary-light-5);
    box-shadow: 0 4px 12px rgba(31, 58, 112, 0.07);
  }

  :global(.el-card__header) {
    min-height: 42px;
    padding: 0 12px;
    border-bottom: 1px solid var(--el-border-color-lighter);
    background: var(--el-fill-color-light);
  }

  :global(.el-card__body) {
    padding: 12px;
    background: var(--el-bg-color);
  }

  // 输入控件与统一卡片风格对齐（圆角、边框、聚焦态）
  :global(.el-input__wrapper),
  :global(.el-select__wrapper),
  :global(.el-cascader__wrapper),
  :global(.el-input-number) {
    border-radius: 7px;
    box-shadow: 0 0 0 1px var(--el-border-color) inset;
    transition:
      box-shadow 0.3s ease,
      background 0.3s ease;

    &:hover {
      box-shadow: 0 0 0 1px var(--el-border-color-dark) inset;
    }

    &:focus-within {
      box-shadow:
        0 0 0 1px var(--el-color-primary) inset,
        0 0 0 3px var(--el-color-primary-light-8);
    }
  }

  :global(.el-form-item__label) {
    color: var(--el-form-label-color);
    font-size: 12px;
    font-weight: 500;
  }
}

.tabBar {
  position: relative;
  display: flex;
  min-height: 46px;
  height: 46px;
  align-items: center;
  gap: 4px;
  padding: 0 12px;
  margin: 0;
  border-bottom: 1px solid var(--el-border-color-extra-light);
  background: color-mix(in srgb, var(--el-bg-color) 88%, transparent);
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
    position: relative;
    min-width: 0;
    padding: 0 10px;
    border-radius: 7px;
    color: var(--el-text-color-secondary);
    font-size: 12px;
    font-weight: 600;
    line-height: 30px;
    transition:
      color 0.18s ease,
      background 0.18s ease,
      box-shadow 0.18s ease;

    &:hover {
      color: var(--el-color-primary);
      background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
    }
  }

  :global(.el-button.active),
  :global(.el-button--primary) {
    color: var(--el-color-primary) !important;
    background: color-mix(in srgb, var(--el-color-primary) 12%, transparent) !important;
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 28%, transparent);
  }
}

:global(html.dark) .panelContent {
  background: color-mix(in srgb, var(--el-bg-color) 76%, var(--el-bg-color-overlay));
}

:global(html.dark) .contentScrollbar {
  :global(.el-scrollbar__view) {
    background: color-mix(in srgb, var(--el-bg-color) 84%, var(--el-bg-color-overlay));
  }
}

:global(html.dark) {
  .tabBar {
    border-bottom-color: var(--el-border-color-extra-light);
    background: color-mix(in srgb, var(--el-bg-color) 94%, transparent);

    :global(.el-button) {
      color: var(--el-text-color-secondary);

      &:hover {
        color: var(--el-color-primary);
        background: color-mix(in srgb, var(--el-color-primary) 10%, transparent);
      }
    }

    :global(.el-button.active),
    :global(.el-button--primary) {
      background: color-mix(in srgb, var(--el-color-primary) 14%, transparent) !important;
      color: var(--el-color-primary) !important;
      box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--el-color-primary) 34%, transparent);
    }
  }

  .emptyState {
    color: var(--el-text-color-secondary);

    p {
      color: var(--el-text-color-primary);
    }

    span {
      color: var(--el-text-color-secondary);
    }
  }

  .emptyIcon {
    border-color: color-mix(in srgb, var(--el-color-primary) 24%, transparent);
    background: color-mix(in srgb, var(--el-color-primary) 12%, transparent);
    color: var(--el-color-primary);
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
  color: var(--el-text-color-secondary);

  p {
    margin: 0 0 4px;
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  span {
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }
}

.emptyIcon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  margin-bottom: 16px;
  border: 1px solid color-mix(in srgb, var(--el-color-primary) 18%, transparent);
  border-radius: var(--app-shell-radius, 14px);
  background: color-mix(in srgb, var(--el-color-primary) 8%, transparent);
  color: var(--el-color-primary);
}
</style>
