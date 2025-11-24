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
      width: '',
      height: '',
      fontSize: 14,
      fontWeight: 500,
      lineHeight: '',
      letterSpacing: 0,
      textAlign: 'center',
      color: '',
    } as CSSProperties,
  },
]

export function getComponentConfigs(configs?: ComponentConfig[]) {
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
