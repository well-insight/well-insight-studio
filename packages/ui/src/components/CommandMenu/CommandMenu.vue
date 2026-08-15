<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useWdConfig } from '../../shared/config'
import { resolveOverlayTeleport } from '../../shared/overlay'
import type { CommandMenuItem, CommandMenuProps } from './types'

const props = withDefaults(defineProps<CommandMenuProps>(), {
  model: () => [],
  modelValue: false,
  placeholder: '搜索命令…',
  teleport: true,
})

const emit = defineEmits<{
  (event: 'update:modelValue', value: boolean): void
}>()

const config = useWdConfig()
const query = ref('')
const inputRef = ref<HTMLInputElement | null>(null)
const activeIndex = ref(0)
const teleportTarget = computed(() => resolveOverlayTeleport(props, config.value.appendTo))

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return props.model
  return props.model.filter((item) => item.label.toLowerCase().includes(q))
})

function close() {
  emit('update:modelValue', false)
}

function activate(item: CommandMenuItem) {
  if (item.disabled) return
  item.command?.()
  close()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    close()
    return
  }
  if (event.key === 'ArrowDown') {
    event.preventDefault()
    activeIndex.value = Math.min(filtered.value.length - 1, activeIndex.value + 1)
  }
  if (event.key === 'ArrowUp') {
    event.preventDefault()
    activeIndex.value = Math.max(0, activeIndex.value - 1)
  }
  if (event.key === 'Enter') {
    const item = filtered.value[activeIndex.value]
    if (item) {
      event.preventDefault()
      activate(item)
    }
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (open) {
      query.value = ''
      activeIndex.value = 0
      await nextTick()
      inputRef.value?.focus()
    }
  },
)

watch(filtered, () => {
  activeIndex.value = 0
})
</script>

<template>
  <Teleport :to="teleportTarget.to" :disabled="teleportTarget.disabled">
    <Transition name="wd-fade">
      <div v-if="modelValue" class="wd-commandmenu-backdrop" @click.self="close">
        <div
          class="wd-commandmenu"
          role="dialog"
          aria-modal="true"
          aria-label="命令面板"
          @keydown="onKeydown"
        >
          <input
            ref="inputRef"
            v-model="query"
            class="wd-commandmenu__input"
            type="search"
            :placeholder="placeholder"
            aria-label="搜索命令"
          />
          <ul class="wd-commandmenu__list" role="listbox">
            <li v-for="(item, index) in filtered" :key="`${item.label}-${index}`" role="presentation">
              <button
                type="button"
                class="wd-commandmenu__item"
                role="option"
                :class="{ 'wd-commandmenu__item--active': index === activeIndex }"
                :aria-selected="index === activeIndex"
                :disabled="item.disabled"
                @click="activate(item)"
                @mouseenter="activeIndex = index"
              >
                <span v-if="item.icon" class="wd-commandmenu__icon" aria-hidden="true">{{ item.icon }}</span>
                <span class="wd-commandmenu__label">{{ item.label }}</span>
                <span v-if="item.shortcut" class="wd-commandmenu__shortcut">{{ item.shortcut }}</span>
              </button>
            </li>
            <li v-if="!filtered.length" class="wd-commandmenu__empty">无匹配命令</li>
          </ul>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
