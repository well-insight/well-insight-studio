<script lang="ts" setup>
import type { Layout } from '@/components/grid-layout-plus'
import type { FormField, FormSchema } from '../../types'
import { Delete, Link, Operation } from '@element-plus/icons-vue'
import { computed, ref } from 'vue'
import { GridItem, GridLayout } from '@/components/grid-layout-plus'
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
  (e: 'updateColSpan', vid: string, colSpan: number): void
}>()

const cols = 24
const isDragOver = ref(false)

function toLayoutItem(field: FormField, index: number) {
  return {
    i: field._vid,
    x: 0,
    y: index,
    w: Math.min(cols, Math.max(1, field.colSpan || cols)),
    h: 1,
    minW: 1,
    maxW: cols,
  }
}

const layout = computed<Layout>(() => props.fields.map((f, i) => toLayoutItem(f, i)))

/** 通过 _vid 查找 layout 项 */
function findLayoutItem(vid: string) {
  const idx = props.fields.findIndex(f => f._vid === vid)
  if (idx === -1) return null
  return { item: toLayoutItem(props.fields[idx], idx), index: idx }
}

function onLayoutUpdated(newLayout: Layout) {
  const sorted = [...newLayout].sort((a, b) => a.y - b.y || a.x - b.x)
  const newOrder = sorted.map(item => String(item.i))
  const oldOrder = props.fields.map(f => f._vid)

  // 更新 colSpan
  for (const item of sorted) {
    const field = props.fields.find(f => f._vid === item.i)
    if (field) {
      const newW = Math.min(cols, Math.max(1, item.w))
      if (field.colSpan !== newW) {
        emit('updateColSpan', String(item.i), newW)
      }
    }
  }

  // 更新顺序（找到移动的字段）
  for (let i = 0; i < newOrder.length; i++) {
    if (newOrder[i] !== oldOrder[i]) {
      const movedVid = newOrder.find(v => !oldOrder.slice(0, i + 1).includes(v) || oldOrder.indexOf(v) > i)
      if (movedVid) {
        const fromIdx = oldOrder.indexOf(movedVid)
        if (fromIdx !== i && fromIdx >= 0) {
          emit('moveField', fromIdx, i)
          break
        }
      }
    }
  }
}

function onDragOver(event: DragEvent) {
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  isDragOver.value = true
}

function onDragLeave() {
  isDragOver.value = false
}

function onDrop(event: DragEvent) {
  event.preventDefault()
  isDragOver.value = false
  if (!event.dataTransfer) return
  const raw = event.dataTransfer.getData('application/json')
  console.log('[FormCanvas] drop raw:', raw)
  if (!raw) return
  try {
    const field = JSON.parse(raw) as FormField
    console.log('[FormCanvas] addField:', field.componentKey)
    emit('addField', field, props.fields.length)
  }
  catch (e) { console.error('[FormCanvas] parse error:', e) }
}

function getFieldPreview(field: FormField) {
  const comp = getFormComponent(field.componentKey)
  return {
    label: field.label || comp?.label || '字段',
    placeholder: field.placeholder || '请输入',
  }
}
</script>

<template>
  <div
    class="form-canvas overflow-y-auto"
    :class="{ 'drag-active': isDragOver }"
    @dragover="onDragOver"
    @dragleave="onDragLeave"
    @drop="onDrop"
  >
    <div class="form-canvas-inner mx-auto w-full max-w-[860px] px-4 py-6">
      <div class="mb-4 text-center">
        <h3 class="text-lg font-semibold">表单画布</h3>
        <p class="mt-1 text-sm text-gray-400">拖拽字段调整位置，拖拽右下角调整列宽</p>
      </div>

      <div
        class="form-canvas-body rounded-lg border border-[var(--el-border-color)] bg-white p-6 shadow-sm"
        :class="{ 'drag-hover': isDragOver }"
        @dragover="onDragOver"
        @drop="onDrop"
      >
        <div
          v-if="fields.length === 0"
          class="flex flex-col items-center justify-center py-16 text-gray-400"
        >
          <el-icon :size="48" class="mb-3 opacity-20"><Operation /></el-icon>
          <p class="text-sm">拖拽或点击组件开始构建表单</p>
        </div>

        <GridLayout
          v-else
          :layout="layout"
          :col-num="cols"
          :row-height="72"
          :margin="[8, 8]"
          :is-draggable="true"
          :is-resizable="true"
          :vertical-compact="true"
          :prevent-collision="false"
          :use-css-transforms="true"
          @update:layout="onLayoutUpdated"
        >
          <GridItem
            v-for="(field, idx) in fields"
            :key="field._vid"
            :i="field._vid"
            :x="0"
            :y="idx"
            :w="Math.min(cols, Math.max(1, field.colSpan || cols))"
            :h="1"
            :min-w="1"
            :max-w="cols"
            drag-allow-from=".drag-handle"
            is-resizable
          >
            <div
              class="form-field-card group relative h-full cursor-pointer rounded border-2 px-3 py-2"
              :class="{
                'border-blue-500 bg-blue-50': activeFieldId === field._vid,
                'border-transparent hover:border-blue-300': activeFieldId !== field._vid,
                'opacity-60': field.hidden,
              }"
              @click.stop="emit('select', field._vid)"
            >
              <div class="flex items-center gap-2">
                <span class="drag-handle shrink-0 cursor-grab font-bold text-lg">⠿</span>
                <label class="shrink-0 text-xs font-medium">
                  {{ field.label }}<span v-if="field.required" class="text-red-500">*</span>
                  <el-icon v-if="field.datasetBinding" :size="12" class="ml-1 inline-block text-green-500" title="已绑定数据集"><Link /></el-icon>
                </label>
                <div class="min-w-0 flex-1">
                  <div class="rounded border border-dashed bg-gray-50 px-2 py-1 text-xs text-gray-400">
                    {{ getFieldPreview(field).placeholder }}
                  </div>
                </div>
              </div>
              <div class="field-actions absolute right-1 top-1 hidden gap-0.5 group-hover:flex">
                <el-button text size="small" :icon="Delete" class="hover:!text-red-500" @click.stop="emit('remove', field._vid)" />
              </div>
            </div>
          </GridItem>
        </GridLayout>
      </div>
    </div>
  </div>
</template>

<style scoped>
.form-canvas { height: 100%; width: 100%; background: var(--el-bg-color-page, #f0f2f5); }
.form-canvas-inner { width: 100%; min-height: 100%; }
.form-canvas-body { position: relative; width: 100%; min-height: 300px; }
.form-field-card { user-select: none; background: #fff; height: 100%; }
.form-field-card .drag-handle { cursor: grab; }
.form-field-card:active .drag-handle { cursor: grabbing; }

:deep(.vgl-layout) {
  width: 100% !important;
  background: #fff;
}

.drag-active {
  outline: 2px dashed var(--el-color-primary);
  outline-offset: -2px;
}

.drag-hover {
  border-color: var(--el-color-primary) !important;
  box-shadow: 0 0 0 2px rgba(var(--el-color-primary-rgb, 64, 158, 255), 0.2);
}
</style>
