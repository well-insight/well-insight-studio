<script lang="ts" setup>
import { debounce, throttle } from 'lodash-es'
import { computed, reactive, ref, watch, watchEffect } from 'vue'
import { ButtonTabs } from '@/components/button-tabs'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { Animate, AttrEditor, FormRule, PageSetting } from './components'

defineOptions({
  name: 'RightAttributePanel'
})

const { currentBlock } = useVisualData()

const currentActive = ref('attr')

const pageListOptions = ref([])

function getPageListOptions() {
  const options = [
    {
      label: '属性',
      value: 'attr'
    },
    {
      label: '动画',
      value: 'animate'
    }
  ]

  const pageOptions = {
    label: '页面',
    value: 'page-setting'
  }

  if (!currentBlock.value?._vid) {
    pageListOptions.value = [pageOptions]
    return
  }

  if (currentBlock.value?.label?.startsWith('表单')) {
    options.push({
      label: '规则',
      value: 'form-rule'
    })
  }

  options.push(pageOptions)

  pageListOptions.value = options
}

const activeName = ref('attr')

const isOpen = ref(true)

watch(
  () => currentBlock.value,
  debounce(
    () => {
      if (!currentBlock.value?.label?.startsWith('表单') && currentActive.value === 'form-rule') {
        activeName.value = 'attr'
      }

      if (!currentBlock.value?._vid) {
        currentActive.value = 'page-setting'
      } else {
        currentActive.value = 'attr'
      }

      getPageListOptions()
    },
    100,
    { leading: false, trailing: true }
  ),
  { immediate: true }
)
</script>

<template>
  <div :class="[$style.wrapper, isOpen ? $style['open-wrapper'] : '']">
    <div :class="[$style.drawer, isOpen ? $style['is-open'] : '']">
      <div class="w-full h-full flex flex-col border-start-1">
        <div class="h-[50px] flex items-center px-3 border-bottom-1">
          <ButtonTabs v-model="currentActive" :options="pageListOptions" />
        </div>
        <div class="flex-auto h-0 w-full">
          <el-scrollbar class="p-3">
            <AttrEditor v-if="currentActive === 'attr'" />
            <Animate v-else-if="currentActive === 'animate'" />
            <FormRule v-else-if="currentActive === 'form-rule'" />
            <PageSetting v-else />
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
