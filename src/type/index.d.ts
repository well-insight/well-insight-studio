export interface menuListType {
  id: string
  icon: string
  pid: string
  title: string
  ranking: string | null
  router: string
  createDate: string
  children?: menuListType[]
}

export interface tagType {
  title: any
  path: string
  type: string
}

export interface reponseType {
  code: number
  status: string
  message: string
  data: any | menuListType[]
}

export interface userInfoType {
  username: string
  avator: string
}

export interface stateType {
  componentsList: Compnents[]
  count: number
  loginContent: {
    [propName: string]: any
  }
  menuList: menuListType[]
  curComponentIndex: number
  canvasScale: number
}

export interface assemblyType {
  img: string
  title: string
  description: string
  time: string
  id: string
}

export interface Compnents {
  id: string
  type: string // 组件类性
  component: string // 组件名称，需要提前注册到 Vue
  label: string // 左侧组件列表中显示的名字
  propValue: string // 组件所使用的值
  icon: string // 左侧组件列表中显示的名字
  animations: Array<any> // 动画列表
  events: any // 事件列表
  style: any
  ifLock?: boolean
  ifShow?: boolean
  title?: string
  [key: string]: any
}

export interface designListType {
  title: string
  img: string // 封面
  width: number
  height: number
  backgroundColor: string
  adapter: string
  theme: string
  status: string
  id: string
}

export interface PageConfig {
  title: string
  img: string // 封面
  width: number
  height: number
  backgroundColor: string
  backgroundImage?: string
  adapter: string
  theme: string
  status: string
  [k: string]: any
}
