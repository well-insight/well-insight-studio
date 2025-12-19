import { Background, BackgroundRepeat } from './background'
import { ColorPicker } from './color-picker'
import { Input, InputNumber } from './input'
import Select from './select/Select.vue'
import { Style } from './style'
import { ImageUploader } from './uploader'

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

  if (key === 'ColorPicker') {
    return ColorPicker
  }

  if (key === 'Background') {
    return Background
  }

  if (key === 'BackgroundRepeat') {
    return BackgroundRepeat
  }

  if (key === 'ImageUploader') {
    return ImageUploader
  }

  if (key === 'Select') {
    return Select
  }
}
