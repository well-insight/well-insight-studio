<script lang="ts">
// 为递归组件提供 name 选项
</script>

<script setup lang="ts" generic="T extends Record<string, any>">
import type { DropdownInstance } from 'element-plus'
import type { PropType, VNode } from 'vue'
import { ArrowRight } from '@element-plus/icons-vue'
import { ElButton, ElDropdown, ElDropdownItem, ElDropdownMenu, ElIcon } from 'element-plus'
import { computed, defineComponent, h, ref, Teleport } from 'vue'

const props = withDefaults(defineProps<Props>(), {
  trigger: 'hover',
  placement: 'bottom-start',
  popperClass: '',
  closeOnClickLeaf: true,
  nodeKey: 'value',
})

const emit = defineEmits<{
  (e: 'item-click', node: TreeNode, path: TreeNode[]): void
  (e: 'visible-change', visible: boolean): void
}>()

export default {
  name: 'CascadeDropdown',
}

export interface TreeNode {
  label: string
  value?: string | number
  children?: TreeNode[]
  disabled?: boolean
  [key: string]: any
}

// ========== 递归菜单项组件 ==========
const MenuItem = defineComponent({
  name: 'MenuItem',
  props: {
    node: { type: Object as PropType<TreeNode>, required: true },
    level: { type: Number, required: true },
    index: { type: Number, required: true },
    nodeRender: { type: Function as PropType<(node: TreeNode, level: number, index: number) => VNode | string>, default: undefined },
    closeOnClickLeaf: { type: Boolean, default: true },
    parentPath: { type: Array as PropType<TreeNode[]>, default: () => [] },
  },
  emits: ['item-click'],
  setup(props, { emit, slots }) {
    const itemRef = ref<InstanceType<typeof ElDropdownItem>>()
    const submenuRef = ref<HTMLElement>()
    const showChildren = ref(false)
    let hideTimer: number | null = null

    const hasChildren = computed(() => !!(props.node.children && props.node.children.length))
    const currentPath = computed(() => [...props.parentPath, props.node])

    const getNodeKey = (node: TreeNode): string => {
      return `${node.label}_${Math.random().toString(36).slice(2, 8)}`
    }

    const submenuStyle = computed(() => {
      const el = itemRef.value?.$el as HTMLElement
      if (!el)
        return {}
      const rect = el.getBoundingClientRect()
      return {
        position: 'fixed' as const,
        left: `${rect.right + 4}px`,
        top: `${rect.top}px`,
        zIndex: 3000,
      }
    })

    const handleMouseEnter = () => {
      if (props.node.disabled)
        return
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }
      if (hasChildren.value) {
        showChildren.value = true
      }
    }

    const handleMouseLeave = () => {
      if (props.node.disabled)
        return
      hideTimer = window.setTimeout(() => {
        showChildren.value = false
        hideTimer = null
      }, 100)
    }

    const handleSubmenuEnter = () => {
      if (hideTimer) {
        clearTimeout(hideTimer)
        hideTimer = null
      }
    }

    const handleSubmenuLeave = () => {
      hideTimer = window.setTimeout(() => {
        showChildren.value = false
        hideTimer = null
      }, 100)
    }

    const handleClick = () => {
      if (props.node.disabled)
        return
      emit('item-click', props.node, currentPath.value)
    }

    const handleChildClick = (childNode: TreeNode, childPath: TreeNode[]) => {
      emit('item-click', childNode, childPath)
    }

    const renderContent = () => {
      if (slots.item) {
        return slots.item({ node: props.node, level: props.level, index: props.index })
      }
      if (props.nodeRender) {
        const result = props.nodeRender(props.node, props.level, props.index)
        if (typeof result === 'string') {
          return h('span', { class: 'cascade-menu-item-label' }, result)
        }
        return result
      }
      return h('span', { class: 'cascade-menu-item-label' }, props.node.label)
    }

    return () => {
      const itemContent = h(
        'div',
        { class: 'cascade-menu-item-content-wrapper' },
        [
          h('div', { class: 'cascade-menu-item-content' }, renderContent()),
          hasChildren.value && h(ElIcon, { class: 'cascade-menu-item-arrow' }, () => h(ArrowRight)),
        ],
      )

      const menuItem = h(
        ElDropdownItem,
        {
          ref: itemRef,
          disabled: props.node.disabled,
          class: 'cascade-menu-item',
          onMouseenter: handleMouseEnter,
          onMouseleave: handleMouseLeave,
          onClick: handleClick,
        },
        { default: () => itemContent },
      )

      const submenu = hasChildren.value && showChildren.value
        ? h(
            Teleport,
            { to: 'body' },
            h(
              'div',
              {
                ref: submenuRef,
                class: 'cascade-submenu',
                style: submenuStyle.value,
                onMouseenter: handleSubmenuEnter,
                onMouseleave: handleSubmenuLeave,
              },
              h(
                ElDropdownMenu,
                {},
                props.node.children!.map((child, idx) =>
                  h(MenuItem, {
                    key: getNodeKey(child),
                    node: child,
                    level: props.level + 1,
                    index: idx,
                    nodeRender: props.nodeRender,
                    closeOnClickLeaf: props.closeOnClickLeaf,
                    parentPath: currentPath.value,
                    onItemClick: handleChildClick,
                  }),
                ),
              ),
            ),
          )
        : null

      return [menuItem, submenu]
    }
  },
})

// ========== 主组件 Props 与逻辑 ==========
interface Props {
  options: TreeNode[]
  trigger?: 'hover' | 'click' | 'contextmenu'
  placement?: string
  popperClass?: string
  closeOnClickLeaf?: boolean
  nodeKey?: string
  nodeRender?: (node: TreeNode, level: number, index: number) => VNode | string
}

const dropdownRef = ref<DropdownInstance>()

function getNodeKey(node: TreeNode): string {
  if (props.nodeKey && node[props.nodeKey] !== undefined) {
    return String(node[props.nodeKey])
  }
  return `${node.label}_${Math.random().toString(36).slice(2, 8)}`
}

function handleItemClick(node: TreeNode, path: TreeNode[]) {
  emit('item-click', node, path)
  if (props.closeOnClickLeaf && (!node.children || node.children.length === 0)) {
    dropdownRef.value?.handleClose()
  }
}

function handleVisibleChange(visible: boolean) {
  emit('visible-change', visible)
}

defineExpose({
  close: () => dropdownRef.value?.handleClose(),
})
</script>

<template>
  <ElDropdown
    ref="dropdownRef"
    :trigger="trigger"
    :placement="placement"
    :popper-class="['cascade-dropdown-popper', popperClass]"
    :hide-on-click="false"
    @visible-change="handleVisibleChange"
  >
    <slot name="reference">
      <ElButton>级联菜单</ElButton>
    </slot>

    <template #dropdown>
      <ElDropdownMenu>
        <MenuItem
          v-for="(item, index) in options"
          :key="getNodeKey(item)"
          :node="item"
          :level="0"
          :index="index"
          :node-render="nodeRender"
          :close-on-click-leaf="closeOnClickLeaf"
          :parent-path="[]"
          @item-click="handleItemClick"
        >
          <template v-if="$slots.item" #item="{ node, level, index }">
            <slot name="item" :node="node" :level="level" :index="index" />
          </template>
        </MenuItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>

<style scoped>
.cascade-dropdown-popper {
  padding: 0 !important;
}

.cascade-dropdown-popper :deep(.el-dropdown-menu) {
  padding: 0;
}

.cascade-menu-item {
  padding: 0 !important;
}

.cascade-menu-item-content-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 160px;
  padding: 0 16px;
  height: 34px;
  line-height: 34px;
  font-size: var(--el-font-size-base);
  color: inherit;
  white-space: nowrap;
}

.cascade-menu-item-content {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cascade-menu-item-label {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cascade-menu-item-arrow {
  margin-left: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.cascade-submenu {
  min-width: 160px;
  padding: 4px 0;
  background-color: var(--el-bg-color-overlay);
  border-radius: var(--el-border-radius-base);
  box-shadow: var(--el-box-shadow-light);
}

.cascade-submenu :deep(.el-dropdown-menu) {
  padding: 0;
}
</style>
