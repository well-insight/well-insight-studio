<script setup lang="ts">
import type { ApiDatasetField } from "@/api/dataset";
import { Close } from "@element-plus/icons-vue";

defineProps<{
  label: string;
  hint?: string;
  field: ApiDatasetField | null;
  active?: boolean;
  emptyText?: string;
  /** dimension | metric | filter | bind */
  variant?: "dimension" | "metric" | "filter" | "bind";
}>();

const emit = defineEmits<{
  dropField: [field: ApiDatasetField];
  clear: [];
}>();

function onDragOver(e: DragEvent) {
  e.preventDefault();
  e.dataTransfer!.dropEffect = "copy";
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  const raw = e.dataTransfer?.getData("application/x-dataset-field");
  if (!raw) return;
  try {
    const field = JSON.parse(raw) as ApiDatasetField;
    emit("dropField", field);
  } catch {
    /* ignore */
  }
}
</script>

<template>
  <div class="drop-row" :class="{ 'drop-row--active': active, 'drop-row--filled': field }">
    <span class="drop-row__label">{{ label }}</span>
    <div
      class="drop-row__zone"
      @dragover="onDragOver"
      @drop="onDrop"
    >
      <template v-if="field">
        <span class="drop-pill" :class="`drop-pill--${variant || 'bind'}`">
          <span class="drop-pill__text">{{ field.name }}</span>
          <button type="button" class="drop-pill__close" @click.stop="emit('clear')">
            <el-icon :size="12"><Close /></el-icon>
          </button>
        </span>
      </template>
      <span v-else class="drop-row__placeholder">
        {{ emptyText || hint || "拖动左侧字段到此处" }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.drop-row {
  display: contents;
}

.drop-row__label {
  padding-top: 11px;
  font-size: 13px;
  line-height: 1.4;
  color: var(--el-text-color-regular);
  text-align: right;
  white-space: nowrap;
  justify-self: end;
}

.drop-row__zone {
  min-height: 44px;
  padding: 8px 12px;
  border: 1px dashed var(--el-border-color);
  border-radius: 8px;
  background: #fafbfc;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  transition:
    border-color 0.2s,
    background 0.2s,
    box-shadow 0.2s;
}

.drop-row--active .drop-row__zone {
  border-color: var(--el-color-primary-light-5);
  background: var(--el-color-primary-light-9);
}

.drop-row--filled .drop-row__zone {
  border-style: solid;
  border-color: var(--el-border-color-lighter);
  background: #fff;
}

.drop-row__placeholder {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  line-height: 28px;
  user-select: none;
}

.drop-pill {
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  height: 28px;
  padding: 0 4px 0 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.drop-pill--dimension {
  background: #e6f7f4;
  color: #0d9b8a;
}

.drop-pill--metric {
  background: var(--el-color-primary-light-8);
  color: var(--el-color-primary);
}

.drop-pill--filter,
.drop-pill--bind {
  background: #eef2ff;
  color: #4f6ef7;
}

.drop-pill__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 240px;
}

.drop-pill__close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  margin-left: 2px;
  padding: 0;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: inherit;
  cursor: pointer;
  opacity: 0.65;
  flex-shrink: 0;
}

.drop-pill__close:hover {
  opacity: 1;
  background: rgb(0 0 0 / 6%);
}
</style>
