import { ref } from 'vue'

/** 可视化编辑器当前 DSL（跨组件共享，PageEditor 写入，Header 读取） */
export const visualDSL = ref<Record<string, unknown> | null>(null)

/** 可视化编辑器是否已保存（跨组件共享） */
export const visualSaved = ref(true)

/** 标记有未保存更改 */
export function markVisualDirty() {
  visualSaved.value = false
}

/** 标记已保存 */
export function markVisualClean() {
  visualSaved.value = true
}

/** 更新可视化 DSL 快照 */
export function updateVisualDSL(dsl: Record<string, unknown>) {
  visualDSL.value = dsl
}
