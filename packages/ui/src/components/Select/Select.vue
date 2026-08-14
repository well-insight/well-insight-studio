<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { isOverlayTeleported, resolveOverlayTeleport } from '../../shared/overlay'
import { resolveSizeClass } from '../../shared/types'
import type { SelectOption, SelectProps, SelectValue } from './types'

const props = withDefaults(defineProps<SelectProps>(), {
  modelValue: undefined,
  error: false,
  invalid: false,
  disabled: false,
  required: false,
  fluid: false,
  teleport: true,
  appendTo: 'body',
  placement: 'bottom-start',
})
const emit = defineEmits<{
  (event: 'update:modelValue', value: SelectValue | undefined): void
  (event: 'change', value: SelectValue | undefined): void
  (event: 'show'): void
  (event: 'hide'): void
}>()

const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const menu = ref<HTMLElement | null>(null)
const open = ref(false)
const highlightedIndex = ref(-1)
const menuStyle = ref<Record<string, string>>({})
const selectId = computed(() => props.id ?? `wd-select-${Math.random().toString(36).slice(2, 8)}`)
const enabledOptions = computed(() => props.options.filter((option) => !option.disabled))
const selectedOption = computed(() => props.options.find((option) => option.value === props.modelValue))
const displayLabel = computed(() => selectedOption.value?.label ?? props.placeholder ?? '请选择')
const isInvalid = computed(() => props.error || props.invalid)
const sizeClass = computed(() => resolveSizeClass(props.size))
const teleportTarget = computed(() => resolveOverlayTeleport(props))
const teleported = computed(() => isOverlayTeleported(props))

function updateMenuPosition() {
  if (!teleported.value || !trigger.value) return
  const rect = trigger.value.getBoundingClientRect()
  menuStyle.value = {
    left: props.placement === 'bottom-end' ? `${rect.right}px` : `${rect.left}px`,
    minWidth: `${rect.width}px`,
    top: `${rect.bottom + 8}px`,
    ...(props.placement === 'bottom-end' ? { transform: 'translateX(-100%)' } : {}),
  }
}

function setOpen(next: boolean) {
  if (props.disabled || open.value === next) return
  open.value = next
  if (next) {
    highlightedIndex.value = Math.max(
      0,
      enabledOptions.value.findIndex((option) => option.value === props.modelValue),
    )
    emit('show')
    void nextTick(() => {
      updateMenuPosition()
      menu.value?.focus()
    })
  } else {
    emit('hide')
  }
}

function selectOption(option: SelectOption) {
  if (option.disabled) return
  emit('update:modelValue', option.value)
  emit('change', option.value)
  setOpen(false)
  trigger.value?.focus()
}

function onTriggerKeydown(event: KeyboardEvent) {
  if (['Enter', ' ', 'ArrowDown', 'ArrowUp'].includes(event.key)) {
    event.preventDefault()
    if (!open.value) setOpen(true)
  }
}

function onMenuKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    setOpen(false)
    trigger.value?.focus()
    return
  }
  const length = enabledOptions.value.length
  if (!length) return
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    highlightedIndex.value =
      (highlightedIndex.value + (event.key === 'ArrowDown' ? 1 : -1) + length) % length
  }
  if (event.key === 'Home') {
    event.preventDefault()
    highlightedIndex.value = 0
  }
  if (event.key === 'End') {
    event.preventDefault()
    highlightedIndex.value = length - 1
  }
  if (event.key === 'Enter' || event.key === ' ') {
    const option = enabledOptions.value[highlightedIndex.value]
    if (option) {
      event.preventDefault()
      selectOption(option)
    }
  }
}

function onDocumentClick(event: MouseEvent) {
  if (open.value && !root.value?.contains(event.target as Node) && !menu.value?.contains(event.target as Node)) {
    setOpen(false)
  }
}

function onViewportChange() {
  if (open.value) updateMenuPosition()
}

watch(open, (next) => {
  if (next) {
    document.addEventListener('click', onDocumentClick)
    if (teleported.value) {
      window.addEventListener('resize', onViewportChange)
      window.addEventListener('scroll', onViewportChange, true)
    }
  } else {
    document.removeEventListener('click', onDocumentClick)
    window.removeEventListener('resize', onViewportChange)
    window.removeEventListener('scroll', onViewportChange, true)
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  window.removeEventListener('resize', onViewportChange)
  window.removeEventListener('scroll', onViewportChange, true)
})
</script>

<template>
  <div ref="root" class="wd-select-field" :class="{ 'wd-select-field--fluid': fluid }">
    <label v-if="label" class="wd-select-field__label" :for="selectId">{{ label }}</label>
    <button
      :id="selectId"
      ref="trigger"
      class="wd-select"
      :class="[
        `wd-select--${sizeClass}`,
        {
          'wd-select--error': isInvalid,
          'wd-select--open': open,
          'wd-select--placeholder': !selectedOption,
          'wd-select--fluid': fluid,
        },
      ]"
      type="button"
      role="combobox"
      :aria-expanded="open"
      aria-haspopup="listbox"
      :aria-controls="`${selectId}-listbox`"
      :aria-invalid="isInvalid || undefined"
      :aria-describedby="helpText ? `${selectId}-help` : undefined"
      :disabled="disabled"
      @click="setOpen(!open)"
      @keydown="onTriggerKeydown"
    >
      <span class="wd-select__value">{{ displayLabel }}</span>
      <span class="wd-select__indicator" aria-hidden="true" />
    </button>
    <Teleport :to="teleportTarget.to" :disabled="teleportTarget.disabled">
      <Transition name="wd-scale-fade">
        <div
          v-if="open"
          :id="`${selectId}-listbox`"
          ref="menu"
          class="wd-select__menu"
          :class="[`wd-select__menu--${placement}`, { 'wd-select__menu--teleported': teleported }]"
          :style="teleported ? menuStyle : undefined"
          role="listbox"
          tabindex="-1"
          :aria-label="label ?? placeholder ?? '选择选项'"
          @keydown="onMenuKeydown"
        >
          <button
            v-for="option in options"
            :key="String(option.value)"
            class="wd-select__option"
            :class="{
              'wd-select__option--selected': option.value === modelValue,
              'wd-select__option--highlighted': enabledOptions[highlightedIndex]?.value === option.value,
            }"
            type="button"
            role="option"
            :aria-selected="option.value === modelValue"
            :disabled="option.disabled"
            @mouseenter="!option.disabled && (highlightedIndex = enabledOptions.findIndex((item) => item.value === option.value))"
            @click="selectOption(option)"
          >
            <span>{{ option.label }}</span>
            <span v-if="option.value === modelValue" class="wd-select__check" aria-hidden="true">✓</span>
          </button>
        </div>
      </Transition>
    </Teleport>
    <input
      v-if="required"
      class="wd-select__required-input"
      tabindex="-1"
      aria-hidden="true"
      :required="!selectedOption"
      :value="modelValue"
    />
    <span v-if="helpText" :id="`${selectId}-help`" class="wd-select-field__help">{{ helpText }}</span>
  </div>
</template>
