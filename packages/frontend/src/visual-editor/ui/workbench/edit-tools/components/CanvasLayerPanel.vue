<script lang="ts" setup>
import type { VisualEditorBlockData } from '@/visual-editor/core/visual-editor.utils'
import {
  ArrowDown,
  ArrowUp,
  Bottom,
  Close,
  CopyDocument,
  Delete,
  Expand,
  Fold,
  FolderRemove,
  Lock,
  List,
  Top,
  Unlock,
} from '@element-plus/icons-vue'
import { isString } from 'lodash-es'
import { storeToRefs } from 'pinia'
import { computed, ref, watch } from 'vue'
import { SvgIcon } from '@/components/svg-icon'
import { useControlStore } from '@/stores/controlStore'
import { useVisualData } from '@/visual-editor/hooks/useVisualData'
import { generateNanoid } from '@/visual-editor/lib'
import { visualConfig } from '@/visual.config'

const emits = defineEmits<{
  close: []
}>()

const { currentPage, currentBlock, setCurrentBlock, recordHistory } = useVisualData()
const controlStore = useControlStore()
const { canvasSelectedBlockIds } = storeToRefs(controlStore)

const blocks = computed(() => currentPage.value?.blocks ?? [])

const effectiveSelectedIds = computed(() => [...canvasSelectedBlockIds.value])
const hasSelection = computed(() => effectiveSelectedIds.value.length > 0)
const isMultiSelection = computed(() => effectiveSelectedIds.value.length > 1)

const selectedLockedCount = computed(() => {
  return effectiveSelectedIds.value.filter((vid) => {
    const block = findBlockByVidRaw(vid, blocks.value)
    return Boolean(block?._layerLocked)
  }).length
})

const allSelectedLocked = computed(() =>
  hasSelection.value && selectedLockedCount.value === effectiveSelectedIds.value.length,
)
const someSelectedLocked = computed(() => selectedLockedCount.value > 0)

const filterText = ref('')
const treeRef = ref<any>(null)
const hoverVid = ref<string | null>(null)
const isLayerDragging = ref(false)
const treeData = computed(() => transformToTreeData(blocks.value))

interface TreeNode extends Omit<VisualEditorBlockData, 'children'> {
  children: TreeNode[]
  isSlotGroup?: boolean
  slotKey?: string
  iconClass?: string
  moduleColor?: string
  moduleLabel?: string
}

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

function transformToTreeData(data: VisualEditorBlockData[]): TreeNode[] {
  return data.slice().reverse().map(item => buildTreeNode(item))
}

function buildTreeNode(item: VisualEditorBlockData): TreeNode {
  const comp = visualConfig.componentMap[item.componentKey]
  let iconClass = comp?.icon && isString(comp.icon) ? comp.icon : ''
  if (item.componentKey === 'group')
    iconClass = 'comp-icon-group'
  const moduleColor = getModuleColor(item.moduleName)
  const moduleLabel = item.componentKey === 'group' ? '组' : getModuleLabel(item.moduleName)
  const label = item.label || item.componentKey || item._vid

  const node: TreeNode = {
    _vid: item._vid,
    i: item.i ?? item._vid,
    moduleName: item.moduleName,
    componentKey: item.componentKey,
    label,
    adjustPosition: !!item.adjustPosition,
    focus: false,
    focusWithChild: false,
    w: item.w ?? 0,
    h: item.h ?? 0,
    x: item.x ?? 0,
    y: item.y ?? 0,
    styles: {},
    hasResize: !!item.hasResize,
    props: {},
    model: {},
    draggable: !!item.draggable,
    showStyleConfig: !!item.showStyleConfig,
    actions: [],
    events: [],
    children: [],
    iconClass,
    moduleColor,
    moduleLabel,
  }
  if (item._layerLocked)
    node._layerLocked = true

  const slots = item.props?.slots || {}
  const slotKeys = Object.keys(slots).filter(k => slots[k]?.children?.length)

  if (slotKeys.length > 0) {
    slotKeys.forEach((key) => {
      const children = slots[key]?.children || []
      if (children.length === 0)
        return

      if (item.componentKey === 'group' && key === 'default') {
        node.children.push(...children.slice().reverse().map(child => buildTreeNode(child)))
        return
      }

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

function filterNode(value: string, data: TreeNode): boolean {
  if (!value)
    return true
  const keyword = value.toLowerCase()
  if (data.label?.toLowerCase().includes(keyword))
    return true
  if (data.componentKey?.toLowerCase().includes(keyword))
    return true
  if (data.children?.length)
    return data.children.some(child => filterNode(value, child))
  return false
}

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

function selectBlockByVid(vid: string) {
  const block = findBlockByVidRaw(vid, blocks.value)
  if (block)
    controlStore.selectCanvasBlock(block)
}

function isNodeSelected(vid: string) {
  return effectiveSelectedIds.value.includes(vid)
}

function onNodeDragStart() {
  isLayerDragging.value = true
}

function onNodeDragEnd() {
  isLayerDragging.value = false
  hoverVid.value = null
}

function clearSelection() {
  controlStore.clearCanvasSelection()
}

function onPanelBlankClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  const ignoreSelectors = [
    '.el-tree-node__content',
    '.el-tree-node__expand-icon',
    '.el-button',
    '.el-input',
    '.el-input__wrapper',
    '.el-scrollbar__bar',
    'button',
  ]
  if (ignoreSelectors.some(sel => target.closest(sel)))
    return
  clearSelection()
}

function onNodeClick(data: TreeNode, _node: unknown, _nodeInstance: unknown, event: MouseEvent) {
  if (isLayerDragging.value || data.isSlotGroup)
    return

  const block = findBlockByVidRaw(data._vid, blocks.value)
  if (!block)
    return

  controlStore.selectCanvasBlock(block, {
    multiSelect: event.ctrlKey || event.metaKey,
  })
}

function expandAll() {
  treeRef.value?.expandAll?.()
}

function collapseAll() {
  treeRef.value?.collapseAll?.()
}

function deleteNodes(vids: string[]) {
  if (!vids.length)
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

  vids.forEach(vid => removeById(vid, blocks.value))
  clearSelection()
  recordHistory()
}

function deleteNode(node: TreeNode) {
  if (node.isSlotGroup)
    return

  const vids = isMultiSelection.value && effectiveSelectedIds.value.includes(node._vid)
    ? [...effectiveSelectedIds.value]
    : [node._vid]
  deleteNodes(vids)
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

function ungroupNode(node: TreeNode) {
  if (node.isSlotGroup || node.componentKey !== 'group')
    return
  ungroupByVid(node._vid)
}

function ungroupCurrentBlock() {
  if (!currentBlock.value?._vid || currentBlock.value.componentKey !== 'group')
    return
  ungroupByVid(currentBlock.value._vid)
}

function ungroupByVid(vid: string) {
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

  const children = group.props?.slots?.default?.children || []

  if (children.length === 0) {
    const index = blocks.value.findIndex(item => item._vid === vid)
    if (index !== -1) {
      blocks.value.splice(index, 1)
      setCurrentBlock({} as VisualEditorBlockData)
      recordHistory()
    }
    return
  }

  const releasedBlocks: VisualEditorBlockData[] = children.map((child: VisualEditorBlockData) => {
    const releasedBlock = { ...child }
    releasedBlock._vid = `vid_${generateNanoid()}`
    releasedBlock.i = releasedBlock._vid
    releasedBlock.x = (group.x || 0) + (child.x || 0)
    releasedBlock.y = (group.y || 0) + (child.y || 0)
    delete (releasedBlock as any).groupInnerLayout
    releasedBlock.focus = false
    releasedBlock.focusWithChild = false
    return releasedBlock
  })

  const groupIndex = blocks.value.findIndex(item => item._vid === vid)
  if (groupIndex !== -1)
    blocks.value.splice(groupIndex, 1)

  blocks.value.splice(groupIndex, 0, ...releasedBlocks)

  if (releasedBlocks.length > 0) {
    setCurrentBlock(releasedBlocks[0])
    controlStore.selectCanvasBlock(releasedBlocks[0])
  }
  else {
    setCurrentBlock({} as VisualEditorBlockData)
  }

  recordHistory()
}

function groupSelectedByList(vids: string[]) {
  const listMap = new Map<VisualEditorBlockData[], string[]>()
  vids.forEach((vid) => {
    const ctx = findBlockListContext(vid)
    if (!ctx)
      return
    const existing = listMap.get(ctx.list) || []
    if (!existing.includes(vid))
      existing.push(vid)
    listMap.set(ctx.list, existing)
  })
  return listMap
}

function bringToFront(list: VisualEditorBlockData[], vids: string[]) {
  const selected = list.filter(b => vids.includes(b._vid))
  const rest = list.filter(b => !vids.includes(b._vid))
  list.splice(0, list.length, ...rest, ...selected)
}

function sendToBack(list: VisualEditorBlockData[], vids: string[]) {
  const selected = list.filter(b => vids.includes(b._vid))
  const rest = list.filter(b => !vids.includes(b._vid))
  list.splice(0, list.length, ...selected, ...rest)
}

function moveGroupUp(list: VisualEditorBlockData[], vids: string[]) {
  const indices = vids
    .map(vid => list.findIndex(b => b._vid === vid))
    .filter(i => i >= 0)
    .sort((a, b) => a - b)
  if (!indices.length || indices[indices.length - 1] >= list.length - 1)
    return

  const maxI = indices[indices.length - 1]
  const minI = indices[0]
  const [above] = list.splice(maxI + 1, 1)
  list.splice(minI, 0, above)
}

function moveGroupDown(list: VisualEditorBlockData[], vids: string[]) {
  const indices = vids
    .map(vid => list.findIndex(b => b._vid === vid))
    .filter(i => i >= 0)
    .sort((a, b) => a - b)
  if (!indices.length || indices[0] <= 0)
    return

  const minI = indices[0]
  const maxI = indices[indices.length - 1]
  const [below] = list.splice(minI - 1, 1)
  list.splice(maxI, 0, below)
}

function applyLayerOrder(op: 'front' | 'back' | 'up' | 'down') {
  const vids = effectiveSelectedIds.value
  if (!vids.length)
    return

  const listMap = groupSelectedByList(vids)
  listMap.forEach((ids, list) => {
    if (op === 'front')
      bringToFront(list, ids)
    else if (op === 'back')
      sendToBack(list, ids)
    else if (op === 'up')
      moveGroupUp(list, ids)
    else
      moveGroupDown(list, ids)
  })
  recordHistory()
}

function setLayerLocked(vids: string[], locked: boolean) {
  vids.forEach((vid) => {
    const block = findBlockByVidRaw(vid, blocks.value)
    if (!block)
      return
    if (locked)
      block._layerLocked = true
    else
      delete block._layerLocked
  })
  recordHistory()
}

function toggleLayerLock() {
  if (!hasSelection.value)
    return
  setLayerLocked(effectiveSelectedIds.value, !allSelectedLocked.value)
}

function deleteSelectedLayers() {
  if (!hasSelection.value)
    return
  deleteNodes([...effectiveSelectedIds.value])
}

watch(filterText, (val) => {
  treeRef.value?.filter(val)
})
</script>

<template>
  <div :class="$style.panel" @mousedown="onPanelBlankClick">
    <div :class="$style.header">
      <div :class="$style.headerMain">
        <el-icon :size="16">
          <List />
        </el-icon>
        <span>画布层级</span>
      </div>
      <div :class="$style.headerActions">
        <el-tooltip content="展开全部" placement="bottom">
          <el-button text size="small" :icon="Expand" @click="expandAll" />
        </el-tooltip>
        <el-tooltip content="收起全部" placement="bottom">
          <el-button text size="small" :icon="Fold" @click="collapseAll" />
        </el-tooltip>
        <el-tooltip content="关闭" placement="bottom">
          <el-button text size="small" :icon="Close" aria-label="关闭" @click.stop="emits('close')" />
        </el-tooltip>
      </div>
    </div>

    <div :class="$style.body">
      <div :class="$style.toolbar">
        <el-tooltip content="置顶" placement="bottom">
          <el-button text size="small" :icon="Top" :disabled="!hasSelection" @click="applyLayerOrder('front')" />
        </el-tooltip>
        <el-tooltip content="置底" placement="bottom">
          <el-button text size="small" :icon="Bottom" :disabled="!hasSelection" @click="applyLayerOrder('back')" />
        </el-tooltip>
        <el-tooltip content="上移一层" placement="bottom">
          <el-button text size="small" :icon="ArrowUp" :disabled="!hasSelection" @click="applyLayerOrder('up')" />
        </el-tooltip>
        <el-tooltip content="下移一层" placement="bottom">
          <el-button text size="small" :icon="ArrowDown" :disabled="!hasSelection" @click="applyLayerOrder('down')" />
        </el-tooltip>
        <el-divider direction="vertical" />
        <el-tooltip :content="allSelectedLocked ? '解冻' : '冻结'" placement="bottom">
          <el-button
            text
            size="small"
            :type="someSelectedLocked ? 'warning' : 'default'"
            :icon="allSelectedLocked ? Unlock : Lock"
            :disabled="!hasSelection"
            @click="toggleLayerLock"
          />
        </el-tooltip>
        <el-tooltip content="删除选中" placement="bottom">
          <el-button
            text
            size="small"
            type="danger"
            :icon="Delete"
            :disabled="!hasSelection"
            @click="deleteSelectedLayers"
          />
        </el-tooltip>
        <el-divider direction="vertical" />
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

      <div :class="$style.searchBox">
        <el-input
          v-model="filterText"
          placeholder="搜索组件..."
          clearable
          :prefix-icon="List"
        />
      </div>

      <el-scrollbar :class="$style.treePanel">
        <div :class="$style.treeInner">
          <el-tree
            ref="treeRef"
            :data="treeData"
            :props="{ children: 'children', label: 'label' }"
            node-key="_vid"
            :indent="12"
            default-expand-all
            :expand-on-click-node="false"
            draggable
            :filter-node-method="filterNode"
            :allow-drag="(node: any) => !node.data.isSlotGroup && !node.data._layerLocked"
            :allow-drop="allowTreeDrop"
            :class="$style.dragTree"
            @node-click="onNodeClick"
            @node-drag-start="onNodeDragStart"
            @node-drag-end="onNodeDragEnd"
            @node-drop="handleNodeDrop"
          >
            <template #default="{ data }: { data: TreeNode }">
              <div
                v-if="data.isSlotGroup"
                :class="$style.slotGroupHeader"
              >
                <span :class="$style.slotLabel">{{ data.slotKey }}</span>
                <span :class="$style.slotCount">{{ data.children.length }}</span>
              </div>

              <div
                v-else
                :class="[
                  $style.treeNode,
                  isNodeSelected(data._vid) && $style.treeNodeSelected,
                  data._layerLocked && $style.treeNodeLocked,
                ]"
                @mouseenter="hoverVid = data._vid"
                @mouseleave="hoverVid = null"
              >
                <SvgIcon
                  v-if="data.iconClass"
                  :name="data.iconClass"
                  :class="$style.nodeIcon"
                  :style="{ color: data.moduleColor }"
                />
                <span v-else :class="$style.nodeIconPlaceholder" />

                <span :class="$style.nodeLabel">{{ data.label }}</span>

                <el-icon v-if="data._layerLocked" :class="$style.nodeLockIcon">
                  <Lock />
                </el-icon>

                <span
                  v-if="data.moduleLabel"
                  :class="$style.nodeTypeBadge"
                  :style="{
                    background: `var(--el-color-primary-light-9)`,
                    color: data.moduleColor,
                  }"
                >
                  {{ data.moduleLabel }}
                </span>

                <span :class="$style.nodeActions" @click.stop>
                  <el-tooltip v-if="data.componentKey === 'group'" content="拆分组" placement="top">
                    <el-button
                      link
                      size="small"
                      type="warning"
                      :icon="FolderRemove"
                      :class="$style.actionBtn"
                      @click="ungroupNode(data)"
                    />
                  </el-tooltip>
                  <el-tooltip content="复制" placement="top">
                    <el-button
                      link
                      size="small"
                      :icon="CopyDocument"
                      :class="$style.actionBtn"
                      @click="duplicateNode(data)"
                    />
                  </el-tooltip>
                  <el-tooltip content="删除" placement="top">
                    <el-button
                      link
                      size="small"
                      type="danger"
                      :icon="Delete"
                      :class="$style.actionBtn"
                      @click="deleteNode(data)"
                    />
                  </el-tooltip>
                </span>
              </div>
            </template>
          </el-tree>
        </div>
      </el-scrollbar>

      <div :class="$style.footerBar">
        <div :class="$style.footerInfo">
          <span>共 {{ treeData.length }} 个根节点</span>
          <span v-if="isMultiSelection">已选 {{ effectiveSelectedIds.length }} 项</span>
        </div>
        <el-button
          v-if="hasSelection"
          link
          type="primary"
          size="small"
          @click="clearSelection"
        >
          取消选中
        </el-button>
      </div>
    </div>
  </div>
</template>

<style lang="scss" module>
.panel {
  width: 340px;
  background: var(--el-bg-color-overlay);
  border-radius: var(--el-popover-border-radius, 12px);
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  box-shadow: var(--el-box-shadow-light);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 44px;
  padding: 0 10px 0 14px;
  border-bottom: 1px solid var(--el-border-color-light);
  flex-shrink: 0;
}

.headerMain {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);

  &::before {
    content: '';
    display: inline-block;
    width: 3px;
    height: 14px;
    border-radius: 2px;
    background: var(--el-color-primary);
    margin-right: 2px;
    flex-shrink: 0;
  }
}

.headerActions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;

  :global(.el-button) {
    width: 28px;
    height: 28px;
    min-width: 28px;
    padding: 0;
    border-radius: 6px;
    font-size: 14px;
    color: var(--el-text-color-secondary);

    &:hover {
      color: var(--el-color-primary);
      background-color: var(--el-color-primary-light-9);
    }
  }
}

.body {
  display: flex;
  flex-direction: column;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2px;
  padding: 8px 12px 6px;
  flex-shrink: 0;

  :global(.el-button) {
    height: 28px;
    min-width: 28px;
    font-size: 12px;
    padding: 0 6px;
    border-radius: 6px;
  }

  :global(.el-divider--vertical) {
    height: 18px;
    margin: 0 4px;
  }
}

.searchBox {
  padding: 0 12px 8px;

  :global(.el-input) {
    --el-input-border-radius: 8px;
  }
}

.treePanel {
  padding: 0 12px;
  height: min(480px, calc(100vh - 200px));
  max-height: min(480px, calc(100vh - 200px));
  box-sizing: border-box;

  :global(.el-scrollbar__wrap) {
    max-height: min(480px, calc(100vh - 200px));
  }
}

.treeInner {
  min-height: 100%;
  padding-bottom: 4px;
}

.dragTree {
  :global(.el-tree-node__expand-icon.is-leaf) {
    display: none;
    width: 0;
    padding: 0;
    margin: 0;
  }

  :global(.el-tree-node__content) {
    height: auto;
    min-height: 36px;
    padding: 2px 0;
    border-radius: 6px;
    transition: background-color 0.15s;
    background-color: transparent;

    &:hover {
      background-color: transparent;
    }
  }

  :global(.el-tree-node__children) .el-tree-node__children .el-tree-node__content {
    padding-left: 24px !important;
  }

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

.slotGroupHeader {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 4px 8px;
  cursor: default;
  user-select: none;
}

.slotLabel {
  font-size: 11px;
  font-weight: 600;
  color: var(--el-text-color-placeholder);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.slotCount {
  font-size: 10px;
  color: var(--el-text-color-disabled);
  background: var(--el-fill-color);
  padding: 0 6px;
  border-radius: 8px;
  line-height: 16px;
}

.treeNode {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  padding: 4px 6px;
  min-height: 30px;
  border-radius: 6px;
  transition: background-color 0.15s;

  &:hover {
    background-color: var(--el-color-primary-light-8);
  }
}

.treeNodeSelected {
  background-color: var(--el-color-primary-light-8);
}

.treeNodeLocked .nodeLabel {
  color: var(--el-text-color-secondary);
}

.nodeLockIcon {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--el-color-warning);
}

.nodeIcon {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  font-size: 16px;
}

.nodeIconPlaceholder {
  flex-shrink: 0;
  width: 18px;
}

.nodeLabel {
  flex: 1;
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nodeTypeBadge {
  flex-shrink: 0;
  font-size: 10px;
  padding: 0 6px;
  line-height: 18px;
  border-radius: 4px;
  font-weight: 500;
}

.nodeActions {
  display: none;
  flex-shrink: 0;
  gap: 2px;
  margin-left: auto;
}

.treeNode:hover .nodeActions {
  display: flex;
}

.actionBtn {
  --el-button-size: 22px;
  font-size: 13px;
  padding: 0 2px;
}

.footerBar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 11px;
  color: var(--el-text-color-disabled);
  flex-shrink: 0;
}

.footerInfo {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
