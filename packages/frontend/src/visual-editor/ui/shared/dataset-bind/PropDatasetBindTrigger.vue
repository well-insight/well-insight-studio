<script setup lang="ts">
import type { VisualEditorBlockData } from "@/visual-editor/visual-editor.utils";
import type { PropDatasetBinding } from "@/utils/datasetBinding";
import {
  getPropDatasetBinding,
  isPropDatasetBound,
  isRowsModeProp,
  shouldShowPropDatasetBind,
} from "@/utils/datasetBinding";
import type { VisualEditorProps } from "@/visual-editor/visual-editor.props";
import { Connection } from "@element-plus/icons-vue";
import { computed, ref } from "vue";
import DatasetBindDialog from "./DatasetBindDialog.vue";

const props = defineProps<{
  block: VisualEditorBlockData;
  propName: string;
  propLabel?: string;
  propConfig?: VisualEditorProps;
}>();

const dialogVisible = ref(false);

const showBind = computed(() =>
  props.propConfig ? shouldShowPropDatasetBind(props.propName, props.propConfig) : false,
);

const binding = computed(() => getPropDatasetBinding(props.block, props.propName));

const isBound = computed(() => isPropDatasetBound(props.block, props.propName));

const allowRowsMode = computed(() => isRowsModeProp(props.propName, props.propConfig));

function ensureBindings(): Record<string, PropDatasetBinding> {
  if (!props.block.datasetBindings) {
    props.block.datasetBindings = {};
  }
  return props.block.datasetBindings;
}

function onConfirm(b: PropDatasetBinding) {
  ensureBindings()[props.propName] = b;
}

function onClear() {
  const map = props.block.datasetBindings;
  if (map) {
    delete map[props.propName];
  }
}
</script>

<template>
  <template v-if="showBind">
    <el-tooltip content="绑定数据源" placement="top">
      <el-button
        text
        class="prop-dataset-bind-btn"
        :class="{ 'prop-dataset-bind-btn--active': isBound }"
        @click.stop="dialogVisible = true"
      >
        <el-icon :size="16">
          <Connection />
        </el-icon>
      </el-button>
    </el-tooltip>
    <DatasetBindDialog
      v-model="dialogVisible"
      :initial-binding="binding"
      :prop-label="propLabel"
      :allow-rows-mode="allowRowsMode"
      @confirm="onConfirm"
      @clear="onClear"
    />
  </template>
</template>

<style scoped>
.prop-dataset-bind-btn {
  flex-shrink: 0;
  padding: 4px;
  color: var(--el-text-color-secondary);
}

.prop-dataset-bind-btn:hover {
  color: var(--el-color-primary);
}

.prop-dataset-bind-btn--active {
  color: var(--el-color-primary) !important;
}
</style>
