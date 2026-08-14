import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WdTable from './Table.vue'

describe('WdTable', () => {
  it('renders headers, row values, and a named cell slot', () => {
    const wrapper = mount(WdTable, {
      props: { columns: [{ key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }], rows: [{ id: 1, name: 'Landing page', status: 'Draft' }] },
      slots: { 'cell-status': '<strong>{{ value }}</strong>' },
    })
    expect(wrapper.get('th').text()).toBe('Name')
    expect(wrapper.text()).toContain('Landing page')
    expect(wrapper.get('strong').text()).toBe('Draft')
  })

  it('renders an empty state with the correct colspan', () => {
    const wrapper = mount(WdTable, { props: { columns: [{ key: 'name', label: 'Name' }], rows: [], emptyText: 'Nothing here' } })
    expect(wrapper.get('.wd-table__empty').attributes('colspan')).toBe('1')
    expect(wrapper.text()).toContain('Nothing here')
  })

  it('applies density size classes', () => {
    const wrapper = mount(WdTable, {
      props: {
        columns: [{ key: 'name', label: 'Name' }],
        rows: [{ id: 1, name: 'A' }],
        size: 'lg',
      },
    })
    expect(wrapper.classes()).toContain('wd-table-wrapper--large')
    expect(wrapper.get('table').classes()).toContain('wd-table--large')
  })
})
