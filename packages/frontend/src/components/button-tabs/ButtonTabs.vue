<script lang="ts" setup>
import { SvgIcon } from '../svg-icon'

interface Options {
  label: string
  value: string
  icon?: string
}

const props = withDefaults(defineProps<{ options?: Options[] }>(), {
  options: () => [],
})

const modelValue = defineModel<string>({ required: true, default: '' })

function changeActive(e: Options) {
  modelValue.value = e?.value
}
</script>

<template>
  <div class="flex items-center">
    <el-button
      v-for="e in options"
      :key="e?.value"
      text
      :type="modelValue === e?.value ? 'primary' : ''"
      :class="[modelValue === e?.value ? $style.active : '']"
      @click="changeActive(e)"
    >
      <el-space>
        <SvgIcon v-if="e?.icon" :name="e?.icon" />
        <span>{{ e?.label }}</span>
      </el-space>
    </el-button>
  </div>
</template>

<style lang="scss" module>
.active {
  background-color: var(--wc-active-fill, var(--el-color-primary-light-9)) !important;
  color: var(--el-color-primary) !important;
}
</style>
