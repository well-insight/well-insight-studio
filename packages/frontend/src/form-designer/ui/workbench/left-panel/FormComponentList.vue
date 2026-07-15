<script lang="ts" setup>
/**
 * 左侧表单组件库
 */
import type { FormComponentDefinition, FormField } from '../../../types'
import {
  ArrowDown,
  ArrowRight,
  Brush,
  Calendar,
  Check,
  CircleCheck,
  Clock,
  DataAnalysis,
  Document,
  EditPen,
  Lock,
  Operation,
  Present,
  Rank,
  Search,
  Setting,
  Sort,
  Star,
  Switch,
  Timer,
  Upload,
} from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import {
  FORM_COMPONENT_CATEGORIES,
  getFormComponentsByCategory,
} from '../../../form-component-registry'
import { createFormField } from '../../../form-designer.utils'

const emit = defineEmits<{
  (e: 'addField', field: FormField): void
}>()

const expandedCategories = ref<Set<string>>(new Set(FORM_COMPONENT_CATEGORIES.map(c => c.key)))

function toggleCategory(key: string) {
  if (expandedCategories.value.has(key))
    expandedCategories.value.delete(key)
  else
    expandedCategories.value.add(key)
}

function isExpanded(key: string): boolean {
  return expandedCategories.value.has(key)
}

function onDragStart(event: DragEvent, comp: FormComponentDefinition) {
  if (!event.dataTransfer)
    return
  const field = createFormField(comp.key)
  event.dataTransfer.setData('application/json', JSON.stringify(field))
  event.dataTransfer.effectAllowed = 'copy'
}

const iconMap: Record<string, any> = {
  input: EditPen,
  textarea: Document,
  number: DataAnalysis,
  password: Lock,
  select: ArrowDown,
  radio: CircleCheck,
  checkbox: Check,
  switch: Switch,
  rate: Star,
  slider: Operation,
  datePicker: Calendar,
  timePicker: Clock,
  datetimePicker: Timer,
  cascader: Sort,
  treeSelect: Rank,
  colorPicker: Brush,
  upload: Upload,
  transfer: Present,
}

function getIcon(comp: FormComponentDefinition): any {
  return iconMap[comp.key] ?? Setting
}

function onClickAdd(comp: FormComponentDefinition) {
  emit('addField', createFormField(comp.key))
}

const searchText = ref('')
const filteredCategories = computed(() => {
  if (!searchText.value.trim()) {
    return FORM_COMPONENT_CATEGORIES.map(cat => ({
      ...cat,
      components: getFormComponentsByCategory(cat.key),
    }))
  }
  const keyword = searchText.value.trim().toLowerCase()
  return FORM_COMPONENT_CATEGORIES.map(cat => ({
    ...cat,
    components: getFormComponentsByCategory(cat.key).filter(
      c =>
        c.label.includes(keyword) || c.key.includes(keyword) || c.description?.includes(keyword),
    ),
  })).filter(cat => cat.components.length > 0)
})
</script>

<template>
  <div class="form-component-list flex h-full flex-col bg-[var(--el-bg-color)]">
    <div class="border-bottom-1 flex h-[var(--fd-header-h,50px)] shrink-0 items-center gap-2 px-3">
      <span class="fd-panel-title">组件库</span>
      <span class="text-[11px] text-[var(--el-text-color-placeholder)]">拖入或点击添加</span>
    </div>

    <div class="shrink-0 px-3 py-2.5">
      <el-input
        v-model="searchText"
        placeholder="搜索组件"
        :prefix-icon="Search"
        clearable
      />
    </div>

    <el-scrollbar class="min-h-0 flex-1">
      <div class="px-2.5 pb-4">
        <div v-for="cat in filteredCategories" :key="cat.key" class="mb-3">
          <button
            type="button"
            class="fd-cat-row mb-1.5 flex w-full cursor-pointer items-center justify-between rounded-[var(--fd-radius-sm,6px)] px-2 py-1.5 hover:bg-[var(--el-fill-color-light)]"
            @click="toggleCategory(cat.key)"
          >
            <span class="fd-cat-label">{{ cat.label }}</span>
            <el-icon
              :class="{ 'rotate-90': isExpanded(cat.key) }"
              class="text-[var(--el-text-color-placeholder)] transition-transform duration-200"
            >
              <ArrowRight />
            </el-icon>
          </button>

          <div v-show="isExpanded(cat.key)" class="grid grid-cols-2 gap-2">
            <div
              v-for="comp in cat.components"
              :key="comp.key"
              class="form-component-item group flex min-h-[48px] cursor-pointer items-center gap-2.5 rounded-[var(--fd-radius-md,10px)] border border-[var(--el-border-color-lighter)] bg-[var(--el-fill-color-blank)] px-2.5 py-2 text-[13px] text-[var(--el-text-color-regular)]"
              draggable="true"
              @dragstart="onDragStart($event, comp)"
              @click="onClickAdd(comp)"
            >
              <span class="form-component-item__icon flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--fd-radius-sm,6px)]">
                <el-icon :size="16" class="text-[var(--el-color-primary)]">
                  <component :is="getIcon(comp)" />
                </el-icon>
              </span>
              <span class="truncate font-medium">{{ comp.label }}</span>
            </div>
          </div>
        </div>

        <div
          v-if="filteredCategories.length === 0"
          class="py-10 text-center text-sm text-[var(--el-text-color-placeholder)]"
        >
          没有匹配的组件
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.form-component-item {
  transition:
    border-color 0.18s ease,
    background-color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.18s ease;
}

.form-component-item__icon {
  background: var(--fd-chip-bg, var(--el-fill-color-light));
}

.form-component-item:hover {
  border-color: color-mix(in srgb, var(--el-color-primary) 45%, var(--el-border-color));
  background: var(--wc-active-fill, var(--el-color-primary-light-9));
  color: var(--el-color-primary);
  box-shadow: 0 1px 0 color-mix(in srgb, var(--el-color-primary) 16%, transparent);
  transform: translateY(-1px);
}

.form-component-item:active {
  cursor: grabbing;
  transform: translateY(0);
  opacity: 0.85;
}

.fd-cat-row {
  border: 0;
  background: transparent;
  text-align: left;
}
</style>
