import type { ComponentExport } from '../types'
import type { ButtonProps } from './src/props'
import Button from './src/index.vue'

export default [
  {
    name: 'WButton',
    component: Button,
    default: { type: 'element', component: 'WButton', label: '按钮', configs: { textValue: '这是按钮' } },
  },
] as ComponentExport<ButtonProps>[]
