import { Input, InputNumber } from './input'
import { Style } from './style'

export * from './input'

export function getComponent(key: string) {
  if (key === 'Input') {
    return Input
  }
  if (key === 'InputNumber') {
    return InputNumber
  }
  if (key === 'Style') {
    return Style
  }
}
