import { Input } from './input'

export * from './input'

export function getComponent(key: string) {
  if (key === 'Input') {
    return Input
  }
}
