import type { InjectionKey } from 'vue'
import type {
  FetchApiItem,
  PageConfig,
  VisualEditorBlockData,
  VisualEditorModel,
  VisualEditorModelValue,
  VisualEditorPage
} from '@/visual-editor/visual-editor.utils'
import { computed, inject, reactive, readonly, ref, watch } from 'vue'

/** 页面路由 path，统一为以 / 开头 */
export function normalizeEditorPagePath(path: string) {
  const t = (path || '').trim()
  if (!t) return '/'
  return t.startsWith('/') ? t : `/${t}`
}

import { useRoute } from 'vue-router'
import { CacheEnum } from '@/enums'
import { useWorkspaceStoreWithout } from '@/stores/workspaceStore'
import { visualConfig } from '@/visual.config'

// 保存到本地JSON数据的key
export const localKey = CacheEnum.PAGE_DATA_KEY

// 注入jsonData的key
export const injectKey: InjectionKey<ReturnType<typeof initVisualData>> = Symbol()

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
        height: 667
      }
    : {
        name: '',
        width: 1920,
        height: 1080
      }
}

/**
 * @description 创建空的新页面
 */
export function createNewPage({ title = '新页面', path = '/' }) {
  return {
    title,
    path,
    config: {
      bgColor: '#ffffff',
      bgImage: '',
      keepAlive: false,
      pageSize: defaultPageSize()
    } as PageConfig,
    blocks: [] as VisualEditorBlockData[]
  }
}

function defaultValue(): VisualEditorModelValue {
  return {
    pages: {
      // 页面
      '/': createNewPage({ title: '首页' })
    },
    models: [], // 模型实体集合
    actions: {
      // 动作集合
      fetch: {
        name: '接口请求',
        apis: []
      },
      dialog: {
        name: '对话框',
        handlers: []
      }
    }
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

  const currentPage = jsonData.pages[route.path]

  /**
   * 获取visualData时可能会在组件内被多次调用，使用ref包裹loading状态避免重复请求数据
    * 例如：在Animate组件中，点击添加动画集时会调用useVisualData获取currentBlock的值，此时如果loading状态没有被ref包裹，则会重复请求数据，导致性能问题
    * 目前的解决方案是在useVisualData中使用ref包裹loading状态，确保在数据加载完成之前不会重复请求数据
   * */
  const visualLoading = ref(false)

  const state: IState = reactive({
    jsonData,
    currentPage,
    currentBlock: currentPage?.blocks?.find(item => item.focus) ?? ({} as VisualEditorBlockData)
  })
  const paths = Object.keys(jsonData.pages)

  const isExistPath = paths.some(path => route.path == path)
  // 当前页面是否存在
  if (!isExistPath) {
    // router.replace(paths[0] || '/')
    state.currentPage = jsonData.pages[paths[0]] ?? defaultValue()?.pages['/']
  }

  // 路由变化时更新当前操作的页面
  watch(
    () => route.path,
    url => setCurrentPage(url)
  )

  // 更新 page（路径比较必须规范化，否则 `foo` 与 `/foo` 会误判为改名并误删）
  const updatePage = ({ newPath = '', oldPath, page }: { newPath?: string; oldPath: string; page: Partial<VisualEditorPage> }) => {
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
      setCurrentPage(n)
    } else {
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
    const rest = Object.keys(state.jsonData.pages)
    const prefer = redirectPath ? getPrefixPath(redirectPath) : ''
    const next =
      (prefer && state.jsonData.pages[prefer] ? prefer : null) || rest[0] || '/'
    setCurrentPage(next)
    return true
  }
  // 设置当前页面（必须读 state.jsonData：overrideProject 会替换整棵项目树）
  function setCurrentPage(path = '/') {
    const pages = state.jsonData.pages
    state.currentPage = pages[path]
    if (!state.currentPage) {
      state.currentPage = pages['/'] ?? Object.values(pages)[0]
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
    } else {
      apis.forEach(apiItem => {
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
    } else {
      models.forEach(modelItem => {
        const index = jsonData.models.findIndex(item => item.key == modelItem.key)
        if (index !== -1) {
          state.jsonData.models.splice(index, 1, modelItem)
        }
      })
    }
  }

  // 使用自定义JSON覆盖整个项目
  const overrideProject = (incoming: VisualEditorModelValue | string) => {
    state.jsonData =
      typeof incoming === 'string' ? (JSON.parse(incoming) as VisualEditorModelValue) : incoming
    const paths = Object.keys(state.jsonData.pages)
    const path = state.jsonData.pages['/'] ? '/' : paths[0] || '/'
    setCurrentPage(path)
  }

  function updateVisualLoading(loading: boolean) {
    visualLoading.value = loading
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
    updatePageBlock,
    updateCurrentBlock,
    visualLoading,
    updateVisualLoading
  }
}

export const useVisualData = () => inject<ReturnType<typeof initVisualData>>(injectKey)!

/**
 * 实体的字段数据类型
 */
export const fieldTypes = [
  {
    label: '字符串',
    value: 'string'
  },
  {
    label: '数字',
    value: 'number'
  },
  {
    label: '数组',
    value: 'array'
  },
  {
    label: '布尔值',
    value: 'boolean'
  }
]
