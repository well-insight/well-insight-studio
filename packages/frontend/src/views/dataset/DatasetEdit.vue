<script setup lang="ts">
import { ArrowLeft, Plus } from "@element-plus/icons-vue";
import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import DatasetTable from "./DatasetTable.vue";
import { ApiDatasetListItem, fetchDatasetDetail } from "@/api/dataset";
import { useWorkspaceStore } from "@/store/workspaceStore/workspaceStore";

const route = useRoute();
const router = useRouter();
const workspaceStore = useWorkspaceStore();

const datasetId = computed(() => {
  const raw = route.params.id;
  const s = Array.isArray(raw) ? raw.join("/") : raw;
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? n : null;
});

const datasetTitle = ref("");
const datasetTableRef = ref<InstanceType<typeof DatasetTable> | null>(null);
const canAddDatasetRow = ref(false);

function onAddRowStateChange(payload: { canAdd: boolean }) {
  canAddDatasetRow.value = payload.canAdd;
}

function triggerAddRow() {
  datasetTableRef.value?.openCreateRow();
}

async function refreshTitle() {
  const id = datasetId.value;
  if (id == null) {
    datasetTitle.value = "";
    return;
  }
  try {
    const d = await fetchDatasetDetail(id);
    workspaceStore.setCurrentDataset(d as unknown as ApiDatasetListItem);
    datasetTitle.value = d.name;
  } catch {
    datasetTitle.value = "";
  }
}

watch(datasetId, () => void refreshTitle(), { immediate: true });

function goBack() {
  router.push({ name: "Dataset" });
}

onUnmounted(() => {
  workspaceStore.setCurrentDataset(null);
});
</script>

<template>
  <div :class="$style.page">
    <header :class="$style.header">
      <div :class="$style.headerLeft">
        <el-button type="primary" bg text :icon="ArrowLeft" @click="goBack"> 返回 </el-button>
        <h1 :class="$style.title">
          {{ datasetTitle || "数据集数据" }}
        </h1>
      </div>
      <div :class="$style.headerRight">
        <el-button type="primary" :icon="Plus" @click="triggerAddRow"> 新增行 </el-button>
      </div>
    </header>
    <div :class="$style.body">
      <p v-if="datasetId == null" :class="$style.badId">链接无效，请从数据集列表进入。</p>
      <DatasetTable
        v-else
        ref="datasetTableRef"
        :dataset-id="datasetId"
        :editable="true"
        @add-row-state-change="onAddRowStateChange"
      />
    </div>
  </div>
</template>

<style module lang="css">
.page {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 0;
  background: var(--el-bg-color-page);
}

.header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  height: 54px;
  padding: 0 12px;
  background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.headerLeft {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.headerRight {
  flex-shrink: 0;
}

.title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0;
  background-color: var(--el-bg-color);
}

.badId {
  margin: 0;
  padding: 24px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}
</style>
