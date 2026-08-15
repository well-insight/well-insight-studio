import type { Component } from 'vue'

export interface GuideDocFrontmatter {
  title?: string
  order?: string | number
  description?: string
}

export interface GuideDocMeta {
  slug: string
  title: string
  order: number
  description?: string
}

export interface ResolvedGuideDoc {
  slug: string
  frontmatter: GuideDocFrontmatter
  component: Component
}

const guideModules = import.meta.glob<{
  default: Component
  frontmatter?: GuideDocFrontmatter
}>('./*.md', { eager: true })

const rawGuideModules = import.meta.glob<string>('./*.md', {
  eager: true,
  query: '?raw',
  import: 'default',
})

function slugFromPath(path: string): string | null {
  const normalized = path.replace(/\\/g, '/')
  const match = normalized.match(/\/([^/]+)\.md$/)
  return match?.[1] ?? null
}

function parseFrontmatterFromRaw(raw: string): GuideDocFrontmatter {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!match?.[1]) return {}

  const result: GuideDocFrontmatter = {}
  for (const line of match[1].split(/\r?\n/)) {
    const sep = line.indexOf(':')
    if (sep <= 0) continue
    const key = line.slice(0, sep).trim()
    const value = line.slice(sep + 1).trim()
    if (key === 'title' || key === 'description') result[key] = value
    if (key === 'order') result.order = value
  }
  return result
}

function resolveFrontmatter(path: string, mod: { frontmatter?: GuideDocFrontmatter }, slug: string) {
  const fromModule = mod.frontmatter
  const fromRaw = rawGuideModules[path] ? parseFrontmatterFromRaw(rawGuideModules[path]) : {}
  return {
    title: fromModule?.title ?? fromRaw.title ?? slug,
    order: fromModule?.order ?? fromRaw.order,
    description: fromModule?.description ?? fromRaw.description,
  } satisfies GuideDocFrontmatter
}

export function listGuideDocs(): GuideDocMeta[] {
  const items: GuideDocMeta[] = []
  for (const [path, mod] of Object.entries(guideModules)) {
    const slug = slugFromPath(path)
    if (!slug) continue
    const frontmatter = resolveFrontmatter(path, mod, slug)
    items.push({
      slug,
      title: frontmatter.title ?? slug,
      order: Number(frontmatter.order ?? 99),
      description: frontmatter.description,
    })
  }
  return items.sort((a, b) => a.order - b.order || a.slug.localeCompare(b.slug))
}

export function resolveGuideDoc(slug: string): ResolvedGuideDoc | null {
  const entry = Object.entries(guideModules).find(([path]) => slugFromPath(path) === slug)
  if (!entry) return null
  const [path, mod] = entry
  return {
    slug,
    frontmatter: resolveFrontmatter(path, mod, slug),
    component: mod.default,
  }
}
