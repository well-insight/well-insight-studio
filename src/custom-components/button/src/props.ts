import type { ButtonProps as ElButtonProps } from 'element-plus'
import type { ComponentBaseProps, ComponentConfig } from '@/custom-components/types'
import { withConfigs } from '@/custom-components/utils'

export interface ButtonProps extends ComponentBaseProps {
  configs?: Partial<ElButtonProps> & { inputValue?: string }
}

export const componentConfig: ComponentConfig[] = withConfigs([
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
        default: '120px',
      },
      {
        title: '高度',
        key: 'InputNumber',
        value: 'height',
        default: '32px',
      },
    ],
  },
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
        key: 'Select',
        value: 'type',
        default: 'primary',
        props: {
          options: [
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
      },
    ],
  },
])
