<script setup lang="ts">
import { computed } from 'vue'
import { provideWdConfig, type WdGlobalConfig } from '../../shared/config'

const props = defineProps<{
  /** Global defaults for descendant Well Design components. */
  config?: WdGlobalConfig
  /** Shorthand: default overlay Teleport target. */
  appendTo?: WdGlobalConfig['appendTo']
  /** Shorthand: default control size. */
  size?: WdGlobalConfig['size']
  /** Shorthand: default input variant. */
  inputVariant?: WdGlobalConfig['inputVariant']
  /** Shorthand: overlay z-index base. */
  zIndex?: WdGlobalConfig['zIndex']
  /** Shorthand: locale dictionary. */
  locale?: WdGlobalConfig['locale']
}>()

const resolved = computed<WdGlobalConfig>(() => ({
  ...(props.config ?? {}),
  ...(props.appendTo !== undefined ? { appendTo: props.appendTo } : {}),
  ...(props.size !== undefined ? { size: props.size } : {}),
  ...(props.inputVariant !== undefined ? { inputVariant: props.inputVariant } : {}),
  ...(props.zIndex !== undefined ? { zIndex: props.zIndex } : {}),
  ...(props.locale !== undefined ? { locale: props.locale } : {}),
}))

provideWdConfig(resolved)
</script>

<template>
  <slot />
</template>
