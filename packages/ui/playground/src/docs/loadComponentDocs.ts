import type { Component } from 'vue'

export interface ComponentDocFrontmatter {
  title?: string
  category?: string
  description?: string
}

export interface ResolvedComponentDoc {
  name: string
  frontmatter: ComponentDocFrontmatter
  component: Component
}

const docModules = import.meta.glob<{
  default: Component
  frontmatter?: ComponentDocFrontmatter
}>('../../../src/components/*/docs/index.md', { eager: true })

function componentNameFromPath(path: string): string | null {
  const match = path.match(/components\/([^/]+)\/docs\/index\.md$/)
  return match?.[1] ?? null
}

export function listDocumentedComponents(): string[] {
  return Object.keys(docModules)
    .map((path) => componentNameFromPath(path))
    .filter((name): name is string => Boolean(name))
    .sort((a, b) => a.localeCompare(b))
}

export function resolveComponentDoc(name: string): ResolvedComponentDoc | null {
  const entry = Object.entries(docModules).find(([path]) => componentNameFromPath(path) === name)
  if (!entry) return null

  const mod = entry[1]
  return {
    name,
    frontmatter: mod.frontmatter ?? { title: name },
    component: mod.default,
  }
}
