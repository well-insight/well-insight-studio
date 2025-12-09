import type { CSSProperties } from 'vue'
import type { Compnents, designListType, PageConfig } from '@/type'
import { dayjs } from 'element-plus'
import { isNumber, set } from 'lodash-es'
import { defineStore } from 'pinia'
import { addDesign, deleteDesign, findDesignList, updateDesignById } from '@/api/design'
import { getItem } from '@/utils'

export interface DsignStateTypes {
  curComponentIndex: number
  canvasScale: number
  componentsInCanvas: any[]
  pageConfig: PageConfig & Partial<CSSProperties>
  componentConfig: any
  designList: designListType[]
}

export const useDesignStore = defineStore('design', {
  state: (): DsignStateTypes => {
    return {
      curComponentIndex: -1, // 当前选中组件
      canvasScale: 1,
      componentsInCanvas: [], // 当前界面中显示的组件数据
      componentConfig: {},
      pageConfig: {
        // 页面设置数据
        title: `项目-${dayjs(new Date()).format()}`, // 默认项目名称
        img: '平台', // 封面
        width: 1920,
        height: 1080,
        adapter: 'auto',
        theme: 'light',
        status: 'success',
        backgroundColor: '#f2f3f5',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center center',
        backgroundSize: '100% 100%',
      },
      designList: [],
    }
  },
  getters: {
    editConfigContent(): {
      pageConfig: any
      componentsInCanvas: Compnents[]
    } {
      return {
        pageConfig: this.pageConfig,
        componentsInCanvas: this.componentsInCanvas,
      }
    },
    currentComponentConfig(): any {
      return this.componentsInCanvas[this.curComponentIndex]
    },
  },
  actions: {
    setCurComponentIndex(index: number) {
      this.curComponentIndex = index
    },
    setPageConfig(pageConfig: PageConfig) {
      Object.entries(pageConfig || {}).forEach(([k, v]) => {
        this.pageConfig[k] = v
      })
    },
    setPageConfigByKey(key: string, value: any) {
      this.pageConfig[key] = value
    },
    setComponentsInCanvas(component: Compnents[]) {
      this.componentsInCanvas = component
    },
    addComponentsInCanvas(component: Compnents) {
      this.componentsInCanvas.push(component)
    },
    changeComponentsInCanvasByIndex(index: number | string, data: any) {
      this.componentsInCanvas[Number(index)] = { ...this.componentsInCanvas[Number(index)], ...data }
    },
    updateCurrentComponentConfig(key: string, config: any, index?: number) {
      set(this.componentsInCanvas[isNumber(index) ? index : this.curComponentIndex], key, config)
    },
    async newDesignContent() {
      const content = JSON.stringify(this.editConfigContent || {})
      const { id: userId } = getItem('loginContent') || ''

      const res = await addDesign(userId, content)
      return res
    },
    async updateDesignById(id: string, content?: string) {
      content = content || JSON.stringify(this.editConfigContent || {})
      const res = await updateDesignById(id, content)
      return res
    },
    async findDesignList() {
      const { id: userId } = getItem('loginContent') || ''
      const res = await findDesignList(userId)
      if (res) {
        this.designList = res
        return this.designList
      };
      return []
    },
    async deleteDesign(id: string) {
      const res = await deleteDesign(id)
      if (res.status === 'success') {
        //
      };
    },
  },
})
