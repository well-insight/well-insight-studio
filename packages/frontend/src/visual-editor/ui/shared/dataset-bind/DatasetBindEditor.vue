<script setup lang="ts">
import type { ApiDatasetListItem } from "@/api/dataset";
import { fetchAllDatasets } from "@/api/dataset";
import { ElMessage } from "element-plus";
import { onMounted, ref } from "vue";

const model = defineModel<string>({ default: "" });

const loading = ref(false);
const datasets = ref<ApiDatasetListItem[]>([]);

async function loadDatasets() {
  loading.value = true;
  try {
    const list = await fetchAllDatasets();
    datasets.value = Array.isArray(list) ? list : [];
  } catch (e) {
    datasets.value = [];
    ElMessage.error(e instanceof Error ? e.message : "加载数据集列表失败");
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  void loadDatasets();
});
</script>

<template>
  <el-select
    v-model="model"
    clearable
    filterable
    :loading="loading"
    placeholder="请选择数据集"
    class="w-full"
  >
    <el-option
      v-for="item in datasets"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    >
      <span>{{ item.name }}</span>
      <span class="text-12px text-[var(--el-text-color-secondary)] ml-8px">
        {{ item.row_count }} 行
      </span>
    </el-option>
  </el-select>
</template>
