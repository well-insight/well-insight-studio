import { ref } from 'vue'

/** 可视化编辑器当前 DSL（跨组件共享，PageEditor 写入，Header 读取） */
export const visualDSL = ref<Record<string, unknown> | null>(null)

/** 可视化编辑器是否已保存（跨组件共享） */
export const visualSaved = ref(true)

/** 保存计数器，每次保存递增，PageEditor watch 此值来同步基线 */
export const saveCounter = ref(0)

/** 页面是否有未保存的更改（跨组件共享，PageEditor 写入，PageTitle 读取） */
export const isPageDirty = ref(false)

/** 标记有未保存更改 */
export function markVisualDirty() {
  visualSaved.value = false
}

/** 标记已保存 */
export function markVisualClean() {
  visualSaved.value = true
}

/** 通知已保存（header 操作栏保存/发布后调用），触发基线同步 */
export function notifySaved() {
  visualSaved.value = true
  saveCounter.value++
}

/** 更新可视化 DSL 快照 */
export function updateVisualDSL(dsl: Record<string, unknown>) {
  visualDSL.value = dsl
}
