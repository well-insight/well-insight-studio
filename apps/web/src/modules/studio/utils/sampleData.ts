import type { TableData } from '@well-insight/shared'

/**
 * 内置示例数据源（与 docs/products/demo.html 原型一致）。
 * P4 接入真实 API 后作为开发兜底数据保留。
 */
export const sampleTables: Record<string, TableData> = {
  orders: {
    fields: ['order_id', 'customer_id', 'product', 'category', 'amount', 'order_date', 'status'],
    rows: [
      [101, 1, 'Laptop', 'Electronics', 1200, '2026-01-15', 'paid'],
      [102, 2, 'Phone', 'Electronics', 800, '2026-01-20', 'paid'],
      [103, 3, 'Table', 'Furniture', 450, '2026-02-01', 'paid'],
      [104, 1, 'Chair', 'Furniture', 200, '2026-02-10', 'pending'],
      [105, 4, 'Headphones', 'Electronics', 150, '2026-02-15', 'paid'],
      [106, 5, 'Book', 'Stationery', 25, '2026-03-01', 'paid'],
      [107, 2, 'Monitor', 'Electronics', 300, '2026-03-05', 'paid'],
      [108, 3, 'Desk', 'Furniture', 600, '2026-03-10', 'paid'],
      [109, 6, 'Notebook', 'Stationery', 12, '2026-03-12', 'paid'],
      [110, 7, 'Phone Case', 'Accessories', 20, '2026-03-15', 'paid'],
    ],
  },
  customers: {
    fields: ['customer_id', 'name', 'age', 'city', 'signup_date'],
    rows: [
      [1, 'Alice', 28, 'Beijing', '2025-01-01'],
      [2, 'Bob', 34, 'Shanghai', '2025-02-01'],
      [3, 'Charlie', 45, 'Beijing', '2024-11-01'],
      [4, 'Diana', 29, 'Shenzhen', '2025-05-01'],
      [5, 'Eve', 38, 'Shanghai', '2024-08-01'],
      [6, 'Frank', 22, 'Beijing', '2026-01-01'],
      [7, 'Grace', 31, 'Shenzhen', '2025-09-01'],
    ],
  },
  products: {
    fields: ['product_id', 'product_name', 'category', 'price', 'stock'],
    rows: [
      [1, 'Laptop', 'Electronics', 1200, 50],
      [2, 'Phone', 'Electronics', 800, 120],
      [3, 'Table', 'Furniture', 450, 30],
      [4, 'Chair', 'Furniture', 200, 80],
      [5, 'Headphones', 'Electronics', 150, 200],
      [6, 'Book', 'Stationery', 25, 500],
      [7, 'Monitor', 'Electronics', 300, 60],
      [8, 'Desk', 'Furniture', 600, 20],
      [9, 'Notebook', 'Stationery', 12, 1000],
      [10, 'Phone Case', 'Accessories', 20, 300],
    ],
  },
}

/** 判断字段是否为数值类型（按首行采样，与原型一致） */
export function isNumericField(table: TableData, field: string): boolean {
  const idx = table.fields.indexOf(field)
  if (idx < 0 || table.rows.length === 0) return false
  return typeof table.rows[0]?.[idx] === 'number'
}

export function getFieldType(table: TableData, field: string): 'number' | 'string' {
  return isNumericField(table, field) ? 'number' : 'string'
}
