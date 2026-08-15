export interface OrderListProps {
  modelValue?: unknown[]
  dataKey?: string
  listStyle?: string | Record<string, string>
}

export interface OrderListEmits {
  (event: 'update:modelValue', value: unknown[]): void
}
