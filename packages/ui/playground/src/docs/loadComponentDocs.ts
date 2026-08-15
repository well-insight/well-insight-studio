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

export interface DocumentedComponentMeta {
  name: string
  /** 原始 frontmatter，例如 `01 / PRIMITIVE` */
  category: string
  /** 分类排序号，缺省时靠后 */
  categoryOrder: number
  /** 分类展示名，例如 `PRIMITIVE` */
  categoryLabel: string
  description?: string
}

const docModules = import.meta.glob<{
  default: Component
  frontmatter?: ComponentDocFrontmatter
}>('../../../src/components/*/docs/index.md', { eager: true })

// unplugin-vue-markdown 在与 markdown-preview 联用时，named frontmatter 经常丢；改从源码解析
const rawDocModules = import.meta.glob<string>('../../../src/components/*/docs/index.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

function componentNameFromPath(path: string): string | null {
  const normalized = path.replace(/\\/g, '/')
  const match = normalized.match(/components\/([^/]+)\/docs\/index\.md$/)
  return match?.[1] ?? null
}

function parseFrontmatterFromRaw(raw: string): ComponentDocFrontmatter {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match?.[1]) return {}

  const result: ComponentDocFrontmatter = {}
  for (const line of match[1].split(/\r?\n/)) {
    const sep = line.indexOf(':')
    if (sep <= 0) continue
    const key = line.slice(0, sep).trim()
    const value = line.slice(sep + 1).trim()
    if (key === 'title' || key === 'category' || key === 'description') {
      result[key] = value
    }
  }
  return result
}

function parseCategory(raw?: string): Pick<DocumentedComponentMeta, 'category' | 'categoryOrder' | 'categoryLabel'> {
  const category = raw?.trim() || '99 / OTHER'
  const match = category.match(/^(\d+)\s*\/\s*(.+)$/)
  if (!match) {
    return { category, categoryOrder: 99, categoryLabel: category }
  }
  return {
    category,
    categoryOrder: Number(match[1]),
    categoryLabel: match[2].trim(),
  }
}

function resolveFrontmatter(path: string, mod: { frontmatter?: ComponentDocFrontmatter }, name: string) {
  const fromModule = mod.frontmatter
  const fromRaw = rawDocModules[path] ? parseFrontmatterFromRaw(rawDocModules[path]) : {}
  return {
    title: fromModule?.title ?? fromRaw.title ?? name,
    category: fromModule?.category ?? fromRaw.category,
    description: fromModule?.description ?? fromRaw.description,
  } satisfies ComponentDocFrontmatter
}

export function listDocumentedComponents(): DocumentedComponentMeta[] {
  return Object.entries(docModules)
    .map(([path, mod]) => {
      const name = componentNameFromPath(path)
      if (!name) return null
      const frontmatter = resolveFrontmatter(path, mod, name)
      const parsed = parseCategory(frontmatter.category)
      return {
        name,
        description: frontmatter.description,
        ...parsed,
      } satisfies DocumentedComponentMeta
    })
    .filter((item): item is DocumentedComponentMeta => Boolean(item))
    .sort((a, b) => a.categoryOrder - b.categoryOrder || a.name.localeCompare(b.name))
}

export function listDocumentedComponentNames(): string[] {
  return listDocumentedComponents().map((item) => item.name)
}

export function resolveComponentDoc(name: string): ResolvedComponentDoc | null {
  const entry = Object.entries(docModules).find(([path]) => componentNameFromPath(path) === name)
  if (!entry) return null

  const [path, mod] = entry
  return {
    name,
    frontmatter: resolveFrontmatter(path, mod, name),
    component: mod.default,
  }
}
