import type { ReportDocument, ReportPreviewMode, ReportSchema, ReportSection } from './types'

const sectionIds = ['header', 'body', 'footer'] as const
type SectionId = typeof sectionIds[number]

export function getEmptyDocument(): ReportDocument {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

function createSection(id: SectionId): ReportSection {
  return { id, content: getEmptyDocument() }
}

export function getEmptyReportSchema(): ReportSchema {
  return {
    version: 1,
    settings: {
      title: '未命名报表',
      page: {
        size: 'A4',
        orientation: 'portrait',
        margin: { top: 18, right: 16, bottom: 18, left: 16 },
      },
      online: { maxWidth: 1120 },
    },
    sections: {
      header: createSection('header'),
      body: createSection('body'),
      footer: createSection('footer'),
    },
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function asNumber(value: unknown, fallback: number, min: number, max: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.min(max, Math.max(min, parsed)) : fallback
}

function textFromLegacyBlocks(value: unknown) {
  if (!Array.isArray(value))
    return ''
  return value
    .map((item) => {
      const block = asRecord(item)
      const props = asRecord(block.props)
      return typeof props.content === 'string' ? props.content : ''
    })
    .filter(Boolean)
    .join('\n\n')
}

function normalizeDocument(value: unknown, legacyBlocks?: unknown): ReportDocument {
  const document = asRecord(value)
  if (document.type === 'doc' && Array.isArray(document.content))
    return document

  const legacyText = textFromLegacyBlocks(legacyBlocks)
  return legacyText
    ? { type: 'doc', content: legacyText.split('\n').map(text => ({ type: 'paragraph', content: [{ type: 'text', text }] })) }
    : getEmptyDocument()
}

export function normalizeReportSchema(value: unknown): ReportSchema {
  const defaults = getEmptyReportSchema()
  if (!value || typeof value !== 'object')
    return defaults

  const source = asRecord(value)
  const settings = asRecord(source.settings)
  const page = asRecord(settings.page)
  const online = asRecord(settings.online)
  const sections = asRecord(source.sections)

  const normalizedSections = sectionIds.reduce((result, id) => {
    const current = asRecord(sections[id])
    result[id] = {
      id,
      content: normalizeDocument(current.content, current.blocks),
    }
    return result
  }, {} as ReportSchema['sections'])

  return {
    version: 1,
    settings: {
      title: typeof settings.title === 'string' ? settings.title : defaults.settings.title,
      page: {
        size: 'A4',
        orientation: page.orientation === 'landscape' ? 'landscape' : 'portrait',
        margin: {
          top: asNumber(asRecord(page.margin).top, defaults.settings.page.margin.top, 0, 50),
          right: asNumber(asRecord(page.margin).right, defaults.settings.page.margin.right, 0, 50),
          bottom: asNumber(asRecord(page.margin).bottom, defaults.settings.page.margin.bottom, 0, 50),
          left: asNumber(asRecord(page.margin).left, defaults.settings.page.margin.left, 0, 50),
        },
      },
      online: { maxWidth: asNumber(online.maxWidth, defaults.settings.online.maxWidth, 480, 1920) },
    },
    sections: normalizedSections,
  }
}

export function isValidReportSchema(value: unknown): value is ReportSchema {
  const source = asRecord(value)
  return source.version === 1 && Boolean(source.sections)
}

export function getModeFromSchema(schema: ReportSchema): ReportPreviewMode {
  return schema.settings.page.orientation === 'landscape' ? 'a4-landscape' : 'a4-portrait'
}
