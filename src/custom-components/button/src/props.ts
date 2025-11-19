import type { ButtonProps as ElButtonProps } from 'element-plus'
import type { BaseProps } from '@/custom-components/types'

export interface ButtonProps extends BaseProps {
  configs?: Partial<ElButtonProps> & { inputValue?: string }
}

export const withConfig = [
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
    default: {},
  },
  {
    key: 'Style',
    value: 'style',
    default: {},
  },
  {
    key: 'configs',
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
]
