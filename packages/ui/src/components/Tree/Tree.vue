<script setup lang="ts">
import { computed, ref } from 'vue'
import type { TreeNode, TreeProps, TreeSelectionKeys } from './types'
import TreeNodeItem from './TreeNodeItem.vue'

const props = withDefaults(defineProps<TreeProps>(), {
  selectionMode: 'single',
  selectionKeys: () => ({}),
  modelValue: null,
})

const emit = defineEmits<{
  (event: 'update:selectionKeys', value: TreeSelectionKeys): void
  (event: 'update:modelValue', value: string | null): void
}>()

const expanded = ref<Record<string, boolean>>({})

const effectiveKeys = computed<TreeSelectionKeys>(() => {
  if (props.selectionMode === 'single' && props.modelValue) {
    return { [props.modelValue]: true }
  }
  return props.selectionKeys ?? {}
})

function isExpanded(key: string) {
  return Boolean(expanded.value[key])
}

function isSelected(key: string) {
  return Boolean(effectiveKeys.value[key])
}

function toggleExpand(key: string) {
  expanded.value = { ...expanded.value, [key]: !expanded.value[key] }
}

function select(node: TreeNode) {
  if (props.selectionMode === 'single') {
    const next = isSelected(node.key) ? null : node.key
    emit('update:modelValue', next)
    emit('update:selectionKeys', next ? { [next]: true } : {})
    return
  }
  const next = { ...effectiveKeys.value }
  if (next[node.key]) delete next[node.key]
  else next[node.key] = true
  emit('update:selectionKeys', next)
}
</script>

<template>
  <ul class="wd-tree" role="tree">
    <TreeNodeItem
      v-for="node in value"
      :key="node.key"
      :node="node"
      :is-expanded="isExpanded"
      :is-selected="isSelected"
      @toggle="toggleExpand"
      @select="select"
    />
  </ul>
</template>
