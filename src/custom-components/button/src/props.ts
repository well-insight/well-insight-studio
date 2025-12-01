import type { ButtonProps as ElButtonProps } from 'element-plus'
import type { CSSProperties } from 'vue'
import type { BaseProps, ComponentConfig } from '@/custom-components/types'
import { withConfigs } from '@/custom-components/utils'

export interface ButtonProps extends BaseProps {
  configs?: Partial<ElButtonProps> & { inputValue?: string }
}

export const componentConfig: ComponentConfig[] = withConfigs([
  {
    key: '_configs',
    value: 'configs',
    title: '按钮配置',
    children: [
      {
        key: 'Input',
        title: '文字',
        value: 'inputValue',
        default: '按钮',
      },
      {
        title: '类型',
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
