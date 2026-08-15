<script setup lang="ts">
import { Comment, Fragment, Text, computed, useSlots, type VNode } from 'vue'
import type { SplitterProps } from './types'

withDefaults(defineProps<SplitterProps>(), {
  layout: 'horizontal',
})

const slots = useSlots()

function unwrap(nodes: VNode[]): VNode[] {
  const result: VNode[] = []
  for (const node of nodes) {
    if (node.type === Comment) continue
    if (node.type === Text && !String(node.children ?? '').trim()) continue
    if (node.type === Fragment && Array.isArray(node.children)) {
      result.push(...unwrap(node.children as VNode[]))
      continue
    }
    result.push(node)
  }
  return result
}

const useNamedPanels = computed(() => Boolean(slots.panel1 || slots.panel2))

const defaultPanels = computed(() => {
  const children = unwrap(slots.default?.() ?? [])
  return [children[0] ?? null, children[1] ?? null] as const
})
</script>

<template>
  <div
    class="wd-splitter"
    :class="`wd-splitter--${layout}`"
    :aria-orientation="layout === 'vertical' ? 'vertical' : 'horizontal'"
  >
    <template v-if="useNamedPanels">
      <div class="wd-splitter__panel">
        <slot name="panel1" />
      </div>
      <div class="wd-splitter__gutter" role="separator" aria-hidden="true" />
      <div class="wd-splitter__panel">
        <slot name="panel2" />
      </div>
    </template>
    <template v-else>
      <div class="wd-splitter__panel">
        <component :is="defaultPanels[0]" v-if="defaultPanels[0]" />
      </div>
      <div class="wd-splitter__gutter" role="separator" aria-hidden="true" />
      <div class="wd-splitter__panel">
        <component :is="defaultPanels[1]" v-if="defaultPanels[1]" />
      </div>
    </template>
  </div>
</template>
