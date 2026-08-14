<script setup lang="ts">
import { computed } from 'vue'
import { resolveSizeClass } from '../../shared/types'
import type { IconProps } from './types'

const props = withDefaults(defineProps<IconProps>(), { size: 'md' })
const sizeClass = computed(() => resolveSizeClass(props.size))
</script>

<template>
  <span class="wd-icon" :class="`wd-icon--${sizeClass}`" :aria-label="label" :aria-hidden="label ? undefined : 'true'" role="img">
    <svg v-if="name === 'check'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 8 3 3 7-7" /></svg>
    <svg v-else-if="name === 'close'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m4 4 8 8M12 4l-8 8" /></svg>
    <svg v-else-if="name === 'info'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="8" cy="8" r="5.5" /><path d="M8 7v4M8 5.25h.01" /></svg>
    <svg v-else-if="name === 'chevron-down'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m4 6 4 4 4-4" /></svg>
    <svg v-else-if="name === 'chevron-left'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m10 4-4 4 4 4" /></svg>
    <svg v-else-if="name === 'chevron-right'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m6 4 4 4-4 4" /></svg>
    <svg v-else-if="name === 'plus'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M8 3v10M3 8h10" /></svg>
    <svg v-else-if="name === 'minus'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 8h10" /></svg>
    <svg v-else-if="name === 'search'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="7" cy="7" r="3.75" /><path d="m10 10 3 3" /></svg>
    <svg v-else-if="name === 'menu'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 5h10M3 8h10M3 11h10" /></svg>
    <svg v-else-if="name === 'edit'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m3 11.75-.5 2.75 2.75-.5L13 6.25 9.75 3 3 9.75v2Z" /><path d="m8.75 4 3.25 3.25" /></svg>
    <svg v-else-if="name === 'trash'" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3.5 5h9M6 5V3.5h4V5M5 5l.5 8h5l.5-8M6.75 7v4M9.25 7v4" /></svg>
  </span>
</template>
