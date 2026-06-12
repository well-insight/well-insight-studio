<script lang="tsx" setup>
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { useElementSize } from '@vueuse/core'
import { cloneDeep } from 'lodash-es'
import { storeToRefs } from 'pinia'
import { computed, ref, useTemplateRef, watchEffect } from 'vue'
import { useGlobalProperties } from '@/hooks/useGlobalProperties'
import { useControlStore } from '@/stores/controlStore'
import { useWorkspaceStore } from '@/stores/workspaceStore'
import { useModal } from '@/visual-editor/hooks/useModal'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { generateNanoid } from '@/visual-editor/lib'
import { $$dropdown, DropdownOption } from '@/visual-editor/lib/dropdown-service'
import MonacoEditor from '@/visual-editor/ui/shared/monaco-editor/MonacoEditor'
import CompRender from './comp-render'
import DraggableTransitionGroup from './DraggableTransitionGroup.vue'
import SlotItem from './SlotItem.vue'

defineOptions({
  name: 'MobilePreviewWrapper',
})

withDefaults(
  defineProps<{
    active?: boolean
  }>(),
  { active: true },
)

const wrapperRef = useTemplateRef('wrapperRef')
const contentRef = useTemplateRef('contentRef')

const { width: wrapperWidth } = useElementSize(wrapperRef)

const workspaceStore = useWorkspaceStore()

const { currentApp } = storeToRefs(workspaceStore)

const controlStore = useControlStore()

const { currentPage, setCurrentBlock } = useVisualData()

const { globalProperties } = useGlobalProperties()

const drag = ref(false)

/**
 *  适应容器自适应宽度缩放
 */
const scale = computed(() => {
  return (wrapperWidth.value - 24) / currentPage.value.config?.pageSize?.width
})

/**
 * @description 操作当前页面样式表
 */
watchEffect(() => {
  const { bgImage, bgColor, pageSize, bgRepeat, bgSize } = currentPage.value.config
  const normalizedBgColor = bgColor || '#ffffff'
  const normalizedBgImage = bgImage ? `url(${bgImage})` : 'none'
  const bodyStyleStr = `
      .simulator-editor-content {
        width: ${pageSize?.width || 0}px;
        height: ${pageSize?.height || 0}px;
        background-color: ${normalizedBgColor};
        background-image: ${normalizedBgImage};
        background-repeat: ${bgRepeat || 'no-repeat'};
        background-size: ${bgSize || 'cover'};
        transform: translate(-50%, -50%) scale(${scale.value});
      }`
  const styleSheets = document.styleSheets[0]
  const firstCssRule = document.styleSheets[0].cssRules[0]
  const isExistContent = firstCssRule.cssText.includes('.simulator-editor-content')
  if (isExistContent) {
    styleSheets.deleteRule(0)
  }
  styleSheets.insertRule(bodyStyleStr)
})

// 递归实现
// @leafId  为你要查找的id，
// @nodes   为原始Json数据
// @path    供递归使用，不要赋值
function findPathByLeafId(leafId: string, nodes: VisualEditorBlockData[] = [], path: VisualEditorBlockData[] = []): VisualEditorBlockData[] {
  for (let i = 0; i < nodes.length; i++) {
    const tmpPath = path.concat()
    tmpPath.push(nodes[i])
    if (leafId === nodes[i]._vid) {
      return tmpPath
    }
    const slots = nodes[i].props?.slots || {}
    const keys = Object.keys(slots)
    for (let j = 0; j < keys.length; j++) {
      const children = slots[keys[j]]?.children
      if (children) {
        const findResult = findPathByLeafId(leafId, children, tmpPath)
        if (findResult) {
          return findResult
        }
      }
    }
  }
}

// 给当前点击的组件设置聚焦
function handleSlotsFocus(block: VisualEditorBlockData, _vid: string) {
  const slots = block.props?.slots || {}
  if (Object.keys(slots).length > 0) {
    Object.keys(slots).forEach((key) => {
      slots[key]?.children?.forEach((item: VisualEditorBlockData) => {
        item.focusWithChild = false
        item.focus = item._vid === _vid
        if (item.focus) {
          const arr = findPathByLeafId(_vid, currentPage.value.blocks)
          arr.forEach(n => (n.focusWithChild = true))
        }
        if (Object.keys(item.props?.slots || {}).length) {
          handleSlotsFocus(item, _vid)
        }
      })
    })
  }
}

// 选择要操作的组件
function selectComp(element: VisualEditorBlockData) {
  // 选中组件关闭组件选择抽屉
  controlStore.customComponentsVisible = false

  setCurrentBlock(element)
  currentPage.value.blocks.forEach((block) => {
    block.focus = element._vid === block._vid
    block.focusWithChild = false
    handleSlotsFocus(block, element._vid)
    element.focusWithChild = false
  })
}

/**
 * 删除组件
 */
function deleteComp(block: VisualEditorBlockData, parentBlocks = currentPage.value.blocks) {
  console.log(block, 'block')
  const index = parentBlocks.findIndex(item => item._vid === block._vid)
  if (index !== -1) {
    delete globalProperties.$$refs[parentBlocks[index]._vid]
    const delTarget = parentBlocks.splice(index, 1)[0]
    if (delTarget.focus) {
      setCurrentBlock({} as VisualEditorBlockData)
    }
  }
}

function onContextmenuBlock(e: MouseEvent, block: VisualEditorBlockData, parentBlocks = currentPage.value.blocks) {
  $$dropdown({
    reference: e,
    content: () => (
      <>
        <DropdownOption
          label="复制节点"
          icon="el-icon-document-copy"
          {...{
            onClick: () => {
              const index = parentBlocks.findIndex(item => item._vid === block._vid)
              if (index !== -1) {
                const setBlockVid = (block: VisualEditorBlockData) => {
                  block._vid = `vid_${generateNanoid()}`
                  block.focus = false
                  const slots = block?.props?.slots || {}
                  const slotKeys = Object.keys(slots)
                  if (slotKeys.length) {
                    slotKeys.forEach((slotKey) => {
                      slots[slotKey]?.children?.forEach((child: VisualEditorBlockData) => setBlockVid(child))
                    })
                  }
                }
                const blockCopy = cloneDeep(parentBlocks[index])
                setBlockVid(blockCopy)
                parentBlocks.splice(index + 1, 0, blockCopy)
              }
            },
          }}
        />
        <DropdownOption
          label="查看节点"
          icon="el-icon-view"
          {...{
            onClick: () =>
              useModal({
                title: '节点信息',
                footer: null,
                props: {
                  width: 600,
                },
                content: () => (
                  <MonacoEditor
                    code={JSON.stringify(block)}
                    layout={{ width: 530, height: 600 }}
                    vid={block._vid}
                  />
                ),
              }),
          }}
        />
        <DropdownOption
          label="删除节点"
          icon="el-icon-delete"
          {...{
            onClick: () => deleteComp(block, parentBlocks),
          }}
        />
      </>
    ),
  })
}

function triggerShowComponents() {
  controlStore.customComponentsVisible = !controlStore.customComponentsVisible
}
</script>

<template>
  <div ref="wrapperRef" class="simulator-editor-wrapper">
    <div ref="contentRef" class="simulator-editor-content">
      <DraggableTransitionGroup
        v-model:drag="drag"
        v-model="currentPage.blocks"
        draggable=".item-drag"
      >
        <template #item="{ element: outElement }">
          <div
            class="list-group-item"
            :data-label="outElement.label"
            :class="{
              focus: outElement.focus,
              focusWithChild: outElement.focusWithChild,
              drag,
              ['has-slot']: !!Object.keys(outElement.props.slots || {}).length,
            }"
            @contextmenu.stop.prevent="onContextmenuBlock($event, outElement)"
            @mousedown="selectComp(outElement)"
          >
            <CompRender
              :key="outElement._vid"
              :element="outElement"
              :style="{
                pointerEvents: Object.keys(outElement.props?.slots || {}).length ? 'auto' : 'none',
              }"
            >
              <template
                v-for="(value, slotKey) in outElement.props?.slots"
                :key="slotKey"
                #[slotKey]
              >
                <SlotItem
                  v-model:children="value.children"
                  v-model:drag="drag"
                  :slot-key="slotKey"
                  :on-contextmenu-block="onContextmenuBlock"
                  :select-comp="selectComp"
                  :delete-comp="deleteComp"
                />
              </template>
            </CompRender>
          </div>
        </template>
      </DraggableTransitionGroup>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use './func.scss' as *;

.simulator-container {
  display: flex;
  width: 100%;
  height: 100%;
  align-items: center;
  justify-content: center;
  position: relative;
  flex-direction: column;
}

.simulator-editor {
  width: 100%;
  overflow: hidden auto;
  background: #fafafa;
  border-radius: 5px;
  box-sizing: border-box;
  background-clip: content-box;
  contain: layout;
  flex: 1;
  height: 0;
  display: flex;
  justify-content: center;
  // padding: 32px 0 0 0;

  &::-webkit-scrollbar {
    width: 0;
  }

  .simulator-editor-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
  }

  &-content {
    background-color: var(--el-bg-color);
    // transform: translate(0);
    box-shadow: 0 8px 12px #ebedf0;
    margin-top: 32px;
    border-radius: var(--el-border-radius-base);
    position: absolute;
    top: 50%;
    left: 50%;
    // transform: translate(-50%, -50%);
  }
}

.list-group-item {
  position: relative;
  // padding: 3px;
  border: 2px solid var(--el-bg-color);
  cursor: move;

  > div {
    position: relative;
  }

  &.focus {
    @include showComponentBorder;
  }

  &.drag::after {
    display: none;
  }

  &:not(.has-slot) {
    content: '';
  }

  &.focusWithChild {
    @include showContainerBorder;
  }

  i {
    cursor: pointer;
  }

  &:hover {
    // 边框
    @include showComponentBorder;

    &::after {
      // 标签
      opacity: 1;
      transition: opacity 0.2s;
      @include showSoliOutline;
      @include showCompLabel(left);
    }
  }
}
</style>
