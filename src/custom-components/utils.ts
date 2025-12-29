import type { ComponentConfig } from './types'
import { cloneDeep } from 'lodash-es'
import { uuid } from '@/utils'

const baseConfigs: ComponentConfig[] = [
  {
    title: '组件标识',
    key: 'Input',
    value: 'id',
    default: uuid(),
    props: {
      disabled: true,
    },
  },
  {
    title: '标题',
    key: 'Input',
    value: 'label',
    default: '',
  },
  // {
  //   title: '动画',
  //   key: 'Animations',
  //   value: 'animations',
  //   default: [],
  // },
  // {
  //   title: '事件',
  //   key: 'Events',
  //   value: 'events',
  //   default: {},
  // },
  {
    title: '样式',
    key: '_style',
    value: 'style',
    children: [
      {
        title: '左边距',
        key: 'InputNumber',
        value: 'left',
        props: {
          unit: 'px',
        },
      },
      {
        title: '上边距',
        key: 'InputNumber',
        value: 'top',
        props: {
          unit: 'px',
        },
      },
      {
        title: '宽度',
        key: 'InputNumber',
        value: 'width',
        default: '500px',
      },
      {
        title: '高度',
        key: 'InputNumber',
        value: 'height',
        default: '300px',
      },
      {
        key: 'Font',
        title: '字体',
        value: 'font',
        default: {
          fontSize: '14px',
          fontWeight: '500',
          fontStyle: 'normal',
        },
      },
      {
        title: '背景',
        key: 'Background',
        value: 'background',
        default: {
          backgroundColor: '#ffffff',
          backgroundImage: '',
          backgroundPosition: 'center center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '100% 100%',
        },
      },
    ],
  },
  // {
  //   title: '动画',
  //   key: 'Animations',
  //   value: 'animations',
  //   default: [''],
  // },
]

export function getBaseConfigs() { }

export function withConfigs(configs?: ComponentConfig[]) {
  const dataList = cloneDeep(baseConfigs)
    ; (configs || []).forEach((e) => {
    const hasK = dataList.findIndex(u => u?.key === e?.key)
    if (hasK >= 0) {
      dataList.splice(hasK, 1, e)
    }
    else {
      dataList.push(e)
    }
  })
  return dataList
}

/**
 * 根据组件名称获取对应的配置对象
 * @param {string} name - 组件名称（如 "WButton"、"WHorizontalBarChart"）
 * @param {Array} components - 原始组件配置数组（你的输入数据）
 * @returns {object | null} 转换后的嵌套配置对象，未找到返回 null
 */
export function getComponentConfig(name: string, configs?: ComponentConfig[]) {
  // 2. 递归处理配置项，转换为目标结构
  function transformConfig(configItems: ComponentConfig[]) {
    return configItems.reduce((result: Record<string, any>, item) => {
      const { key, value, default: defaultValue, children } = item

      // 如果 key 以 _ 开头，且有 children，视为嵌套对象
      if (key.startsWith('_') && Array.isArray(children)) {
        result[value] = transformConfig(children)
      }
      else {
        // 普通配置项：直接以 value 为键，default 为值
        result[value] = defaultValue
      }
      return result
    }, {})
  }

  // 3. 处理目标组件的 config 数组，返回转换后的对象
  return transformConfig(configs || [])
}
