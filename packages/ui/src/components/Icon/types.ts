import type { WdSizeInput } from '../../shared/types'

export type IconName =
  | 'check'
  | 'close'
  | 'info'
  | 'chevron-down'
  | 'chevron-left'
  | 'chevron-right'
  | 'plus'
  | 'minus'
  | 'search'
  | 'menu'
  | 'edit'
  | 'trash'

export type IconSize = WdSizeInput

export interface IconProps {
  name: IconName
  label?: string
  size?: IconSize
}
