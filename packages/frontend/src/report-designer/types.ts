export type ReportPreviewMode = 'a4-portrait' | 'a4-landscape' | 'online'

/** Tiptap/ProseMirror JSON 文档，使用 unknown 以避免 DSL 与编辑器实现强耦合。 */
export type ReportDocument = Record<string, unknown>

export interface ReportSection {
  id: 'header' | 'body' | 'footer'
  content: ReportDocument
}

export interface ReportSchema {
  version: 1
  settings: {
    title: string
    page: {
      size: 'A4'
      orientation: 'portrait' | 'landscape'
      margin: { top: number, right: number, bottom: number, left: number }
    }
    online: { maxWidth: number }
  }
  sections: {
    header: ReportSection
    body: ReportSection
    footer: ReportSection
  }
}
