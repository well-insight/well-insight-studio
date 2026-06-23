<script setup lang="ts">
import { ArrowDown } from '@element-plus/icons-vue'
import { ref } from 'vue'

const props = withDefaults(
  defineProps<{
    title: string
    defaultOpen?: boolean
  }>(),
  { defaultOpen: true },
)

const isOpen = ref(props.defaultOpen)

function toggle() {
  isOpen.value = !isOpen.value
}
</script>

<template>
  <div :class="$style.card">
    <div :class="$style.card__header" @click="toggle">
      <el-icon
        :class="$style.card__arrow"
        :style="{ transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)' }"
      >
        <ArrowDown />
      </el-icon>
      <span :class="$style.card__title">{{ title }}</span>
    </div>
    <div v-show="isOpen" :class="$style.card__body">
      <slot />
    </div>
  </div>
</template>

<style lang="scss" module>
.card {
  background: var(--el-fill-color-lighter);
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--el-border-color-light);
  transition: border-color 0.2s ease;

  &:hover {
    border-color: var(--el-border-color);
  }

  &__header {
    display: flex;
    align-items: center;
    height: 34px;
    padding: 0 10px;
    cursor: pointer;
    user-select: none;

    &:hover {
      background-color: var(--el-color-primary-light-9);
    }
  }

  &__arrow {
    margin-right: 6px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    transition: transform 0.2s ease;
    flex-shrink: 0;
  }

  &__title {
    font-size: 13px;
    font-weight: 600;
    color: var(--el-text-color-primary);
  }

  &__body {
    padding: 2px 10px 10px;
  }
}
</style>
