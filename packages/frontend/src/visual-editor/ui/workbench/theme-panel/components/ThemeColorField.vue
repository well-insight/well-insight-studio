<script setup lang="ts">
withDefaults(defineProps<{
  modelValue: string
  canDisable?: boolean
  enabled?: boolean
}>(), {
  canDisable: false,
  enabled: true,
})

const emit = defineEmits<{
  'update:modelValue': [val: string]
  'update:enabled': [val: boolean]
}>()

const colorRegex = /^#(?:[A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$|^rgba?\([^)]+\)$|^[a-zA-Z]+$/

function onColorChange(val: string | null) {
  if (val)
    emit('update:modelValue', val)
}

function onTextChange(val: string) {
  if (colorRegex.test(val) || val === '') {
    emit('update:modelValue', val)
  }
}
</script>

<template>
  <div class="theme-color-field">
    <el-checkbox
      v-if="canDisable"
      :model-value="enabled"
      @update:model-value="emit('update:enabled', $event as boolean)"
    />
    <template v-if="!canDisable || enabled">
      <el-color-picker
        :model-value="modelValue"
        size="small"
        show-alpha
        @update:model-value="onColorChange"
      />
      <el-input
        :model-value="modelValue"
        size="small"
        class="theme-color-field__input"
        @update:model-value="onTextChange"
      />
    </template>
  </div>
</template>

<style scoped>
.theme-color-field {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
  min-width: 0;
}
.theme-color-field :deep(.el-color-picker) {
  flex-shrink: 0;
}
.theme-color-field :deep(.el-color-picker__trigger) {
  width: 28px;
  height: 28px;
  padding: 2px;
  border-radius: 6px;
}
.theme-color-field__input {
  flex: 1;
  min-width: 72px;
}
.theme-color-field__input :deep(.el-input__wrapper) {
  border-radius: 6px;
}
</style>
