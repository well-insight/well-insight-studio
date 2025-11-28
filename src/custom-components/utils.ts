import type { CSSProperties } from 'vue'
import type { ComponentConfig } from './types'
import { cloneDeep } from 'lodash-es'

const baseConfigs: ComponentConfig[] = [
  {
    key: 'Input',
    value: 'label',
    default: '',
  },
  {
    key: 'Animations',
    value: 'animations',
    default: [],
  },
  {
    key: 'Events',
    value: 'events',
    default: {},
  },
  {
    key: 'Style',
    value: 'style',
    default: {
      width: '500px',
      height: '300px',
      fontSize: 14,
      fontWeight: 500,
      lineHeight: '',
      letterSpacing: 0,
      textAlign: 'center',
      color: '',
    } as CSSProperties,
  },
]

export function withConfigs(configs?: ComponentConfig[]) {
  const dataList = cloneDeep(baseConfigs);
  (configs || []).forEach((e) => {
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
