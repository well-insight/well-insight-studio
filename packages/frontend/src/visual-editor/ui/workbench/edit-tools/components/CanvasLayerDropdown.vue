<script lang="ts" setup>
import type { VisualEditorBlockData } from '@/visual-editor/core/visual-editor.utils'
import {
  CopyDocument,
  Delete,
  Expand,
  Fold,
  FolderRemove,
  List,
} from '@element-plus/icons-vue'
import { isString } from 'lodash-es'
import { computed, ref } from 'vue'
import { SvgIcon } from '@/components/svg-icon'
import { useControlStore } from '@/stores/controlStore'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { generateNanoid } from '@/visual-editor/lib'
import { visualConfig } from '@/visual.config'

const { currentPage, currentBlock, setCurrentBlock, recordHistory } = useVisualData()
const controlStore = useControlStore()

const blocks = computed(() => currentPage.value?.blocks ?? [])

/** 树过滤器关键字 */
const filterText = ref('')
const treeRef = ref<any>(null)
const hoverVid = ref<string | null>(null)
const isLayerDragging = ref(false)
const treeData = computed(() => transformToTreeData(blocks.value))

// ---- 工具函数 ----

function getModuleColor(moduleName?: string): string {
  const map: Record<string, string> = {
    baseWidgets: 'var(--el-color-primary)',
    containerComponents: 'var(--el-color-success)',
    formWidgets: 'var(--el-color-warning)',
    chartWidgets: 'var(--el-color-purple)',
  }
  return moduleName ? map[moduleName] || 'var(--el-text-color-secondary)' : 'var(--el-text-color-secondary)'
}

function getModuleLabel(moduleName?: string): string {
  const map: Record<string, string> = {
    baseWidgets: '基础',
    containerComponents: '容器',
    formWidgets: '表单',
    chartWidgets: '图表',
  }
  return moduleName ? map[moduleName] || '' : ''
}

interface TreeNode extends Omit<VisualEditorBlockData, 'children'> {
  children: TreeNode[]
  /** 是否为插槽分组节点 */
  isSlotGroup?: boolean
  /** 插槽名称（slotGroup=true 时有效） */
  slotKey?: string
  /** 组件图标 class */
  iconClass?: string
  /** 所属模块颜色 */
  moduleColor?: string
  /** 模块中文简称 */
  moduleLabel?: string
}

function transformToTreeData(data: VisualEditorBlockData[]): TreeNode[] {
  // 数组末尾的元素在画布上层，展示在树顶部
  return data.slice().reverse().map(item => buildTreeNode(item))
}

function buildTreeNode(item: VisualEditorBlockData): TreeNode {
  const comp = visualConfig.componentMap[item.componentKey]
  let iconClass = comp?.icon && isString(comp.icon) ? comp.icon : ''
  if (item.componentKey === 'group')
    iconClass = 'comp-icon-group'
  const moduleColor = getModuleColor(item.moduleName)
  const moduleLabel = item.componentKey === 'group' ? '组' : getModuleLabel(item.moduleName)

  const node: TreeNode = {
    ...item,
    children: [],
    label: item.label || item.componentKey || item._vid,
    iconClass,
    moduleColor,
    moduleLabel,
  }

  // 收集插槽子节点，将插槽名字作为分组标题
  const slots = item.props?.slots || {}
  const slotKeys = Object.keys(slots).filter(k => slots[k]?.children?.length)

  if (slotKeys.length > 0) {
    slotKeys.forEach((key) => {
      const children = slots[key]?.children || []
      if (children.length === 0)
        return

      // 组内组件直接挂在组节点下，减少一层插槽分组缩进
      if (item.componentKey === 'group' && key === 'default') {
        node.children.push(...children.slice().reverse().map(child => buildTreeNode(child)))
        return
      }

      // 插槽分组标题节点
      const slotGroup: TreeNode = {
        _vid: `__slot_${item._vid}_${key}`,
        i: '',
        moduleName: item.moduleName,
        componentKey: '',
        label: `插槽：${key}`,
        adjustPosition: false,
        focus: false,
        w: 0,
        h: 0,
        x: 0,
        y: 0,
        styles: {},
        hasResize: false,
        props: {},
        draggable: false,
        showStyleConfig: false,
        actions: [],
        events: [],
        children: children.slice().reverse().map(child => buildTreeNode(child)),
        isSlotGroup: true,
        slotKey: key,
      }
      node.children.push(slotGroup)
    })
  }

  return node
}

/** 递归过滤树节点 */
function filterNode(value: string, data: TreeNode): boolean {
  if (!value)
    return true
  const keyword = value.toLowerCase()
  if (data.label?.toLowerCase().includes(keyword))
    return true
  if (data.componentKey?.toLowerCase().includes(keyword))
    return true
  if (data.children?.length) {
    return data.children.some(child => filterNode(value, child))
  }
  return false
}

/** 在实际数据中递归查找指定 _vid 的 block */
function findBlockByVidRaw(vid: string, nodes: VisualEditorBlockData[]): VisualEditorBlockData | null {
  for (const n of nodes) {
    if (n._vid === vid)
      return n
    const slots = n.props?.slots || {}
    for (const key of Object.keys(slots)) {
      const children = slots[key]?.children
      if (children) {
        const found = findBlockByVidRaw(vid, children)
        if (found)
          return found
      }
    }
  }
  return null
}

/** 查找 block 所在的同级数组及索引 */
function findBlockListContext(vid: string, nodes: VisualEditorBlockData[] = blocks.value): { list: VisualEditorBlockData[], index: number } | null {
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i]._vid === vid)
      return { list: nodes, index: i }
  }
  for (const node of nodes) {
    const slots = node.props?.slots || {}
    for (const key of Object.keys(slots)) {
      const children = slots[key]?.children
      if (!children?.length)
        continue
      for (let i = 0; i < children.length; i++) {
        if (children[i]._vid === vid)
          return { list: children, index: i }
      }
      const found = findBlockListContext(vid, children)
      if (found)
        return found
    }
  }
  return null
}

/**
 * 树展示顺序与数据数组相反（slice().reverse()），
 * 在树顺序中完成 before/after 后再写回数组。
 */
function reorderWithinSameList(
  list: VisualEditorBlockData[],
  dragIdx: number,
  dropIdx: number,
  dropType: 'before' | 'after',
) {
  const treeVids = list.map(b => b._vid).reverse()
  const draggedVid = list[dragIdx]._vid
  const tDrag = treeVids.indexOf(draggedVid)
  const tDrop = treeVids.indexOf(list[dropIdx]._vid)
  let tInsert = dropType === 'before' ? tDrop : tDrop + 1

  const nextTreeVids = treeVids.filter(vid => vid !== draggedVid)
  if (tDrag < tInsert)
    tInsert--

  nextTreeVids.splice(tInsert, 0, draggedVid)

  const moved = list.splice(dragIdx, 1)[0]
  const blockMap = new Map(list.map(b => [b._vid, b]))
  blockMap.set(moved._vid, moved)

  const reordered = nextTreeVids.reverse().map(vid => blockMap.get(vid)!)
  list.splice(0, list.length, ...reordered)
}

function allowTreeDrop(
  draggingNode: { data: TreeNode },
  dropNode: { data: TreeNode },
  type: 'before' | 'after' | 'inner' | string,
): boolean {
  // 只允许同级 before/after，禁止 inner 跨层级
  if (type === 'inner')
    return false
  if (draggingNode.data.isSlotGroup || dropNode.data.isSlotGroup)
    return false
  if (draggingNode.data._vid === dropNode.data._vid)
    return false

  const dragCtx = findBlockListContext(draggingNode.data._vid)
  const dropCtx = findBlockListContext(dropNode.data._vid)
  if (!dragCtx || !dropCtx)
    return false

  return dragCtx.list === dropCtx.list
}

function handleNodeDrop(
  draggingNode: { data: TreeNode, key: string },
  dropNode: { data: TreeNode, key: string },
  dropType: 'before' | 'after' | 'inner',
) {
  if (dropType === 'inner' || draggingNode.data.isSlotGroup || dropNode.data.isSlotGroup)
    return

  const draggedVid = draggingNode.data._vid
  const dropVid = dropNode.data._vid

  const dragCtx = findBlockListContext(draggedVid)
  const dropCtx = findBlockListContext(dropVid)
  if (!dragCtx || !dropCtx || dragCtx.list !== dropCtx.list)
    return

  if (dragCtx.index === dropCtx.index)
    return

  reorderWithinSameList(dragCtx.list, dragCtx.index, dropCtx.index, dropType)
  selectBlockByVid(draggedVid)
  recordHistory()
}

/** 根据 _vid 选中一个 block */
function selectBlockByVid(vid: string) {
  const node = findBlockByVidRaw(vid, blocks.value)
  if (node)
    selectBlock(node as TreeNode)
}

// ---- 交互 ----

function onNodeDragStart() {
  isLayerDragging.value = true
}

function onNodeDragEnd() {
  isLayerDragging.value = false
  hoverVid.value = null
}

function selectBlock(node: TreeNode) {
  if (isLayerDragging.value)
    return
  if (!node?._vid || node.isSlotGroup)
    return

  const block = findBlockByVidRaw(node._vid, blocks.value)
  if (!block)
    return

  controlStore.selectCanvasBlock(block)
}

function expandAll() {
  treeRef.value?.expandAll?.()
}

function collapseAll() {
  treeRef.value?.collapseAll?.()
}

function deleteCurrentBlock() {
  if (!currentBlock.value?._vid)
    return
  const removeById = (id: string, nodes: VisualEditorBlockData[]): boolean => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (nodes[i]._vid === id) {
        nodes.splice(i, 1)
        return true
      }
      const slots = nodes[i].props?.slots || {}
      for (const key of Object.keys(slots)) {
        const children = slots[key]?.children
        if (children && removeById(id, children))
          return true
      }
    }
    return false
  }
  if (removeById(currentBlock.value._vid, blocks.value))
    setCurrentBlock({} as VisualEditorBlockData)
}

function duplicateNode(node: TreeNode) {
  if (node.isSlotGroup)
    return
  const setNewVid = (n: VisualEditorBlockData) => {
    n._vid = `vid_${generateNanoid()}`
    n.focus = false
    const slots = n.props?.slots || {}
    Object.keys(slots).forEach((key) => {
      slots[key]?.children?.forEach((child: VisualEditorBlockData) => setNewVid(child))
    })
  }
  const cloneNode = (id: string, nodes: VisualEditorBlockData[]): boolean => {
    for (let i = 0; i < nodes.length; i++) {
      if (nodes[i]._vid === id) {
        const copy = JSON.parse(JSON.stringify(nodes[i]))
        setNewVid(copy)
        nodes.splice(i + 1, 0, copy)
        return true
      }
      const slots = nodes[i].props?.slots || {}
      for (const key of Object.keys(slots)) {
        const children = slots[key]?.children
        if (children && cloneNode(id, children))
          return true
      }
    }
    return false
  }
  if (node._vid)
    cloneNode(node._vid, blocks.value)
}

/**
 * 拆分组节点
 * 将组内的子组件释放到画布上，并恢复它们的原始位置
 */
function ungroupNode(node: TreeNode) {
  if (node.isSlotGroup || node.componentKey !== 'group')
    return

  ungroupByVid(node._vid)
}

/**
 * 拆分当前选中的组块
 */
function ungroupCurrentBlock() {
  if (!currentBlock.value?._vid || currentBlock.value.componentKey !== 'group')
    return
  ungroupByVid(currentBlock.value._vid)
}

/**
 * 根据 vid 拆分组
 */
function ungroupByVid(vid: string) {
  // 查找实际的组块
  const findGroupBlock = (vid: string, nodes: VisualEditorBlockData[]): VisualEditorBlockData | null => {
    for (const n of nodes) {
      if (n._vid === vid)
        return n
      const slots = n.props?.slots || {}
      for (const key of Object.keys(slots)) {
        const children = slots[key]?.children
        if (children) {
          const found = findGroupBlock(vid, children)
          if (found)
            return found
        }
      }
    }
    return null
  }

  const group = findGroupBlock(vid, blocks.value)
  if (!group || group.componentKey !== 'group')
    return

  // 获取组内的子组件
  const children = group.props?.slots?.default?.children || []

  if (children.length === 0) {
    // 空组直接删除
    const index = blocks.value.findIndex(item => item._vid === vid)
    if (index !== -1) {
      blocks.value.splice(index, 1)
      setCurrentBlock({} as VisualEditorBlockData)
      recordHistory()
    }
    return
  }

  // 统一网格度量：子组件 x/y 为相对于组的网格偏移
  const releasedBlocks: VisualEditorBlockData[] = children.map((child: VisualEditorBlockData) => {
    const releasedBlock = { ...child }

    releasedBlock._vid = `vid_${generateNanoid()}`
    releasedBlock.i = releasedBlock._vid

    // 直接网格相加
    releasedBlock.x = (group.x || 0) + (child.x || 0)
    releasedBlock.y = (group.y || 0) + (child.y || 0)

    delete (releasedBlock as any).groupInnerLayout
    releasedBlock.focus = false
    releasedBlock.focusWithChild = false

    return releasedBlock
  })

  // 找到组在当前 blocks 数组中的位置
  const groupIndex = blocks.value.findIndex(item => item._vid === vid)

  // 删除组
  if (groupIndex !== -1) {
    blocks.value.splice(groupIndex, 1)
  }

  // 将子组件插入到原来组的位置
  blocks.value.splice(groupIndex, 0, ...releasedBlocks)

  // 设置第一个子组件为当前选中
  if (releasedBlocks.length > 0) {
    setCurrentBlock(releasedBlocks[0])
    // 通知画布更新选中状态
    controlStore.selectCanvasBlock(releasedBlocks[0])
  }
  else {
    setCurrentBlock({} as VisualEditorBlockData)
  }

  recordHistory()
}
</script>

<template>
  <el-popover
    placement="bottom"
    trigger="click"
    width="340"
    transition="el-zoom-in-top"
    :popper-class="$style['page-setting-popover']"
  >
    <template #reference>
      <el-button text bg type="primary" :icon="List">
        <span>画布层级</span>
      </el-button>
    </template>

    <!-- 自定义标题栏 -->
    <div :class="$style['custom-header']">
      <span :class="$style['header-title']">画布层级</span>
      <div :class="$style['header-actions']">
        <el-tooltip content="展开/收起全部节点" placement="bottom">
          <el-button text size="small" :icon="Expand" @click="expandAll" />
        </el-tooltip>
      </div>
    </div>

    <div class="w-full flex flex-col">
      <!-- 工具栏 -->
      <div :class="$style['toolbar']">
        <el-button
          v-if="currentBlock?.componentKey === 'group'"
          text
          size="small"
          type="warning"
          :icon="FolderRemove"
          @click="ungroupCurrentBlock()"
        >
          拆分组
        </el-button>
      </div>

      <!-- 搜索框 -->
      <div :class="$style['search-box']">
        <el-input
          v-model="filterText"
          placeholder="搜索组件..."
          clearable
          :prefix-icon="List"
        />
      </div>

      <!-- 树 -->
      <el-scrollbar :class="$style['page-setting-panel']">
        <el-tree
          ref="treeRef"
          :data="treeData"
          :props="{ children: 'children', label: 'label' }"
          node-key="_vid"
          :indent="12"
          default-expand-all
          highlight-current
          draggable
          :current-node-key="currentBlock?._vid"
          :filter-node-method="filterNode"
          :allow-drag="(node: any) => !node.data.isSlotGroup"
          :allow-drop="allowTreeDrop"
          :class="$style['drag-tree']"
          @current-change="selectBlock"
          @node-drag-start="onNodeDragStart"
          @node-drag-end="onNodeDragEnd"
          @node-drop="handleNodeDrop"
        >
          <template #default="{ data }: { data: TreeNode }">
            <!-- 插槽分组标题 -->
            <div
              v-if="data.isSlotGroup"
              :class="$style['slot-group-header']"
            >
              <span :class="$style['slot-label']">{{ data.slotKey }}</span>
              <span :class="$style['slot-count']">{{ data.children.length }}</span>
            </div>

            <!-- 普通节点 -->
            <div
              v-else
              :class="[$style['tree-node'], hoverVid === data._vid && $style['tree-node--hover']]"
              @mouseenter="hoverVid = data._vid"
              @mouseleave="hoverVid = null"
            >
              <!-- 图标 -->
              <SvgIcon
                v-if="data.iconClass"
                :name="data.iconClass"
                :class="$style['node-icon']"
                :style="{ color: data.moduleColor }"
              />
              <span v-else :class="$style['node-icon-placeholder']" />

              <!-- 名称 -->
              <span :class="$style['node-label']">{{ data.label }}</span>

              <!-- 类型标签 -->
              <span
                v-if="data.moduleLabel"
                :class="$style['node-type-badge']"
                :style="{
                  background: `var(--el-color-primary-light-9)`,
                  color: data.moduleColor,
                }"
              >
                {{ data.moduleLabel }}
              </span>

              <!-- 快速操作 -->
              <span :class="$style['node-actions']" @click.stop>
                <el-tooltip v-if="data.componentKey === 'group'" content="拆分组" placement="top">
                  <el-button
                    link
                    size="small"
                    type="warning"
                    :icon="FolderRemove"
                    :class="$style['action-btn']"
                    @click="ungroupNode(data)"
                  />
                </el-tooltip>
                <el-tooltip content="复制" placement="top">
                  <el-button
                    link
                    size="small"
                    :icon="CopyDocument"
                    :class="$style['action-btn']"
                    @click="duplicateNode(data)"
                  />
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button
                    link
                    size="small"
                    type="danger"
                    :icon="Delete"
                    :class="$style['action-btn']"
                    @click="deleteCurrentBlock"
                  />
                </el-tooltip>
              </span>
            </div>
          </template>
        </el-tree>
      </el-scrollbar>

      <!-- 底部统计 -->
      <div :class="$style['footer-bar']">
        <span>共 {{ treeData.length }} 个根节点</span>
      </div>
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

  width: 340px !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--el-box-shadow-dark);

  :global(.el-popover__title) {
    display: none;
  }
}

.custom-header {
  height: 44px;
  padding: 0 14px 0 18px;
  display: flex;
  align-items: center;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  letter-spacing: 0.3px;
  white-space: nowrap;

  &::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: var(--el-color-primary);
    margin-right: 8px;
    vertical-align: middle;
  }
}

.header-actions {
  margin-left: auto;

  :global(.el-button) {
    width: 28px;
    height: 28px;
    font-size: 14px;
    color: var(--el-text-color-secondary);

    &:hover {
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
    }
  }
}

.toolbar {
  display: flex;
  gap: 4px;
  padding: 10px 12px 6px;
  flex-shrink: 0;

  :global(.el-button) {
    height: 28px;
    font-size: 12px;
    padding: 0 8px;
    border-radius: 6px;
  }
}

.search-box {
  padding: 0 12px 8px;

  :global(.el-input) {
    --el-input-border-radius: 8px;
  }
}

.page-setting-panel {
  padding: 0 12px;
  width: 340px;
  height: min(480px, calc(100vh - 200px));
  max-height: min(480px, calc(100vh - 200px));
  box-sizing: border-box;

  :global(.el-scrollbar__wrap) {
    max-height: min(480px, calc(100vh - 200px));
  }

  // 树节点样式
  :global(.el-tree-node__content) {
    height: auto;
    min-height: 36px;
    padding: 2px 0;
    border-radius: 6px;
    transition: background-color 0.15s;

    &:hover {
      background-color: var(--el-color-primary-light-9);
    }
  }

  :global(.el-tree-node.is-current > .el-tree-node__content) {
    background-color: var(--el-color-primary-light-8);
  }

  // 深层嵌套节点额外缩进（较默认更紧凑）
  :global(.el-tree-node__children) .el-tree-node__children .el-tree-node__content {
    padding-left: 24px !important;
  }
}

/* 拖拽中的样式 */
:global(.el-tree-dragging) {
  :global(.el-tree-node__content) {
    opacity: 0.5;
  }
}

.drag-tree {
  // 树节点样式
  :global(.el-tree-node__content) {
    height: auto;
    min-height: 36px;
    padding: 2px 0;
    border-radius: 6px;
    transition: background-color 0.15s;

    &:hover {
      background-color: var(--el-color-primary-light-9);
    }
  }

  :global(.el-tree-node.is-current > .el-tree-node__content) {
    background-color: var(--el-color-primary-light-8);
  }

  // 深层嵌套节点额外缩进（较默认更紧凑）
  :global(.el-tree-node__children) .el-tree-node__children .el-tree-node__content {
    padding-left: 24px !important;
  }

  /* 拖拽中的样式 */
  :global(.el-tree-dragging) {
    :global(.el-tree-node__content) {
      opacity: 0.5;
    }
  }
  :global(.el-tree-node.is-dragging) {
    > .el-tree-node__content {
      background-color: var(--el-color-primary-light-7);
      opacity: 0.8;
      box-shadow: 0 0 0 2px var(--el-color-primary);
      border-radius: 6px;
    }
  }

  :global(.el-tree-node.is-drop-inner) {
    > .el-tree-node__content {
      background-color: var(--el-color-primary-light-8);
      outline: 2px dashed var(--el-color-primary);
      outline-offset: -2px;
      border-radius: 6px;
    }
  }

  :global(.el-tree-node.before-drop),
  :global(.el-tree-node.after-drop) {
    position: relative;

    &::before {
      content: '';
      position: absolute;
      left: 24px;
      right: 8px;
      height: 2px;
      background: var(--el-color-primary);
      z-index: 10;
      border-radius: 1px;
    }
  }

  :global(.el-tree-node.before-drop)::before {
    top: 0;
  }

  :global(.el-tree-node.after-drop)::before {
    bottom: 0;
  }

}

/* ---- 插槽分组标题 ---- */
.slot-group-header {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 4px 8px;
  cursor: default;
  user-select: none;

  .slot-label {
    font-size: 11px;
    font-weight: 600;
    color: var(--el-text-color-placeholder);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .slot-count {
    font-size: 10px;
    color: var(--el-text-color-disabled);
    background: var(--el-fill-color);
    padding: 0 6px;
    border-radius: 8px;
    line-height: 16px;
  }
}

/* ---- 树节点 ---- */
.tree-node {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 4px 6px;
  min-height: 30px;
}

.tree-node--hover .node-actions {
  display: flex;
}

.node-icon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  font-size: 16px;
}

.node-icon-placeholder {
  flex-shrink: 0;
  width: 18px;
}

.node-label {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-type-badge {
  flex-shrink: 0;
  font-size: 10px;
  padding: 0 6px;
  line-height: 18px;
  border-radius: 4px;
  font-weight: 500;
}

.node-actions {
  display: none;
  flex-shrink: 0;
  gap: 2px;
  margin-left: auto;
}

.tree-node:hover .node-actions {
  display: flex;
}

.action-btn {
  --el-button-size: 22px;
  font-size: 13px;
  padding: 0 2px;
}

/* ---- 底部统计 ---- */
.footer-bar {
  display: flex;
  justify-content: space-between;
  padding: 8px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 11px;
  color: var(--el-text-color-disabled);
  flex-shrink: 0;
}
</style>
