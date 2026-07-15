<script lang="ts" setup>
/**
 * 表单组件面板
 * 左侧拖拽源，展示所有可用表单组件（样式对齐可视化组件列表）
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

/** 展开/折叠的分类 */
const expandedCategories = ref<Set<string>>(new Set(FORM_COMPONENT_CATEGORIES.map(c => c.key)))

function toggleCategory(key: string) {
  if (expandedCategories.value.has(key)) {
    expandedCategories.value.delete(key)
  }
  else {
    expandedCategories.value.add(key)
  }
}

function isExpanded(key: string): boolean {
  return expandedCategories.value.has(key)
}

/** 拖拽开始 */
function onDragStart(event: DragEvent, comp: FormComponentDefinition) {
  if (!event.dataTransfer)
    return
  const field = createFormField(comp.key)
  event.dataTransfer.setData('application/json', JSON.stringify(field))
  event.dataTransfer.effectAllowed = 'copy'
}

/** 图标映射 */
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

/** 点击添加 */
function onClickAdd(comp: FormComponentDefinition) {
  const field = createFormField(comp.key)
  emit('addField', field)
}

/** 搜索 */
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
    <div class="border-bottom-1 flex h-[50px] shrink-0 items-center px-3">
      <span class="text-sm font-semibold text-[var(--el-text-color-primary)]">表单组件</span>
    </div>

    <div class="shrink-0 px-3 py-2">
      <el-input
        v-model="searchText"
        placeholder="搜索组件..."
        :prefix-icon="Search"
        clearable
      />
    </div>

    <el-scrollbar class="min-h-0 flex-1">
      <div class="px-2 pb-3">
        <div v-for="cat in filteredCategories" :key="cat.key" class="mb-2">
          <div
            class="mb-1 flex cursor-pointer items-center justify-between rounded-md px-2 py-2 text-xs font-medium text-[var(--el-text-color-secondary)] hover:bg-[var(--el-fill-color-light)]"
            @click="toggleCategory(cat.key)"
          >
            <span>{{ cat.label }}</span>
            <el-icon
              :class="{ 'rotate-90': isExpanded(cat.key) }"
              class="transition-transform duration-200"
            >
              <ArrowRight />
            </el-icon>
          </div>

          <div v-show="isExpanded(cat.key)" class="grid grid-cols-2 gap-2 px-0.5">
            <div
              v-for="comp in cat.components"
              :key="comp.key"
              class="form-component-item group flex min-h-[44px] cursor-pointer items-center gap-2.5 rounded-[8px] border border-[var(--el-border-color-light)] bg-[var(--el-fill-color-blank)] px-3 py-2.5 text-[13px] leading-snug text-[var(--el-text-color-regular)] transition-colors hover:border-[var(--el-color-primary-light-5)] hover:bg-[var(--wc-active-fill,var(--el-color-primary-light-9))] hover:text-[var(--el-color-primary)]"
              draggable="true"
              @dragstart="onDragStart($event, comp)"
              @click="onClickAdd(comp)"
            >
              <el-icon :size="18" class="shrink-0 text-[var(--el-color-primary)] opacity-80">
                <component :is="getIcon(comp)" />
              </el-icon>
              <span class="truncate">{{ comp.label }}</span>
            </div>
          </div>
        </div>

        <div
          v-if="filteredCategories.length === 0"
          class="py-8 text-center text-sm text-[var(--el-text-color-placeholder)]"
        >
          未找到匹配的组件
        </div>
      </div>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.form-component-item:active {
  cursor: grabbing;
  opacity: 0.75;
}
</style>
