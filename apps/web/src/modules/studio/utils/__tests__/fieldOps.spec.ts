import { describe, expect, it } from 'vitest'
import type { FieldOperation, TableData } from '@well-insight/shared'
import { applyFieldOps } from '../fieldOps'

const table: TableData = {
  fields: ['order_id', 'product', 'category', 'amount'],
  rows: [
    [101, 'Laptop', 'Electronics', 1200],
    [102, 'Phone', 'Electronics', 800],
    [103, 'Table', 'Furniture', 450],
    [104, 'Chair', 'Furniture', 200],
    [105, 'Headphones', 'Electronics', 150],
  ],
}

function ops(partial: Partial<FieldOperation> = {}): FieldOperation {
  return { alias: '', agg: 'none', sort: 'none', filter: '', hidden: false, ...partial }
}

const ALL = table.fields

describe('applyFieldOps', () => {
  it('无操作时按可见字段投影并保持行数', () => {
    const result = applyFieldOps(table, {}, ['product', 'amount'])
    expect(result.fields).toEqual(['product', 'amount'])
    expect(result.rows).toHaveLength(5)
    expect(result.rows[0]).toEqual(['Laptop', 1200])
  })

  it('应用别名生成 displayFields', () => {
    const result = applyFieldOps(table, { amount: ops({ alias: '金额' }) }, ['product', 'amount'])
    expect(result.displayFields).toEqual(['product', '金额'])
  })

  it('数值过滤：> 500', () => {
    const result = applyFieldOps(table, { amount: ops({ filter: '> 500' }) }, ALL)
    expect(result.rows).toHaveLength(2)
    expect(result.rows.every(r => Number(r[3]) > 500)).toBe(true)
  })

  it('字符串过滤：= Electronics', () => {
    const result = applyFieldOps(table, { category: ops({ filter: '= Electronics' }) }, ALL)
    expect(result.rows).toHaveLength(3)
  })

  it('不等过滤：!= Electronics', () => {
    const result = applyFieldOps(table, { category: ops({ filter: '!= Electronics' }) }, ALL)
    expect(result.rows).toHaveLength(2)
  })

  it('非法过滤表达式不生效', () => {
    const result = applyFieldOps(table, { amount: ops({ filter: '约等于 500' }) }, ALL)
    expect(result.rows).toHaveLength(5)
  })

  it('数值降序排序', () => {
    const result = applyFieldOps(table, { amount: ops({ sort: 'desc' }) }, ALL)
    const amounts = result.rows.map(r => r[3])
    expect(amounts).toEqual([1200, 800, 450, 200, 150])
  })

  it('字符串升序排序', () => {
    const result = applyFieldOps(table, { product: ops({ sort: 'asc' }) }, ALL)
    const products = result.rows.map(r => r[1])
    expect(products).toEqual([...products].sort((a, b) => String(a).localeCompare(String(b))))
  })

  it('分组聚合：按 category 分组对 amount 求和', () => {
    const result = applyFieldOps(
      table,
      { category: ops(), amount: ops({ agg: 'sum' }) },
      ['category', 'amount'],
    )
    expect(result.rows).toHaveLength(2)
    const map = Object.fromEntries(result.rows.map(r => [r[0], r[1]]))
    expect(map).toEqual({ Electronics: 2150, Furniture: 650 })
  })

  it('分组聚合：avg 与 count', () => {
    const result = applyFieldOps(
      table,
      { category: ops(), amount: ops({ agg: 'avg' }), order_id: ops({ agg: 'count' }) },
      ['category', 'amount', 'order_id'],
    )
    const map = Object.fromEntries(result.rows.map(r => [r[0], [r[1], r[2]]]))
    expect(map['Electronics']).toEqual([716.67, 3])
    expect(map['Furniture']).toEqual([325, 2])
  })

  it('全局聚合：无分组字段时输出单行', () => {
    const result = applyFieldOps(table, { amount: ops({ agg: 'max' }) }, ['amount'])
    expect(result.rows).toEqual([[1200]])
  })

  it('过滤与聚合组合', () => {
    const result = applyFieldOps(
      table,
      { category: ops({ filter: '= Electronics' }), amount: ops({ agg: 'sum' }) },
      ['category', 'amount'],
    )
    expect(result.rows).toEqual([['Electronics', 2150]])
  })

  it('空结果集安全返回', () => {
    const result = applyFieldOps(table, { amount: ops({ filter: '> 99999' }) }, ALL)
    expect(result.rows).toHaveLength(0)
    expect(result.fields).toEqual(ALL)
  })

  it('不修改原表数据', () => {
    const before = JSON.stringify(table.rows)
    applyFieldOps(table, { amount: ops({ sort: 'desc', filter: '> 100' }) }, ALL)
    expect(JSON.stringify(table.rows)).toBe(before)
  })
})
