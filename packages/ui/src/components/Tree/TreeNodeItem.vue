<script setup lang="ts">
import type { TreeNode } from './types'
import TreeNodeItem from './TreeNodeItem.vue'

defineProps<{
  node: TreeNode
  isExpanded: (key: string) => boolean
  isSelected: (key: string) => boolean
}>()

defineEmits<{
  (event: 'toggle', key: string): void
  (event: 'select', node: TreeNode): void
}>()
</script>

<template>
  <li class="wd-tree__node" role="treeitem" :aria-expanded="node.children?.length ? isExpanded(node.key) : undefined">
    <div class="wd-tree__row" :class="{ 'wd-tree__row--selected': isSelected(node.key) }">
      <button
        v-if="node.children?.length"
        type="button"
        class="wd-tree__toggler"
        :aria-label="isExpanded(node.key) ? '折叠' : '展开'"
        @click="$emit('toggle', node.key)"
      >
        {{ isExpanded(node.key) ? '▾' : '▸' }}
      </button>
      <span v-else class="wd-tree__toggler wd-tree__toggler--leaf" aria-hidden="true" />
      <span v-if="node.icon" class="wd-tree__icon" aria-hidden="true">{{ node.icon }}</span>
      <button type="button" class="wd-tree__label" @click="$emit('select', node)">
        {{ node.label }}
      </button>
    </div>
    <ul v-if="node.children?.length && isExpanded(node.key)" class="wd-tree__children" role="group">
      <TreeNodeItem
        v-for="child in node.children"
        :key="child.key"
        :node="child"
        :is-expanded="isExpanded"
        :is-selected="isSelected"
        @toggle="$emit('toggle', $event)"
        @select="$emit('select', $event)"
      />
    </ul>
  </li>
</template>
