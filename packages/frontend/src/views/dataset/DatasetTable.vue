<script setup lang="ts">
import ElListTable from "@/components/el-vtable/ElListTable.vue";
import type { ApiDatasetField } from "@/api/dataset";
import {
  createDatasetRow,
  deleteDatasetRow,
  fetchDatasetDetail,
  fetchDatasetRowsPage,
  updateDatasetRow,
} from "@/api/dataset";
import type { ColumnDefine, ListTableConstructorOptions } from "@visactor/vtable";
import { ElButton, ElMessage, ElMessageBox } from "element-plus";
import dayjs from "dayjs";
import { h, reactive, ref, watch } from "vue";

import { vueGroupCustomLayout } from "@/utils/vtableVueCustomLayout";

const props = withDefaults(
  defineProps<{
    datasetId: string | null;
    /** 为 true 时展示新增/编辑/删除行（用于「编辑数据集」对话框） */
    editable?: boolean;
  }>(),
  {
    datasetId: null,
    editable: false,
  },
);

const emit = defineEmits<{
  rowsUpdated: [];
  /** 可新增行状态（字段已加载且非空），供标题栏按钮使用 */
  addRowStateChange: [payload: { canAdd: boolean }];
}>();

const loading = ref(false);
const page = ref(1);
const pageSize = ref(20);
const total = ref(0);
const fields = ref<ApiDatasetField[]>([]);

const tableOptions = reactive<ListTableConstructorOptions>({
  columns: [],
  records: [],
  widthMode: "adaptive",
});

const rowDialogVisible = ref(false);
const rowDialogMode = ref<"create" | "edit">("create");
const editingRowId = ref<string | null>(null);
const rowForm = ref<Record<string, string>>({});
const rowSubmitting = ref(false);

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "";
  return String(v);
}

/** 与 el-date-picker value-format 一致，便于编辑已保存的 ISO/时间字符串 */
function formatDatetimeForPicker(v: unknown): string {
  const s = formatCell(v);
  if (!s) return "";
  const d = dayjs(s);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm:ss") : s;
}

function syncTableFrozen(editable: boolean) {
  tableOptions.frozenColCount = editable ? 1 : 0;
  tableOptions.rightFrozenColCount = editable ? 1 : 0;
  if (editable) {
    tableOptions.emptyTip = { text: "暂无数据，点击「新增行」添加" };
  } else {
    delete tableOptions.emptyTip;
  }
}

function buildColumns(f: ApiDatasetField[], editable: boolean) {
  const base: ColumnDefine[] = [
    {
      field: "__row_id",
      title: "行 ID",
      width: 60,
      headerStyle: { textAlign: "center" },
      style: { textAlign: "center" },
    },
  ];
  const dataCols = f.map((col) => ({
    field: `c_${col.id}`,
    title: `${col.name} (${col.field_type})`,
    width: 160,
  }));
  if (!editable) {
    return [...base, ...dataCols];
  }
  const actionsCol = {
    field: "__actions",
    title: "操作",
    width: 150,
    headerStyle: {
      textAlign: "center",
    },
    customLayout: vueGroupCustomLayout(({ record }) =>
      h(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            height: "100%",
          },
        },
        [
          h(
            ElButton,
            {
              link: true,
              type: "primary",
              onClick: () => openEditRow(record),
            },
            () => "编辑",
          ),
          h(
            ElButton,
            {
              link: true,
              type: "danger",
              onClick: () => confirmDeleteRow(record),
            },
            () => "删除",
          ),
        ],
      ),
    ),
  } as ColumnDefine;
  return [...base, ...dataCols, actionsCol];
}

function buildRecords(
  rows: { id: string; values: Record<string, unknown> }[],
  f: ApiDatasetField[],
) {
  return rows.map((r) => {
    const rec: Record<string, unknown> = { __row_id: r.id };
    for (const col of f) {
      const key = String(col.id);
      rec[`c_${col.id}`] = formatCell(r.values[key]);
    }
    return rec;
  });
}

async function loadRowsOnly() {
  const id = props.datasetId;
  if (id == null || fields.value.length === 0) return;
  loading.value = true;
  try {
    const { rows, total: t } = await fetchDatasetRowsPage(id, page.value, pageSize.value);
    tableOptions.records = buildRecords(rows, fields.value);
    total.value = t;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "加载数据失败";
    ElMessage.error(msg);
    tableOptions.records = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

async function loadDetailAndRows() {
  const id = props.datasetId;
  if (id == null) {
    fields.value = [];
    tableOptions.columns = [];
    tableOptions.records = [];
    total.value = 0;
    return;
  }
  loading.value = true;
  fields.value = [];
  tableOptions.columns = [];
  tableOptions.records = [];
  syncTableFrozen(false);
  try {
    const detail = await fetchDatasetDetail(id);
    fields.value = [...detail.fields].sort((a, b) => a.sort_order - b.sort_order);
    if (fields.value.length === 0) {
      tableOptions.columns = [];
      tableOptions.records = [];
      syncTableFrozen(false);
      total.value = detail.row_count;
      return;
    }
    const { rows, total: t } = await fetchDatasetRowsPage(id, page.value, pageSize.value);
    syncTableFrozen(props.editable);
    tableOptions.columns = buildColumns(fields.value, props.editable);
    tableOptions.records = buildRecords(rows, fields.value);
    total.value = t;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "加载数据失败";
    ElMessage.error(msg);
    fields.value = [];
    tableOptions.columns = [];
    tableOptions.records = [];
    syncTableFrozen(false);
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.editable,
  (editable: boolean) => {
    if (fields.value.length === 0) return;
    syncTableFrozen(editable);
    tableOptions.columns = buildColumns(fields.value, editable);
  },
);

watch(
  () => props.datasetId,
  () => {
    page.value = 1;
    loadDetailAndRows();
  },
  { immediate: true },
);

watch(
  () => [props.editable, props.datasetId, fields.value.length] as const,
  () => {
    if (!props.editable) return;
    emit("addRowStateChange", {
      canAdd: props.datasetId != null && fields.value.length > 0,
    });
  },
  { immediate: true },
);

async function onPageChange(p: number) {
  page.value = p;
  await loadRowsOnly();
}

async function onSizeChange(s: number) {
  pageSize.value = s;
  page.value = 1;
  await loadRowsOnly();
}

function openCreateRow() {
  const id = props.datasetId;
  if (id == null || fields.value.length === 0) return;
  rowDialogMode.value = "create";
  editingRowId.value = null;
  const next: Record<string, string> = {};
  for (const f of fields.value) next[String(f.id)] = "";
  rowForm.value = next;
  rowDialogVisible.value = true;
}

function openEditRow(row: Record<string, unknown>) {
  rowDialogMode.value = "edit";
  editingRowId.value = String(row.__row_id ?? "");
  const next: Record<string, string> = {};
  for (const f of fields.value) {
    const v = row[`c_${f.id}`];
    next[String(f.id)] = f.field_type === "datetime" ? formatDatetimeForPicker(v) : formatCell(v);
  }
  rowForm.value = next;
  rowDialogVisible.value = true;
}

function buildValuesFromForm(): Record<string, string | number | null> | null {
  const values: Record<string, string | number | null> = {};
  for (const f of fields.value) {
    const k = String(f.id);
    const raw = rowForm.value[k] ?? "";
    const trimmed = typeof raw === "string" ? raw.trim() : "";
    if (f.field_type === "text") {
      values[k] = trimmed === "" ? null : trimmed;
    } else if (f.field_type === "number") {
      if (trimmed === "") {
        values[k] = null;
      } else {
        const n = Number(trimmed);
        if (!Number.isFinite(n)) {
          ElMessage.warning(`「${f.name}」须为有效数字`);
          return null;
        }
        values[k] = n;
      }
    } else {
      values[k] = trimmed === "" ? null : trimmed;
    }
  }
  return values;
}

async function submitRowDialog() {
  const id = props.datasetId;
  if (id == null) return;
  const values = buildValuesFromForm();
  if (values == null) return;
  rowSubmitting.value = true;
  try {
    if (rowDialogMode.value === "create") {
      await createDatasetRow(id, { values });
      ElMessage.success("已新增一行");
    } else {
      const rid = editingRowId.value;
      if (rid == null) return;
      await updateDatasetRow(id, rid, { values });
      ElMessage.success("已保存");
    }
    rowDialogVisible.value = false;
    await loadRowsOnly();
    emit("rowsUpdated");
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : "保存失败");
  } finally {
    rowSubmitting.value = false;
  }
}

async function confirmDeleteRow(row: Record<string, unknown>) {
  const id = props.datasetId;
  if (id == null) return;
  const rowId = String(row.__row_id ?? "");
  try {
    await ElMessageBox.confirm("确定删除该行吗？此操作不可恢复。", "删除确认", {
      type: "warning",
      confirmButtonText: "删除",
      cancelButtonText: "取消",
    });
  } catch {
    return;
  }
  try {
    await deleteDatasetRow(id, rowId);
    ElMessage.success("已删除");
    if (tableOptions.records.length <= 1 && page.value > 1) {
      page.value -= 1;
    }
    await loadRowsOnly();
    emit("rowsUpdated");
  } catch (e) {
    ElMessage.error(e instanceof Error ? e.message : "删除失败");
  }
}

defineExpose({ openCreateRow });
</script>

<template>
  <div :class="$style.wrap">
    <div v-if="datasetId == null" :class="$style.empty">请从左侧选择一个数据集</div>
    <template v-else>
      <div v-if="!loading && fields.length === 0" :class="$style.hint">
        该数据集尚未定义字段，请通过接口或后续「字段管理」功能添加字段后再录入行数据。
      </div>
      <template v-else-if="editable">
        <div v-loading="loading" :class="$style.editArea">
          <div class="w-full flex-auto h-0">
            <el-auto-resizer>
              <template #default="{ height, width }">
                <ElListTable :options="tableOptions" :width="'100%'" :height="height" />
              </template>
            </el-auto-resizer>
          </div>
          <div v-if="fields.length > 0" :class="$style.pager">
            <el-pagination
              background
              layout="total, sizes, prev, pager, next"
              :total="total"
              :page-size="pageSize"
              :current-page="page"
              :page-sizes="[10, 20, 50, 100]"
              @current-change="onPageChange"
              @size-change="onSizeChange"
            />
          </div>
        </div>
        <el-dialog
          v-model="rowDialogVisible"
          :title="rowDialogMode === 'create' ? '新增行' : '编辑行'"
          width="480px"
          destroy-on-close
          append-to-body
          @closed="editingRowId = null"
        >
          <el-form label-position="top">
            <el-form-item v-for="f in fields" :key="f.id" :label="`${f.name}（${f.field_type}）`">
              <el-input
                v-if="f.field_type === 'text'"
                v-model="rowForm[String(f.id)]"
                type="textarea"
                :rows="2"
                placeholder="文本，可留空"
              />
              <el-input
                v-else-if="f.field_type === 'number'"
                v-model="rowForm[String(f.id)]"
                placeholder="数字，可留空"
              />
              <el-date-picker
                v-else
                v-model="rowForm[String(f.id)]"
                type="datetime"
                placeholder="选择日期时间，可留空"
                style="width: 100%"
                value-format="YYYY-MM-DD HH:mm:ss"
              />
            </el-form-item>
          </el-form>
          <template #footer>
            <el-button @click="rowDialogVisible = false">取消</el-button>
            <el-button type="primary" :loading="rowSubmitting" @click="submitRowDialog"
              >保存</el-button
            >
          </template>
        </el-dialog>
      </template>
      <div v-else v-loading="loading" :class="$style.tableArea">
        <div class="w-full flex-auto h-0"></div>
        <ElListTable :options="tableOptions" :width="'100%'" :height="420" />
        <div v-if="fields.length > 0" :class="$style.pager">
          <el-pagination
            background
            layout="total, sizes, prev, pager, next"
            :total="total"
            :page-size="pageSize"
            :current-page="page"
            :page-sizes="[10, 20, 50, 100]"
            @current-change="onPageChange"
            @size-change="onSizeChange"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<style module lang="css">
.wrap {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  min-height: 420px;
}

.empty,
.hint {
  padding: 24px;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.tableArea,
.editArea {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  height: 100%;
}

.pager {
  display: flex;
  justify-content: flex-end;
  height: 60px;
  padding: 0 12px;
}
</style>
