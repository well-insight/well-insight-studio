<script setup lang="ts">
import type { PropDatasetBinding, PropDatasetBindMode } from "@/utils/datasetBinding";
import DatasetBindEditor from "@/visual-editor/ui/shared/dataset-bind/DatasetBindEditor.vue";
import DatasetFieldSelect from "@/visual-editor/ui/shared/dataset-bind/DatasetFieldSelect.vue";
import { computed, ref, watch } from "vue";

const props = defineProps<{
  propLabel?: string;
  allowRowsMode?: boolean;
  initialBinding?: PropDatasetBinding | null;
}>();

const visible = defineModel<boolean>({ required: true });

const emit = defineEmits<{
  confirm: [binding: PropDatasetBinding];
  clear: [];
}>();

const datasetId = ref("");
const field = ref("");
const labelField = ref("");
const rowIndex = ref(0);
const mode = ref<PropDatasetBindMode>("cell");

watch(visible, (open) => {
  if (!open) return;
  const b = props.initialBinding;
  datasetId.value = b?.datasetId ?? "";
  field.value = b?.field ?? "";
  labelField.value = b?.labelField ?? "";
  rowIndex.value = b?.rowIndex ?? 0;
  mode.value = b?.mode ?? (props.allowRowsMode ? "rows" : "cell");
});

const canConfirm = computed(
  () => Boolean(datasetId.value.trim() && field.value.trim()),
);

function onConfirm() {
  if (!canConfirm.value) return;
  const binding: PropDatasetBinding = {
    datasetId: datasetId.value.trim(),
    field: field.value.trim(),
    rowIndex: rowIndex.value,
    mode: mode.value,
  };
  if (mode.value === "rows" && labelField.value.trim()) {
    binding.labelField = labelField.value.trim();
  }
  emit("confirm", binding);
  visible.value = false;
}

function onClear() {
  emit("clear");
  visible.value = false;
}
</script>

<template>
  <el-dialog
    v-model="visible"
    :title="`绑定数据源${propLabel ? ` · ${propLabel}` : ''}`"
    width="420px"
    append-to-body
    destroy-on-close
  >
    <el-form label-width="96px" label-position="left" @submit.prevent>
      <el-form-item label="数据集" required>
        <DatasetBindEditor v-model="datasetId" />
      </el-form-item>
      <el-form-item v-if="allowRowsMode" label="绑定方式">
        <el-radio-group v-model="mode">
          <el-radio value="cell">取某一行的字段值</el-radio>
          <el-radio value="rows">多行生成列表</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item :label="mode === 'rows' ? '值字段' : '字段'" required>
        <DatasetFieldSelect v-model="field" :dataset-id="datasetId" />
      </el-form-item>
      <el-form-item v-if="mode === 'rows' && allowRowsMode" label="标签字段">
        <DatasetFieldSelect v-model="labelField" :dataset-id="datasetId" />
        <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
          不选则与值字段相同
        </div>
      </el-form-item>
      <el-form-item v-if="mode === 'cell'" label="数据行">
        <el-input-number v-model="rowIndex" :min="0" :step="1" class="w-full!" />
        <div class="mt-4px text-12px text-[var(--el-text-color-secondary)]">
          从 0 开始，表示数据集中的第几行
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="danger" plain @click="onClear">解除绑定</el-button>
      <el-button type="primary" :disabled="!canConfirm" @click="onConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>
