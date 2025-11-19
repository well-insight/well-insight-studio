import type { ButtonProps as ElButtonProps } from 'element-plus'
import type { BaseProps } from '@/custom-components/types'

export interface ButtonProps extends BaseProps {
  configs?: Partial<ElButtonProps> & { textValue?: string }
}
