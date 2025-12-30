import type { TextProps as ElTextProps } from 'element-plus'
import type { ComponentBaseProps, ComponentConfig } from '@/custom-components/types'
import { withConfigs } from '@/custom-components/utils'

export interface TextProps extends ComponentBaseProps {
  configs?: Partial<ElTextProps> & { value?: string }
}

export const componentConfig: ComponentConfig[] = withConfigs([
  {
    key: '_configs',
    value: 'configs',
    title: '文本配置',
    children: [
      {
        key: 'Input',
        title: '文字',
        value: 'value',
        default: '这是文本',
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
  {
    title: '样式',
    key: '_style',
    value: 'style',
    children: [
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
        key: 'ColorPicker',
        title: '字体颜色',
        value: 'color',
      },
      {
        key: '_background',
        title: '背景',
        value: 'background',
        children: [
          {
            key: 'ColorPicker',
            title: '背景颜色',
            value: 'backgroundColor',
            default: '#ffff',
          },
        ],
      },
    ],
  },
])
