<script lang="ts" setup>
import type { VisualEditorBlockData } from '@/visual-editor/core/visual-editor.utils'
import { Delete, Expand, Fold, List } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'

const { currentPage, currentBlock, setCurrentBlock } = useVisualData()

const blocks = computed(() => currentPage.value?.blocks ?? [])
const layerTreeData = computed(() => transformToTreeData(blocks.value))
const treeRef = ref<any>(null)

const treeProps = {
  label: 'label',
  children: 'children',
}

function resetFocus(nodes: VisualEditorBlockData[]) {
  nodes.forEach((item) => {
    item.focus = false
    item.focusWithChild = false
    const slots = item.props?.slots || {}
    Object.keys(slots).forEach((key) => {
      const children = slots[key]?.children
      if (children) {
        resetFocus(children)
      }
    })
  })
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
        if (findResult.length) {
          return findResult
        }
      }
    }
  }
  return []
}

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
      label: item.label || item.componentKey || item._vid,
    }

    treeNode.children = collectSlotChildren(item)

    return treeNode
  })
}

function selectBlock(node: VisualEditorBlockData) {
  if (!node?._vid) {
    return
  }

  resetFocus(blocks.value)
  const path = findPathByLeafId(node._vid, blocks.value)
  path.forEach((item) => {
    item.focusWithChild = true
  })
  node.focus = true
  setCurrentBlock(node)
}

function expandAll() {
  treeRef.value?.expandAll?.()
}

function collapseAll() {
  treeRef.value?.collapseAll?.()
}

function deleteCurrentBlock() {
  if (!currentBlock.value?._vid) {
    return
  }
  if (removeBlockById(currentBlock.value._vid, blocks.value)) {
    setCurrentBlock({} as VisualEditorBlockData)
  }
}

function removeBlockById(id: string, nodes: VisualEditorBlockData[] = []): boolean {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]._vid === id) {
      nodes.splice(i, 1)
      return true
    }
    const slots = nodes[i].props?.slots || {}
    const keys = Object.keys(slots)
    for (let j = 0; j < keys.length; j++) {
      const children = slots[keys[j]]?.children
      if (children && removeBlockById(id, children)) {
        return true
      }
    }
  }
  return false
}
</script>

<template>
  <el-popover
    title="画布层级"
    placement="bottom"
    trigger="click"
    width="320"
    transition="el-zoom-in-top"
    :popper-class="$style['page-setting-popover']"
  >
    <template #reference>
      <el-button text bg type="primary" :icon="List">
        <span>画布层级</span>
      </el-button>
    </template>

    <div class="w-full h-full flex flex-col">
      <el-space class="mx-3 my-2">
        <el-button link :icon="Expand" @click="expandAll">
          展开全部
        </el-button>
        <el-button link :icon="Fold" @click="collapseAll">
          收起全部
        </el-button>
        <el-button
          link
          type="danger"
          :icon="Delete"
          :disabled="!currentBlock?._vid"
          @click="deleteCurrentBlock"
        >
          删除选中
        </el-button>
      </el-space>
      <el-scrollbar :class="$style['page-setting-panel']">
        <el-tree
          ref="treeRef"
          :data="layerTreeData"
          :props="treeProps"
          node-key="_vid"
          default-expand-all
          highlight-current
          :current-node-key="currentBlock?._vid"
          class="custom-el-tree-wrapper"
          @current-change="selectBlock"
        >
          <template #default="{ node, data }">
            <el-space>
              <span>{{ node.label }}</span>
              <span class="node-meta">{{ data.componentKey }}</span>
            </el-space>
          </template>
        </el-tree>
      </el-scrollbar>
    </div>
  </el-popover>
</template>

<style lang="scss" module>
.page-setting-popover {
  --el-popover-bg-color: var(--el-bg-color-overlay);
  --el-popover-font-size: var(--el-font-size-base);
  --el-popover-border-color: var(--el-border-color-lighter);
  --el-popover-padding: 0;
  --el-popover-border-radius: 12px;

  width: 320px !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  :global(.el-popover__title) {
    height: 40px;
    width: 100%;
    padding: 0 16px;
    display: flex;
    align-items: center;
    margin-bottom: 0;
    border-bottom: 1px solid var(--el-border-color-lighter);
    flex-shrink: 0;
  }

  .page-setting-panel {
    padding: 0 8px;
    width: 320px;
    height: min(460px, calc(100vh - 220px));
    max-height: min(460px, calc(100vh - 220px));
    box-sizing: border-box;
  }

  :global(.el-scrollbar__wrap) {
    max-height: min(460px, calc(100vh - 220px));
  }
}
</style>
