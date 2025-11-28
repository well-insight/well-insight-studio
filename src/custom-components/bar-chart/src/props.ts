import type { BaseProps, ComponentConfig } from '@/custom-components/types'
import { withConfigs } from '@/custom-components/utils'

export interface IProps extends BaseProps {
}

export const componentConfig: ComponentConfig[] = withConfigs([
  {
    key: '_configs',
    value: 'configs',
    children: [
      {
        key: 'Input',
        value: 'inputValue',
        default: '按钮',
      },
      {
        key: 'Radio',
        value: 'type',
        default: 'primary',
        props: [
          {
            label: '默认',
            value: 'primary',
          },
          {
            label: '成功',
            value: 'success',
          },
          {
            label: '提示',
            value: 'info',
          },
          {
            label: '危险',
            value: 'warnning',
          },
        ],
      },
    ],
  },
])
