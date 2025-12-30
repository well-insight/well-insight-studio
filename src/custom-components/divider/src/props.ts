import type { DividerProps as ElDividerProps } from 'element-plus'
import type { ComponentBaseProps, ComponentConfig } from '@/custom-components/types'
import { withConfigs } from '@/custom-components/utils'

export interface DividerProps extends ComponentBaseProps {
  configs?: Partial<ElDividerProps> & { value?: string }
}

export const componentConfig: ComponentConfig[] = withConfigs([
  {
    key: '_configs',
    value: 'configs',
    title: '分割线配置',
    children: [
      {
        title: '分割线内容',
        key: 'Input',
        value: 'value',
        default: '',
      },
      {
        title: '分割线方向',
        key: 'Select',
        value: 'direction',
        default: 'horizontal',
        props: {
          options: [
            {
              label: '横向',
              value: 'horizontal',
            },
            {
              label: '竖向',
              value: 'vertical',
            },
          ],
        },
      },
      {
        title: '分隔符样式',
        key: 'Select',
        value: 'borderStyle',
        default: 'solid',
        props: {
          options: [
            {
              label: '实线',
              value: 'solid',
            },
            {
              label: '双实线',
              value: 'double',
            },
            {
              label: '虚线',
              value: 'dotted',
            },
            {
              label: '隐藏',
              value: 'hidden',
            },
          ],
        },
      },
      {
        title: '内容的位置',
        key: 'Select',
        value: 'contentPosition',
        default: 'center',
        props: {
          options: [
            {
              label: '左（上）',
              value: 'left',
            },
            {
              label: '中',
              value: 'center',
            },
            {
              label: '右（下）',
              value: 'right',
            },
          ],
        },
      },
    ],
  },
])
