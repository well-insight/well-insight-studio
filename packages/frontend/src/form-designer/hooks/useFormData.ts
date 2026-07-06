/**
 * 表单设计器数据管理 Hook
 * 负责表单 Schema 的增删改查、脏状态追踪
 */
import type { FormField, FormSchema } from '../types'
import { computed, provide, reactive, ref, watch } from 'vue'
import { cloneFormSchema, getEmptyFormSchema } from '../form-designer.utils'

export interface UseFormDataReturn {
  /** 当前表单 Schema（响应式） */
  formSchema: FormSchema
  /** 当前选中的字段 ID */
  activeFieldId: ref<string | null>
  /** 当前选中的字段 */
  activeField: computed<FormField | null>
  /** 字段列表 */
  fields: computed<FormField[]>
  /** 是否有未保存更改 */
  isDirty: ref<boolean>
  /** 表单加载状态 */
  loading: ref<boolean>
  /** 预览模式 */
  isPreview: ref<boolean>
  /** 是否已初始化（防止循环加载） */
  initialized: ref<boolean>

  /** 设置整个 Schema */
  setFormSchema: (schema: FormSchema) => void
  /** 添加字段 */
  addField: (field: FormField, index?: number) => void
  /** 删除字段 */
  removeField: (vid: string) => void
  /** 更新字段 */
  updateField: (vid: string, patch: Partial<FormField>) => void
  /** 选中字段 */
  selectField: (vid: string | null) => void
  /** 移动字段 */
  moveField: (fromIndex: number, toIndex: number) => void
  /** 更新表单配置 */
  updateFormConfig: (patch: Partial<FormSchema['config']>) => void
  /** 同步已保存基线 */
  syncSavedBaseline: () => void
  /** 切换预览模式 */
  togglePreview: () => void
  /** 重置为默认 */
  resetToDefault: () => void
}

export function useFormData(): UseFormDataReturn {
  const formSchema = reactive<FormSchema>(getEmptyFormSchema())
  const activeFieldId = ref<string | null>(null)
  const isDirty = ref(false)
  const loading = ref(false)
  const isPreview = ref(false)
  const initialized = ref(false)

  // 保存基线用于脏检查
  let savedBaseline: string = JSON.stringify(formSchema)

  const fields = computed(() => formSchema.fields)

  const activeField = computed(() => {
    if (!activeFieldId.value) return null
    return formSchema.fields.find(f => f._vid === activeFieldId.value) ?? null
  })

  function setFormSchema(schema: FormSchema) {
    Object.assign(formSchema, schema)
    savedBaseline = JSON.stringify(formSchema)
    isDirty.value = false
    activeFieldId.value = null
    initialized.value = true
  }

  function addField(field: FormField, index?: number) {
    const newField = { ...field }
    if (index !== undefined && index >= 0 && index <= formSchema.fields.length) {
      formSchema.fields.splice(index, 0, newField)
    } else {
      formSchema.fields.push(newField)
    }
    // 重排序号
    formSchema.fields.forEach((f, i) => { f.sort = i })
    activeFieldId.value = newField._vid
    isDirty.value = true
  }

  function removeField(vid: string) {
    const idx = formSchema.fields.findIndex(f => f._vid === vid)
    if (idx !== -1) {
      formSchema.fields.splice(idx, 1)
      formSchema.fields.forEach((f, i) => { f.sort = i })
      if (activeFieldId.value === vid) {
        activeFieldId.value = null
      }
      isDirty.value = true
    }
  }

  function updateField(vid: string, patch: Partial<FormField>) {
    const field = formSchema.fields.find(f => f._vid === vid)
    if (field) {
      Object.assign(field, patch)
      isDirty.value = true
    }
  }

  function selectField(vid: string | null) {
    activeFieldId.value = vid
  }

  function moveField(fromIndex: number, toIndex: number) {
    const item = formSchema.fields.splice(fromIndex, 1)[0]
    if (item) {
      formSchema.fields.splice(toIndex, 0, item)
      formSchema.fields.forEach((f, i) => { f.sort = i })
      isDirty.value = true
    }
  }

  function updateFormConfig(patch: Partial<FormSchema['config']>) {
    Object.assign(formSchema.config, patch)
    isDirty.value = true
  }

  function syncSavedBaseline() {
    savedBaseline = JSON.stringify(formSchema)
    isDirty.value = false
  }

  function togglePreview() {
    isPreview.value = !isPreview.value
  }

  function resetToDefault() {
    const empty = getEmptyFormSchema()
    Object.assign(formSchema, empty)
    savedBaseline = JSON.stringify(empty)
    isDirty.value = false
    activeFieldId.value = null
  }

  return {
    formSchema: formSchema as FormSchema,
    activeFieldId,
    activeField,
    fields,
    isDirty,
    loading,
    isPreview,
    initialized,
    setFormSchema,
    addField,
    removeField,
    updateField,
    selectField,
    moveField,
    updateFormConfig,
    syncSavedBaseline,
    togglePreview,
    resetToDefault,
  }
}

/** Provide / Inject key */
export const FORM_DATA_KEY = Symbol('formDesignerData')
