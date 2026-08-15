<script setup lang="ts">
import { computed } from 'vue'
import type { TimelineProps } from './types'

const props = withDefaults(defineProps<TimelineProps>(), {
  align: 'left',
})

const rootClass = computed(() => ['wd-timeline', `wd-timeline--${props.align}`])

function side(index: number): 'left' | 'right' {
  if (props.align === 'right') return 'right'
  if (props.align === 'alternate') return index % 2 === 0 ? 'left' : 'right'
  return 'left'
}
</script>

<template>
  <ul :class="rootClass">
    <li
      v-for="(event, index) in value"
      :key="index"
      class="wd-timeline__event"
      :class="`wd-timeline__event--${side(index)}`"
    >
      <div class="wd-timeline__opposite">
        <slot name="opposite" :item="event" :index="index">
          {{ event.date }}
        </slot>
      </div>
      <div class="wd-timeline__separator">
        <span
          class="wd-timeline__marker"
          :style="event.color ? { background: event.color, borderColor: event.color } : undefined"
        >
          <span v-if="event.icon" aria-hidden="true">{{ event.icon }}</span>
        </span>
        <span class="wd-timeline__connector" />
      </div>
      <div class="wd-timeline__content">
        <slot name="content" :item="event" :index="index">
          <div v-if="event.status" class="wd-timeline__status">{{ event.status }}</div>
          <div>{{ event.content }}</div>
        </slot>
      </div>
    </li>
  </ul>
</template>
