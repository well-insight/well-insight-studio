<script lang="ts" setup>
import type { ApiDatasetField, DatasetFieldType } from '@/api/dataset'
import type { FormField, FormSchema } from '@/form-designer/types'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { fetchDatasetDetail, updateDataset } from '@/api/dataset'
import { FormDesigner } from '@/form-designer'
import { createFormField, getEmptyFormSchema, normalizeFormSchema } from '@/form-designer/form-designer.utils'

const route = useRoute()
const router = useRouter()

const datasetId = computed(() => String(route.params.id || '').trim())
const datasetName = ref('')
const sourceFields = ref<ApiDatasetField[]>([])
const schema = ref<FormSchema>(getEmptyFormSchema())
const loading = ref(false)
const saving = ref(false)

function componentForFieldType(type: DatasetFieldType) {
  if (type === 'number')
    return 'number'
  if (type === 'datetime')
    return 'datePicker'
  return 'input'
}

function fieldTypeForComponent(componentKey: string): DatasetFieldType {
  if (componentKey === 'number')
    return 'number'
  if (['datePicker', 'timePicker', 'datetimePicker'].includes(componentKey))
    return 'datetime'
  return 'text'
}

function buildDefaultSchema(fields: Array<{ id: string, name: string, field_type: DatasetFieldType }>) {
  const initialSchema = getEmptyFormSchema()
  initialSchema.config.submitBtn.show = false
  initialSchema.config.resetBtn.show = false
  initialSchema.fields = fields.map((field, index) =>
    createFormField(componentForFieldType(field.field_type), {
      _vid: `dataset_${field.id}`,
      field: field.id,
      label: field.name,
      placeholder: field.field_type === 'number' ? '请输入数字' : field.field_type === 'datetime' ? '请选择日期' : '请输入',
      colSpan: 12,
      sort: index,
    }),
  )
  return initialSchema
}

function datasetFieldsFromSchema(formSchema: FormSchema) {
  const seen = new Set<string>()
  return formSchema.fields.map((field, index) => {
    const name = field.label.trim() || `字段${index + 1}`
    const baseField = field.field.trim() || `field_${index + 1}`
    let key = baseField
    let suffix = 2
    while (seen.has(key)) key = `${baseField}_${suffix++}`
    seen.add(key)
    return { name, field_type: fieldTypeForComponent(field.componentKey), sort_order: index, field: key }
  })
}

async function loadDataset() {
  if (!datasetId.value)
    return
  loading.value = true
  try {
    const dataset = await fetchDatasetDetail(datasetId.value)
    datasetName.value = dataset.name
    sourceFields.value = dataset.fields
    schema.value = dataset.form_schema
      ? normalizeFormSchema(dataset.form_schema as unknown as FormSchema)
      : buildDefaultSchema(dataset.fields)
  }
  catch (error) {
    ElMessage.error((error as Error).message || '加载数据集失败')
  }
  finally {
    loading.value = false
  }
}

async function saveSchema() {
  const fields = datasetFieldsFromSchema(schema.value)
  if (fields.length === 0) {
    ElMessage.warning('请至少保留一个表单字段')
    return
  }
  saving.value = true
  try {
    const normalizedSchema = normalizeFormSchema(schema.value)
    normalizedSchema.fields = normalizedSchema.fields.map((field: FormField, index) => ({
      ...field,
      field: fields[index].field,
      label: fields[index].name,
      sort: index,
    }))
    const fieldDefinitionChanged = fields.length !== sourceFields.value.length
      || fields.some((field, index) => field.name !== sourceFields.value[index]?.name
        || field.field_type !== sourceFields.value[index]?.field_type)
    const result = await updateDataset(datasetId.value, {
      form_schema: normalizedSchema as unknown as Record<string, unknown>,
      ...(fieldDefinitionChanged
        ? { fields: fields.map(({ field: _field, ...field }) => field) }
        : {}),
    })
    schema.value = result.form_schema
      ? normalizeFormSchema(result.form_schema as unknown as FormSchema)
      : normalizedSchema
    sourceFields.value = result.fields
    ElMessage.success('表单字段已同步到数据集')
  }
  catch (error) {
    ElMessage.error((error as Error).message || '保存失败')
  }
  finally {
    saving.value = false
  }
}

function goBack() {
  router.push({ name: 'DatasetEdit', params: { id: datasetId.value } })
}

watch(datasetId, () => void loadDataset(), { immediate: true })
</script>

<template>
  <div class="dataset-form-workspace">
    <header class="dataset-form-workspace__header">
      <el-button text :icon="ArrowLeft" @click="goBack">
        返回数据集
      </el-button>
      <div class="dataset-form-workspace__title">
        <strong>{{ datasetName || '数据集' }}</strong>
        <span>表单字段设计</span>
      </div>
      <el-button type="primary" :loading="saving" @click="saveSchema">
        保存字段
      </el-button>
    </header>
    <main v-loading="loading" class="dataset-form-workspace__body">
      <FormDesigner
        v-if="!loading"
        :initial-schema="schema"
        :default-field-col-span="12"
        @update:schema="schema = $event"
      />
    </main>
  </div>
</template>

<style scoped>
.dataset-form-workspace {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: var(--el-bg-color-page);
}

.dataset-form-workspace__header {
  display: flex;
  align-items: center;
  gap: 14px;
  height: 56px;
  padding: 0 16px;
  border-bottom: 1px solid rgba(82, 124, 181, 0.14);
  background: var(--el-bg-color);
}

.dataset-form-workspace__title {
  display: flex;
  flex: 1;
  min-width: 0;
  align-items: baseline;
  gap: 8px;
}

.dataset-form-workspace__title strong {
  overflow: hidden;
  color: var(--el-text-color-primary);
  font-size: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dataset-form-workspace__title span {
  flex-shrink: 0;
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.dataset-form-workspace__body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}
</style>
