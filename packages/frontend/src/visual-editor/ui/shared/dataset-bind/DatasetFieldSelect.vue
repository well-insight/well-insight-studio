<script setup lang="ts">
import type { ApiDatasetField } from "@/api/dataset";
import { fetchDatasetDetail } from "@/api/dataset";
import { computed, ref, watch } from "vue";

const props = withDefaults(
  defineProps<{
    datasetId?: string;
    /** 仅展示指定类型的字段 */
    fieldType?: "text" | "number" | "datetime";
  }>(),
  {
    datasetId: "",
    fieldType: undefined,
  },
);

const model = defineModel<string>({ default: "" });

const loading = ref(false);
const fields = ref<ApiDatasetField[]>([]);

const options = computed(() => {
  let list = [...fields.value].sort((a, b) => a.sort_order - b.sort_order);
  if (props.fieldType) {
    list = list.filter((f) => f.field_type === props.fieldType);
  }
  return list;
});

async function loadFields(id: string) {
  loading.value = true;
  try {
    const detail = await fetchDatasetDetail(id);
    fields.value = detail.fields ?? [];
    if (model.value && !fields.value.some((f) => f.name === model.value)) {
      model.value = "";
    }
  } catch {
    fields.value = [];
    model.value = "";
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.datasetId,
  (id) => {
    if (!id) {
      fields.value = [];
      model.value = "";
      return;
    }
    void loadFields(id);
  },
  { immediate: true },
);
</script>

<template>
  <el-select
    v-model="model"
    clearable
    filterable
    :loading="loading"
    :disabled="!datasetId"
    placeholder="请先选择数据集"
    class="w-full"
  >
    <el-option
      v-for="field in options"
      :key="field.id"
      :label="field.name"
      :value="field.name"
    >
      <span>{{ field.name }}</span>
      <span class="text-12px text-[var(--el-text-color-secondary)] ml-8px">
        {{ field.field_type }}
      </span>
    </el-option>
  </el-select>
</template>
