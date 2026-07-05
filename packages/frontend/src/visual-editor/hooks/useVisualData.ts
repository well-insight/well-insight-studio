import type { InjectionKey } from 'vue'
import type {
  FetchApiItem,
  PageConfig,
  VisualEditorBlockData,
  VisualEditorModel,
  VisualEditorModelValue,
  VisualEditorPage,
} from '@/visual-editor/visual-editor.utils'
import { computed, inject, nextTick, reactive, readonly, ref, toRaw, watch } from 'vue'
import { useRoute } from 'vue-router'
import { updateApplication } from '@/api/application'

import { CacheEnum } from '@/enums'
import { useWorkspaceStoreWithout } from '@/stores/workspaceStore'
import { defaultComponentBorder } from '@/utils/blockBorder'
import {
  serializeProjectContent,
  stripProjectEditorEphemeral,
} from '@/visual-editor/visual-editor.utils'
import { visualConfig } from '@/visual.config'

/** 页面路由 path，统一为以 / 开头 */
export function normalizeEditorPagePath(path: string) {
  const t = (path || '').trim()
  if (!t)
    return '/'
  return t.startsWith('/') ? t : `/${t}`
}

// 保存到本地JSON数据的key
export const localKey = CacheEnum.PAGE_DATA_KEY

// 注入jsonData的key
export const injectKey: InjectionKey<ReturnType<typeof initVisualData>> = Symbol()

export type VisualSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

const MAX_HISTORY = 50

function cloneProject(data: VisualEditorModelValue): VisualEditorModelValue {
  return JSON.parse(JSON.stringify(toRaw(data))) as VisualEditorModelValue
}

function cloneProjectForHistory(data: VisualEditorModelValue): VisualEditorModelValue {
  return stripProjectEditorEphemeral(cloneProject(data))
}

interface IState {
  currentBlock: VisualEditorBlockData // 当前正在操作的组件
  currentPage: VisualEditorPage // 当前正在操作的页面
  jsonData: VisualEditorModelValue // 整棵JSON树
}

const workspaceStore = useWorkspaceStoreWithout()

function defaultPageSize() {
  return workspaceStore.currentApp?.clientType === 2
    ? {
        name: '',
        width: 375,
        height: 667,
      }
    : {
        name: '',
        width: 1920,
        height: 1080,
      }
}

/**
 * @description 创建空的新页面
 */
export function createNewPage({ title = '新页面', path = '/index' }) {
  return {
    title,
    path,
    config: {
      bgColor: '',
      bgImage: '',
      keepAlive: false,
      pageSize: defaultPageSize(),
      componentBorder: defaultComponentBorder(),
    } as PageConfig,
    blocks: [] as VisualEditorBlockData[],
  }
}

export function ensurePageOrder(data: VisualEditorModelValue): string[] {
  const keys = Object.keys(data.pages)
  if (!keys.length) {
    data.pageOrder = ['/index']
    return data.pageOrder
  }
  if (!data.pageOrder?.length) {
    data.pageOrder = [...keys]
    return data.pageOrder
  }
  const order = data.pageOrder.filter(p => keys.includes(p))
  for (const key of keys) {
    if (!order.includes(key)) {
      order.push(key)
    }
  }
  data.pageOrder = order
  return order
}

function getFirstPagePath(data: VisualEditorModelValue): string {
  const order = ensurePageOrder(data)
  return order[0] ?? Object.keys(data.pages)[0] ?? '/index'
}

function defaultValue(): VisualEditorModelValue {
  return {
    pages: {
      '/index': createNewPage({ title: '首页', path: '/index' }),
    },
    pageOrder: ['/index'],
    models: [], // 模型实体集合
    actions: {
      // 动作集合
      fetch: {
        name: '接口请求',
        apis: [],
      },
      dialog: {
        name: '对话框',
        handlers: [],
      },
    },
  }
}

/**
 * 编辑器项目数据不以 sessionStorage 作为初始来源：进入应用编辑时由接口拉取并 overrideProject。
 * 预览等场景在打开前会自行写入 sessionStorage / localStorage。
 */
export function initVisualData() {
  const jsonData: VisualEditorModelValue = defaultValue()

  const route = useRoute()
  const getPrefixPath = normalizeEditorPagePath

  const firstPagePath = getFirstPagePath(jsonData)
  const initialPage = jsonData.pages[firstPagePath] ?? Object.values(jsonData.pages)[0]

  const state: IState = reactive({
    jsonData,
    currentPage: initialPage,
    currentBlock: initialPage?.blocks?.find(item => item.focus) ?? ({} as VisualEditorBlockData),
  })

  /**
   * 获取visualData时可能会在组件内被多次调用，使用ref包裹loading状态避免重复请求数据
   */
  const visualLoading = ref(false)

  // 路由变化时更新当前操作的页面
  watch(
    () => route.path,
    url => setCurrentPage(url),
  )

  // 更新 page（路径比较必须规范化，否则 `foo` 与 `/foo` 会误判为改名并误删）
  const updatePage = ({ newPath = '', oldPath, page }: { newPath?: string, oldPath: string, page: Partial<VisualEditorPage> }) => {
    const o = getPrefixPath(oldPath)
    const existing = state.jsonData.pages[o]
    if (!existing) {
      return
    }
    const n = getPrefixPath(newPath || o)
    if (n !== o) {
      const merged = { ...existing, ...page, path: n } as VisualEditorPage
      state.jsonData.pages[n] = merged
      delete state.jsonData.pages[o]
      const order = ensurePageOrder(state.jsonData)
      const orderIdx = order.indexOf(o)
      if (orderIdx >= 0) {
        order[orderIdx] = n
      }
      setCurrentPage(n)
    }
    else {
      Object.assign(existing, page)
      existing.path = n
    }
  }

  /** 新增页面；路径已存在返回 false */
  const incrementPage = (path: string, page: VisualEditorPage) => {
    const key = getPrefixPath(path)
    if (state.jsonData.pages[key]) {
      return false
    }
    state.jsonData.pages[key] = { ...page, path: key }
    const order = ensurePageOrder(state.jsonData)
    if (!order.includes(key)) {
      order.push(key)
    }
    setCurrentPage(key)
    return true
  }

  /** 删除页面；至少保留一页，失败返回 false */
  function deletePage(path: string, redirectPath = '') {
    const keys = Object.keys(state.jsonData.pages)
    if (keys.length <= 1) {
      return false
    }
    const p = getPrefixPath(path)
    if (!state.jsonData.pages[p]) {
      return false
    }
    delete state.jsonData.pages[p]
    const order = ensurePageOrder(state.jsonData)
    const orderIdx = order.indexOf(p)
    if (orderIdx >= 0) {
      order.splice(orderIdx, 1)
    }
    const prefer = redirectPath ? getPrefixPath(redirectPath) : ''
    const next
      = (prefer && state.jsonData.pages[prefer] ? prefer : null)
        || order[0]
        || Object.keys(state.jsonData.pages)[0]
        || '/index'
    setCurrentPage(next)
    return true
  }

  function reorderPage(path: string, direction: 'up' | 'down') {
    const key = getPrefixPath(path)
    const order = ensurePageOrder(state.jsonData)
    const idx = order.indexOf(key)
    if (idx < 0) {
      return false
    }
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= order.length) {
      return false
    }
    ;[order[idx], order[targetIdx]] = [order[targetIdx], order[idx]]
    return true
  }

  const orderedPagePaths = computed(() => {
    const keys = Object.keys(state.jsonData.pages)
    const stored = state.jsonData.pageOrder?.filter(p => keys.includes(p)) ?? []
    const extras = keys.filter(key => !stored.includes(key))
    return [...stored, ...extras]
  })
  // 设置当前页面（必须读 state.jsonData：overrideProject 会替换整棵项目树）
  function setCurrentPage(path = '/index') {
    const pages = state.jsonData.pages
    const normalized = getPrefixPath(path)
    state.currentPage = pages[normalized]
    if (!state.currentPage) {
      state.currentPage = pages[getFirstPagePath(state.jsonData)] ?? Object.values(pages)[0]
    }
    if (!state.currentPage) {
      return
    }
    const currentFocusBlock = state.currentPage.blocks.find(item => item.focus)
    setCurrentBlock(currentFocusBlock ?? ({} as VisualEditorBlockData))
  }

  // 设置当前被操作的组件
  function setCurrentBlock(block: VisualEditorBlockData | null) {
    state.currentBlock = block ?? ({} as VisualEditorBlockData)
  }

  function updateCurrentBlock(block: Partial<VisualEditorBlockData>) {
    Object.entries(block).forEach(([k, v]) => {
      state.currentBlock[k] = v
    })
  }

  // 更新pages下面的blocks
  const updatePageBlock = (path = '', blocks: VisualEditorBlockData[] = []) => {
    state.jsonData.pages[path].blocks = blocks
  }

  /**
   * @description 新建API接口请求
   */
  const incrementFetchApi = (api: FetchApiItem) => {
    state.jsonData.actions.fetch.apis.push(api)
  }

  /**
   * @description 删除某个API接口
   */
  const deleteFetchApi = (key: string) => {
    const index = state.jsonData.actions.fetch.apis.findIndex(item => item.key == key)
    if (index !== -1) {
      state.jsonData.actions.fetch.apis.splice(index, 1)
    }
  }

  /**
   * @description 更新某个接口或者批量更新接口
   * @param {FetchApiItem | FetchApiItem[]} api 接口
   * @param {boolean} isCover 是否覆盖全部接口
   */
  const updateFetchApi = (api: FetchApiItem | FetchApiItem[], isCover = false) => {
    const fetch = state.jsonData.actions.fetch
    const apis = Array.isArray(api) ? api : [api]
    if (isCover) {
      fetch.apis = apis
    }
    else {
      apis.forEach((apiItem) => {
        const target = fetch.apis.find(item => item.key == apiItem.key)
        target && Object.assign(target, api)
      })
    }
  }

  /**
   * @description 新增模型
   */
  const incrementModel = (model: VisualEditorModel) => {
    state.jsonData.models.push(model)
  }

  /**
   * @description 删除某个模型
   */
  const deleteModel = (key: string) => {
    const index = state.jsonData.models.findIndex(item => item.key == key)
    if (index !== -1) {
      state.jsonData.models.splice(index, 1)
    }
  }

  /**
   * @param { VisualEditorModel | VisualEditorModel[]} model 模型项或模型数组
   * @param {boolean} isCover 是否覆盖所有模型
   * @description 更新某个模型
   */
  const updateModel = (model: VisualEditorModel | VisualEditorModel[], isCover = false) => {
    const jsonData = state.jsonData
    const models = Array.isArray(model) ? model : [model]
    if (isCover) {
      jsonData.models = models
    }
    else {
      models.forEach((modelItem) => {
        const index = jsonData.models.findIndex(item => item.key == modelItem.key)
        if (index !== -1) {
          state.jsonData.models.splice(index, 1, modelItem)
        }
      })
    }
  }

  // 使用自定义JSON覆盖整个项目
  const overrideProject = (incoming: VisualEditorModelValue | string) => {
    state.jsonData
      = typeof incoming === 'string' ? (JSON.parse(incoming) as VisualEditorModelValue) : incoming
    setCurrentPage(getFirstPagePath(state.jsonData))
    resetEditorSession()
  }

  function updateVisualLoading(loading: boolean) {
    visualLoading.value = loading
  }

  const saveStatus = ref<VisualSaveStatus>('idle')
  const saveError = ref<string | null>(null)
  const lastSavedSnapshot = ref('')
  let saveStatusResetTimer: ReturnType<typeof setTimeout> | null = null
  let pendingSave = false

  const historyStack = ref<VisualEditorModelValue[]>([])
  const historyIndex = ref(-1)
  let isApplyingHistory = false
  let historyReady = false
  let recordHistoryTimer: ReturnType<typeof setTimeout> | null = null
  let lastHistoryContent = ''

  const isDirty = computed(() => {
    void state.jsonData
    if (!lastSavedSnapshot.value) {
      return false
    }
    return serializeProjectContent(state.jsonData) !== lastSavedSnapshot.value
  })

  const canUndo = computed(() => historyIndex.value > 0)
  const canRedo = computed(() => historyIndex.value < historyStack.value.length - 1)

  function syncSavedBaseline() {
    lastSavedSnapshot.value = serializeProjectContent(state.jsonData)
  }

  function resetEditorSession() {
    isApplyingHistory = true
    historyReady = false
    if (recordHistoryTimer) {
      clearTimeout(recordHistoryTimer)
      recordHistoryTimer = null
    }
    historyStack.value = [cloneProjectForHistory(state.jsonData)]
    historyIndex.value = 0
    syncSavedBaseline()
    saveStatus.value = 'idle'
    saveError.value = null
    historyReady = true
    isApplyingHistory = false
    lastHistoryContent = serializeProjectContent(state.jsonData)
  }

  function recordHistory() {
    if (!historyReady || isApplyingHistory) {
      return
    }
    const snap = cloneProjectForHistory(state.jsonData)
    const current = historyStack.value[historyIndex.value]
    if (current && serializeProjectContent(current) === serializeProjectContent(snap)) {
      return
    }
    historyStack.value = historyStack.value.slice(0, historyIndex.value + 1)
    historyStack.value.push(snap)
    historyIndex.value = historyStack.value.length - 1
    lastHistoryContent = serializeProjectContent(snap)
    if (historyStack.value.length > MAX_HISTORY) {
      historyStack.value.shift()
      historyIndex.value--
    }
  }

  function scheduleRecordHistory(delay = 400) {
    if (!historyReady || isApplyingHistory) {
      return
    }
    const content = serializeProjectContent(state.jsonData)
    if (content === lastHistoryContent) {
      return
    }
    if (recordHistoryTimer) {
      clearTimeout(recordHistoryTimer)
    }
    recordHistoryTimer = setTimeout(() => {
      recordHistoryTimer = null
      if (serializeProjectContent(state.jsonData) === lastHistoryContent) {
        return
      }
      recordHistory()
    }, delay)
  }

  function undo(): boolean {
    if (!canUndo.value) {
      return false
    }
    if (recordHistoryTimer) {
      clearTimeout(recordHistoryTimer)
      recordHistoryTimer = null
    }
    isApplyingHistory = true
    historyIndex.value--
    state.jsonData = cloneProject(historyStack.value[historyIndex.value])
    setCurrentPage(route.path)
    lastHistoryContent = serializeProjectContent(state.jsonData)
    void nextTick(() => {
      isApplyingHistory = false
    })
    return true
  }

  function redo(): boolean {
    if (!canRedo.value) {
      return false
    }
    if (recordHistoryTimer) {
      clearTimeout(recordHistoryTimer)
      recordHistoryTimer = null
    }
    isApplyingHistory = true
    historyIndex.value++
    state.jsonData = cloneProject(historyStack.value[historyIndex.value])
    setCurrentPage(route.path)
    lastHistoryContent = serializeProjectContent(state.jsonData)
    void nextTick(() => {
      isApplyingHistory = false
    })
    return true
  }

  watch(
    () => serializeProjectContent(state.jsonData),
    () => scheduleRecordHistory(),
  )

  resetEditorSession()

  async function saveProject(): Promise<boolean> {
    // 手动保存时取消自动保存定时器
    cancelAutoSave()
    if (saveStatus.value === 'saving') {
      pendingSave = true
      return false
    }

    const app = workspaceStore.currentApp
    if (!app?.id) {
      saveStatus.value = 'error'
      saveError.value = '未找到当前应用'
      return false
    }

    saveStatus.value = 'saving'
    saveError.value = null

    try {
      const schema = stripProjectEditorEphemeral(
        cloneProject(state.jsonData),
      ) as unknown as Record<string, unknown>
      await updateApplication(String(app.id), {
        schema,
        client_type: app.clientType ?? 1,
        status: app.status ?? 1,
      })
      sessionStorage.setItem(localKey, JSON.stringify(schema))
      syncSavedBaseline()
      saveStatus.value = 'saved'

      if (saveStatusResetTimer) {
        clearTimeout(saveStatusResetTimer)
      }
      saveStatusResetTimer = setTimeout(() => {
        if (saveStatus.value === 'saved') {
          saveStatus.value = 'idle'
        }
      }, 2000)

      return true
    }
    catch (e) {
      saveStatus.value = 'error'
      saveError.value = e instanceof Error ? e.message : '保存失败'
      return false
    }
    finally {
      if (pendingSave) {
        pendingSave = false
        void saveProject()
      }
    }
  }

  // ── 静默防抖自动保存 ──
  const AUTO_SAVE_DELAY = 3000 // 3 秒无操作后自动保存
  let autoSaveTimer: ReturnType<typeof setTimeout> | null = null

  function cancelAutoSave() {
    if (autoSaveTimer !== null) {
      clearTimeout(autoSaveTimer)
      autoSaveTimer = null
    }
  }

  function scheduleAutoSave() {
    cancelAutoSave()
    // 如果当前没有未保存的更改，跳过
    if (!isDirty.value) return
    autoSaveTimer = setTimeout(async () => {
      autoSaveTimer = null
      // 再次检查是否仍有未保存的更改
      if (!isDirty.value) return
      await saveProject()
      // 静默保存：不弹 toast，saveStatus 由 saveProject 内部管理
    }, AUTO_SAVE_DELAY)
  }

  // 监听数据变化，调度防抖自动保存
  watch(
    () => serializeProjectContent(state.jsonData),
    () => {
      scheduleAutoSave()
    },
  )

  // 页面离开前主动取消定时器
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', cancelAutoSave)
  }

  return {
    visualConfig,
    /** 必须用 computed：overrideProject 会替换 state.jsonData 引用，否则注入的仍是初始默认对象 */
    jsonData: computed(() => readonly(state.jsonData) as VisualEditorModelValue),
    currentPage: computed(() => state.currentPage),
    currentBlock: computed(() => state.currentBlock),
    overrideProject,
    incrementFetchApi,
    deleteFetchApi,
    updateFetchApi,
    incrementModel,
    deleteModel,
    updateModel,
    setCurrentPage,
    setCurrentBlock,
    updatePage,
    incrementPage,
    deletePage,
    reorderPage,
    orderedPagePaths,
    ensurePageOrder: () => ensurePageOrder(state.jsonData),
    updatePageBlock,
    updateCurrentBlock,
    visualLoading,
    updateVisualLoading,
    saveStatus: readonly(saveStatus),
    saveError: readonly(saveError),
    isDirty,
    canUndo,
    canRedo,
    saveProject,
    syncSavedBaseline,
    recordHistory,
    undo,
    redo,
  }
}

export const useVisualData = () => inject<ReturnType<typeof initVisualData>>(injectKey)!

/**
 * 实体的字段数据类型
 */
export const fieldTypes = [
  {
    label: '字符串',
    value: 'string',
  },
  {
    label: '数字',
    value: 'number',
  },
  {
    label: '数组',
    value: 'array',
  },
  {
    label: '布尔值',
    value: 'boolean',
  },
]
