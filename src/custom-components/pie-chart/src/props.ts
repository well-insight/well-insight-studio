import type { ComponentBaseProps, ComponentConfig } from '@/custom-components/types'
import { withConfigs } from '@/custom-components/utils'

export interface IProps extends ComponentBaseProps {
}

export const componentConfig: ComponentConfig[] = withConfigs([
  // {
  //   key: '_configs',
  //   value: 'configs',
  //   title: '图像配置',
  //   children: [],
  // },
])
