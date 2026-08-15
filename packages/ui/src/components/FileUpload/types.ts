export type FileUploadMode = 'basic' | 'advanced'

export interface FileUploadProps {
  mode?: FileUploadMode
  multiple?: boolean
  accept?: string
  disabled?: boolean
  chooseLabel?: string
}

export interface FileUploadEmits {
  (event: 'select', files: File[]): void
}
