<script lang="ts" setup>
import { debounce } from 'lodash-es'
import { storeToRefs } from 'pinia'
import { ref, watch } from 'vue'
import { ButtonTabs } from '@/components/button-tabs'
import { useControlStore } from '@/stores/controlStore'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { Animate, AttrEditor, FormRule } from './components'

defineOptions({
  name: 'RightAttributePanel',
})

const controlStore = useControlStore()
const { currentBlock } = useVisualData()
const { floatingSettingActiveTab } = storeToRefs(controlStore)

const currentActive = ref('attr')

const pageListOptions = ref([])

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

  if (floatingSettingActiveTab.value) {
    currentActive.value = floatingSettingActiveTab.value
  }

  pageListOptions.value = options
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
</script>

<template>
  <div :class="[$style.wrapper, isOpen ? $style['open-wrapper'] : '']">
    <div :class="[$style.drawer, isOpen ? $style['is-open'] : '']">
      <div class="border-start-1 flex h-full w-full flex-col">
        <div class="border-bottom-1 flex h-[50px] items-center px-3">
          <ButtonTabs v-model="currentActive" :options="pageListOptions" />
        </div>
        <div class="h-0 w-full flex-auto overflow-hidden">
          <el-scrollbar :class="currentActive === 'animate' ? 'animate-scrollbar' : ''" class="p-3">
            <AttrEditor v-if="currentActive === 'attr'" />
            <Animate v-else-if="currentActive === 'animate'" />
            <FormRule v-else-if="currentActive === 'form-rule'" />
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
  background-color: white;
  transform: translateX(100%);
  // box-shadow: $boxShadow;
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
  background: #fff;
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
  background-color: white;
}
</style>
