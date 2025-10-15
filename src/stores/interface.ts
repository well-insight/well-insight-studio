import type { designListType, PageConfig } from '@/type'

export interface DsignStateTypes {
  curComponentIndex: number
  canvasScale: number
  componentsInCanvas: any[]
  pageConfig: PageConfig
  editCanvasConfig: any
  designList: designListType[]
}
