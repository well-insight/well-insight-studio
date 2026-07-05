<script lang="ts" setup>
/**
 * 表单画布 - 拖拽投放区
 * 支持从左侧面板拖入组件、内部拖拽排序
 */
import type { FormField, FormSchema } from '../../types'
import { Delete, Link } from '@element-plus/icons-vue'
import { getFormComponent } from '../../form-component-registry'

const props = defineProps<{
  fields: FormField[]
  activeFieldId: string | null
  formConfig: FormSchema['config']
}>()

const emit = defineEmits<{
  (e: 'select', vid: string | null): void
  (e: 'remove', vid: string): void
  (e: 'addField', field: FormField, index?: number): void
  (e: 'moveField', fromIndex: number, toIndex: number): void
}>()

/** 拖拽悬停位置 */
const hoverIndex = defineModel<number | null>('hoverIndex', { default: null })

/** 从左侧拖入 */
function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (!event.dataTransfer) {
    return
  }
  event.dataTransfer.dropEffect = 'copy'
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  if (!event.dataTransfer) {
    return
  }
  const raw = event.dataTransfer.getData('application/json')
  if (!raw) {
    return
  }
  try {
    const field = JSON.parse(raw) as FormField
    const idx = hoverIndex.value ?? props.fields.length
    emit('addField', field, idx)
  } catch {
    /* ignore */
  }
  hoverIndex.value = null
}

function onDragLeave() {
  hoverIndex.value = null
}

/** 内部字段排序拖拽 */
let dragFieldVid: string | null = null

function onFieldDragStart(event: DragEvent, field: FormField) {
  dragFieldVid = field._vid
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', field._vid)
  }
}

function onFieldDragOver(event: DragEvent, index: number) {
  event.preventDefault()
  if (!event.dataTransfer) {
    return
  }
  event.dataTransfer.dropEffect = 'move'
  hoverIndex.value = index
}

function onFieldDrop(event: DragEvent, toIndex: number) {
  event.preventDefault()
  if (!dragFieldVid) {
    return
  }
  const fromIndex = props.fields.findIndex(f => f._vid === dragFieldVid)
  if (fromIndex !== -1 && fromIndex !== toIndex) {
    emit('moveField', fromIndex, toIndex)
  }
  dragFieldVid = null
  hoverIndex.value = null
}

function onFieldDragEnd() {
  dragFieldVid = null
  hoverIndex.value = null
}

/** field 的 col-span 样式 */
function fieldStyle(field: FormField): Record<string, string> {
  const cols = props.formConfig.gridColumns || 24
  const span = Math.max(1, Math.min(cols, field.colSpan || 12))
  return {
    width: `${(span / cols) * 100}%`,
  }
}

/** 简化的字段预览 */
function getFieldPreview(field: FormField): { icon: string, label: string, placeholder: string } {
  const comp = getFormComponent(field.componentKey)
  return {
    icon: comp?.icon ?? 'el-icon-edit',
    label: field.label || comp?.label || '字段',
    placeholder: field.placeholder || '请输入',
  }
}
</script>

<template>
  <el-scrollbar
    class="form-canvas h-full"
    @dragover="onDragOver"
    @drop="onDrop"
    @dragleave="onDragLeave"
  >
    <div class="form-canvas-inner mx-auto min-h-full max-w-[800px] px-6 py-8">
      <!-- 画布标题 -->
      <div class="mb-6 text-center">
        <h3 class="text-lg font-semibold text-[var(--el-text-color-primary)]">
          表单画布
        </h3>
        <p class="mt-2 text-sm text-[var(--el-text-color-placeholder)]">
          从左侧拖拽组件到此处，或点击组件直接添加
        </p>
      </div>

      <!-- 表单布局容器 -->
      <div class="form-canvas-body rounded-lg border border-[var(--el-border-color)] bg-[var(--el-bg-color)] p-6 shadow-sm">
        <!-- 空状态 -->
        <div
          v-if="fields.length === 0"
          class="flex flex-col items-center justify-center py-16 text-[var(--el-text-color-placeholder)]"
        >
          <el-icon :size="48" class="mb-3 opacity-20">
            <Operation />
          </el-icon>
          <p class="text-sm">
            拖拽或点击组件开始构建表单
          </p>
        </div>

      <!-- 字段列表 -->
        <div class="flex flex-wrap items-start">
          <template v-for="(field, index) in fields" :key="field._vid">
            <!-- 拖拽悬停指示器（拖入位置） -->
            <div
              v-if="hoverIndex === index"
              class="hover-indicator"
              @dragover.prevent="onFieldDragOver($event, index)"
              @drop.prevent="onFieldDrop($event, index)"
            />

          <!-- 字段卡片 -->
          <div
            class="form-field-card group relative mb-3 cursor-pointer rounded border-2 px-3 py-2 transition-all"
            :class="{
              'border-[var(--el-color-primary)] bg-[var(--el-color-primary-light-9)] shadow-sm': activeFieldId === field._vid,
              'border-dashed border-[var(--el-border-color)] hover:border-[var(--el-color-primary-light-5)]': activeFieldId !== field._vid,
              'opacity-60': field.hidden,
            }"
            :style="fieldStyle(field)"
            draggable="true"
            @click.stop="emit('select', field._vid)"
            @dragstart="onFieldDragStart($event, field)"
            @dragend="onFieldDragEnd"
          >
            <!-- 字段内容 -->
            <div class="flex items-center gap-2">
              <el-icon class="drag-handle shrink-0 cursor-grab text-[var(--el-text-color-placeholder)]" :size="16">
                <Rank />
              </el-icon>
              <label class="shrink-0 text-xs font-medium" :class="{ 'text-[var(--el-text-color-secondary)]': activeFieldId !== field._vid }">
                {{ field.label }}
                <span v-if="field.required" class="text-[var(--el-color-danger)]">*</span>
                <el-icon v-if="field.datasetBinding" :size="12" class="ml-1 inline-block text-[var(--el-color-success)]" title="已绑定数据集">
                  <Link />
                </el-icon>
              </label>
              <div class="min-w-0 flex-1">
                <div class="rounded border border-dashed border-[var(--el-border-color)] bg-[var(--el-fill-color-light)] px-2 py-1 text-xs text-[var(--el-text-color-placeholder)]">
                  {{ getFieldPreview(field).placeholder }}
                </div>
              </div>
            </div>

            <!-- 悬浮操作 -->
            <div class="field-actions absolute right-1 top-1 hidden gap-0.5 group-hover:flex">
              <el-button
                text
                size="small"
                :icon="Delete"
                class="!text-[var(--el-text-color-secondary)] hover:!text-[var(--el-color-danger)]"
                @click.stop="emit('remove', field._vid)"
              />
            </div>
          </div>

          <!-- 字段间拖拽插入指示器 -->
          <div
            v-if="hoverIndex === index + 1"
            class="hover-indicator"
            @dragover.prevent="onFieldDragOver($event, index + 1)"
            @drop.prevent="onFieldDrop($event, index + 1)"
          />
        </template>
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>

<style scoped>
.form-canvas {
  height: 100%;
}

.form-canvas-inner {
  min-height: 100%;
}

.form-field-card {
  user-select: none;
  background: var(--el-bg-color);
}

.form-field-card:hover {
  border-color: var(--el-color-primary-light-5);
}

.form-field-card .drag-handle {
  cursor: grab;
}

.form-field-card:active .drag-handle {
  cursor: grabbing;
}

.hover-indicator {
  width: 100%;
  height: 4px;
  background: var(--el-color-primary);
  border-radius: 2px;
  margin: 2px 0;
  opacity: 0.6;
  animation: pulse 0.8s ease-in-out infinite alternate;
}

@keyframes pulse {
  from { opacity: 0.4; }
  to { opacity: 0.8; }
}
</style>
