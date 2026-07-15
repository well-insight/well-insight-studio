import type { ComputedRef, Ref } from 'vue'
/**
 * 表单设计器数据管理 Hook
 * 负责表单 Schema 的增删改查、脏状态追踪
 */
import type { FormField, FormSchema } from '../types'
import { computed, reactive, ref } from 'vue'
import { cloneFormSchema, getEmptyFormSchema, normalizeFormSchema } from '../form-designer.utils'

export interface UseFormDataReturn {
  /** 当前表单 Schema（响应式） */
  formSchema: FormSchema
  /** 当前选中的字段 ID */
  activeFieldId: Ref<string | null>
  /** 当前选中的字段 */
  activeField: ComputedRef<FormField | null>
  /** 字段列表 */
  fields: ComputedRef<FormField[]>
  /** 是否有未保存更改 */
  isDirty: Ref<boolean>
  /** 表单加载状态 */
  loading: Ref<boolean>
  /** 是否已初始化（防止循环加载） */
  initialized: Ref<boolean>

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
}

export function useFormData(): UseFormDataReturn {
  const formSchema = reactive<FormSchema>(getEmptyFormSchema())
  const activeFieldId = ref<string | null>(null)
  const isDirty = ref(false)
  const loading = ref(false)
  const initialized = ref(false)

  const fields = computed(() => formSchema.fields)

  const activeField = computed(() => {
    if (!activeFieldId.value)
      return null
    return formSchema.fields.find(f => f._vid === activeFieldId.value) ?? null
  })

  function setFormSchema(schema: FormSchema) {
    const normalized = normalizeFormSchema(cloneFormSchema(schema))
    formSchema.config = normalized.config
    formSchema.fields = normalized.fields
    isDirty.value = false
    activeFieldId.value = null
    initialized.value = true
  }

  function addField(field: FormField, index?: number) {
    const newField = cloneFormSchema({ config: getEmptyFormSchema().config, fields: [field] })
      .fields[0]
    if (index !== undefined && index >= 0 && index <= formSchema.fields.length) {
      formSchema.fields.splice(index, 0, newField)
    }
    else {
      formSchema.fields.push(newField)
    }
    // 重排序号
    formSchema.fields.forEach((f, i) => {
      f.sort = i
    })
    activeFieldId.value = newField._vid
    isDirty.value = true
  }

  function removeField(vid: string) {
    const idx = formSchema.fields.findIndex(f => f._vid === vid)
    if (idx !== -1) {
      formSchema.fields.splice(idx, 1)
      formSchema.fields.forEach((f, i) => {
        f.sort = i
      })
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
    const lastIndex = formSchema.fields.length - 1
    if (
      fromIndex < 0
      || fromIndex > lastIndex
      || toIndex < 0
      || toIndex > lastIndex
      || fromIndex === toIndex
    ) {
      return
    }

    const item = formSchema.fields.splice(fromIndex, 1)[0]
    if (item) {
      formSchema.fields.splice(toIndex, 0, item)
      formSchema.fields.forEach((f, i) => {
        f.sort = i
      })
      isDirty.value = true
    }
  }

  function updateFormConfig(patch: Partial<FormSchema['config']>) {
    Object.assign(formSchema.config, patch)
    isDirty.value = true
  }

  function syncSavedBaseline() {
    isDirty.value = false
  }

  return {
    formSchema: formSchema as FormSchema,
    activeFieldId,
    activeField,
    fields,
    isDirty,
    loading,
    initialized,
    setFormSchema,
    addField,
    removeField,
    updateField,
    selectField,
    moveField,
    updateFormConfig,
    syncSavedBaseline,
  }
}

/** Provide / Inject key */
export const FORM_DATA_KEY = Symbol('formDesignerData')
