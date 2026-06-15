<script lang="ts" setup>
import type { VisualEditorBlockData } from '@/visual-editor/visual-editor.utils'
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'

const { updatePage, currentPage, overrideProject, currentBlock, setCurrentBlock } = useVisualData()

const currentBlocks = computed(() => transformToTreeData(currentPage.value?.blocks || []))

const treeRef = useTemplateRef('treeRef')
const scrollbarRef = useTemplateRef('scrollbarRef')
const triggerWithMine = ref(false)

const treeProps = {
  label: 'label', // 节点显示的文本字段
  children: 'children', // 子节点的字段名
}

function selectBlock(element: VisualEditorBlockData) {
  triggerWithMine.value = true
  setCurrentBlock(element)
  currentPage.value.blocks.forEach((block) => {
    block.focus = element._vid === block._vid
    block.focusWithChild = false
    handleSlotsFocus(block, element._vid)
    element.focusWithChild = false
  })
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

function findPathByLeafId(
  leafId: string,
  nodes: VisualEditorBlockData[] = [],
  path: VisualEditorBlockData[] = [],
): VisualEditorBlockData[] {
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

/**
 * 递归转换原始数据为tree格式
 * @param {Array} data - 原始数据数组
 * @returns {Array} 转换后的树形数据
 */
function collectSlotChildren(item: VisualEditorBlockData): VisualEditorBlockData[] {
  const result: VisualEditorBlockData[] = []
  const slots = item.props?.slots || {}

  Object.keys(slots).forEach((slotKey) => {
    const slotChildren = slots[slotKey]?.children
    if (Array.isArray(slotChildren) && slotChildren.length) {
      result.push(...transformToTreeData(slotChildren))
    }
  })

  return result
}

function transformToTreeData(data: VisualEditorBlockData[]) {
  return data.map((item) => {
    const treeNode: VisualEditorBlockData = {
      ...item,
      children: [],
    }

    treeNode.children = collectSlotChildren(item)

    return treeNode
  })
}

/**
 * 让选中的节点滚动到可视区域
 */
async function scrollToCurrentNode() {
  if (!currentBlock.value?._vid || !treeRef.value)
    return

  // 等待DOM渲染完成（必须，否则获取不到节点DOM）
  await nextTick()

  // 1. 通过el-tree的getNode方法获取选中的节点对象
  const targetNode = document.querySelector(`[data-key="${currentBlock.value._vid}"]`)
  if (!targetNode)
    return

  targetNode.scrollIntoView({
    block: 'center',
    behavior: 'smooth',
    inline: 'nearest',
  })
}

// 监听currentNodeKey变化，自动触发滚动
watch(
  currentBlock,
  async () => {
    if (!triggerWithMine.value) {
      await scrollToCurrentNode()
    }
    triggerWithMine.value = false
  },
  { immediate: true },
)

console.log('currentPage.value', currentPage.value)
</script>

<template>
  <div class="w-full h-full">
    <el-scrollbar ref="scrollbarRef">
      <el-tree
        ref="treeRef"
        :data="currentBlocks"
        :props="treeProps"
        node-key="_vid"
        default-expand-all
        highlight-current
        :current-node-key="currentBlock?._vid"
        class="custom-el-tree-wrapper"
        :class="$style.tree"
        @current-change="selectBlock"
      >
        <!-- 自定义节点内容（可选），展示更多信息 -->
        <template #default="{ node, data }">
          <el-space>
            <span>{{ node.label }}</span>
            <span style="margin-left: 10px; font-size: 12px; color: #999">
              {{ data.componentKey }}
            </span>
          </el-space>
        </template>
      </el-tree>
    </el-scrollbar>
  </div>
</template>

<style lang="scss" module>
.tree {
  padding: 6px;
}
</style>
