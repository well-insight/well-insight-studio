export type TimelineAlign = 'left' | 'right' | 'alternate'

export interface TimelineEvent {
  status?: string
  content?: string
  date?: string
  icon?: string
  color?: string
}

export interface TimelineProps {
  value: TimelineEvent[]
  align?: TimelineAlign
}
