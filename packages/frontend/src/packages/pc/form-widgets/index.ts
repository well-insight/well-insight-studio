import type { VisualEditorComponent } from '@/visual-editor/visual-editor.utils'

const modules = import.meta.glob('./*/index.tsx', { eager: true })

const components: Record<string, VisualEditorComponent> = {}

Object.entries(modules).forEach(([key, module]) => {
  const name = key.replace(/\.\/(.*)\/index\.(tsx|vue)/, '$1')
  components[name] = module?.default || module
})

console.log(components, 'form-widgets')
export default components
