import type { ApiDatasetListItem } from '@/api/dataset'
import { defineStore } from 'pinia'
import { store } from './pinia'

export const useWorkspaceStore = defineStore('useWorkspaceStore', {
  state: (): WorkspaceState => ({
    workspaceList: [
      {
        id: '001',
        title: '默认工作空间',
      },
      {
        id: '002',
        title: '我的自定义工作空间',
      },
    ],
    currentWorkspace: undefined,
    appList: [],
    currentApp: undefined,
    menuList: [
      {
        path: '/project/pages',
        title: '页面设计',
        meta: {
          icon: 'page-setting',
        },
        children: [
          {
            path: '/project/pages/visual',
            title: '可视化设计',
            meta: {
              icon: 'dashboard',
            },
          },
          {
            path: '/project/pages/form',
            title: '表单设计',
            meta: {
              icon: 'form',
            },
          },
          {
            path: '/project/pages/report',
            title: '报表设计',
            meta: {
              icon: 'chart',
            },
          },
        ],
      },
      {
        path: '/project/app-assembly',
        title: '应用集',
        meta: {
          icon: 'component-base',
        },
      },
      {
        path: '/project/dataset',
        title: '数据集',
        meta: {
          icon: 'dataset',
        },
      },
      {
        path: '/project/api',
        title: '数据连接',
        meta: {
          icon: 'api',
        },
      },
    ],
    currentMenu: undefined,
    screens: [
      {
        id: 'screen_001',
        workspaceAppId: '001001',
        showNavigation: true,
        width: 'Large',
        props: {
          _id: 'c39c18ed570a649018b7d17e36a99861e',
          _component: '@budibase/standard-components/container',
          _styles: {
            normal: {},
            hover: {},
            active: {},
            selected: {},
          },
          _children: [
            {
              _id: 'ccbe8a7e124104e9590a26c543e48160e',
              _component: '@budibase/standard-components/gridblock',
              _styles: {
                normal: {
                  '--grid-desktop-col-end': 13,
                  '--grid-desktop-row-end': 21,
                  '--grid-desktop-row-start': 3,
                  '--grid-desktop-col-start': 1,
                },
                hover: {},
                active: {},
              },
              _instanceName: 'New Table',
              table: {
                label: 'Employees',
                tableId: 'ta_bb_employee',
                resourceId: 'ta_bb_employee',
                type: 'table',
              },
              initialSortOrder: 'Ascending',
              allowAddRows: true,
              allowEditRows: true,
              allowDeleteRows: true,
              stripeRows: false,
              quiet: false,
            },
            {
              _id: 'c98eb8a1ca9454063b46ffa27607639fa',
              _component: '@budibase/standard-components/button',
              _styles: {
                normal: {
                  '--grid-desktop-col-end': 3,
                  '--grid-desktop-h-align': 'center',
                  '--grid-desktop-row-end': 3,
                },
                hover: {},
                active: {},
              },
              _instanceName: 'New Button',
              text: '添加',
              type: 'cta',
              size: 'M',
              gap: 'S',
              icon: 'plus',
              disabled: false,
              onClick: [
                {
                  'parameters': {
                    type: 'screen',
                    url: '/inventory/new',
                    peek: true,
                  },
                  '##eventHandlerType': 'Navigate To',
                  'id': 'YqwIo-zR_',
                },
              ],
            },
          ],
          _instanceName: 'Blank screen',
          layout: 'grid',
          direction: 'column',
          hAlign: 'stretch',
          vAlign: 'top',
          size: 'grow',
          gap: 'M',
        },
        routing: {
          route: '/data-show1',
          roleId: 'BASIC',
          homeScreen: false,
        },
        name: 'screen-id',
        createdAt: '2026-01-05T17:35:41.116Z',
        updatedAt: '2026-01-11T03:36:47.196Z',
        pluginAdded: false,
      },
    ],
    currentScreen: undefined,
    currentDataset: undefined,
  }),
  actions: {
    setWorkspaceList(list: Workspace[]) {
      this.workspaceList = list
    },
    setCurrentWorkspace(workspace: Workspace) {
      this.currentWorkspace = workspace
    },
    setAppList(list: WorkspaceApp[]) {
      this.appList = list
    },
    setCurrentApp(app: WorkspaceApp | null | undefined) {
      this.currentApp = app ?? undefined
    },
    setCurrentMenu(menu: SimpleMenuOption) {
      this.currentMenu = menu
    },
    setScreens(s: AppScreen[]) {
      this.screens = s
    },
    setCurrentScreen(s: AppScreen) {
      this.currentScreen = s
    },
    setCurrentDataset(dataset: ApiDatasetListItem) {
      this.currentDataset = dataset
    },
  },
})

export function useWorkspaceStoreWithout() {
  return useWorkspaceStore(store)
}

export interface Workspace {
  title: string
  id: string | number
}

export interface WorkspaceApp {
  id: string | number
  workspaceId?: string | number
  title: string
  status?: number
  lastUpdated?: string
  /** 设备类型：1 PC，2 移动端 */
  clientType?: number
  starred?: boolean
}

export interface AppScreen {
  id: string
  workspaceAppId: string
  showNavigation: boolean
  width: string
  props: ScreenProps
  routing: ScreenRouting
  name: string
  createdAt: string
  updatedAt: string
  pluginAdded: boolean
}

export interface ScreenProps {
  id: string
  instanceName: string
  component: string
  styles: Record<string, any>
  children: ScreenProps[]
  [p: string]: string | number | any
}

export interface ScreenRouting {
  route: string
  roleId: string
  homeScreen: boolean
}

export interface SimpleMenuOption {
  path: string
  title: string
  meta: {
    icon?: string
  }
  children?: Array<Omit<SimpleMenuOption, 'children'>> // 避免深度递归
  [key: string]: unknown
}

export interface WorkspaceState {
  workspaceList?: Workspace[]
  currentWorkspace?: Workspace
  appList?: WorkspaceApp[]
  currentApp?: WorkspaceApp
  menuList?: SimpleMenuOption[]
  currentMenu?: SimpleMenuOption
  screens?: AppScreen[]
  currentScreen?: AppScreen
  currentDataset?: ApiDatasetListItem
}
