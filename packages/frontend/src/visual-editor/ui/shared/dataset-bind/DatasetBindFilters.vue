<script setup lang="ts">
import type { ApiDatasetField } from "@/api/dataset";
import type { DatasetBindingFilter, DatasetFilterOperator } from "@/utils/datasetBinding";
import { DATASET_FILTER_OP_OPTIONS } from "@/utils/datasetBinding";
import { Delete, Plus } from "@element-plus/icons-vue";

const props = defineProps<{
  fields: ApiDatasetField[];
  disabled?: boolean;
}>();

const filters = defineModel<DatasetBindingFilter[]>({ default: () => [] });

function addFilter() {
  const first = props.fields[0]?.name ?? "";
  filters.value = [
    ...filters.value,
    { field: first, operator: "eq" as DatasetFilterOperator, value: "" },
  ];
}

function removeFilter(index: number) {
  filters.value = filters.value.filter((_, i) => i !== index);
}

function needsValue(op: DatasetFilterOperator) {
  return !DATASET_FILTER_OP_OPTIONS.find((o) => o.value === op)?.noValue;
}
</script>

<template>
  <div class="bind-filters">
    <div v-if="filters.length === 0" class="bind-filters__empty">
      暂无筛选，取全部数据行
    </div>
    <div v-for="(item, index) in filters" :key="index" class="bind-filters__row">
      <el-select
        v-model="item.field"
        size="small"
        placeholder="字段"
        :disabled="disabled"
        class="bind-filters__field"
      >
        <el-option v-for="f in fields" :key="f.id" :label="f.name" :value="f.name" />
      </el-select>
      <el-select
        v-model="item.operator"
        size="small"
        :disabled="disabled"
        class="bind-filters__op"
      >
        <el-option
          v-for="op in DATASET_FILTER_OP_OPTIONS"
          :key="op.value"
          :label="op.label"
          :value="op.value"
        />
      </el-select>
      <el-input
        v-if="needsValue(item.operator)"
        v-model="item.value"
        size="small"
        placeholder="比较值"
        :disabled="disabled"
        class="bind-filters__value"
        clearable
      />
      <span v-else class="bind-filters__value-placeholder" />
      <el-button
        text
        type="danger"
        :disabled="disabled"
        class="bind-filters__remove"
        @click="removeFilter(index)"
      >
        <el-icon><Delete /></el-icon>
      </el-button>
    </div>
    <el-button
      size="small"
      plain
      :disabled="disabled || fields.length === 0"
      class="bind-filters__add"
      @click="addFilter"
    >
      <el-icon class="mr-4px"><Plus /></el-icon>
      添加筛选条件
    </el-button>
  </div>
</template>

<style scoped>
.bind-filters {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bind-filters__empty {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  padding: 8px 10px;
  border-radius: 8px;
  background: var(--el-fill-color-light);
}

.bind-filters__row {
  display: grid;
  grid-template-columns: minmax(88px, 1fr) 108px minmax(88px, 1fr) 28px;
  gap: 8px;
  align-items: center;
}

.bind-filters__field,
.bind-filters__op,
.bind-filters__value {
  width: 100%;
}

.bind-filters__value-placeholder {
  display: block;
}

.bind-filters__remove {
  padding: 4px;
}

.bind-filters__add {
  align-self: flex-start;
}
</style>
