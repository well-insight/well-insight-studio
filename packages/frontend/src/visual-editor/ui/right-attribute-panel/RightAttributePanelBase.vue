<script lang="ts" setup>
import { DArrowLeft, DArrowRight } from '@element-plus/icons-vue'
import { ElTabPane, ElTabs } from 'element-plus'
import { reactive, watch } from 'vue'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { Animate, AttrEditor, EventAction, FormRule, PageSetting } from './components'

defineOptions({
  name: 'RightAttributePanel'
})

const { currentBlock } = useVisualData()

const state = reactive({
  activeName: 'attr',
  isOpen: true
})

watch(
  () => currentBlock.value.label,
  newLabel => {
    if (!newLabel?.startsWith('表单') && state.activeName === 'form-rule') {
      state.activeName = 'attr'
    }
  }
)
</script>

<template>
  <div :class="[$style.wrapper, state?.isOpen ? $style['open-wrapper'] : '']">
    <div :class="[$style.drawer, state?.isOpen ? $style['is-open'] : '']">
      <div :class="$style['floating-action-btn']" @click="state.isOpen = !state.isOpen">
        <DArrowRight v-if="state?.isOpen" />
        <DArrowLeft v-else />
      </div>
      <div :class="$style.attrs">
        <ElTabs v-model="state.activeName" type="border-card" stretch :class="$style.tabs">
          <ElTabPane label="属性" name="attr">
            <AttrEditor />
          </ElTabPane>
          <ElTabPane label="动画" name="animate" lazy>
            <Animate />
          </ElTabPane>
          <ElTabPane label="事件" name="events">
            <EventAction />
          </ElTabPane>
          <ElTabPane v-if="currentBlock.label?.startsWith('表单')" label="规则" name="form-rule" lazy>
            <FormRule />
          </ElTabPane>
          <ElTabPane label="页面设置" name="page-setting">
            <PageSetting />
          </ElTabPane>
        </ElTabs>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
$boxShadow: -2px 0 4px 0 rgb(0 0 0 / 10%);

.wrapper {
  width: 0;
  height: 100%;
  transition: width 0.5s;

  &.open-wrapper {
    width: 390px;
  }
}

.drawer {
  position: relative;
  height: 100%;
  width: 100%;
  background-color: white;
  transform: translateX(100%);
  box-shadow: $boxShadow;
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
  width: 20px;
  height: 80px;
  cursor: pointer;
  background: #fff;
  transform: translateX(-20px);
  box-shadow: $boxShadow;
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

  .tabs {
    height: 100%;

    :global {
      .el-tabs__content {
        height: 100%;
        padding-bottom: 50px;
        overflow-y: auto;
      }

      .el-form-item__label {
        font-size: 12px;
      }

      .el-form-item .el-form-item__content {
        display: flex;
        justify-content: flex-end;
        align-items: center;
      }
    }
  }
}
</style>
